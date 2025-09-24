import { anthropic } from '@ai-sdk/anthropic';
import { Experimental_Agent as Agent, stepCountIs } from 'ai';
import * as visualizationTools from '@/tools/apps/visualization';

export const maxDuration = 300;

const productAgent = new Agent({
  model: anthropic('claude-sonnet-4-20250514'),
  system: `Você é especialista em análise de produtos de lojas.

Sua especialidade é analisar:
- Produtos mais vendidos
- Categorias de produtos
- Performance por produto
- Análise de inventário

Use gerarGrafico para criar visualizações claras dos dados de produtos.`,
  stopWhen: stepCountIs(3),
  tools: {
    gerarGrafico: visualizationTools.gerarGrafico
  }
});

export async function POST(req: Request) {
  console.log('📦 PRODUCT AGENT: Request recebido!');

  try {
    const body = await req.json();
    console.log('📦 PRODUCT AGENT: Body:', body);

    const { messages } = body;
    console.log('📦 PRODUCT AGENT: Messages:', messages?.length);

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    const result = productAgent.stream({
      prompt: messages[messages.length - 1].content
    });

    console.log('📦 PRODUCT AGENT: Retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('📦 PRODUCT AGENT ERROR:', error);
    return new Response('Error processing request', { status: 500 });
  }
}