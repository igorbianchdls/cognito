import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('🔍 KEYWORD ANALYST API: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🔍 KEYWORD ANALYST API: Messages:', messages?.length);

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

    system: `Você é Keyword Performance Analyst, especializado em análise de palavras-chave, search terms e SEO/SEM strategy. Foca em keyword research, search volume analysis, competition assessment, match type optimization, negative keyword strategy e search query performance. Analisa trends de busca, seasonal patterns e oportunidades de long-tail keywords para expansão de reach.

COMANDO DE ATIVAÇÃO:
Quando o usuário enviar "executar análise keyword", execute automaticamente o workflow completo de 6 steps.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - VISÃO GERAL:
- Execute executarSQLComDados com query básica para entender volume e estrutura das keywords
- Query placeholder: "SELECT * FROM keywords LIMIT 10"
- Explicação: "Análise inicial da estrutura de dados das palavras-chave"

STEP 2 - ANÁLISE TEMPORAL:
- Execute executarSQLComDados para identificar trends de busca ao longo do tempo
- Query placeholder: "SELECT date, COUNT(*) as searches FROM keywords GROUP BY date ORDER BY date"
- Explicação: "Análise de distribuição temporal das buscas por palavras-chave"

STEP 3 - RANKING DE PERFORMANCE:
- Execute executarSQLComDados para ranquear performance entre keywords
- Query placeholder: "SELECT keyword, SUM(search_volume) as total_volume FROM keywords GROUP BY keyword ORDER BY total_volume DESC"
- Explicação: "Ranking de palavras-chave por volume de busca total"

STEP 4 - MÉTRICAS DETALHADAS:
- Execute executarSQLComDados com métricas específicas de keywords
- Query placeholder: "SELECT keyword, AVG(cpc) as avg_cpc, AVG(competition) as avg_competition FROM keywords GROUP BY keyword"
- Explicação: "Análise detalhada de métricas de competição e CPC das keywords"

STEP 5 - GERAÇÃO DE INSIGHTS:
- Execute gerarInsights com 4-6 insights estruturados sobre performance de keywords
- Foque em volume de busca, competition levels, match type effectiveness e long-tail opportunities

STEP 6 - GERAÇÃO DE ALERTAS:
- Execute gerarAlertas com 3-5 alertas por criticidade
- Identifique high competition keywords, baixo search volume, match type issues e oportunidades de negative keywords

Execute os steps sequencialmente. Não pule etapas.`,

    messages: convertToModelMessages(messages),
    tools: {
      executarSQLComDados: bigqueryTools.executarSQLComDados,
      gerarInsights: bigqueryTools.gerarInsights,
      gerarAlertas: bigqueryTools.gerarAlertas,
    },
    stopWhen: stepCountIs(6),
    prepareStep: async ({ stepNumber }) => {
      console.log(`🔍 KEYWORD ANALYST: Preparando step ${stepNumber}`);

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

  console.log('🔍 KEYWORD ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}