import PerguntaDoUsuario from './PerguntaDoUsuario';
import RespostaDaIA from './RespostaDaIA';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  content?: string;
  summary?: string;
  fileType?: 'csv' | 'text' | 'unknown';
  rowCount?: number;
  columnCount?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  files?: UploadedFile[];
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export default function MessageList({ messages, isLoading, error }: MessageListProps) {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-4 space-y-4">
      {messages.map((message) => {
        if (message.role === 'user') {
          return (
            <PerguntaDoUsuario
              key={message.id}
              content={message.content}
              timestamp={message.createdAt}
              files={message.files}
            />
          );
        }
        
        return (
          <RespostaDaIA
            key={message.id}
            content={message.content}
            timestamp={message.createdAt}
            isLoading={message.role === 'assistant' && message.content === '' && isLoading}
          />
        );
      })}
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-xs font-medium">
              {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}