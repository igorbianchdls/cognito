import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  console.log('=== SHEETS CHAT API DEBUG ===');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
  console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'N/A');
  
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

    let systemPrompt = `Você é um assistente especializado em planilhas e análise de dados. Você está integrado a uma interface de planilhas (Univer Sheets) e deve ajudar os usuários com:

1. **Análise de dados**: Interpretar dados de planilhas, identificar padrões e tendências
2. **Fórmulas e funções**: Sugerir e explicar fórmulas para cálculos específicos
3. **Formatação**: Orientações sobre formatação condicional, estilos e layouts
4. **Visualização**: Sugestões para gráficos e visualizações adequadas aos dados
5. **Organização**: Melhores práticas para estruturação de planilhas
6. **Importação/Exportação**: Ajuda com formatos CSV, Excel e outros
7. **Automação**: Sugestões para automatizar tarefas repetitivas

Seja conciso, prático e focado em soluções aplicáveis diretamente na planilha. Sempre que possível, forneça exemplos específicos de fórmulas ou procedimentos.`;

    // Add file context if files are provided
    if (files && files.length > 0) {
      const fileContext = files.map((file: { name?: string; fileType?: string; summary?: string; rowCount?: number; columnCount?: number; content?: string }) => {
        let context = `\n\n**Arquivo: ${file.name}** (${file.fileType?.toUpperCase() || 'UNKNOWN'})`;
        
        if (file.summary) {
          context += `\nResumo: ${file.summary}`;
        }
        
        if (file.rowCount && file.columnCount) {
          context += `\nDimensões: ${file.rowCount} linhas x ${file.columnCount} colunas`;
        }
        
        if (file.content) {
          context += `\nConteúdo:\n${file.content.substring(0, 2000)}${file.content.length > 2000 ? '...' : ''}`;
        }
        
        return context;
      }).join('\n');
      
      systemPrompt += `\n\n**CONTEXTO DOS ARQUIVOS ENVIADOS:**${fileContext}`;
    }

    console.log('System prompt length:', systemPrompt.length);
    console.log('System prompt preview:', systemPrompt.substring(0, 200) + '...');

    const result = await streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 4096,
    });

    console.log('Stream result created successfully');
    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Detailed error in sheets-chat API:', error);
    console.error('Error stack:', (error as Error).stack);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error in sheets chat',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}