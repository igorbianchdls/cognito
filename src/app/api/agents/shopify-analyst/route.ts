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
3. **executarSQL(query)** - Execute as queries com períodos temporais inteligentes

## REGRAS IMPORTANTES:
- NUNCA invente nomes de tabelas ou colunas
- SEMPRE use o fluxo: getTables → getTableSchema → executarSQL
- executarSQL já gera tabela E gráficos automaticamente - não precisa de tools adicionais
- **gerarGrafico()** - Use para criar visualizações específicas de métricas Shopify com gráficos interativos
- **code_execution** - Use para análises avançadas, cálculos estatísticos e processamento de dados com Python
- Dataset padrão: \`creatto-463117.biquery_data\`

## VISUALIZAÇÕES SHOPIFY:
- Use **gerarGrafico()** para criar gráficos de conversion rate, AOV, CLV por período ou produto
- Gráficos de barra para comparação de performance entre produtos ou categorias
- Gráficos de linha para trends de vendas e conversion rate ao longo do tempo
- Gráficos de pizza para distribuição de vendas por canal de aquisição ou produto

## CODE EXECUTION - SHOPIFY ANALYTICS:
- Use **code_execution** para análises avançadas de performance Shopify:
- **Customer Lifetime Value**: Cálculos avançados de CLV e customer segmentation
- **Churn Prediction**: Machine learning models para predict customer churn
- **Cart Abandonment**: Statistical analysis de abandonment patterns e recovery optimization
- **Product Recommendations**: Collaborative filtering e association rules mining
- **Cohort Analysis**: Customer behavior tracking e retention rate calculations
- **Revenue Attribution**: Multi-touch attribution modeling para marketing channels

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
      // Code execution para análises avançadas Shopify
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      code_execution: anthropic.tools.codeExecution_20250522() as any,
    },
  });

  console.log('🛒 SHOPIFY STORE ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}