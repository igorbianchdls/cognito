import axios from 'axios';

export async function POST(req: Request) {
  console.log('=== DAYTONA ANALYSIS API DEBUG ===');
  
  try {
    const { prompt } = await req.json();
    console.log('Prompt received:', prompt);
    console.log('DAYTONA_API_KEY exists:', !!process.env.DAYTONA_API_KEY);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Modo simulação para debug (quando não tem chave real)
    const simulationMode = !process.env.DAYTONA_API_KEY;
    
    if (simulationMode) {
      console.log('SIMULATION MODE: Using mock Daytona response');
      
      // Simular resposta da análise para debug
      const mockAnalysisResult = {
        success: true,
        analysis: {
          output: `=== ANÁLISE DE VENDAS ===
Total de registros: 6
Período: 2024-01 até 2024-06
Total de vendas: R$ 127,000.00
Média mensal: R$ 21,166.67

=== VENDAS POR REGIÃO ===
SP    65000
RJ    43000
MG    19000

=== VENDAS POR PRODUTO ===
A    65000
B    43000
C    19000

=== INSIGHTS PRINCIPAIS ===
✓ Maior venda: R$ 28,000.00 em 2024-06
✓ Menor venda: R$ 15,000.00 em 2024-01
✓ Região líder: SP com R$ 65,000.00
✓ Produto líder: A com R$ 65,000.00
✓ Crescimento total: 86.7% no período`,
          charts: ['chart1.png', 'chart2.png', 'chart3.png', 'chart4.png'],
          executionTime: '2.3s',
          sandboxId: `mock-sandbox-${Date.now()}`
        },
        insights: [
          "📈 Crescimento consistente nas vendas ao longo dos meses",
          "🏆 São Paulo lidera em volume de vendas",
          "📊 Produto A representa a maior fatia do mercado",
          "💡 Crescimento de 86.7% no período analisado"
        ]
      };
      
      console.log('Returning mock analysis result:', mockAnalysisResult);
      
      return new Response(JSON.stringify(mockAnalysisResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('PRODUCTION MODE: Using real Daytona API');

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

    console.log('Daytona config URL:', daytonaConfig.url);
    console.log('Authorization header set:', !!daytonaConfig.headers.Authorization);
    console.log('Creating Daytona sandbox...');
    
    // Criar sandbox
    const createResponse = await axios.post(daytonaConfig.url, {
      language: 'python',
      timeout: 300 // 5 minutes
    }, { headers: daytonaConfig.headers });

    console.log('Create response status:', createResponse.status);
    console.log('Create response data:', createResponse.data);

    const sandboxId = createResponse.data.id;
    console.log('Sandbox created with ID:', sandboxId);

    // Executar código Python
    const execUrl = `${daytonaConfig.url}/${sandboxId}/exec`;
    console.log('Executing code at URL:', execUrl);
    console.log('Code length:', vendasData.length, 'characters');
    
    const execResponse = await axios.post(
      execUrl,
      {
        code: vendasData,
        timeout: 120
      },
      { headers: daytonaConfig.headers }
    );

    console.log('Execution response status:', execResponse.status);
    const result = execResponse.data;
    console.log('Execution result:', result);
    console.log('Code execution completed successfully');

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

  } catch (error: unknown) {
    console.error('=== DAYTONA API ERROR DEBUG ===');
    console.error('Error type:', (error as Error)?.constructor?.name);
    console.error('Error message:', (error as Error)?.message);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:');
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Response Data:', error.response?.data);
      console.error('- Request URL:', error.config?.url);
      console.error('- Request Method:', error.config?.method);
      console.error('- Request Headers:', error.config?.headers);
    }
    console.error('Full error object:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error in Daytona analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
      axiosError: axios.isAxiosError(error) ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      } : null,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}