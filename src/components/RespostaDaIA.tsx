import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

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
    <div className="group relative flex justify-start mb-6">
      <div className="flex items-start gap-4 max-w-[85%]">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* Message Content - No bubble/caixa */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-gray">
            {isLoading ? (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <span>Digitando</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-900 dark:text-gray-100">{children}</p>,
                  code: ({ children }) => (
                    <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-700">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside text-gray-900 dark:text-gray-100 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-gray-900 dark:text-gray-100 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1 text-gray-900 dark:text-gray-100">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                  em: ({ children }) => <em className="italic text-gray-900 dark:text-gray-100">{children}</em>,
                  h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-700 dark:text-gray-300 mb-2">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            )}
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