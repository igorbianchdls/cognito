import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, tool, UIMessage } from 'ai';
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
      tools: {
        weather: tool({
          description: 'Get weather information for a location',
          inputSchema: z.object({
            location: z.string().describe('The location to get weather for'),
          }),
          execute: async ({ location }) => ({
            location,
            temperature: Math.floor(Math.random() * 30) + 10,
            condition: ['sunny', 'cloudy', 'rainy', 'snowy'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 40) + 30,
          }),
        }),
        calculator: tool({
          description: 'Perform mathematical calculations',
          inputSchema: z.object({
            expression: z.string().describe('The mathematical expression to calculate'),
          }),
          execute: async ({ expression }) => {
            try {
              // Simple evaluation for basic operations (+ - * / parentheses)
              // Note: In production, use a proper math parser like mathjs
              const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
              const result = new Function('return ' + sanitized)();
              
              return {
                expression,
                result: typeof result === 'number' ? result : 0,
                steps: [`Evaluated: ${sanitized}`, `Result: ${result}`]
              };
            } catch (error) {
              return {
                expression,
                result: 0,
                steps: [`Error: Invalid expression`]
              };
            }
          }
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