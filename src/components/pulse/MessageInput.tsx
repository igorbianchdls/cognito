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
    <PromptInput onSubmit={onSubmit} className="mt-4">
      <PromptInputTextarea
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputButton onClick={onAttach} disabled={disabled}>
            <PlusIcon size={16} />
          </PromptInputButton>
          
          <PromptInputButton onClick={onMicrophone} disabled={disabled}>
            <MicIcon size={16} />
          </PromptInputButton>
          
          <PromptInputButton onClick={onSearch} disabled={disabled}>
            <SearchIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
          
          <PromptInputModelSelect value={selectedModel} onValueChange={onModelChange}>
            <PromptInputModelSelectTrigger>
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
        </PromptInputTools>
        
        <PromptInputSubmit
          status={status}
          disabled={!value.trim() || disabled}
        />
      </PromptInputToolbar>
    </PromptInput>
  );
}