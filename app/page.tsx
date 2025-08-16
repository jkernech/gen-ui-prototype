'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { useState } from 'react';
import { UIMessage, useChat } from '@ai-sdk/react';
import { Response } from '@/components/ai-elements/response';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/source';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import { ToolRenderer } from '@/components/tools/tool-renderer';
import { Thinking } from '@/components/ai-elements/thinking';
import { DefaultChatTransport } from 'ai';

type Part = UIMessage['parts'][number];

export default function Page() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    experimental_throttle: 50,
    transport: new DefaultChatTransport({
      api: 'http://localhost:8000/api/chat',
    }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  return (
    <div className="w-full mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => {
              const parts = message.parts as Part[];
              const sourceUrls = parts.filter(
                (p) => p.type === 'source-url'
              ) as Extract<Part, { type: 'source-url'; url: string }>[];
              return (
                <div key={message.id}>
                  {message.role === 'assistant' && sourceUrls.length > 0 && (
                    <Sources>
                      <SourcesTrigger count={sourceUrls.length} />
                      <SourcesContent>
                        {sourceUrls.map((part, i) => (
                          <Source
                            key={`${message.id}-src-${i}`}
                            href={part.url}
                            title={part.url}
                          />
                        ))}
                      </SourcesContent>
                    </Sources>
                  )}

                  <Message from={message.role}>
                    <div className="flex flex-col gap-4">
                      {parts.map((part, i) => {
                        switch (part.type) {
                          case 'text':
                            return (
                              <MessageContent key={`${message.id}-${i}`}>
                                <Response>{part.text}</Response>
                              </MessageContent>
                            );

                          case 'reasoning':
                            if (!part.text) return null;
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                isStreaming={status === 'streaming'}
                              >
                                <ReasoningTrigger />
                                <ReasoningContent>{part.text}</ReasoningContent>
                              </Reasoning>
                            );

                          default:
                            if (part.type.startsWith('tool-')) {
                              return (
                                <ToolRenderer
                                  key={`${message.id}-${i}`}
                                  part={part}
                                  messageId={message.id}
                                  index={i}
                                />
                              );
                            }
                            return null;
                        }
                      })}
                    </div>
                  </Message>
                </div>
              );
            })}
            {status === 'submitted' && <Thinking />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <Suggestions>
          <Suggestion
            suggestion="What is the status of my flight to San Francisco?"
            onClick={handleSuggestionClick}
            disabled={status === 'streaming'}
          />
          <Suggestion
            suggestion="How has Apple performed in the last 9 months?"
            onClick={handleSuggestionClick}
            disabled={status === 'streaming'}
          />
          <Suggestion
            suggestion="Start vendor onboarding for Acme Inc. in consulting"
            onClick={handleSuggestionClick}
            disabled={status === 'streaming'}
          />
        </Suggestions>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setInput(e.target.value)}
            value={input}
          />
          <PromptInputToolbar>
            <PromptInputTools />
            <PromptInputSubmit
              disabled={!input}
              status={status}
              className="bg-yellow-500"
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
