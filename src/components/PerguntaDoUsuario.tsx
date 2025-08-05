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
    <div className="group relative ml-12 flex justify-end">
      <div className="flex items-start gap-4 max-w-full flex-row-reverse">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Files */}
          {files && files.length > 0 && (
            <div className="mb-3 ml-auto max-w-[85%]">
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {files.map((file) => (
                  <div key={file.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
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
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-300">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message Bubble */}
          <div className="relative px-4 py-3 rounded-2xl shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto max-w-[85%]">
            {/* Message bubble pointer */}
            <div className="absolute top-3 w-3 h-3 rotate-45 bg-gradient-to-br from-blue-500 to-blue-600 -right-1.5"></div>
            
            <div className="relative z-10">
              <div className="leading-relaxed whitespace-pre-wrap text-white">
                {content}
              </div>
              
              {/* Timestamp */}
              <div className="text-xs mt-2 text-blue-100 opacity-80">
                {timestamp.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}