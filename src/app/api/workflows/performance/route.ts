import { anthropic } from '@ai-sdk/anthropic';
import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';

export const maxDuration = 300;

const performanceAgent = new Agent({
  model: anthropic('claude-sonnet-4-20250514'),
  system: `Você é especialista em análise de performance de lojas.

Sua especialidade é analisar métricas como:
- Vendas totais por período
- Número de pedidos
- Receita e crescimento
- KPIs de performance geral

Use executarSQL para consultar dados e forneça insights claros sobre performance.`,
  stopWhen: stepCountIs(3),
  tools: {
    executarSQL: bigqueryTools.executarSQL
  }
});

export async function POST(req: Request) {
  console.log('🎯 PERFORMANCE AGENT: Request recebido!');

  try {
    const body = await req.json();
    console.log('🎯 PERFORMANCE AGENT: Body:', body);

    const { messages } = body;
    console.log('🎯 PERFORMANCE AGENT: Messages:', messages?.length);

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const result = performanceAgent.stream({
      prompt: messages[messages.length - 1].content
    });

    console.log('🎯 PERFORMANCE AGENT: Retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('🎯 PERFORMANCE AGENT ERROR:', error);
    return new Response('Error processing request', { status: 500 });
  }
}