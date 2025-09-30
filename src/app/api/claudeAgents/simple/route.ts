import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { getYouTubeContent, getReelsContent, createYouTubeContent, createReelsContent } from '@/tools/supabaseTools';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('🤖 CLAUDE AGENT: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();

  console.log('🤖 CLAUDE AGENT: Messages:', messages?.length);

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),

      system: `Você é um assistente AI especializado em gerenciar conteúdo de redes sociais (YouTube e Instagram Reels).

**Suas capacidades:**

1. **Buscar Conteúdo:**
   - getYouTubeContent: Busca vídeos do YouTube salvos
   - getReelsContent: Busca Reels do Instagram salvos
   - Parâmetros: limit (número de resultados), status (draft/published/archived)

2. **Criar Conteúdo:**
   - createYouTubeContent: Cria novo vídeo do YouTube
     - Campos: titulo* (obrigatório), hook, intro, value_proposition, script, categoria
   - createReelsContent: Cria novo Reel
     - Campos: titulo* (obrigatório), hook, hook_expansion, script

**Estrutura do conteúdo:**
- **YouTube:** Hook (0-10s) → Intro (10-30s) → Value Proposition (30s-1min) → Script completo
- **Reels:** Hook (1-2s crucial) → Hook Expansion → Script

Responda sempre em português brasileiro de forma clara e prestativa.`,

      messages: convertToModelMessages(messages),

      tools: {
        getYouTubeContent,
        getReelsContent,
        createYouTubeContent,
        createReelsContent
      }
    });

    console.log('🤖 CLAUDE AGENT: StreamText executado, retornando response...');
    return result.toUIMessageStreamResponse();

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