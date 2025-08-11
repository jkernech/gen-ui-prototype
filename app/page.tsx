'use client';

import { useState, useTransition } from 'react';
import type { ClientMessage } from './actions';
import { useActions, useUIState } from '@ai-sdk/rsc';
import { generateId } from 'ai';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';

export const maxDuration = 30;

function Thinking() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Assistant is thinking"
      className="flex items-center gap-2 text-muted-foreground"
    >
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inline-flex h-2 w-2 rounded-full bg-current opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      <span className="animate-pulse">Thinking…</span>
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState<string>('');
  const [conversation, setConversation] = useUIState();
  const { continueConversation } = useActions();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const submitted = input;
      // Show the user's message immediately
      setConversation((currentConversation: ClientMessage[]) => [
        ...currentConversation,
        { id: generateId(), role: 'user', display: submitted },
      ]);
      // Clear input synchronously for better UX
      setInput('');

      // Stream assistant response with low-priority transition
      startTransition(async () => {
        const message = await continueConversation(submitted);
        setConversation((currentConversation: ClientMessage[]) => [
          ...currentConversation,
          message,
        ]);
      });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const submitted = suggestion;
    setConversation((currentConversation: ClientMessage[]) => [
      ...currentConversation,
      { id: generateId(), role: 'user', display: submitted },
    ]);
    setInput('');
    startTransition(async () => {
      const message = await continueConversation(submitted);
      setConversation((currentConversation: ClientMessage[]) => [
        ...currentConversation,
        message,
      ]);
    });
  };

  return (
    <div className="relative mx-auto size-full h-screen p-6">
      <div className="flex h-full flex-col">
        <Conversation className="h-full">
          <ConversationContent>
            {conversation.map((message: ClientMessage) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.display}
                {message.role === 'user' && (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>{message.display}</MessageContent>
                  </Message>
                )}
              </div>
            ))}
            {isPending && <Thinking />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <Suggestions>
          <Suggestion
            suggestion="What is the status of my flight to San Francisco?"
            onClick={handleSuggestionClick}
            disabled={isPending}
          />
          <Suggestion
            suggestion="How has Apple performed in the last 9 months?"
            onClick={handleSuggestionClick}
            disabled={isPending}
          />
          <Suggestion
            suggestion="Start vendor onboarding for Acme Inc. in consulting"
            onClick={handleSuggestionClick}
            disabled={isPending}
          />
        </Suggestions>

        <PromptInput
          onSubmit={handleSubmit}
          className="mt-4"
          aria-busy={isPending}
        >
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
            disabled={isPending}
            autoFocus={true}
          />
          <PromptInputToolbar>
            <PromptInputTools />
            <PromptInputSubmit
              disabled={!input || isPending}
              status={isPending ? 'submitted' : 'ready'}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
