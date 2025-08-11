'use server';

import { getMutableAIState, streamUI } from '@ai-sdk/rsc';
import { openai } from '@ai-sdk/openai';
import type { ReactNode } from 'react';
import { z } from 'zod';
import { generateId } from 'ai';
import { Stock, StockLoader } from '@/components/tools/stock';
import { Flight, FlightLoader } from '@/components/tools/flight';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import { wait } from '@/lib/utils';
import {
  VendorOnboardingForm,
  VendorOnboardingLoader,
} from '@/components/tools/vendor-onboarding';

export interface ServerMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClientMessage {
  id: string;
  role: 'user' | 'assistant';
  display: ReactNode;
}

export async function continueConversation(
  input: string
): Promise<ClientMessage> {
  'use server';

  const id = generateId();
  const history = getMutableAIState();
  history.update([...history.get(), { role: 'user', content: input }]);

  const result = await streamUI({
    model: openai('gpt-5-nano'),
    messages: history.get(),
    text: ({ content, done }) => {
      if (done) {
        history.done((messages: ServerMessage[]) => [
          ...messages,
          { role: 'assistant', content },
        ]);
      }

      return (
        <Message from={'assistant'} key={id}>
          <MessageContent>
            <Response>{content}</Response>
          </MessageContent>
        </Message>
      );
    },
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
        async *generate({ symbol, numOfMonths }) {
          yield <StockLoader />;

          history.done((messages: ServerMessage[]) => [
            ...messages,
            {
              role: 'assistant',
              content: `Showing stock information for ${symbol}`,
            },
          ]);

          await wait(1000);

          const data = Array.from({ length: numOfMonths }, (_, index) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (numOfMonths - 1 - index));
            const isoDate = date.toISOString().split('T')[0];
            const baseValue = 100 + index * 50;
            const noise = Math.round(Math.random() * 100);
            return { date: isoDate, value: baseValue + noise };
          });

          return <Stock symbol={symbol} stockData={data} />;
        },
      },
      showFlightStatus: {
        description: 'Get the status of a flight',
        inputSchema: z.object({
          flightNumber: z
            .string()
            .describe('The flight number to get status for'),
        }),
        async *generate({ flightNumber }) {
          yield <FlightLoader />;

          history.done((messages: ServerMessage[]) => [
            ...messages,
            {
              role: 'assistant',
              content: `Showing flight status for ${flightNumber}`,
            },
          ]);

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

          return <Flight flightNumber={flightNumber} flightData={data} />;
        },
      },
      startVendorOnboarding: {
        description: 'Start a multi-step vendor onboarding flow with validation',
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
        async *generate({ companyName, category }) {
          yield <VendorOnboardingLoader />;

          history.done((messages: ServerMessage[]) => [
            ...messages,
            {
              role: 'assistant',
              content: `Starting vendor onboarding${companyName ? ` for ${companyName}` : ''}.`,
            },
          ]);

          await wait(800);

          return (
            <VendorOnboardingForm
              defaultValues={{ companyName: companyName ?? '', category }}
            />
          );
        },
      },
    },
  });

  return {
    id,
    role: 'assistant',
    display: result.value,
  };
}
