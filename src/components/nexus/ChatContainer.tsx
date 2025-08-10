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
}

export default function ChatContainer({ 
  messages, 
  input, 
  setInput, 
  onSubmit, 
  status 
}: ChatContainerProps) {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <div style={{ 
        height: '80%', 
        overflowY: 'auto' 
      }}>
        <MessageList messages={messages} />
      </div>
      <div style={{ 
        height: '20%', 
        display: 'flex', 
        alignItems: 'flex-end',
        justifyContent: 'center'
      }}>
        <InputArea 
          input={input}
          setInput={setInput}
          onSubmit={onSubmit}
          status={status}
        />
      </div>
    </div>
  );
}