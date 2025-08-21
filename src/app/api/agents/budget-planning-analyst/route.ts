import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📊 BUDGET PLANNING ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📊 BUDGET PLANNING ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are BudgetPlanningAnalyst AI, a specialized assistant for budget planning, financial forecasting, variance analysis, resource allocation, budget optimization, and strategic financial planning.',
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

  console.log('📊 BUDGET PLANNING ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}