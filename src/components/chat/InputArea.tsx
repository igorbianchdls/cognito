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
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
} from '@/components/ai-elements/prompt-input';
import { Plus, BarChart3, GlobeIcon } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status?: ChatStatus | string;
  onOpenSandbox?: () => void;
};

export default function InputArea({ value, onChange, onSubmit, status = 'idle', onOpenSandbox }: Props) {
  return (
    <div className="pt-2">
      <PromptInput onSubmit={onSubmit} className="border-gray-100">
        <PromptInputTextarea
          placeholder="Ask a follow up..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputButton>
              <Plus size={16} />
              <span>Upload</span>
            </PromptInputButton>
            <PromptInputButton onClick={() => onOpenSandbox?.()}>
              <BarChart3 size={16} />
              <span>Artifact</span>
            </PromptInputButton>
            <PromptInputButton>
              <GlobeIcon size={16} />
              <span>Search</span>
            </PromptInputButton>

            {/* Agentes (somente trigger visual) */}
            <PromptInputModelSelect>
              <PromptInputModelSelectTrigger className="text-gray-500 hover:text-gray-800">
                <PromptInputModelSelectValue placeholder="Agentes" />
              </PromptInputModelSelectTrigger>
            </PromptInputModelSelect>

            {/* Workflow (somente trigger visual) */}
            <PromptInputModelSelect>
              <PromptInputModelSelectTrigger className="text-gray-500 hover:text-gray-800">
                <PromptInputModelSelectValue placeholder="Workflow" />
              </PromptInputModelSelectTrigger>
            </PromptInputModelSelect>
          </PromptInputTools>
          <PromptInputSubmit disabled={!value} status={status as ChatStatus} />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
