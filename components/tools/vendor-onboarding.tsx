'use client';

import { useMemo, useState } from 'react';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { wait } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type VendorCategory = 'software' | 'consulting' | 'hardware' | 'services' | 'other';

const companyInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  website: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\//i.test(v), 'Website must start with http or https'),
  country: z.string().min(2, 'Country is required'),
  category: z.enum(['software', 'consulting', 'hardware', 'services', 'other']).optional(),
});

const complianceSchema = z.object({
  taxId: z
    .string()
    .regex(/^(\d{2}-?\d{7})$/, 'Enter a valid EIN (##-#######)')
    .transform((v) => (v.includes('-') ? v : `${v.slice(0, 2)}-${v.slice(2)}`)),
  certificationsAck: z.boolean("You must confirm compliance statements"),
});

const bankingSchema = z.object({
  accountNumber: z.string().min(6, 'Account number is required'),
  routingNumber: z
    .string()
    .regex(/^\d{9}$/, 'Routing number must be 9 digits'),
  accountType: z.enum(['checking', 'savings']),
});

const contactsSchema = z.object({
  contactName: z.string().min(2, 'Primary contact name is required'),
  contactEmail: z
    .email('Enter a valid email address')
    .min(5, 'Primary contact email is required'),
  contactPhone: z
    .string()
    .optional()
    .refine((v) => !v || /^[+()\-\d\s]{7,}$/.test(v), 'Enter a valid phone'),
  notes: z.string().optional(),
});

type CompanyInfo = z.infer<typeof companyInfoSchema>;
type Compliance = z.infer<typeof complianceSchema>;
type Banking = z.infer<typeof bankingSchema>;
type Contacts = z.infer<typeof contactsSchema>;

type FormState = CompanyInfo & Compliance & Banking & Contacts;

function useStepValidation() {
  return useMemo(
    () => [
      {
        key: 'company' as const,
        title: 'Company Information',
        description: 'Tell us about the vendor you want to onboard.',
        validate: (data: Partial<FormState>) => companyInfoSchema.safeParse(data),
      },
      {
        key: 'compliance' as const,
        title: 'Tax & Compliance',
        description: 'Enter U.S. EIN and confirm compliance statements.',
        validate: (data: Partial<FormState>) => complianceSchema.safeParse(data),
      },
      {
        key: 'banking' as const,
        title: 'Banking Details',
        description: 'Provide payment information for ACH transfers.',
        validate: (data: Partial<FormState>) => bankingSchema.safeParse(data),
      },
      {
        key: 'contacts' as const,
        title: 'Contacts',
        description: 'Who should we reach out to?',
        validate: (data: Partial<FormState>) => contactsSchema.safeParse(data),
      },
      {
        key: 'review' as const,
        title: 'Review & Submit',
        description: 'Verify all details before creating the vendor profile.',
        validate: (_: Partial<FormState>) => ({ success: true, data: {} } as const),
      },
    ],
    []
  );
}

