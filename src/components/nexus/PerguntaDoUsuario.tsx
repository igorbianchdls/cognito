import { UIMessage } from 'ai';
import { Message, MessageContent } from '@/components/ai-elements/message';
import MessageFileAttachment from './MessageFileAttachment';

interface PerguntaDoUsuarioProps {
  message: UIMessage;
}

export default function PerguntaDoUsuario({ message }: PerguntaDoUsuarioProps) {
  // Separar file parts e text parts
  const fileParts = message.parts.filter(part => part.type === 'file');
  const textParts = message.parts.filter(part => part.type === 'text');

  return (
    <Message from="user">
      {/* Thumbnails acima do container preto */}
      {fileParts.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {fileParts.map((part, index) => (
            <MessageFileAttachment
              key={index}
              mediaType={part.mediaType || 'application/octet-stream'}
              url={part.url || ''}
            />
          ))}
        </div>
      )}

      {/* Container preto apenas com texto */}
      <MessageContent>
        {textParts.map((part, index) => (
          <span key={index}>{part.text}</span>
        ))}
      </MessageContent>
    </Message>
  );
}