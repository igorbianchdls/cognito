'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent } from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import type { UIMessage } from '@ai-sdk/react';

interface MessageListProps {
  messages: UIMessage[];
  isLoading: boolean;
  error: string | undefined;
}

export default function MessageList({ messages, isLoading, error }: MessageListProps) {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-4">
      <Conversation>
        <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts?.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      default:
                        return null;
                    }
                  })}
                  {message.role === 'assistant' && (!message.parts || message.parts.length === 0) && isLoading && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-[#5f6368] rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-[#5f6368] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-[#5f6368] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  )}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-xs font-medium">
              {error || 'Erro desconhecido'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}