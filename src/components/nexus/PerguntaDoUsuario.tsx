import { UIMessage } from 'ai';
import { Message, MessageContent } from '@/components/ai-elements/message';

interface PerguntaDoUsuarioProps {
  message: UIMessage;
}

export default function PerguntaDoUsuario({ message }: PerguntaDoUsuarioProps) {
  return (
    <Message from="user">
      <MessageContent>
        {message.parts.map((part, index) =>
          part.type === 'text' ? <span key={index}>{part.text}</span> : null,
        )}
      </MessageContent>
    </Message>
  );
}