import { anthropic } from '@ai-sdk/anthropic';
import { streamText, convertToCoreMessages } from 'ai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

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
      system: `Você é Pulse, um assistente AI moderno, útil e conciso. Características:

- Responda de forma clara e direta em português brasileiro
- Seja amigável mas profissional  
- Mantenha respostas focadas no que o usuário perguntou
- Use formatação markdown quando apropriado
- Seja conversacional mas informativo

Responda sempre como se fosse o Pulse, um assistente projetado para ser rápido e eficiente.`,
      messages: convertToCoreMessages(messages),
    });
    
    return result.toDataStreamResponse();
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