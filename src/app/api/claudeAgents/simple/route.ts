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
        model: 'claude-sonnet-4',
        systemPrompt: `Você é um assistente AI simples e útil criado com o Claude Agent SDK.

Responda de forma clara, direta e em português brasileiro.
Seja amigável e prestativo em todas as suas respostas.`,
        // Sem tools por enquanto - agente bem simples
        allowedTools: []
      }
    });

    console.log('🤖 CLAUDE AGENT: Query executado, retornando resposta...');

    // Converter o resultado do Agent SDK para o formato esperado
    const response = new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result) {
              const message = {
                role: 'assistant',
                content: chunk.content || chunk.text || ''
              };

              const data = `data: ${JSON.stringify(message)}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }

            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            console.error('🤖 CLAUDE AGENT: Erro no stream:', error);
            controller.error(error);
          }
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      }
    );

    return response;

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