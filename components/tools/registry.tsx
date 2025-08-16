'use client';

import dynamic from 'next/dynamic';
import React from 'react';

type Descriptor = {
  /** returns the React component to render (e.g., () => import('...').then(m => m.Component)) */
  load: () => Promise<any>;
  loader?: React.ReactNode | null;
  ssr?: boolean;
  /** optional header type string used by the default renderer */
  headerType?: string;
  /** optional title to show in Task trigger */
  getTitle?: (part: any) => string;
  /** optional detailed task items to display while input is present */
  getTaskItems?: (part: any) => string[];
  taskItems?: string[];
  /** optional function to map a tool UI part to props passed to the rendered component */
  propMapper?: (part: any) => Record<string, any>;
  /** optional list of message part types this descriptor handles (e.g. 'tool-showStockInformation') */
  partTypes?: string[];
};

const registry = new Map<string, Descriptor>();
const dynamicCache = new Map<string, React.ComponentType<any>>();
const partTypeIndex = new Map<string, string>();

export function registerTool(key: string, descriptor: Descriptor) {
  registry.set(key, descriptor);
  if (descriptor.partTypes) {
    for (const pt of descriptor.partTypes) partTypeIndex.set(pt, key);
  }
}

export function getToolComponent(key: string): React.ComponentType<any> {
  const desc = registry.get(key);
  if (!desc) throw new Error(`Tool not registered: ${key}`);
  if (dynamicCache.has(key)) return dynamicCache.get(key)!;

  const Comp = dynamic(() => desc.load(), {
    ssr: desc.ssr ?? false,
    loading: () => desc.loader ?? null,
  });

  dynamicCache.set(key, Comp);
  return Comp as unknown as React.ComponentType<any>;
}

export function getDescriptor(key: string) {
  return registry.get(key);
}

export function getToolForPart(part: { type: string }) {
  const key = partTypeIndex.get(part.type);
  if (key) {
    const desc = registry.get(key)!;
    const Comp = getToolComponent(key);
    return { key, desc, Comp };
  }

  // fallback: try to match by substring of part.type (e.g., 'tool-showStockInformation' -> 'stock')
  const maybe = part.type.replace(/^tool-/, '').toLowerCase();
  for (const [k, d] of registry.entries()) {
    if (k.toLowerCase() === maybe) {
      const Comp = getToolComponent(k);
      return { key: k, desc: d, Comp };
    }
  }

  return null;
}

// Pre-register a few tools with simple loaders. As the number of tools grows,
// you can auto-generate these registrations or import a JSON manifest.
import { StockLoader } from './stock';
import { FlightLoader } from './flight';
import { VendorOnboardingLoader } from './vendor-onboarding';

registerTool('stock', {
  load: () => import('@/components/tools/stock').then((m) => m.Stock),
  loader: <StockLoader />,
  headerType: 'tool-stock-information',
  getTitle: (part) => `Stock lookup — ${part?.input?.symbol ?? '…'}`,
  getTaskItems: () => [
    'Fetching historical prices',
    'Calculating summary statistics',
    'Preparing visualization',
  ],
  partTypes: ['tool-showStockInformation'],
  propMapper: (part: any) => ({
    symbol: part?.input?.symbol,
    stockData: part?.output,
  }),
});

registerTool('flight', {
  load: () => import('@/components/tools/flight').then((m) => m.Flight),
  loader: <FlightLoader />,
  headerType: 'tool-flight-status',
  getTitle: (part) => `Flight lookup — ${part?.input?.flightNumber ?? '…'}`,
  getTaskItems: () => [
    'Querying airline API',
    'Matching passenger record',
    'Resolving gate and seat assignment',
    'Generating boarding pass',
  ],
  partTypes: ['tool-showFlightStatus'],
  propMapper: (part: any) => ({
    flightNumber: part?.input?.flightNumber,
    flightData: part?.output,
  }),
});

registerTool('vendor-onboarding', {
  load: () =>
    import('@/components/tools/vendor-onboarding').then(
      (m) => m.VendorOnboardingForm
    ),
  loader: <VendorOnboardingLoader />,
  headerType: 'tool-vendor-onboarding',
  getTitle: (part) => `Vendor onboarding — ${part?.input?.companyName ?? '…'}`,
  getTaskItems: () => ['Collecting company information'],
  partTypes: ['tool-startVendorOnboarding'],
  propMapper: (part: any) => ({
    className: 'w-full',
    defaultValues: {
      companyName: part?.input?.companyName,
      category: part?.input?.category,
    },
  }),
});

export default {
  registerTool,
  getToolComponent,
};
