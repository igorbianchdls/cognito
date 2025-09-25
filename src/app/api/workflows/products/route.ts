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
Quando o usuário enviar "executar análise produtos", execute automaticamente o workflow completo de 3 steps.

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

STEP 3 - INSIGHTS VISUAIS:
**OBRIGATÓRIO**: Execute gerarInsights com os seguintes parâmetros:

PARÂMETROS da tool gerarInsights:
- insights: array de objetos insight (OBRIGATÓRIO)
- resumo: resumo executivo geral (opcional)
- contexto: contexto da análise (opcional)

Estrutura de cada objeto insight:
- titulo: string (ex: "CATEGORIA DOMINANTE - Anéis Lideram")
- descricao: string (explicação detalhada)
- dados: string (números/dados que suportam, opcional)
- importancia: "alta" | "media" | "baixa"

Exemplo de chamada:
insights: [
  {titulo: "CATEGORIA DOMINANTE...", descricao: "...", dados: "...", importancia: "alta"},
  {titulo: "TOP PRODUTO...", descricao: "...", dados: "...", importancia: "alta"}
]

TÓPICOS obrigatórios (4-6 insights):
• CATEGORIA DOMINANTE (alta)
• TOP PRODUTO (alta)
• CONCENTRAÇÃO/DIVERSIFICAÇÃO (media)
• OPORTUNIDADE (media)
• TICKET MÉDIO (baixa)
• RECOMENDAÇÃO (alta)

IMPORTANTE: Execute os steps OBRIGATORIAMENTE na sequência 1 → 2 → 3. Não pule etapas. Não repita steps. Cada step deve ser executado UMA ÚNICA VEZ na ordem correta.`,
      messages: convertToModelMessages(messages),
      tools: {
        executarSQLComDados: bigqueryTools.executarSQLComDados,
        gerarInsights: bigqueryTools.gerarInsights
      },
      stopWhen: stepCountIs(4),
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
          // Step 3: Only gerarInsights allowed
          return {
            activeTools: ['gerarInsights'],
            toolChoice: 'required'
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