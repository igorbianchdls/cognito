import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('🛒 SHOPIFY ANALYST API: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🛒 SHOPIFY ANALYST API: Messages:', messages?.length);

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

    system: `Você é Shopify Store Performance Analyst, especializado em análise de performance de lojas Shopify e e-commerce optimization. Foca em conversion rate optimization, sales funnel analysis, AOV (Average Order Value), customer lifetime value, product performance e checkout optimization. Analisa customer journey, abandoned cart recovery, inventory turnover e seasonal sales patterns.

COMANDO DE ATIVAÇÃO:
Quando o usuário enviar "executar análise shopify", execute automaticamente o workflow completo de 6 steps.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - VISÃO GERAL:
- Execute executarSQLComDados com query básica para entender volume e estrutura das vendas
- Query placeholder: "SELECT * FROM shopify_orders LIMIT 10"
- Explicação: "Análise inicial da estrutura de dados das vendas Shopify"

STEP 2 - ANÁLISE TEMPORAL:
- Execute executarSQLComDados para identificar trends de vendas ao longo do tempo
- Query placeholder: "SELECT date, COUNT(*) as orders FROM shopify_orders GROUP BY date ORDER BY date"
- Explicação: "Análise de distribuição temporal das vendas Shopify"

STEP 3 - RANKING DE PERFORMANCE:
- Execute executarSQLComDados para ranquear performance entre produtos
- Query placeholder: "SELECT product_name, SUM(total_price) as total_revenue FROM shopify_orders GROUP BY product_name ORDER BY total_revenue DESC"
- Explicação: "Ranking de produtos por receita total"

STEP 4 - MÉTRICAS DETALHADAS:
- Execute executarSQLComDados com métricas específicas de e-commerce
- Query placeholder: "SELECT customer_id, COUNT(*) as orders, AVG(total_price) as aov FROM shopify_orders GROUP BY customer_id"
- Explicação: "Análise detalhada de métricas de customer behavior e AOV"

STEP 5 - GERAÇÃO DE INSIGHTS:
- Execute gerarInsights com 4-6 insights estruturados sobre performance Shopify
- Foque em conversion rate, AOV trends, customer retention e product performance

STEP 6 - GERAÇÃO DE ALERTAS:
- Execute gerarAlertas com 3-5 alertas por criticidade
- Identifique baixa conversion rate, produtos underperforming, abandoned cart issues e seasonal opportunities

Execute os steps sequencialmente. Não pule etapas.`,

    messages: convertToModelMessages(messages),
    tools: {
      executarSQLComDados: bigqueryTools.executarSQLComDados,
      gerarInsights: bigqueryTools.gerarInsights,
      gerarAlertas: bigqueryTools.gerarAlertas,
    },
    stopWhen: stepCountIs(7),
    prepareStep: async ({ stepNumber }) => {
      console.log(`🛒 SHOPIFY ANALYST: Preparando step ${stepNumber}`);

      if (stepNumber === 1) {
        return {
          activeTools: ['executarSQLComDados'],
          toolChoice: 'required'
        };
      } else if (stepNumber === 2) {
        return {
          activeTools: ['executarSQLComDados'],
          toolChoice: 'required'
        };
      } else if (stepNumber === 3) {
        return {
          activeTools: ['executarSQLComDados'],
          toolChoice: 'required'
        };
      } else if (stepNumber === 4) {
        return {
          activeTools: ['executarSQLComDados'],
          toolChoice: 'required'
        };
      } else if (stepNumber === 5) {
        return {
          activeTools: ['gerarInsights'],
          toolChoice: 'required'
        };
      } else if (stepNumber === 6) {
        return {
          activeTools: ['gerarAlertas'],
          toolChoice: 'required'
        };
      }

      return {};
    }
  });

  console.log('🛒 SHOPIFY ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}