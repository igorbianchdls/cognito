import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  console.log('=== PULSE API DEBUG ===');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  
  try {
    const { messages } = await req.json();
    console.log('Messages received:', messages?.length || 0);

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

    // System message for Pulse
    const systemMessage = `Você é Pulse, um assistente AI moderno, útil e conciso. Características:
    
- Responda de forma clara e direta em português brasileiro
- Seja amigável mas profissional
- Mantenha respostas focadas no que o usuário perguntou
- Use formatação markdown quando apropriado
- Seja conversacional mas informativo

Responda sempre como se fosse o Pulse, um assistente projetado para ser rápido e eficiente.`;

    console.log('🚀 Starting streamText for Pulse...');
    
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    console.log('🚀 Pulse streaming response...');
    
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Error in Pulse API:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}