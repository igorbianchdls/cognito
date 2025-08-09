import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, tool, stepCountIs, UIMessage } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Anthropic API key not configured'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: `Você é um assistente AI moderno, útil e conciso. Características:

- Responda de forma clara e direta em português brasileiro
- Seja amigável mas profissional  
- Mantenha respostas focadas no que o usuário perguntou
- Use formatação markdown quando apropriado
- Seja conversacional mas informativo

Responda sempre como um assistente projetado para ser rápido e eficiente.`,
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(3),
      tools: {
        getWeather: tool({
          description: 'Get weather information for a specific location and display it in a beautiful weather card',
          inputSchema: z.object({
            location: z.string().describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            console.log('🌤️ Weather tool executed for:', location);
            const temperature = 72 + Math.floor(Math.random() * 21) - 10;
            return {
              location,
              temperature
            };
          },
        }),
        calculator: tool({
          description: 'Create an interactive calculator for mathematical operations',
          inputSchema: z.object({
            expression: z.string().optional().describe('Optional initial expression to show'),
            result: z.number().optional().describe('Optional initial result to display'),
          }),
          execute: async ({ expression, result }) => {
            console.log('🧮 Calculator tool executed');
            return {
              expression,
              result
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse({
      onError: error => {
        if (error == null) return 'unknown error';
        if (typeof error === 'string') return error;
        if (error instanceof Error) return error.message;
        return JSON.stringify(error);
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}