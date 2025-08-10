import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, tool, stepCountIs, UIMessage } from 'ai';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  console.log('=== CHAT-UI API DEBUG ===');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
  
  try {
    const { messages, files } = await req.json();
    console.log('Messages received:', messages?.length || 0);
    console.log('Files received:', files?.length || 0);

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

    console.log('🚀 Starting streamText with multi-step support...');

    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        { role: 'system', content: `Você é um assistente AI moderno, útil e conciso. Características:

- Responda de forma clara e direta em português brasileiro
- Seja amigável mas profissional  
- Mantenha respostas focadas no que o usuário perguntou
- Use formatação markdown quando apropriado
- Seja conversacional mas informativo

Responda sempre como um assistente projetado para ser rápido e eficiente.` },
        ...messages
      ],
      stopWhen: stepCountIs(3),
      tools: {
        displayWeather: tool({
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

    console.log('🚀 Multi-step streaming response with generative UI...');
    
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in chat-ui API:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}