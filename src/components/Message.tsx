interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export default function Message({ content, role, timestamp, isLoading }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`group relative ${
      isUser 
        ? 'ml-12 flex justify-end' 
        : 'mr-12 flex justify-start'
    }`}>
      <div className={`flex items-start gap-4 max-w-full ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-lg ${
          isUser 
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
            : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
        }`}>
          {isUser ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            isUser 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto max-w-[85%]' 
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-[85%]'
          }`}>
            
            {/* Message bubble pointer */}
            <div className={`absolute top-3 w-3 h-3 rotate-45 ${
              isUser 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 -right-1.5' 
                : 'bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 -left-1.5'
            }`}></div>
            
            <div className="relative z-10">
              <div className={`leading-relaxed whitespace-pre-wrap ${
                isUser ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span>Digitando</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                ) : (
                  content
                )}
              </div>
              
              {/* Timestamp */}
              <div className={`text-xs mt-2 ${
                isUser 
                  ? 'text-blue-100 opacity-80' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
          
          {/* Copy button for assistant messages */}
          {!isUser && !isLoading && (
            <button className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}