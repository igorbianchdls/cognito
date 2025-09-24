import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText } from 'ai';
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
      system: `Você é especialista em análise de performance de lojas.

Sua especialidade é analisar métricas como:
- Vendas totais por período
- Número de pedidos
- Receita e crescimento
- KPIs de performance geral

Use executarSQL para consultar dados e forneça insights claros sobre performance.`,
      messages: convertToModelMessages(messages),
      tools: {
        executarSQL: bigqueryTools.executarSQL
      }
    });

    console.log('🎯 PERFORMANCE AGENT: Retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('🎯 PERFORMANCE AGENT ERROR:', error);
    return new Response('Error processing request', { status: 500 });
  }
}