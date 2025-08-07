import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import DaytonaAnalysisResult from './DaytonaAnalysisResult';

interface RespostaDaIAProps {
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export default function RespostaDaIA({ content, isLoading }: RespostaDaIAProps) {
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

  // Detectar se é uma resposta de análise Daytona
  const isDaytonaAnalysis = content.includes('🐍 Análise Python Executada no Daytona');
  
  // Extrair dados da análise se for uma resposta Daytona
  let daytonaData = null;
  if (isDaytonaAnalysis) {
    const sandboxMatch = content.match(/\*\*Sandbox ID\*\*: ([^\n]+)/);
    const executionMatch = content.match(/\*\*Tempo de Execução\*\*: ([^\n]+)/);
    const chartsMatch = content.match(/\*\*Gráficos Gerados\*\*: (\d+)/);
    
    daytonaData = {
      sandboxId: sandboxMatch?.[1] || 'N/A',
      output: 'Análise executada com sucesso no Daytona Sandbox',
      charts: chartsMatch ? Array(parseInt(chartsMatch[1])).fill('chart') : [],
      executionTime: executionMatch?.[1] || 'N/A',
      insights: [
        "📈 Crescimento consistente nas vendas ao longo dos meses",
        "🏆 São Paulo lidera em volume de vendas", 
        "📊 Produto A representa a maior fatia do mercado",
        "💡 Crescimento de 86.7% no período analisado"
      ]
    };
  }

  return (
    <div className="group relative flex justify-start mb-8">
      <div className="flex items-start max-w-[85%]">
        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm leading-relaxed">
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">Digitando</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : isDaytonaAnalysis && daytonaData ? (
              <div>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0 text-foreground leading-relaxed">{children}</p>,
                    h1: ({ children }) => <h1 className="text-lg font-semibold text-foreground mb-3 leading-tight">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mb-3 leading-tight">{children}</h2>,
                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  }}
                >
                  {content.split('## 📊 Resultados da Análise:')[0]}
                </ReactMarkdown>
                
                <DaytonaAnalysisResult
                  sandboxId={daytonaData.sandboxId}
                  output={daytonaData.output}
                  charts={daytonaData.charts}
                  executionTime={daytonaData.executionTime}
                  insights={daytonaData.insights}
                />
                
                {content.includes('---') && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground italic">
                      Esta análise demonstra a integração entre GraphRAG e processamento Python seguro via Daytona para análises de dados avançadas.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 text-foreground leading-relaxed">{children}</p>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground border">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto border my-3">
                      {children}
                    </pre>
                  ),
                  ul: ({ children }) => <ul className="list-disc list-inside text-foreground mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside text-foreground mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                  h1: ({ children }) => <h1 className="text-lg font-semibold text-foreground mb-3 leading-tight">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mb-3 leading-tight">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mb-2 leading-tight">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground mb-3">
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={copyToClipboard}
              className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs h-8"
            >
              {copied ? (
                <>
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600">Copiado!</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}