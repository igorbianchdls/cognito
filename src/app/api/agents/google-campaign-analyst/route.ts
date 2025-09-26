import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('🎯 GOOGLE CAMPAIGN ANALYST API: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🎯 GOOGLE CAMPAIGN ANALYST API: Messages:', messages?.length);

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

    system: `Você é Google Campaign Performance Analyst, especializado em análise de campanhas Google Ads (Search, Display, Shopping, YouTube). Foca em Quality Score optimization, CPC management, ad rank factors, keyword performance, landing page experience e conversion tracking. Analisa search impression share, auction insights e competitive positioning para otimização de lances e budgets.

COMANDO DE ATIVAÇÃO:
Quando o usuário enviar "executar análise google campaign", execute automaticamente o workflow completo de 6 steps.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - VISÃO GERAL:
- Execute executarSQLComDados com query básica para entender volume e estrutura das campanhas
- Query placeholder: "SELECT * FROM google_campaigns LIMIT 10"
- Explicação: "Análise inicial da estrutura de dados das campanhas Google Ads"

STEP 2 - ANÁLISE TEMPORAL:
- Execute executarSQLComDados para identificar trends ao longo do tempo
- Query placeholder: "SELECT date, COUNT(*) as campaigns FROM google_campaigns GROUP BY date ORDER BY date"
- Explicação: "Análise de distribuição temporal das campanhas Google"

STEP 3 - RANKING DE PERFORMANCE:
- Execute executarSQLComDados para ranquear performance entre campanhas
- Query placeholder: "SELECT campaign_name, SUM(cost) as total_cost FROM google_campaigns GROUP BY campaign_name ORDER BY total_cost DESC"
- Explicação: "Ranking de campanhas por custo total"

STEP 4 - MÉTRICAS DETALHADAS:
- Execute executarSQLComDados com métricas específicas Google Ads
- Query placeholder: "SELECT campaign_name, AVG(cpc) as avg_cpc, AVG(quality_score) as avg_quality_score FROM google_campaigns GROUP BY campaign_name"
- Explicação: "Análise detalhada de métricas de performance Google Ads"

STEP 5 - GERAÇÃO DE INSIGHTS:
- Execute gerarInsights com 4-6 insights estruturados sobre performance Google Ads
- Foque em Quality Score, CPC optimization, impression share e conversion performance

STEP 6 - GERAÇÃO DE ALERTAS:
- Execute gerarAlertas com 3-5 alertas por criticidade
- Identifique baixo Quality Score, high CPC, low impression share e oportunidades de bid optimization

Execute os steps sequencialmente. Não pule etapas.`,

    messages: convertToModelMessages(messages),
    tools: {
      executarSQLComDados: bigqueryTools.executarSQLComDados,
      gerarInsights: bigqueryTools.gerarInsights,
      gerarAlertas: bigqueryTools.gerarAlertas,
    },
    stopWhen: stepCountIs(6),
    prepareStep: async ({ stepNumber }) => {
      console.log(`🎯 GOOGLE CAMPAIGN ANALYST: Preparando step ${stepNumber}`);

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

  console.log('🎯 GOOGLE CAMPAIGN ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}