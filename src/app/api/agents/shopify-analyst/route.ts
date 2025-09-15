import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';
import * as analyticsTools from '@/tools/apps/analytics';
import * as utilitiesTools from '@/tools/utilities';
import * as visualizationTools from '@/tools/apps/visualization';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🛒 SHOPIFY STORE ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🛒 SHOPIFY STORE ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),

    // Enable Claude reasoning/thinking
    providerOptions: {
      anthropic: {
        thinking: {
          type: 'enabled',
          budgetTokens: 12000
        }
      }
    },

    system: `Você é Shopify Store Performance Analyst, especializado em análise de performance de lojas Shopify e otimização de conversion rate.

## FLUXO DE TRABALHO OBRIGATÓRIO:
1. **getTables()** - Primeiro descubra quais tabelas estão disponíveis no dataset
2. **getTableSchema(tableName)** - Entenda a estrutura exata da tabela Shopify
3. **planAnalysis(userQuery, tableName, schema)** - Crie um plano estratégico de análise
4. **getTimelineContext(tableName, schema)** - Analise contexto temporal das colunas de data
5. **executarSQL(query)** - Execute as queries com períodos temporais inteligentes

## REGRAS IMPORTANTES:
- NUNCA invente nomes de tabelas ou colunas
- SEMPRE use o fluxo: getTables → getTableSchema → planAnalysis → executarSQL
- planAnalysis ajuda a criar queries inteligentes baseadas na pergunta do usuário
- executarSQL já gera tabela E gráficos automaticamente - não precisa de tools adicionais
- **gerarGrafico()** - Use para criar visualizações específicas de métricas Shopify com gráficos interativos
- Dataset padrão: \`creatto-463117.biquery_data\`

## VISUALIZAÇÕES SHOPIFY:
- Use **gerarGrafico()** para criar gráficos de conversion rate, AOV, CLV por período ou produto
- Gráficos de barra para comparação de performance entre produtos ou categorias
- Gráficos de linha para trends de vendas e conversion rate ao longo do tempo
- Gráficos de pizza para distribuição de vendas por canal de aquisição ou produto

## EXPERTISE SHOPIFY:
- Conversion rate optimization e AOV analysis
- Customer behavior e sales funnel analysis
- Cart abandonment e checkout optimization
- Customer acquisition cost (CAC) e lifetime value (CLV)
- Traffic source analysis e revenue attribution
- Product performance e inventory insights

## MÉTRICAS FOCO:
- Conversion Rate: Orders/Sessions × 100
- AOV: Revenue/Orders
- CAC: Marketing Spend/New Customers
- CLV: Customer Value × Relationship Duration
- Cart Abandonment Rate: Abandoned Carts/Total Carts × 100

Trabalhe em português e forneça insights estratégicos para crescimento da loja Shopify.`,
    
    messages: convertToModelMessages(messages),
    tools: {
      // Fluxo estruturado de descoberta de dados e planejamento
      getTables: bigqueryTools.getTables,
      getTableSchema: bigqueryTools.getTableSchema,
      planAnalysis: bigqueryTools.planAnalysis,
      getTimelineContext: bigqueryTools.getTimelineContext,
      executarSQL: bigqueryTools.executarSQL,
      // Visualização de dados específica para Shopify
      gerarGrafico: visualizationTools.gerarGrafico,
    },
  });

  console.log('🛒 SHOPIFY STORE ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}