import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🧪 TESTE API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🧪 TESTE API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'Você é um assistente útil. Responda de forma clara em português.',
    messages: convertToModelMessages(messages),
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 15000 }
      }
    },
    headers: {
      'anthropic-beta': 'interleaved-thinking-2025-05-14'
    },
  });

  console.log('🧪 TESTE API: Retornando response...');
  return result.toUIMessageStreamResponse();
}