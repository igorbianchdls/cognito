import { query } from '@anthropic-ai/claude-agent-sdk';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('🤖 CLAUDE AGENT: Request recebido!');

  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];

  console.log('🤖 CLAUDE AGENT: Última mensagem:', lastMessage?.content);

  try {
    const result = query({
      prompt: lastMessage?.content || "Olá!",
      options: {
        model: 'sonnet',
        systemPrompt: `Você é um assistente AI simples e útil criado com o Claude Agent SDK.

Responda de forma clara, direta e em português brasileiro.
Seja amigável e prestativo em todas as suas respostas.`,
        allowedTools: []
      }
    });

    console.log('🤖 CLAUDE AGENT: Query executado, coletando resposta...');

    // Coletar resposta completa do Agent SDK
    let fullResponse = '';
    for await (const message of result) {
      if (message.type === 'assistant') {
        fullResponse += message.message.content;
      }
    }

    console.log('🤖 CLAUDE AGENT: Resposta coletada:', fullResponse.substring(0, 100) + '...');

    // Retornar resposta no formato esperado pelo useChat
    return Response.json({
      role: 'assistant',
      content: fullResponse
    });

  } catch (error) {
    console.error('🤖 CLAUDE AGENT: Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do agente' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}