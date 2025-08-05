import PerguntaDoUsuario from './PerguntaDoUsuario';
import RespostaDaIA from './RespostaDaIA';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
  files?: UploadedFile[];
}

export default function Message({ content, role, timestamp, isLoading, files }: MessageProps) {
  if (role === 'user') {
    return (
      <PerguntaDoUsuario 
        content={content}
        timestamp={timestamp}
        files={files}
      />
    );
  }

  return (
    <RespostaDaIA 
      content={content}
      timestamp={timestamp}
      isLoading={isLoading}
    />
  );
}