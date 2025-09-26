import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('🎯 PERFORMANCE AGENT: Request recebido!');

  try {
    const body = await req.json();
    const { messages } = body;
    console.log('🎯 PERFORMANCE AGENT: Messages:', messages?.length);

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

      system: `Você é especialista em análise de performance de lojas com workflow estruturado obrigatório.

COMANDO DE ATIVAÇÃO:
Quando o usuário enviar "executar fluxo categoria", execute automaticamente o workflow completo de 3 steps.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - DESCOBERTA DE TABELAS:
- Antes de executar getTables(), explique de forma detalhada o que você vai fazer
- Use getTables() para descobrir tabelas disponíveis no BigQuery
- Identifique tabelas relacionadas a vendas, pedidos, produtos, campanhas

STEP 2 - MAPEAMENTO DE SCHEMA DA TABELA ECOMMERCE:
- Antes de executar getTableSchema(), explique de forma detalhada o que você vai fazer
- Use getTableSchema(tableName: "ecommerce") APENAS UMA VEZ
- Foque na estrutura da tabela ecommerce especificamente
- Não chame getTableSchema para outras tabelas
- Analise colunas de métricas (vendas, receita, quantidade)
- Identifique colunas de dimensões (data, produto, campanha)

STEP 3 - ANÁLISE SQL ESPECÍFICA:
- Execute executarSQL com os seguintes parâmetros:
  1. sqlQuery: "SELECT
    product_category,
    COUNT(DISTINCT purchase_id) as total_purchases,
    SUM(product_price * quantity) as revenue,
    AVG(product_price) as avg_price
FROM \`creatto-463117.biquery_data.ecommerce\`
WHERE event_name = 'purchase'
GROUP BY product_category
ORDER BY revenue DESC"
  2. explicacao: "Gere aqui sua explicação detalhada do que você está fazendo"
- Use o parâmetro sqlQuery com a query exata acima
- Use o parâmetro explicacao para descrever detalhadamente sua análise

STEP 4 - ANÁLISE TOP PRODUTOS:
- Execute executarSQL com os seguintes parâmetros:
  1. sqlQuery: "SELECT
    product_name,
    SUM(product_price * quantity) as total_revenue,
    SUM(quantity) as total_sold
FROM \`creatto-463117.biquery_data.ecommerce\`
WHERE event_name = 'purchase'
GROUP BY product_name
ORDER BY total_revenue DESC
LIMIT 10"
  2. explicacao: "Gere aqui sua explicação detalhada do que você está fazendo"
- Use o parâmetro sqlQuery com a query exata acima
- Use o parâmetro explicacao para descrever detalhadamente sua análise

STEP 5 - ANÁLISE POR DIA DA SEMANA:
- Execute executarSQL com os seguintes parâmetros:
  1. sqlQuery: "SELECT
    EXTRACT(DAYOFWEEK FROM event_timestamp) as day_of_week,
    FORMAT_TIMESTAMP('%A', event_timestamp) as day_name,
    COUNT(DISTINCT purchase_id) as purchases,
    SUM(product_price * quantity) as revenue
FROM \`creatto-463117.biquery_data.ecommerce\`
WHERE event_name = 'purchase'
GROUP BY 1, 2
ORDER BY 1"
  2. explicacao: "Gere aqui sua explicação detalhada do que você está fazendo"
- Use o parâmetro sqlQuery com a query exata acima
- Use o parâmetro explicacao para descrever detalhadamente sua análise

STEP 6 - ANÁLISE DE CLIENTES RECORRENTES:
- Execute executarSQL com os seguintes parâmetros:
  1. sqlQuery: "SELECT
    user_id,
    COUNT(DISTINCT purchase_id) as total_purchases,
    SUM(product_price * quantity) as total_spent,
    AVG(product_price * quantity) as avg_order_value
FROM \`creatto-463117.biquery_data.ecommerce\`
WHERE event_name = 'purchase'
GROUP BY user_id
HAVING total_purchases > 1
ORDER BY total_spent DESC
LIMIT 20"
  2. explicacao: "Gere aqui sua explicação detalhada do que você está fazendo"
- Use o parâmetro sqlQuery com a query exata acima
- Use o parâmetro explicacao para descrever detalhadamente sua análise

STEP 7 - ANÁLISE DE EVENTOS:
- Execute executarSQL com os seguintes parâmetros:
  1. sqlQuery: "SELECT
    event_name,
    COUNT(*) as total_events,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM \`creatto-463117.biquery_data.ecommerce\`
GROUP BY event_name
ORDER BY total_events DESC"
  2. explicacao: "Gere aqui sua explicação detalhada do que você está fazendo"
- Use o parâmetro sqlQuery com a query exata acima
- Use o parâmetro explicacao para descrever detalhadamente sua análise

STEP 8 - ANÁLISE POR PAÍS:
- Execute executarSQL com os seguintes parâmetros:
  1. sqlQuery: "SELECT
    country,
    COUNT(DISTINCT purchase_id) as purchases,
    SUM(product_price * quantity) as revenue,
    COUNT(DISTINCT user_id) as customers
FROM \`creatto-463117.biquery_data.ecommerce\`
WHERE event_name = 'purchase'
GROUP BY country
ORDER BY revenue DESC"
  2. explicacao: "Gere aqui sua explicação detalhada do que você está fazendo"
- Use o parâmetro sqlQuery com a query exata acima
- Use o parâmetro explicacao para descrever detalhadamente sua análise

Execute os steps sequencialmente. Não pule etapas.`,
      messages: convertToModelMessages(messages),
      tools: {
        getTables: bigqueryTools.getTables,
        getTableSchema: bigqueryTools.getTableSchema,
        executarSQL: bigqueryTools.executarSQL
      },
      stopWhen: stepCountIs(8),
      prepareStep: async ({ stepNumber }) => {
        console.log(`🎯 PERFORMANCE AGENT: Preparando step ${stepNumber}`);

        if (stepNumber === 1) {
          // Step 1: Only getTables allowed
          return {
            activeTools: ['getTables'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 2) {
          // Step 2: Only getTableSchema allowed
          return {
            activeTools: ['getTableSchema'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 3) {
          // Step 3: Only executarSQL allowed
          return {
            activeTools: ['executarSQL'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 4) {
          // Step 4: Only executarSQL allowed
          return {
            activeTools: ['executarSQL'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 5) {
          // Step 5: Only executarSQL allowed
          return {
            activeTools: ['executarSQL'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 6) {
          // Step 6: Only executarSQL allowed
          return {
            activeTools: ['executarSQL'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 7) {
          // Step 7: Only executarSQL allowed
          return {
            activeTools: ['executarSQL'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 8) {
          // Step 8: Only executarSQL allowed
          return {
            activeTools: ['executarSQL'],
            toolChoice: 'required'
          };
        }

        return {};
      }
    });

    console.log('🎯 PERFORMANCE AGENT: Retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('🎯 PERFORMANCE AGENT ERROR:', error);
    return new Response('Error processing request', { status: 500 });
  }
}