import ReactMarkdown from 'react-markdown';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface PerguntaDoUsuarioProps {
  content: string;
  timestamp: Date;
  files?: UploadedFile[];
}

export default function PerguntaDoUsuario({ content, timestamp, files }: PerguntaDoUsuarioProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex justify-end mb-6">
      <div className="max-w-[85%]">
        {/* Files Preview */}
        {files && files.length > 0 && (
          <div className="mb-3">
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {files.map((file) => (
                <div key={file.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={file.url} 
                          alt={file.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      </>
                    ) : (
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-sm">
          <div className="prose prose-sm max-w-none dark:prose-invert prose-gray">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-900 dark:text-gray-100">{children}</p>,
                code: ({ children }) => (
                  <code className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-200 dark:bg-gray-600 p-3 rounded-lg overflow-x-auto">
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
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
          
        </div>
      </div>
    </div>
  );
}