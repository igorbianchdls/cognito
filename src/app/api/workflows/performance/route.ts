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
      system: `Você é especialista em análise de performance de lojas com workflow estruturado obrigatório.

WORKFLOW OBRIGATÓRIO - Execute EXATAMENTE nesta ordem:

STEP 1 - DESCOBERTA DE TABELAS:
- Use getTables() para descobrir tabelas disponíveis no BigQuery
- Identifique tabelas relacionadas a vendas, pedidos, produtos, campanhas

STEP 2 - MAPEAMENTO DE SCHEMAS:
- Para cada tabela relevante, use getTableSchema() para entender estrutura
- Analise colunas de métricas (vendas, receita, quantidade)
- Identifique colunas de dimensões (data, produto, campanha)

STEP 3 - RESUMO DOS SCHEMAS:
- Apresente um resumo claro e organizado dos schemas descobertos
- Identifique as principais tabelas e suas colunas mais importantes
- Destaque colunas de métricas e dimensões relevantes para análise de performance
- Forneça sugestões de análises que podem ser feitas com esses dados

Execute os steps sequencialmente. Não pule etapas.`,
      messages: convertToModelMessages(messages),
      tools: {
        getTables: bigqueryTools.getTables,
        getTableSchema: bigqueryTools.getTableSchema
      },
      stopWhen: stepCountIs(3),
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
          // Step 3: No tools - only text summary
          return {
            activeTools: [],
            toolChoice: 'none'
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