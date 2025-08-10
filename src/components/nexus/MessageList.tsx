import PerguntaDoUsuario from './PerguntaDoUsuario';
import RespostaDaIA from './RespostaDaIA';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{
    type: string;
    text?: string;
    toolCallId?: string;
    state?: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  }>;
}

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  return (
    <>
      {messages.map(message => (
        message.role === 'user' 
          ? <PerguntaDoUsuario key={message.id} message={message} />
          : <RespostaDaIA key={message.id} message={message} />
      ))}
    </>
  );
}