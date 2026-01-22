"use client";

import React from 'react';
import type { UIMessage } from 'ai';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';

type Props = { message: UIMessage };

export default function RespostaDaIa({ message }: Props) {
  const parts = message.parts || [];
  const hasAnything = parts.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="w-full flex justify-start py-3">
      <div className="max-w-[720px] w-full">
        {parts.map((part, index) => {
          if (part.type === 'reasoning') {
            const txt = (part as any).content || (part as any).text || '';
            const isStreaming = (part as any).state === 'streaming';
            if (!txt) return null;
            return (
              <Reasoning key={`think-${index}`} isStreaming={isStreaming}>
                <ReasoningTrigger />
                <ReasoningContent>{txt}</ReasoningContent>
              </Reasoning>
            );
          }
          if (part.type === 'text') {
            const txt = (part as any).text || '';
            if (!txt) return null;
            return (
              <div key={`resp-${index}`} className="text-[15px] leading-6">
                <Response options={{}}>{txt}</Response>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
