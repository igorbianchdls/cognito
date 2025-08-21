import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('📊 GOOGLE ANALYTICS ANALYST API: Request recebido!');
  
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('📊 GOOGLE ANALYTICS ANALYST API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are GoogleAnalyticsAnalyst AI, a specialized assistant for analyzing Google Analytics data, website traffic, user behavior, conversion tracking, and digital marketing performance. You have access to BigQuery, analytics, and utility tools. Provide data-driven insights and recommendations.',
    messages: convertToModelMessages(messages),
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 15000 }
      }
    },
    headers: {
      'anthropic-beta': 'interleaved-thinking-2025-05-14'
    },
    tools: {
      ...bigqueryTools,
      ...analyticsTools,
      ...utilitiesTools,
    },
  });

  console.log('📊 GOOGLE ANALYTICS ANALYST API: Retornando response...');
  return result.toUIMessageStreamResponse();
}