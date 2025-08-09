'use client';

import type { ChatStatus } from 'ai';
import { PlusIcon, MicIcon, SearchIcon } from 'lucide-react';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectValue,
} from '@/components/ai-elements/prompt-input';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  onAttach?: () => void;
  onMicrophone?: () => void;
  onSearch?: () => void;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  availableModels?: Array<{id: string, name: string}>;
}

export default function MessageInput({ 
  value, 
  onChange, 
  onSubmit, 
  disabled,
  onAttach,
  onMicrophone,
  onSearch,
  selectedModel = 'claude-3-5-sonnet',
  onModelChange,
  availableModels = [
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  ]
}: MessageInputProps) {
  const status: ChatStatus = disabled ? 'submitted' : 'ready';

  return (
    <PromptInput 
      onSubmit={onSubmit}
      className="relative bg-white dark:bg-[#1a1a1a] rounded-lg border border-[#dfe1e6] dark:border-[#2d2d2d] focus-within:border-[#0052cc] transition-all duration-200"
    >
      <PromptInputTextarea
        value={value}
        onChange={onChange}
        placeholder="What would you like to know?"
        disabled={disabled}
        minHeight={50}
        maxHeight={128}
        className="resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:border-0 p-3 pb-12 bg-transparent text-sm placeholder:text-[#8993a4] dark:placeholder:text-[#6c757d] text-[#172b4d] dark:text-[#e8eaed] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <PromptInputToolbar className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        {/* Left side - Tools */}
        <PromptInputTools className="flex items-center gap-1">
          <PromptInputButton
            type="button"
            size="sm"
            onClick={onAttach}
            disabled={disabled}
            className="h-8 w-8 p-0 text-[#8993a4] hover:text-[#172b4d] dark:text-[#6c757d] dark:hover:text-[#e8eaed]"
            title="Attach file"
          >
            <PlusIcon className="h-4 w-4" />
          </PromptInputButton>
          
          <PromptInputButton
            type="button"
            size="sm"
            onClick={onMicrophone}
            disabled={disabled}
            className="h-8 w-8 p-0 text-[#8993a4] hover:text-[#172b4d] dark:text-[#6c757d] dark:hover:text-[#e8eaed]"
            title="Voice input"
          >
            <MicIcon className="h-4 w-4" />
          </PromptInputButton>
          
          <PromptInputButton
            type="button"
            size="sm"
            onClick={onSearch}
            disabled={disabled}
            className="h-8 px-3 text-[#8993a4] hover:text-[#172b4d] dark:text-[#6c757d] dark:hover:text-[#e8eaed] flex items-center gap-2"
            title="Search"
          >
            <SearchIcon className="h-4 w-4" />
            <span className="text-sm">Search</span>
          </PromptInputButton>
        </PromptInputTools>

        {/* Center - Model Select */}
        <PromptInputModelSelect value={selectedModel} onValueChange={onModelChange}>
          <PromptInputModelSelectTrigger className="h-8 px-3 text-sm bg-transparent border-0 shadow-none focus:ring-0 text-[#8993a4] hover:text-[#172b4d] dark:text-[#6c757d] dark:hover:text-[#e8eaed]">
            <PromptInputModelSelectValue />
          </PromptInputModelSelectTrigger>
          <PromptInputModelSelectContent>
            {availableModels.map((model) => (
              <PromptInputModelSelectItem key={model.id} value={model.id}>
                {model.name}
              </PromptInputModelSelectItem>
            ))}
          </PromptInputModelSelectContent>
        </PromptInputModelSelect>

        {/* Right side - Submit */}
        <PromptInputSubmit
          status={status}
          disabled={!value.trim() || disabled}
          className="h-8 w-8 transition-all duration-200"
        />
      </PromptInputToolbar>
    </PromptInput>
  );
}