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

  // Ocultar comandos internos (ex.: apply_patch(...)) e envelopes de patch
  const visibleTextParts = textParts.filter((part) => {
    const t = (part as { type: 'text'; text?: string }).text || '';
    if (/^\s*apply_patch\s*\(/.test(t)) return false;
    if (t.includes('*** Begin Patch') || t.includes('*** Update File:') || t.includes('*** End Patch')) return false;
    return true;
  });

  if (visibleTextParts.length === 0 && fileParts.length === 0) {
    return null;
  }

  return (
    <Message from="user">
      <div>
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
          {visibleTextParts.map((part, index) => (
            <span key={index}>{part.text}</span>
          ))}
        </MessageContent>
      </div>
    </Message>
  );
}
