import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';
import * as visualizationTools from '@/tools/apps/visualization';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📘 META CREATIVE ANALYST API: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📘 META CREATIVE ANALYST API: Messages:', messages?.length);

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

    system: `Você é Meta Creative Performance Analyst, especializado em análise de performance de criativos e elementos visuais em campanhas Meta. Foca em creative fatigue detection, A/B testing de formatos (image, video, carousel), CTR por creative elements, thumb-stop ratio e optimization de visual assets. Analisa performance de copy, headlines, call-to-actions e creative rotation strategies.

COMANDO DE ATIVAÇÃO:
Quando o usuário enviar "executar análise meta creative", execute automaticamente o workflow completo de 6 steps.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - VISÃO GERAL:
- Execute executarSQLComDados com query básica para entender volume e estrutura dos criativos
- Query placeholder: "SELECT * FROM meta_creatives LIMIT 10"
- Explicação: "Análise inicial da estrutura de dados dos criativos Meta"

STEP 2 - ANÁLISE TEMPORAL:
- Execute executarSQLComDados para identificar trends de performance ao longo do tempo
- Query placeholder: "SELECT date, COUNT(*) as creatives FROM meta_creatives GROUP BY date ORDER BY date"
- Explicação: "Análise de distribuição temporal dos criativos Meta"

STEP 3 - RANKING DE PERFORMANCE:
- Execute executarSQLComDados para ranquear performance entre formatos
- Query placeholder: "SELECT creative_format, AVG(ctr) as avg_ctr FROM meta_creatives GROUP BY creative_format ORDER BY avg_ctr DESC"
- Explicação: "Ranking de formatos de criativo por CTR médio"

STEP 4 - MÉTRICAS DETALHADAS:
- Execute executarSQLComDados com métricas específicas de criativos
- Query placeholder: "SELECT creative_id, ctr, engagement_rate, thumb_stop_ratio FROM meta_creatives ORDER BY ctr DESC"
- Explicação: "Análise detalhada de métricas de engagement dos criativos"

STEP 5 - GERAÇÃO DE INSIGHTS:
- Execute gerarInsights com 4-6 insights estruturados sobre performance de criativos
- Foque em creative fatigue, formato performance, audience engagement e refresh opportunities

STEP 6 - GERAÇÃO DE ALERTAS:
- Execute gerarAlertas com 3-5 alertas por criticidade
- Identifique creative fatigue, low engagement, formato underperformance e oportunidades de creative optimization

Execute os steps sequencialmente. Não pule etapas.`,

    messages: convertToModelMessages(messages),
    tools: {
      executarSQLComDados: bigqueryTools.executarSQLComDados,
      gerarInsights: bigqueryTools.gerarInsights,
      gerarAlertas: bigqueryTools.gerarAlertas,
    },
    stopWhen: stepCountIs(6),
    prepareStep: async ({ stepNumber }) => {
      console.log(`📘 META CREATIVE ANALYST: Preparando step ${stepNumber}`);

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

  console.log('📘 META CREATIVE ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}