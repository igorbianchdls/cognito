import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: `You are a helpful AI assistant for the Apps Dashboard. You can help users with:
- General questions about their widgets and data
- Assistance with dashboard management
- Simple calculations and data analysis
- General productivity support

Respond in a clear, helpful manner. Keep responses concise and actionable.`,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}