import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import z from 'zod';
import { wait } from '@/lib/utils';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai('o3'),
    messages: convertToModelMessages(messages),
    system:
      'You are a helpful assistant that can answer questions and help with tasks',
    tools: {
      showStockInformation: {
        description:
          'Get stock information for symbol for the last numOfMonths months',
        inputSchema: z.object({
          symbol: z
            .string()
            .describe('The stock symbol to get information for'),
          numOfMonths: z
            .number()
            .describe('The number of months to get historical information for'),
        }),
        execute: async ({ symbol, numOfMonths }) => {
          await wait(1000);

          const data = Array.from({ length: numOfMonths }, (_, index) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (numOfMonths - 1 - index));
            const isoDate = date.toISOString().split('T')[0];
            const baseValue = 100 + index * 50;
            const noise = Math.round(Math.random() * 100);
            return { date: isoDate, value: baseValue + noise };
          });

          return data;
        },
      },
      showFlightStatus: {
        description: 'Get the status of a flight',
        inputSchema: z.object({
          flightNumber: z
            .string()
            .describe('The flight number to get status for'),
        }),
        execute: async ({ flightNumber }) => {
          await wait(1000);

          const data = {
            status: 'On Time',
            source: 'LAX',
            destination: 'SFO',
            departure: '10:15 AM',
            arrival: '11:45 AM',
            gate: 'A12',
            seat: '14C',
          };

          return data;
        },
      },
      startVendorOnboarding: {
        description:
          'Start a multi-step vendor onboarding flow with validation',
        inputSchema: z.object({
          companyName: z
            .string()
            .optional()
            .describe('Optional pre-filled company name'),
          category: z
            .enum(['software', 'consulting', 'hardware', 'services', 'other'])
            .optional()
            .describe('Optional vendor category'),
        }),
        execute: async ({ companyName, category }) => {
          await wait(1200);

          return {
            companyName,
            category,
          };
        },
      },
    },
  });

  return result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
    sendStart: true,
    sendFinish: true,
  });
}
