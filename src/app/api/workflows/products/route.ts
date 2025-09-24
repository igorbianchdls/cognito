import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText } from 'ai';
import * as visualizationTools from '@/tools/apps/visualization';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📦 PRODUCT AGENT: Request recebido!');

  try {
    const body = await req.json();
    const { messages } = body;
    console.log('📦 PRODUCT AGENT: Messages:', messages?.length);

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: `Você é especialista em análise de produtos de lojas.

Sua especialidade é analisar:
- Produtos mais vendidos
- Categorias de produtos
- Performance por produto
- Análise de inventário

Use gerarGrafico para criar visualizações claras dos dados de produtos.`,
      messages: convertToModelMessages(messages),
      tools: {
        gerarGrafico: visualizationTools.gerarGrafico
      }
    });

    console.log('📦 PRODUCT AGENT: Retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('📦 PRODUCT AGENT ERROR:', error);
    return new Response('Error processing request', { status: 500 });
  }
}