export function VendorOnboardingForm({
  defaultValues,
}: {
  defaultValues?: Partial<Pick<CompanyInfo, 'companyName' | 'category'>>;
}) {
  const steps = useStepValidation();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormState>({
    companyName: defaultValues?.companyName ?? '',
    website: '',
    country: '',
    category: (defaultValues?.category as VendorCategory | undefined) ?? 'software',
    taxId: '',
    certificationsAck: false as true | false,
    accountNumber: '',
    routingNumber: '',
    accountType: 'checking',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  });

  const isLastStep = activeStep === steps.length - 1;

  const validateStep = (index: number) => {
    const schema = steps[index];
    const result = schema.validate(form as Partial<FormState>);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.') || 'form';
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const onSubmit = async () => {
    // Validate all prior steps quickly
    for (let i = 0; i < steps.length - 1; i++) {
      if (!validateStep(i)) {
        setActiveStep(i);
        return;
      }
    }

    setIsSubmitting(true);
    await wait(1200);
    const id = `VND-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setSubmittedId(id);
    setIsSubmitting(false);
  };

  const StepIndicator = ({ className }: { className?: string }) => (
    <ol className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Onboarding steps">
      {steps.map((s, i) => {
        const state = i < activeStep ? 'complete' : i === activeStep ? 'active' : 'upcoming';
        return (
          <li key={s.key} className="flex items-center gap-2">
            <span
              aria-current={i === activeStep ? 'step' : undefined}
              className={
                state === 'complete'
                  ? 'inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs'
                  : state === 'active'
                    ? 'inline-flex size-6 items-center justify-center rounded-full border-2 border-primary text-primary text-xs'
                    : 'inline-flex size-6 items-center justify-center rounded-full border text-muted-foreground text-xs'
              }
            >
              {i + 1}
            </span>
            <span className="text-sm text-muted-foreground hidden sm:inline">{s.title}</span>
          </li>
        );
      })}
    </ol>
  );

  return (
    <Card className="mx-auto my-6 w-full max-w-4xl border shadow-md">
      <CardHeader>
        
        <CardTitle className="text-xl">Vendor Onboarding</CardTitle>
        <CardDescription className="text-xs">
          {steps[activeStep].description}
        </CardDescription>
          <StepIndicator className="my-4" />
      </CardHeader>

      <CardContent>
        {submittedId ? (
          <div className="space-y-3">
            <p className="text-sm">Vendor profile created successfully.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">Vendor ID</p>
                <p className="font-medium">{submittedId}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Company</p>
                <p className="font-medium">{form.companyName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Category</p>
                <p className="font-medium">{form.category}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Country</p>
                <p className="font-medium">{form.country}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activeStep === 0 && (
              <section aria-labelledby="company-info-heading" className="space-y-4">
                <h3 id="company-info-heading" className="sr-only">
                  Company Information
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="companyName" className="mb-1 block text-sm font-medium">
                      Company name
                    </label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={form.companyName}
                      onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                      aria-invalid={!!errors.companyName}
                      aria-describedby={errors.companyName ? 'companyName-error' : undefined}
                      placeholder="Acme Inc."
                    />
                    {errors.companyName && (
                      <p id="companyName-error" className="mt-1 text-destructive text-xs">
                        {errors.companyName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="country" className="mb-1 block text-sm font-medium">
                      Country
                    </label>
                    <Input
                      id="country"
                      name="country"
                      value={form.country}
                      onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                      aria-invalid={!!errors.country}
                      aria-describedby={errors.country ? 'country-error' : undefined}
                      placeholder="United States"
                    />
                    {errors.country && (
                      <p id="country-error" className="mt-1 text-destructive text-xs">
                        {errors.country}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="website" className="mb-1 block text-sm font-medium">
                      Website
                    </label>
                    <Input
                      id="website"
                      name="website"
                      value={form.website}
                      onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                      aria-invalid={!!errors.website}
                      aria-describedby={errors.website ? 'website-error' : undefined}
                      placeholder="https://acme.com"
                    />
                    {errors.website && (
                      <p id="website-error" className="mt-1 text-destructive text-xs">
                        {errors.website}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Category</label>
                    <Select
                      value={form.category}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, category: v as VendorCategory }))
                      }
                    >
                      <SelectTrigger aria-label="Select category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            )}

            {activeStep === 1 && (
              <section aria-labelledby="compliance-heading" className="space-y-4">
                <h3 id="compliance-heading" className="sr-only">
                  Tax & Compliance
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="taxId" className="mb-1 block text-sm font-medium">
                      EIN (Tax ID)
                    </label>
                    <Input
                      id="taxId"
                      name="taxId"
                      inputMode="numeric"
                      placeholder="12-3456789"
                      value={form.taxId}
                      onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                      aria-invalid={!!errors.taxId}
                      aria-describedby={errors.taxId ? 'taxId-error' : undefined}
                    />
                    {errors.taxId && (
                      <p id="taxId-error" className="mt-1 text-destructive text-xs">
                        {errors.taxId}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id="certAck"
                      type="checkbox"
                      checked={!!form.certificationsAck}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, certificationsAck: e.target.checked as true | false }))
                      }
                      aria-invalid={!!errors.certificationsAck}
                      aria-describedby={
                        errors.certificationsAck ? 'certAck-error' : undefined
                      }
                    />
                    <label htmlFor="certAck" className="text-sm">
                      I confirm the vendor meets our compliance requirements.
                    </label>
                  </div>
                  {errors.certificationsAck && (
                    <p id="certAck-error" className="-mt-3 text-destructive text-xs">
                      {errors.certificationsAck}
                    </p>
                  )}
                </div>
              </section>
            )}

            {activeStep === 2 && (
              <section aria-labelledby="banking-heading" className="space-y-4">
                <h3 id="banking-heading" className="sr-only">
                  Banking Details
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="accountNumber" className="mb-1 block text-sm font-medium">
                      Account number
                    </label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      inputMode="numeric"
                      value={form.accountNumber}
                      onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))}
                      aria-invalid={!!errors.accountNumber}
                      aria-describedby={
                        errors.accountNumber ? 'accountNumber-error' : undefined
                      }
                    />
                    {errors.accountNumber && (
                      <p id="accountNumber-error" className="mt-1 text-destructive text-xs">
                        {errors.accountNumber}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="routingNumber" className="mb-1 block text-sm font-medium">
                      Routing number
                    </label>
                    <Input
                      id="routingNumber"
                      name="routingNumber"
                      inputMode="numeric"
                      value={form.routingNumber}
                      onChange={(e) => setForm((f) => ({ ...f, routingNumber: e.target.value }))}
                      aria-invalid={!!errors.routingNumber}
                      aria-describedby={
                        errors.routingNumber ? 'routingNumber-error' : undefined
                      }
                    />
                    {errors.routingNumber && (
                      <p id="routingNumber-error" className="mt-1 text-destructive text-xs">
                        {errors.routingNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Account type</label>
                  <Select
                    value={form.accountType}
                    onValueChange={(v) => setForm((f) => ({ ...f, accountType: v as 'checking' | 'savings' }))}
                  >
                    <SelectTrigger aria-label="Select account type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </section>
            )}

            {activeStep === 3 && (
              <section aria-labelledby="contacts-heading" className="space-y-4">
                <h3 id="contacts-heading" className="sr-only">
                  Contacts
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contactName" className="mb-1 block text-sm font-medium">
                      Primary contact name
                    </label>
                    <Input
                      id="contactName"
                      name="contactName"
                      value={form.contactName}
                      onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                      aria-invalid={!!errors.contactName}
                      aria-describedby={errors.contactName ? 'contactName-error' : undefined}
                    />
                    {errors.contactName && (
                      <p id="contactName-error" className="mt-1 text-destructive text-xs">
                        {errors.contactName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium">
                      Primary contact email
                    </label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                      aria-invalid={!!errors.contactEmail}
                      aria-describedby={
                        errors.contactEmail ? 'contactEmail-error' : undefined
                      }
                      placeholder="name@company.com"
                    />
                    {errors.contactEmail && (
                      <p id="contactEmail-error" className="mt-1 text-destructive text-xs">
                        {errors.contactEmail}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="contactPhone" className="mb-1 block text-sm font-medium">
                    Phone (optional)
                  </label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={form.contactPhone ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                    aria-invalid={!!errors.contactPhone}
                    aria-describedby={errors.contactPhone ? 'contactPhone-error' : undefined}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.contactPhone && (
                    <p id="contactPhone-error" className="mt-1 text-destructive text-xs">
                      {errors.contactPhone}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="notes" className="mb-1 block text-sm font-medium">
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={form.notes ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Anything we should know about this vendor?"
                  />
                </div>
              </section>
            )}

            {activeStep === 4 && (
              <section aria-labelledby="review-heading" className="space-y-3">
                <h3 id="review-heading" className="sr-only">
                  Review
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Company</p>
                    <p className="font-medium">{form.companyName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Country</p>
                    <p className="font-medium">{form.country}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Category</p>
                    <p className="font-medium">{form.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Website</p>
                    <p className="font-medium">{form.website || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tax ID</p>
                    <p className="font-medium">{form.taxId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Banking</p>
                    <p className="font-medium">
                      {form.accountType} ••••{form.accountNumber.slice(-4)} / {form.routingNumber}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground text-xs">Primary contact</p>
                    <p className="font-medium">{form.contactName}</p>
                    <p className="text-muted-foreground text-sm">{form.contactEmail}</p>
                  </div>
                  {form.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground text-xs">Notes</p>
                      <p className="text-sm">{form.notes}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between">
        {!submittedId ? (
          <>
            <Button type="button" variant="outline" onClick={handleBack} disabled={activeStep === 0}>
              Back
            </Button>
            {isLastStep ? (
              <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Create Vendor'}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Continue
              </Button>
            )}
          </>
        ) : (
          <div className="flex w-full items-center justify-end gap-2">
            <Button type="button" variant="outline">
              Invite to Portal
            </Button>
            <Button type="button">View Profile</Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export function VendorOnboardingLoader() {
  return (
    <Card className="mx-auto my-6 w-full max-w-4xl animate-pulse border shadow-md">
      <CardHeader>
        <div className="space-y-2">
          <Skeleton className="h-5 w-40 rounded bg-gray-300" />
          <Skeleton className="h-3 w-64 rounded bg-gray-300" />
        </div>
        <div className="my-4 flex items-center gap-2">
          <span className="inline-flex size-6 items-center justify-center rounded-full">
            <Skeleton className="size-6 rounded-full bg-gray-300" />
          </span>
          <span className="inline-flex size-6 items-center justify-center rounded-full">
            <Skeleton className="size-6 rounded-full bg-gray-300" />
          </span>
          <span className="inline-flex size-6 items-center justify-center rounded-full">
            <Skeleton className="size-6 rounded-full bg-gray-300" />
          </span>
          <span className="inline-flex size-6 items-center justify-center rounded-full">
            <Skeleton className="size-6 rounded-full bg-gray-300" />
          </span>
          <span className="inline-flex size-6 items-center justify-center rounded-full">
            <Skeleton className="size-6 rounded-full bg-gray-300" />
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Skeleton className="mb-2 h-3 w-24 rounded bg-gray-300" />
              <Skeleton className="h-9 w-full rounded bg-gray-300" />
            </div>
            <div>
              <Skeleton className="mb-2 h-3 w-16 rounded bg-gray-300" />
              <Skeleton className="h-9 w-full rounded bg-gray-300" />
            </div>
            <div>
              <Skeleton className="mb-2 h-3 w-16 rounded bg-gray-300" />
              <Skeleton className="h-9 w-full rounded bg-gray-300" />
            </div>
            <div>
              <Skeleton className="mb-2 h-3 w-16 rounded bg-gray-300" />
              <Skeleton className="h-9 w-full rounded bg-gray-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Skeleton className="mb-2 h-3 w-28 rounded bg-gray-300" />
              <Skeleton className="h-9 w-full rounded bg-gray-300" />
            </div>
            <div>
              <Skeleton className="mb-2 h-3 w-28 rounded bg-gray-300" />
              <Skeleton className="h-9 w-full rounded bg-gray-300" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Skeleton className="h-9 w-20 rounded bg-gray-300" />
        <Skeleton className="h-9 w-28 rounded bg-gray-300" />
      </CardFooter>
    </Card>
  );
}


