import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are MetaAnalyst AI, a specialized assistant for analyzing metadata, data structures, and providing insights about data organization and patterns. Keep responses concise and analytical.',
    messages,
  });

  return result.toUIMessageStreamResponse();
}