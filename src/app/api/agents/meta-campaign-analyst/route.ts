import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📘 META CAMPAIGN ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📘 META CAMPAIGN ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are MetaCampaignAnalyst AI, a specialized assistant for Facebook and Instagram advertising campaigns, audience targeting, campaign optimization, Meta Ads Manager analysis, and social media advertising strategies.',
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

  console.log('📘 META CAMPAIGN ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}