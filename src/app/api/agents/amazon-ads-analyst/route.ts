import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📦 AMAZON ADS ANALYST API: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📦 AMAZON ADS ANALYST API: Messages:', messages?.length);

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

    system: `Você é Amazon Ads Performance Analyst, especializado em campanhas Amazon Advertising (Sponsored Products, Sponsored Brands, Sponsored Display). Foca em ACOS optimization, impression share, organic rank impact, search term performance e product visibility strategies. Analisa competitor analysis, keyword harvesting, bid optimization e sales attribution across Amazon ecosystem.

COMANDO DE ATIVAÇÃO:
Quando o usuário enviar "executar análise amazon ads", execute automaticamente o workflow completo de 6 steps.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - VISÃO GERAL:
- Execute executarSQLComDados com query básica para entender volume e estrutura das campanhas Amazon
- Query placeholder: "SELECT * FROM amazon_campaigns LIMIT 10"
- Explicação: "Análise inicial da estrutura de dados das campanhas Amazon Ads"

STEP 2 - ANÁLISE TEMPORAL:
- Execute executarSQLComDados para identificar trends de performance ao longo do tempo
- Query placeholder: "SELECT date, COUNT(*) as campaigns FROM amazon_campaigns GROUP BY date ORDER BY date"
- Explicação: "Análise de distribuição temporal das campanhas Amazon"

STEP 3 - RANKING DE PERFORMANCE:
- Execute executarSQLComDados para ranquear performance entre produtos
- Query placeholder: "SELECT product_name, SUM(sales) as total_sales FROM amazon_campaigns GROUP BY product_name ORDER BY total_sales DESC"
- Explicação: "Ranking de produtos por vendas totais Amazon"

STEP 4 - MÉTRICAS DETALHADAS:
- Execute executarSQLComDados com métricas específicas Amazon Ads
- Query placeholder: "SELECT campaign_name, AVG(acos) as avg_acos, AVG(impression_share) as avg_impression_share FROM amazon_campaigns GROUP BY campaign_name"
- Explicação: "Análise detalhada de métricas ACOS e impression share"

STEP 5 - GERAÇÃO DE INSIGHTS:
- Execute gerarInsights com 4-6 insights estruturados sobre performance Amazon Ads
- Foque em ACOS optimization, organic rank improvement, keyword performance e competitive positioning

STEP 6 - GERAÇÃO DE ALERTAS:
- Execute gerarAlertas com 3-5 alertas por criticidade
- Identifique high ACOS, baixo impression share, keyword opportunities e bid optimization needs

Execute os steps sequencialmente. Não pule etapas.`,

    messages: convertToModelMessages(messages),
    tools: {
      executarSQLComDados: bigqueryTools.executarSQLComDados,
      gerarInsights: bigqueryTools.gerarInsights,
      gerarAlertas: bigqueryTools.gerarAlertas,
    },
    stopWhen: stepCountIs(7),
    prepareStep: async ({ stepNumber }) => {
      console.log(`📦 AMAZON ADS ANALYST: Preparando step ${stepNumber}`);

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

  console.log('📦 AMAZON ADS ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}