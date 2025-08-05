import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface PerguntaDoUsuarioProps {
  content: string;
  timestamp: Date;
  files?: UploadedFile[];
}

export default function PerguntaDoUsuario({ content, files }: PerguntaDoUsuarioProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex justify-end mb-8">
      <div className="max-w-[85%]">
        {/* Files Preview */}
        {files && files.length > 0 && (
          <div className="mb-4">
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {files.map((file) => (
                <Card key={file.id} className="p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
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
                        <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{formatFileSize(file.size)}</span>
                        <Badge variant="secondary" className="text-xs h-4 px-1.5">
                          {file.fileType || 'unknown'}
                        </Badge>
                      </div>
                      {file.summary && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ {file.summary}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <Card className="shadow-sm bg-muted/50">
          <CardContent className="p-4">
            <div className="text-sm leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 text-foreground leading-relaxed">{children}</p>,
                  code: ({ children }) => (
                    <code className="bg-background border border-border px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-background border border-border p-3 rounded-lg overflow-x-auto my-2">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside text-foreground mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-foreground mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                  h1: ({ children }) => <h1 className="text-lg font-semibold text-foreground mb-2 leading-tight">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mb-2 leading-tight">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mb-2 leading-tight">{children}</h3>,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}