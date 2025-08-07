import axios from 'axios';

export async function POST(req: Request) {
  console.log('=== DAYTONA ANALYSIS API ===');
  
  try {
    const { prompt } = await req.json();
    console.log('Prompt received:', prompt);

    if (!process.env.DAYTONA_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Daytona API key not configured',
        details: 'Please set DAYTONA_API_KEY in your environment variables'
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Dados hardcoded para análise
    const vendasData = `
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Dados de vendas hardcoded
vendas_data = {
    'data': ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
    'vendas': [15000, 18000, 22000, 19000, 25000, 28000],
    'regiao': ['SP', 'RJ', 'SP', 'MG', 'RJ', 'SP'],
    'produto': ['A', 'B', 'A', 'C', 'B', 'A']
}

df = pd.DataFrame(vendas_data)
df['data'] = pd.to_datetime(df['data'])

print("=== ANÁLISE DE VENDAS ===")
print(f"Total de registros: {len(df)}")
print(f"Período: {df['data'].min().strftime('%Y-%m')} até {df['data'].max().strftime('%Y-%m')}")
print(f"Total de vendas: R$ {df['vendas'].sum():,.2f}")
print(f"Média mensal: R$ {df['vendas'].mean():,.2f}")

# Análise por região
print("\\n=== VENDAS POR REGIÃO ===")
vendas_regiao = df.groupby('regiao')['vendas'].sum().sort_values(ascending=False)
print(vendas_regiao)

# Análise por produto
print("\\n=== VENDAS POR PRODUTO ===")
vendas_produto = df.groupby('produto')['vendas'].sum().sort_values(ascending=False)
print(vendas_produto)

# Gráfico 1: Evolução temporal das vendas
plt.figure(figsize=(12, 8))

plt.subplot(2, 2, 1)
plt.plot(df['data'], df['vendas'], marker='o', linewidth=2, markersize=8)
plt.title('Evolução das Vendas por Mês', fontsize=14, fontweight='bold')
plt.xlabel('Mês')
plt.ylabel('Vendas (R$)')
plt.xticks(rotation=45)
plt.grid(True, alpha=0.3)

# Gráfico 2: Vendas por região
plt.subplot(2, 2, 2)
colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
bars = plt.bar(vendas_regiao.index, vendas_regiao.values, color=colors[:len(vendas_regiao)])
plt.title('Vendas por Região', fontsize=14, fontweight='bold')
plt.xlabel('Região')
plt.ylabel('Vendas (R$)')
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height,
             f'R$ {height:,.0f}',
             ha='center', va='bottom')

# Gráfico 3: Vendas por produto
plt.subplot(2, 2, 3)
plt.pie(vendas_produto.values, labels=vendas_produto.index, autopct='%1.1f%%', 
        colors=['#FF9999', '#66B2FF', '#99FF99'])
plt.title('Distribuição por Produto', fontsize=14, fontweight='bold')

# Gráfico 4: Comparativo mensal
plt.subplot(2, 2, 4)
growth = df['vendas'].pct_change().fillna(0) * 100
colors = ['red' if x < 0 else 'green' for x in growth]
plt.bar(range(len(growth)), growth, color=colors, alpha=0.7)
plt.title('Crescimento Mensal (%)', fontsize=14, fontweight='bold')
plt.xlabel('Mês')
plt.ylabel('Crescimento (%)')
plt.axhline(y=0, color='black', linestyle='-', alpha=0.3)
plt.xticks(range(len(df)), df['data'].dt.strftime('%Y-%m'), rotation=45)

plt.tight_layout()
plt.show()

print("\\n=== INSIGHTS PRINCIPAIS ===")
print(f"✓ Maior venda: R$ {df['vendas'].max():,.2f} em {df[df['vendas'] == df['vendas'].max()]['data'].iloc[0].strftime('%Y-%m')}")
print(f"✓ Menor venda: R$ {df['vendas'].min():,.2f} em {df[df['vendas'] == df['vendas'].min()]['data'].iloc[0].strftime('%Y-%m')}")
print(f"✓ Região líder: {vendas_regiao.index[0]} com R$ {vendas_regiao.iloc[0]:,.2f}")
print(f"✓ Produto líder: {vendas_produto.index[0]} com R$ {vendas_produto.iloc[0]:,.2f}")
crescimento_total = ((df['vendas'].iloc[-1] - df['vendas'].iloc[0]) / df['vendas'].iloc[0]) * 100
print(f"✓ Crescimento total: {crescimento_total:.1f}% no período")
`;

    // Configuração para Daytona API
    const daytonaConfig = {
      url: 'https://api.daytona.io/sandboxes',
      headers: {
        'Authorization': `Bearer ${process.env.DAYTONA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('Creating Daytona sandbox...');
    
    // Criar sandbox
    const createResponse = await axios.post(daytonaConfig.url, {
      language: 'python',
      timeout: 300 // 5 minutes
    }, { headers: daytonaConfig.headers });

    const sandboxId = createResponse.data.id;
    console.log('Sandbox created:', sandboxId);

    // Executar código Python
    const execResponse = await axios.post(
      `${daytonaConfig.url}/${sandboxId}/exec`,
      {
        code: vendasData,
        timeout: 120
      },
      { headers: daytonaConfig.headers }
    );

    const result = execResponse.data;
    console.log('Code execution completed');

    // Limpar sandbox
    try {
      await axios.delete(`${daytonaConfig.url}/${sandboxId}`, {
        headers: daytonaConfig.headers
      });
      console.log('Sandbox cleaned up');
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError);
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        output: result.output || result.result,
        charts: result.artifacts || [],
        executionTime: result.execution_time,
        sandboxId: sandboxId
      },
      insights: [
        "📈 Crescimento consistente nas vendas ao longo dos meses",
        "🏆 São Paulo lidera em volume de vendas",
        "📊 Produto A representa a maior fatia do mercado",
        "💡 Crescimento de 86.7% no período analisado"
      ]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Detailed error in daytona-analysis API:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error in Daytona analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}