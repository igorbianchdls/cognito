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
import { FormEvent } from 'react';
import { useStore } from '@nanostores/react';
import type { ChatStatus } from 'ai';
import { currentAgent as agentStore, setCurrentAgent } from '@/stores/agentStore';

interface InputAreaProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status: string;
}

const models = [
  { id: 'nexus', name: 'Nexus' },
  { id: 'meta-analyst', name: 'MetaAnalyst' },
];

export default function InputArea({ input, setInput, onSubmit, status }: InputAreaProps) {
  const agent = useStore(agentStore);
  
  console.log('🎤 [InputArea] Agent do nanostore:', agent);

  return (
    <PromptInput onSubmit={onSubmit} className="mt-4 border-gray-100">
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
              console.log('🎤 [InputArea] onValueChange chamado:', value);
              console.log('🎤 [InputArea] agent antes da mudança:', agent);
              setCurrentAgent(value); // Usa diretamente o nanostore
              console.log('🎤 [InputArea] setCurrentAgent executado');
            }}
            value={agent}
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