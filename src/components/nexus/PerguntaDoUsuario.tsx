import { UIMessage } from 'ai';
import { Message, MessageContent } from '@/components/ai-elements/message';
import MessageFileAttachment from './MessageFileAttachment';

interface PerguntaDoUsuarioProps {
  message: UIMessage;
}

export default function PerguntaDoUsuario({ message }: PerguntaDoUsuarioProps) {
  return (
    <Message from="user">
      <MessageContent>
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return <span key={index}>{part.text}</span>;
          }
          if (part.type === 'file') {
            return (
              <MessageFileAttachment
                key={index}
                mediaType={part.mediaType || 'application/octet-stream'}
                url={part.url || ''}
              />
            );
          }
          return null;
        })}
      </MessageContent>
    </Message>
  );
}