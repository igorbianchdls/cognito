import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { readFileTool, listDirectoryTool, getFileInfoTool } from '@/tools/fileTools';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('🤖 CLAUDE AGENT: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();

  console.log('🤖 CLAUDE AGENT: Messages:', messages?.length);

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),

      system: `Você é um assistente AI útil com capacidade de ler arquivos do sistema.

**Suas capacidades:**
- Ler arquivos de texto usando readFileTool
- Listar diretórios usando listDirectoryTool
- Obter informações de arquivos usando getFileInfoTool

**Como usar:**
- Para ler um arquivo: "Leia o arquivo X"
- Para listar pasta: "Liste o diretório Y"
- Para info do arquivo: "Mostre informações do arquivo Z"

Responda sempre em português brasileiro de forma clara e prestativa.`,

      messages: convertToModelMessages(messages),

      tools: {
        readFile: readFileTool,
        listDirectory: listDirectoryTool,
        getFileInfo: getFileInfoTool
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