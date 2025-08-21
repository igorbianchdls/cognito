import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  console.log('🤖 Julius Chat API - Messages received:', messages?.length || 0);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are a helpful AI assistant named Julius. Keep responses concise and helpful.',
    messages,
  });

  return result.toUIMessageStreamResponse();
}