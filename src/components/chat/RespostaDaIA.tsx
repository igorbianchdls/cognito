import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import WeatherCard from '@/components/julius/WeatherCard';
import Calculator from '@/components/julius/Calculator';
import ChartGenerator from '@/components/julius/ChartGenerator';
import BigQueryDatasetsList from '@/components/julius/BigQueryDatasetsList';
import BigQueryTablesList from '@/components/julius/BigQueryTablesList';
import BigQueryTableData from '@/components/julius/BigQueryTableData';
import BigQueryChartGenerator from '@/components/julius/BigQueryChartGenerator';

interface ToolCall {
  id: string;
  name: string;
  state: 'loading' | 'result';
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

interface RespostaDaIAProps {
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  toolCalls?: ToolCall[];
}

export default function RespostaDaIA({ content, isLoading, toolCalls }: RespostaDaIAProps) {
  const [copied, setCopied] = useState(false);



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
            ) : (
              <div className="space-y-4">
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
                
                {/* Render Tool UI Components */}
                {toolCalls?.map((toolCall) => {
                  const { id, name, state, result } = toolCall;
                  
                  if (state === 'result' && result) {
                    switch (name) {
                      case 'getWeather':
                        return (
                          <div key={id} className="my-4">
                            <WeatherCard 
                              location={(result.location as string) || ''} 
                              temperature={(result.temperature as number) || 0} 
                            />
                          </div>
                        );
                      case 'calculator':
                        return (
                          <div key={id} className="my-4">
                            <Calculator 
                              expression={result.expression as string}
                              result={result.result as number}
                            />
                          </div>
                        );
                      case 'createChart':
                        return (
                          <div key={id} className="my-4">
                            <ChartGenerator 
                              title={(result.title as string) || ''}
                              data={(result.data as Array<{label: string; value: number}>) || []}
                              type={(result.type as 'bar' | 'pie' | 'line') || 'bar'}
                            />
                          </div>
                        );
                      case 'getBigQueryDatasets':
                        return (
                          <div key={id} className="my-4">
                            <BigQueryDatasetsList 
                              datasets={result.datasets as Array<{
                                id: string;
                                friendlyName?: string;
                                description?: string;
                                location?: string;
                                creationTime?: string;
                                lastModifiedTime?: string;
                              }>}
                              success={result.success as boolean}
                              error={result.error as string}
                            />
                          </div>
                        );
                      case 'getBigQueryTables':
                        return (
                          <div key={id} className="my-4">
                            <BigQueryTablesList 
                              tables={result.tables as Array<{
                                DATASETID?: string;
                                TABLEID?: string;
                                PROJECTID?: string;
                                NUMROWS?: number;
                                NUMBYTES?: number;
                                CREATIONTIME?: string;
                                datasetId?: string;
                                tableId?: string;
                                projectId?: string;
                                description?: string;
                                numRows?: number;
                                numBytes?: number;
                                creationTime?: Date;
                                lastModifiedTime?: Date;
                              }>}
                              datasetId={(result.datasetId as string) || ''}
                              success={result.success as boolean}
                              error={result.error as string}
                            />
                          </div>
                        );
                      case 'getBigQueryTableData':
                        return (
                          <div key={id} className="my-4">
                            <BigQueryTableData 
                              data={result.data as {
                                data: Array<Record<string, unknown>>;
                                totalRows: number;
                                schema: Array<{
                                  name: string;
                                  type: string;
                                  mode: string;
                                }>;
                                executionTime: number;
                                bytesProcessed?: number;
                              }}
                              executionTime={result.executionTime as number}
                              query={result.query as string}
                              success={result.success as boolean}
                              error={result.error as string}
                            />
                          </div>
                        );
                      case 'createBigQueryChart':
                        return (
                          <div key={id} className="my-4">
                            <BigQueryChartGenerator 
                              chartData={result.chartData as Array<{
                                x: string;
                                y: number;
                                label: string;
                                value: number;
                              }>}
                              chartType={result.chartType as 'bar' | 'line' | 'pie' | 'scatter'}
                              xColumn={result.xColumn as string}
                              yColumn={result.yColumn as string}
                              title={result.title as string}
                              query={result.query as string}
                              executionTime={result.executionTime as number}
                              dataCount={result.dataCount as number}
                              success={result.success as boolean}
                              error={result.error as string}
                            />
                          </div>
                        );
                      case 'createChartFromTable':
                        return (
                          <div key={id} className="my-4">
                            <BigQueryChartGenerator 
                              chartData={result.chartData as Array<{
                                x: string;
                                y: number;
                                label: string;
                                value: number;
                              }>}
                              chartType={result.chartType as 'bar' | 'line' | 'pie' | 'scatter'}
                              xColumn={result.xColumn as string}
                              yColumn={result.yColumn as string}
                              title={result.title as string}
                              dataCount={result.dataCount as number}
                              success={result.success as boolean}
                              error={result.error as string}
                            />
                          </div>
                        );
                      default:
                        return null;
                    }
                  } else if (state === 'loading') {
                    return (
                      <div key={id} className="my-4 p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          Executando {name}...
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })}
              </div>
            )}
          </div>
          
          {/* Copy button */}
          {!isLoading && (content || toolCalls?.length) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                const textToCopy = content + (toolCalls?.map(tc => 
                  tc.state === 'result' ? `\n[${tc.name}: ${JSON.stringify(tc.result)}]` : ''
                ).join('') || '');
                navigator.clipboard.writeText(textToCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
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