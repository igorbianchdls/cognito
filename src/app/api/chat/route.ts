import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToModelMessages } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return new Response(JSON.stringify({ 
        error: 'Anthropic API key not configured',
        details: 'Please set ANTHROPIC_API_KEY in your environment variables'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
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
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}