'use client';

import type { ChatStatus } from 'ai';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputToolbar,
} from '@/components/ai-elements/prompt-input';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export default function MessageInput({ value, onChange, onSubmit, disabled }: MessageInputProps) {
  const status: ChatStatus = disabled ? 'submitted' : 'ready';

  return (
    <PromptInput 
      onSubmit={onSubmit}
      className="relative bg-white dark:bg-[#1a1a1a] rounded-lg border border-[#dfe1e6] dark:border-[#2d2d2d] focus-within:border-[#0052cc] transition-all duration-200"
    >
      <PromptInputTextarea
        value={value}
        onChange={onChange}
        placeholder="Digite sua mensagem..."
        disabled={disabled}
        minHeight={72}
        maxHeight={128}
        className="resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 p-3 pr-12 bg-transparent text-sm placeholder:text-[#8993a4] dark:placeholder:text-[#6c757d] text-[#172b4d] dark:text-[#e8eaed] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <PromptInputToolbar className="absolute right-2 bottom-2">
        <PromptInputSubmit
          status={status}
          disabled={!value.trim() || disabled}
          className="h-8 w-8 transition-all duration-200"
        />
      </PromptInputToolbar>
    </PromptInput>
  );
}