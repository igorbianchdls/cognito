'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SandboxResult {
  sandboxId: string;
  output: string;
  executionTime: string;
  status: 'idle' | 'creating' | 'executing' | 'success' | 'error';
  error?: string;
  charts?: string[];
  hasVisualizations?: boolean;
  insights?: string[];
  analysisType?: string;
}

export default function DaytonaSandbox() {
  const [result, setResult] = useState<SandboxResult>({
    sandboxId: '',
    output: '',
    executionTime: '',
    status: 'idle'
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'output' | 'charts' | 'insights'>('overview');

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
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Configurar matplotlib para ambiente headless
plt.switch_backend('Agg')
plt.style.use('default')
sns.set_palette("husl")

print("🐍 Python Sandbox com Visualizações Executando...")
print("="*60)

# Dados de exemplo expandidos
data = {
    'produto': ['Notebook', 'Mouse', 'Teclado', 'Monitor', 'Cabo USB', 'Webcam', 'Fone', 'Hub USB'],
    'vendas': [120, 450, 280, 95, 340, 180, 220, 150],
    'regiao': ['SP', 'RJ', 'MG', 'SP', 'RJ', 'SP', 'MG', 'RJ'],
    'preco': [2500, 80, 150, 800, 25, 120, 200, 60]
}

df = pd.DataFrame(data)

# Simular dados temporais
dates = [datetime.now() - timedelta(days=x*30) for x in range(len(df)-1, -1, -1)]
df['data'] = dates

print("📊 Dataset expandido carregado:")
print(df.to_string())
print()

print("📈 Estatísticas Detalhadas:")
print(f"Total de vendas: {df['vendas'].sum()}")
print(f"Média de vendas: {df['vendas'].mean():.2f}")
print(f"Receita total: R$ {(df['vendas'] * df['preco']).sum():,.2f}")
print(f"Maior venda: {df['vendas'].max()} ({df.loc[df['vendas'].idxmax(), 'produto']})")
print()

print("🏆 Vendas por região:")
vendas_regiao = df.groupby('regiao')['vendas'].sum().sort_values(ascending=False)
print(vendas_regiao.to_string())
print()

print("💰 Receita por produto:")
df['receita'] = df['vendas'] * df['preco']
receita_produto = df.set_index('produto')['receita'].sort_values(ascending=False)
for produto, receita in receita_produto.items():
    print(f"{produto}: R$ {receita:,.2f}")
print()

# ============= GERAÇÃO DE GRÁFICOS =============
print("📊 Gerando visualizações...")

# Configurar subplot
fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle('Análise de Vendas - Dashboard Completo', fontsize=16, fontweight='bold')

# Gráfico 1: Vendas por Região (Barras)
vendas_regiao.plot(kind='bar', ax=ax1, color=['#FF6B6B', '#4ECDC4', '#45B7D1'])
ax1.set_title('📊 Vendas por Região', fontweight='bold', pad=20)
ax1.set_xlabel('Região')
ax1.set_ylabel('Vendas (unidades)')
ax1.tick_params(axis='x', rotation=0)
for i, v in enumerate(vendas_regiao.values):
    ax1.text(i, v + 10, str(v), ha='center', fontweight='bold')

# Gráfico 2: Distribuição de Produtos (Pizza)
produto_vendas = df.set_index('produto')['vendas']
colors = plt.cm.Set3(np.linspace(0, 1, len(produto_vendas)))
wedges, texts, autotexts = ax2.pie(produto_vendas.values, labels=produto_vendas.index, 
                                  autopct='%1.1f%%', colors=colors, startangle=90)
ax2.set_title('🥧 Distribuição por Produto', fontweight='bold', pad=20)
for autotext in autotexts:
    autotext.set_color('white')
    autotext.set_fontweight('bold')

# Gráfico 3: Evolução Temporal (Linha)
ax3.plot(df['data'], df['vendas'], marker='o', linewidth=3, markersize=8, color='#FF6B6B')
ax3.fill_between(df['data'], df['vendas'], alpha=0.3, color='#FF6B6B')
ax3.set_title('📈 Evolução das Vendas no Tempo', fontweight='bold', pad=20)
ax3.set_xlabel('Data')
ax3.set_ylabel('Vendas (unidades)')
ax3.tick_params(axis='x', rotation=45)
ax3.grid(True, alpha=0.3)

# Gráfico 4: Receita vs Vendas (Scatter)
receitas = df['vendas'] * df['preco']
scatter = ax4.scatter(df['vendas'], receitas, s=200, alpha=0.7, c=range(len(df)), cmap='viridis')
ax4.set_title('💰 Receita vs Vendas por Produto', fontweight='bold', pad=20)
ax4.set_xlabel('Vendas (unidades)')
ax4.set_ylabel('Receita (R$)')
ax4.grid(True, alpha=0.3)

# Adicionar labels aos pontos
for i, produto in enumerate(df['produto']):
    ax4.annotate(produto, (df['vendas'].iloc[i], receitas.iloc[i]), 
                xytext=(5, 5), textcoords='offset points', fontsize=9)

plt.tight_layout()
plt.savefig('/tmp/dashboard_vendas.png', dpi=150, bbox_inches='tight', 
            facecolor='white', edgecolor='none')
plt.close()

# ============= GRÁFICO ADICIONAL - HEATMAP =============
print("🔥 Gerando heatmap de correlações...")

# Criar dados para correlação
corr_data = df[['vendas', 'preco']].copy()
corr_data['receita'] = df['vendas'] * df['preco']
correlation_matrix = corr_data.corr()

plt.figure(figsize=(8, 6))
sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0,
            square=True, fmt='.2f', cbar_kws={'shrink': 0.8})
plt.title('🔥 Matriz de Correlação', fontweight='bold', pad=20)
plt.tight_layout()
plt.savefig('/tmp/heatmap_correlacao.png', dpi=150, bbox_inches='tight',
            facecolor='white', edgecolor='none')
plt.close()

print("✅ Gráficos salvos com sucesso!")
print("📁 Arquivos gerados:")
print("  - dashboard_vendas.png (4 gráficos principais)")
print("  - heatmap_correlacao.png (matriz de correlação)")
print()

print("🎯 Insights Automáticos:")
melhor_produto = df.loc[df['receita'].idxmax(), 'produto']
melhor_regiao = vendas_regiao.index[0]
print(f"• Produto mais lucrativo: {melhor_produto} (R$ {df.loc[df['receita'].idxmax(), 'receita']:,.2f})")
print(f"• Região líder: {melhor_regiao} ({vendas_regiao.iloc[0]} vendas)")
print(f"• Correlação Preço x Vendas: {correlation_matrix.loc['preco', 'vendas']:.2f}")
print(f"• Ticket médio: R$ {(df['vendas'] * df['preco']).sum() / df['vendas'].sum():.2f}")

print()
print("✅ Análise completa com visualizações concluída!")
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
          status: 'success',
          charts: data.charts || [],
          hasVisualizations: data.hasVisualizations || false,
          insights: data.insights || [],
          analysisType: data.analysisType || 'basic'
        });
        console.log('✅ Execution successful');
        console.log('📊 Charts generated:', data.charts?.length || 0);
        console.log('💡 Insights extracted:', data.insights?.length || 0);
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

      {/* Tabs Interface */}
      {(result.output || result.error || result.status === 'success') && (
        <div className="border border-border rounded-lg bg-muted/30 mt-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'text-foreground border-b-2 border-blue-500' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📊 Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'charts' 
                  ? 'text-foreground border-b-2 border-blue-500' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📈 Gráficos ({result.charts?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'insights' 
                  ? 'text-foreground border-b-2 border-blue-500' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              💡 Insights ({result.insights?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('output')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'output' 
                  ? 'text-foreground border-b-2 border-blue-500' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📋 Saída Python
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">📊 Resumo da Análise</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background border border-border rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-blue-600">{result.charts?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Gráficos</div>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-green-600">{result.insights?.length || 0}</div>
                    <div className="text-xs text-muted-foreground">Insights</div>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-600">{result.executionTime}</div>
                    <div className="text-xs text-muted-foreground">Tempo</div>
                  </div>
                  <div className="bg-background border border-border rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-orange-600">{result.analysisType === 'complete_dashboard' ? 'Completa' : 'Básica'}</div>
                    <div className="text-xs text-muted-foreground">Análise</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>✅ Dashboard completo gerado com visualizações matplotlib + seaborn</p>
                  <p>📈 Análise temporal, correlações e insights automáticos</p>
                  <p>🎯 Dados expandidos com 8 produtos e métricas de receita</p>
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">📈 Visualizações Geradas</h4>
                {result.hasVisualizations ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-background border border-border rounded-lg p-4 text-center">
                      <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h5 className="text-sm font-medium">📊 Dashboard Principal</h5>
                      <p className="text-xs text-muted-foreground mt-1">4 gráficos: barras, pizza, linha e scatter</p>
                    </div>
                    <div className="bg-background border border-border rounded-lg p-4 text-center">
                      <div className="w-full h-32 bg-gradient-to-br from-red-100 to-red-50 rounded-lg flex items-center justify-center mb-3">
                        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                      <h5 className="text-sm font-medium">🔥 Heatmap Correlações</h5>
                      <p className="text-xs text-muted-foreground mt-1">Matriz de correlação entre variáveis</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>Nenhum gráfico gerado nesta execução</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">💡 Insights Extraídos</h4>
                {result.insights && result.insights.length > 0 ? (
                  <div className="space-y-2">
                    {result.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-background border border-border rounded-lg">
                        <span className="text-blue-500 mt-1">•</span>
                        <span className="text-sm text-foreground">{insight}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p>Nenhum insight extraído nesta execução</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'output' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">
                    {result.status === 'error' ? '❌ Erro de Execução' : '📋 Saída Python Completa'}
                  </h4>
                  {result.output && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(result.output)}
                      className="text-xs h-7"
                    >
                      📋 Copiar Tudo
                    </Button>
                  )}
                </div>
                <pre className="bg-background border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
                  <code className={result.status === 'error' ? 'text-red-600' : 'text-foreground'}>
                    {result.error || result.output || 'Nenhuma saída disponível'}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        <p>🛡️ Código executado em ambiente seguro e isolado via Daytona</p>
      </div>
    </div>
  );
}