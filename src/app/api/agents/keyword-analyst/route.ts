import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('🔍 KEYWORD ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('🔍 KEYWORD ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are KeywordAnalyst AI, a specialized assistant for SEO keyword research, search volume analysis, keyword difficulty assessment, competitor keyword analysis, and search optimization strategies. Provide actionable SEO insights.',
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

  console.log('🔍 KEYWORD ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}