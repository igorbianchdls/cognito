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

STEP 2 - MAPEAMENTO DE SCHEMA DA TABELA ECOMMERCE:
- Use getTableSchema(tableName: "ecommerce") APENAS UMA VEZ
- Foque na estrutura da tabela ecommerce especificamente
- Não chame getTableSchema para outras tabelas
- Analise colunas de métricas (vendas, receita, quantidade)
- Identifique colunas de dimensões (data, produto, campanha)

STEP 3 - ANÁLISE SQL INTELIGENTE:
- Com base no schema da tabela ecommerce descoberto no Step 2, execute executarSQL
- Use as colunas reais da tabela para criar query de análise de performance
- Exemplo: Se encontrou colunas como 'revenue', 'order_date', 'quantity', use-as na query
- Foque em métricas como: total de vendas, pedidos por período, ticket médio
- Crie query que aproveite a estrutura real da tabela ecommerce descoberta

Execute os steps sequencialmente. Não pule etapas.`,
      messages: convertToModelMessages(messages),
      tools: {
        getTables: bigqueryTools.getTables,
        getTableSchema: bigqueryTools.getTableSchema,
        executarSQL: bigqueryTools.executarSQL
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
          // Step 3: Only executarSQL allowed
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