import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🛒 SHOPEE ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🛒 SHOPEE ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are ShopeeAnalyst AI, a specialized assistant for analyzing Shopee marketplace data, sales performance, product optimization, competitor analysis, and marketing strategies for Southeast Asian e-commerce.',
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

  console.log('🛒 SHOPEE ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}