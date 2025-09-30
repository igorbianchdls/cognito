import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('🤖 CLAUDE AGENT: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();

  console.log('🤖 CLAUDE AGENT: Messages:', messages?.length);

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),

      system: `Você é um assistente AI útil e prestativo.

Responda sempre em português brasileiro de forma clara e prestativa.`,

      messages: convertToModelMessages(messages)
    });

    console.log('🤖 CLAUDE AGENT: StreamText executado, retornando response...');
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('🤖 CLAUDE AGENT: Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do agente' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}