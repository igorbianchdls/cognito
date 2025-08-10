import { UIMessage } from 'ai';

interface PerguntaDoUsuarioProps {
  message: UIMessage;
}

export default function PerguntaDoUsuario({ message }: PerguntaDoUsuarioProps) {
  return (
    <div key={message.id}>
      {message.role === 'user' ? 'User: ' : ''}
      {message.parts.map((part, index) =>
        part.type === 'text' ? <span key={index}>{part.text}</span> : null,
      )}
    </div>
  );
}