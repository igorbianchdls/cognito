import {
  PromptInput,
  PromptInputButton,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { GlobeIcon, MicIcon } from 'lucide-react';
import { useState, FormEvent } from 'react';
import type { ChatStatus } from 'ai';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status: string;
}

const models = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'claude-opus-4-20250514', name: 'Claude 4 Opus' },
];

export default function InputArea({ input, setInput, onSubmit, status }: InputAreaProps) {
  const [model, setModel] = useState<string>(models[0].id);

  return (
    <PromptInput onSubmit={onSubmit} className="mt-4">
      <PromptInputTextarea
        onChange={(e) => setInput(e.target.value)}
        value={input}
      />
      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputButton>
            <MicIcon size={16} />
          </PromptInputButton>
          <PromptInputButton>
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
          <PromptInputModelSelect
            onValueChange={(value) => {
              setModel(value);
            }}
            value={model}
          >
            <PromptInputModelSelectTrigger>
              <PromptInputModelSelectValue />
            </PromptInputModelSelectTrigger>
            <PromptInputModelSelectContent>
              {models.map((model) => (
                <PromptInputModelSelectItem key={model.id} value={model.id}>
                  {model.name}
                </PromptInputModelSelectItem>
              ))}
            </PromptInputModelSelectContent>
          </PromptInputModelSelect>
        </PromptInputTools>
        <PromptInputSubmit disabled={!input} status={status as ChatStatus} />
      </PromptInputToolbar>
    </PromptInput>
  );
}