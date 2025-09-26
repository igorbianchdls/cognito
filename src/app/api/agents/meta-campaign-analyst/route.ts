import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';
import * as visualizationTools from '@/tools/apps/visualization';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📘 META CAMPAIGN ANALYST API: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📘 META CAMPAIGN ANALYST API: Messages:', messages?.length);

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

    system: `Você é Meta Campaign Performance Analyst, especializado em análise de performance de campanhas publicitárias Meta (Facebook e Instagram Ads). Foca na otimização de ROAS, CPA, CTR, frequency, budget allocation e estratégias de targeting. Analisa performance por placement, audience segments, bid strategies e attribution windows para maximizar retorno dos investimentos em Meta Ads.

COMANDO DE ATIVAÇÃO:
Quando o usuário enviar "executar análise meta campaign", execute automaticamente o workflow completo de 6 steps.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - VISÃO GERAL:
- Execute executarSQLComDados com query básica para entender volume e estrutura dos dados
- Query placeholder: "SELECT * FROM meta_campaigns LIMIT 10"
- Explicação: "Análise inicial da estrutura de dados das campanhas Meta"

STEP 2 - ANÁLISE TEMPORAL:
- Execute executarSQLComDados para identificar trends ao longo do tempo
- Query placeholder: "SELECT date, COUNT(*) as campaigns FROM meta_campaigns GROUP BY date ORDER BY date"
- Explicação: "Análise de distribuição temporal das campanhas Meta"

STEP 3 - RANKING DE PERFORMANCE:
- Execute executarSQLComDados para ranquear performance entre campanhas
- Query placeholder: "SELECT campaign_name, SUM(spend) as total_spend FROM meta_campaigns GROUP BY campaign_name ORDER BY total_spend DESC"
- Explicação: "Ranking de campanhas por investimento total"

STEP 4 - MÉTRICAS DETALHADAS:
- Execute executarSQLComDados com métricas específicas Meta
- Query placeholder: "SELECT campaign_name, AVG(cpc) as avg_cpc, AVG(ctr) as avg_ctr FROM meta_campaigns GROUP BY campaign_name"
- Explicação: "Análise detalhada de métricas de performance Meta"

STEP 5 - GERAÇÃO DE INSIGHTS:
- Execute gerarInsights com 4-6 insights estruturados sobre performance Meta
- Foque em ROAS, budget allocation, audience performance e optimization opportunities

STEP 6 - GERAÇÃO DE ALERTAS:
- Execute gerarAlertas com 3-5 alertas por criticidade
- Identifique campanhas com baixo ROAS, high frequency, budget waste e oportunidades de scaling

Execute os steps sequencialmente. Não pule etapas.`,

    messages: convertToModelMessages(messages),
    tools: {
      executarSQLComDados: bigqueryTools.executarSQLComDados,
      gerarInsights: bigqueryTools.gerarInsights,
      gerarAlertas: bigqueryTools.gerarAlertas,
    },
    stopWhen: stepCountIs(7),
    prepareStep: async ({ stepNumber }) => {
      console.log(`📘 META CAMPAIGN ANALYST: Preparando step ${stepNumber}`);

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

  console.log('📘 META CAMPAIGN ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}