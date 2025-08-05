import { useState } from 'react';

interface RespostaDaIAProps {
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export default function RespostaDaIA({ content, timestamp, isLoading }: RespostaDaIAProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="group relative mr-12 flex justify-start">
      <div className="flex items-start gap-4 max-w-full flex-row">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="relative px-4 py-3 rounded-2xl shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 max-w-[85%]">
            
            {/* Message bubble pointer */}
            <div className="absolute top-3 w-3 h-3 rotate-45 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 -left-1.5"></div>
            
            <div className="relative z-10">
              <div className="leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-white">
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
              <div className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                {timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
          
          {/* Copy button */}
          {!isLoading && content && (
            <button 
              onClick={copyToClipboard}
              className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-500">Copiado!</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}