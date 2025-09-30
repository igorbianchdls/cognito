import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { readFiles, writeFiles, editFiles, listDirectoryTool } from '@/tools/fileTools';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('🤖 CLAUDE AGENT: Request recebido!');

  const { messages }: { messages: UIMessage[] } = await req.json();

  console.log('🤖 CLAUDE AGENT: Messages:', messages?.length);

  try {
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),

      system: `Você é um assistente AI útil com capacidades completas de manipulação de arquivos.

**Suas capacidades:**
- **readFiles**: Ler arquivos de texto do sistema
- **writeFiles**: Criar ou sobrescrever arquivos
- **editFiles**: Editar arquivos existentes (replace, replaceAll, insertAfter, insertBefore)
- **listDirectory**: Listar arquivos e pastas de um diretório

**Exemplos de uso:**
- "Leia o arquivo package.json"
- "Crie um arquivo teste.txt com o conteúdo 'Olá mundo'"
- "Edite o arquivo config.js substituindo 'development' por 'production'"
- "Liste os arquivos do diretório src/"

**Para editFiles, operações disponíveis:**
- replace: Substitui primeira ocorrência
- replaceAll: Substitui todas as ocorrências
- insertAfter: Insere texto após uma referência
- insertBefore: Insere texto antes de uma referência

Responda sempre em português brasileiro de forma clara e prestativa.`,

      messages: convertToModelMessages(messages),

      tools: {
        readFiles,
        writeFiles,
        editFiles,
        listDirectory: listDirectoryTool
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