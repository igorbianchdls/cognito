import { UIMessage } from 'ai';
import { FormEvent } from 'react';
import MessageList from './MessageList';
import InputArea from './InputArea';

interface ChatContainerProps {
  messages: UIMessage[];
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  status: string;
  selectedAgent: string;
  onAgentChange: (agent: string) => void;
}

export default function ChatContainer({ 
  messages, 
  input, 
  setInput, 
  onSubmit, 
  status,
  selectedAgent,
  onAgentChange
}: ChatContainerProps) {
  console.log('📦 [ChatContainer] Props recebidas:', { 
    messagesCount: messages.length 
  });
  // Estado vazio - tela de boas-vindas centrada
  if (messages.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Converse com seus dados
          </h1>
          <p className="text-lg text-gray-600">
            Analise, visualize e obtenha insights dos seus dados com IA
          </p>
        </div>
        <div className="w-full max-w-2xl">
          <InputArea 
            input={input}
            setInput={setInput}
            onSubmit={onSubmit}
            status={status}
            selectedAgent={selectedAgent}
            onAgentChange={onAgentChange}
          />
        </div>
      </div>
    );
  }

  // Estado com mensagens - layout com InputArea fixa
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden pb-20">
        <MessageList messages={messages} selectedAgent={selectedAgent} />
      </div>
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 pb-4 bg-white border-t">
        <InputArea 
          input={input}
          setInput={setInput}
          onSubmit={onSubmit}
          status={status}
          selectedAgent={selectedAgent}
          onAgentChange={onAgentChange}
        />
      </div>
    </div>
  );
}