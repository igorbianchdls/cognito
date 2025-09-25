import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📦 PRODUCT AGENT: Request recebido!');

  try {
    const body = await req.json();
    const { messages } = body;
    console.log('📦 PRODUCT AGENT: Messages:', messages?.length);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: `Você é especialista em análise de produtos de lojas com workflow estruturado obrigatório.

COMANDO DE ATIVAÇÃO:
Quando o usuário enviar "executar análise produtos", execute automaticamente o workflow completo de 2 steps.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - ANÁLISE POR CATEGORIA:
- Antes de executar executarSQLComDados(), explique de forma detalhada o que você vai fazer
- Execute executarSQLComDados com os seguintes parâmetros:
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

STEP 2 - ANÁLISE TOP PRODUTOS:
- Execute executarSQLComDados com os seguintes parâmetros:
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

STEP 3 - RESUMO E INSIGHTS:
- Baseado nos dados reais obtidos nos STEP 1 e STEP 2, gere um resumo executivo
- Analise os padrões encontrados nas categorias de produtos
- Compare o performance dos top produtos vs categorias gerais
- Identifique oportunidades de crescimento e insights estratégicos
- Forneça recomendações práticas baseadas nos dados analisados
- Este step é apenas análise textual - não execute nenhuma tool

Execute os steps sequencialmente. Não pule etapas.`,
      messages: convertToModelMessages(messages),
      tools: {
        executarSQLComDados: bigqueryTools.executarSQLComDados
      },
      stopWhen: stepCountIs(3),
      prepareStep: async ({ stepNumber }) => {
        console.log(`📦 PRODUCT AGENT: Preparando step ${stepNumber}`);

        if (stepNumber === 1) {
          // Step 1: Only executarSQLComDados allowed
          return {
            activeTools: ['executarSQLComDados'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 2) {
          // Step 2: Only executarSQLComDados allowed
          return {
            activeTools: ['executarSQLComDados'],
            toolChoice: 'required'
          };
        } else if (stepNumber === 3) {
          // Step 3: No tools, just analysis
          return {
            activeTools: [],
            toolChoice: 'none'
          };
        }

        return {};
      }
    });

    console.log('📦 PRODUCT AGENT: Retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('📦 PRODUCT AGENT ERROR:', error);
    return new Response('Error processing request', { status: 500 });
  }
}