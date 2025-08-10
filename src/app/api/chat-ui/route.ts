import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: 'You are a helpful assistant.',
    messages: convertToModelMessages(messages),
    tools: {
      displayWeather: tool({
        description: 'Get weather information for a specific location and display it in a beautiful weather card',
        inputSchema: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          // Simulate weather data
          const temperature = 72 + Math.floor(Math.random() * 21) - 10;
          return {
            location,
            temperature
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}