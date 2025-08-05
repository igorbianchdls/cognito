interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export default function Message({ content, role, timestamp, isLoading }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-600 dark:bg-gray-400 text-white dark:text-gray-900'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>
        
        {/* Message Content */}
        <div className={`px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {isLoading ? (
              <div className="flex items-center gap-1">
                <span>{content}</span>
                <div className="flex gap-1 ml-2">
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : (
              content
            )}
          </div>
          
          {/* Timestamp */}
          <div className={`text-xs mt-1 opacity-70 ${
            isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {timestamp.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}