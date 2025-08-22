import { UIMessage } from 'ai';
import PerguntaDoUsuario from './PerguntaDoUsuario';
import RespostaDaIA from './RespostaDaIA';

interface MessageListProps {
  messages: UIMessage[];
  selectedAgent: string;
}

export default function MessageList({ messages, selectedAgent }: MessageListProps) {
  return (
    <>
      {messages.map(message => (
        message.role === 'user' 
          ? <PerguntaDoUsuario key={message.id} message={message} />
          : <RespostaDaIA key={message.id} message={message} selectedAgent={selectedAgent} />
      ))}
    </>
  );
}