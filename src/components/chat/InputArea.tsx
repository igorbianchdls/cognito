"use client";

import React, { FormEvent } from 'react';
import type { ChatStatus } from 'ai';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputSubmit,
} from '@/components/ai-elements/prompt-input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status?: ChatStatus | string;
};

export default function InputArea({ value, onChange, onSubmit, status = 'idle' }: Props) {
  return (
    <div className="border-t pt-2">
      <PromptInput onSubmit={onSubmit} className="border-gray-100">
        <PromptInputTextarea
          placeholder="Ask a follow up..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputButton>
              <span>+ File</span>
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit disabled={!value} status={status as ChatStatus} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}

