import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DaytonaAnalysisProps {
  sandboxId: string;
  output: string;
  charts: string[];
  executionTime?: string;
  insights: string[];
}

export default function DaytonaAnalysisResult({ 
  sandboxId, 
  output, 
  charts, 
  executionTime, 
  insights 
}: DaytonaAnalysisProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-muted/30 p-4 my-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-foreground">Análise Python Daytona</span>
        </div>
        <div className="flex-1"></div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs h-7"
        >
          {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
        </Button>
      </div>

      {/* Insights */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-foreground mb-2">💡 Insights Principais:</h4>
        <div className="space-y-1">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-foreground">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Placeholder */}
      {charts && charts.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">📊 Visualizações Geradas:</h4>
          <div className="bg-background border border-border rounded-lg p-4 text-center text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">{charts.length} gráficos gerados</p>
            <p className="text-xs opacity-75">Os gráficos serão exibidos aqui quando disponíveis</p>
          </div>
        </div>
      )}

      {/* Technical Details */}
      {showDetails && (
        <div className="space-y-3">
          <div className="border-t border-border pt-3">
            <h4 className="text-sm font-semibold text-foreground mb-2">⚡ Detalhes Técnicos:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Sandbox ID:</span>
                <code className="ml-2 bg-background px-1.5 py-0.5 rounded text-xs font-mono">
                  {sandboxId}
                </code>
              </div>
              {executionTime && (
                <div>
                  <span className="text-muted-foreground">Tempo de Execução:</span>
                  <span className="ml-2 text-foreground">{executionTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Python Output */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-foreground">🐍 Saída Python:</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyOutput}
                className="text-xs h-7"
              >
                {copied ? (
                  <>
                    <svg className="w-3 h-3 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copiado
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </>
                )}
              </Button>
            </div>
            <pre className="bg-background border border-border rounded-lg p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto">
              <code className="text-foreground font-mono whitespace-pre-wrap">
                {output}
              </code>
            </pre>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Executado com segurança no Daytona Sandbox
      </div>
    </div>
  );
}