import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response('Anthropic API key not configured', { status: 500 });
    }

    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: convertToModelMessages(messages),
      system: 'Você é um assistente AI útil e amigável. Responda de forma clara e concisa em português brasileiro.',
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal server error', { status: 500 });
  }
}