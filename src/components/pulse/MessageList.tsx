interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

export default function MessageList({ messages, isLoading, error }: MessageListProps) {
  return (
    <div className="max-w-[800px] mx-auto px-4 py-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {/* Avatar */}
          {message.role === 'assistant' && (
            <div className="w-8 h-8 bg-[#1a73e8] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`max-w-[70%] px-4 py-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-[#1a73e8] text-white ml-auto'
                : 'bg-[#f8f9fa] dark:bg-[#2d2d2d] text-[#202124] dark:text-[#e8eaed]'
            }`}
          >
            <div className="text-sm whitespace-pre-wrap break-words">
              {message.content}
              {message.role === 'assistant' && message.content === '' && isLoading && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#5f6368] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#5f6368] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#5f6368] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
          </div>

          {/* User Avatar */}
          {message.role === 'user' && (
            <div className="w-8 h-8 bg-[#34a853] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-white text-sm font-medium">U</span>
            </div>
          )}
        </div>
      ))}
      
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