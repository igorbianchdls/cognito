'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SandboxResult {
  sandboxId: string;
  output: string;
  executionTime: string;
  status: 'idle' | 'creating' | 'executing' | 'success' | 'error';
  error?: string;
}

export default function DaytonaSandbox() {
  const [result, setResult] = useState<SandboxResult>({
    sandboxId: '',
    output: '',
    executionTime: '',
    status: 'idle'
  });

  const executePythonCode = async () => {
    setResult(prev => ({ ...prev, status: 'creating' }));
    console.log('🚀 Starting Daytona Sandbox execution...');

    try {
      const response = await fetch('/api/daytona-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: `import pandas as pd
import numpy as np
from datetime import datetime

print("🐍 Python Sandbox Executando...")
print("="*50)

# Dados de exemplo
data = {
    'produto': ['Notebook', 'Mouse', 'Teclado', 'Monitor', 'Cabo USB'],
    'vendas': [120, 450, 280, 95, 340],
    'regiao': ['SP', 'RJ', 'MG', 'SP', 'RJ']
}

df = pd.DataFrame(data)
print("📊 Dataset carregado:")
print(df.to_string())
print()

print("📈 Estatísticas:")
print(f"Total de vendas: {df['vendas'].sum()}")
print(f"Média de vendas: {df['vendas'].mean():.2f}")
print(f"Maior venda: {df['vendas'].max()} ({df.loc[df['vendas'].idxmax(), 'produto']})")
print()

print("🏆 Vendas por região:")
vendas_regiao = df.groupby('regiao')['vendas'].sum().sort_values(ascending=False)
print(vendas_regiao.to_string())
print()

print("✅ Análise concluída com sucesso!")
print(f"⏰ Executado em: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
`
        })
      });

      const data = await response.json();
      console.log('📦 Daytona response:', data);

      if (data.success) {
        setResult({
          sandboxId: data.sandboxId,
          output: data.output,
          executionTime: data.executionTime || '2.3s',
          status: 'success'
        });
        console.log('✅ Execution successful');
      } else {
        throw new Error(data.error || 'Falha na execução');
      }

    } catch (error) {
      console.error('❌ Daytona execution failed:', error);
      setResult(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'creating': return 'text-blue-600';
      case 'executing': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (result.status) {
      case 'creating': return 'Criando sandbox...';
      case 'executing': return 'Executando código...';
      case 'success': return 'Executado com sucesso!';
      case 'error': return 'Erro na execução';
      default: return 'Pronto para executar';
    }
  };

  return (
    <div className="border border-border rounded-lg p-6 bg-background">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold">D</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Daytona Python Sandbox</h3>
          <p className="text-sm text-muted-foreground">Execução segura de código Python na nuvem</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-foreground">Ambiente Isolado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-foreground">Python + pandas + numpy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-foreground">Análise de dados em tempo real</span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={getStatusColor()}>{getStatusText()}</span>
          </div>
          {result.sandboxId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sandbox:</span>
              <code className="text-xs bg-muted px-1 rounded">{result.sandboxId.substring(0, 8)}...</code>
            </div>
          )}
          {result.executionTime && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tempo:</span>
              <span className="text-foreground">{result.executionTime}</span>
            </div>
          )}
        </div>
      </div>

      <Button 
        onClick={executePythonCode}
        disabled={result.status === 'creating' || result.status === 'executing'}
        className="w-full mb-4"
      >
        {result.status === 'creating' || result.status === 'executing' ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {result.status === 'creating' ? 'Criando sandbox...' : 'Executando...'}
          </div>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Executar Análise Python
          </>
        )}
      </Button>

      {/* Output Display */}
      {(result.output || result.error) && (
        <div className="border border-border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h4 className="text-sm font-medium text-foreground">
              {result.status === 'error' ? '❌ Erro' : '📋 Saída Python'}
            </h4>
            {result.output && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(result.output)}
                className="text-xs h-7"
              >
                📋 Copiar
              </Button>
            )}
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
            <code className={result.status === 'error' ? 'text-red-600' : 'text-foreground'}>
              {result.error || result.output}
            </code>
          </pre>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>🛡️ Código executado em ambiente seguro e isolado via Daytona</p>
      </div>
    </div>
  );
}