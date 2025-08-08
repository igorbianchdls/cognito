import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  console.log('=== CHAT API DEBUG ===');
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

    // Prepare system message with file context
    let systemMessage = 'Você é um assistente AI útil e amigável. Responda de forma clara e concisa em português brasileiro.';
    
    if (files && files.length > 0) {
      systemMessage += '\n\nVocê tem acesso aos seguintes arquivos enviados pelo usuário:\n\n';
      
      files.forEach((file: { name: string; fileType?: string; size: number; rowCount?: number; columnCount?: number; summary?: string; content?: string }, index: number) => {
        systemMessage += `=== ARQUIVO ${index + 1}: ${file.name} ===\n`;
        systemMessage += `Tipo: ${file.fileType || 'unknown'}\n`;
        systemMessage += `Tamanho: ${file.size} bytes\n`;
        
        if (file.fileType === 'csv' && file.rowCount && file.columnCount) {
          systemMessage += `Dados: ${file.rowCount} linhas, ${file.columnCount} colunas\n`;
        }
        
        if (file.summary) {
          systemMessage += `Resumo: ${file.summary}\n`;
        }
        
        if (file.content) {
          systemMessage += `\nConteúdo:\n${file.content}\n`;
        }
        
        systemMessage += '\n' + '='.repeat(50) + '\n\n';
      });
      
      systemMessage += 'Analise estes arquivos e responda às perguntas do usuário baseado no conteúdo dos documentos. Você pode fazer análises, extrair insights, responder perguntas específicas sobre os dados, ou qualquer outra operação solicitada.';
    }

    // Create simple test tool following documentation exactly
    const testTool = tool({
      description: 'Tool de teste que retorna texto simples',
      inputSchema: z.object({}),
      execute: async () => {
        console.log('🔧 [TOOL] test_tool executada!');
        return {
          message: "Esta é a resposta da ferramenta de teste! Funcionou!",
          success: true
        };
      }
    });

    console.log('🚀 Processing chat with simple test tool...');
    
    // Get last user message to create a simple prompt
    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage?.content || '';
    
    console.log('🔍 ANTES generateText:');
    console.log('- userPrompt:', userPrompt);
    console.log('- tools definidas:', Object.keys({ test: testTool }));
    console.log('- testTool:', testTool);
    
    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      tools: {
        test: testTool
      },
      prompt: `${userPrompt}. Se o usuário mencionar "teste tool", use a ferramenta test.`,
      toolChoice: 'required',
    });

    console.log('🔍 DEPOIS generateText - RESULTADO COMPLETO:');
    console.log('=====================================');
    console.log('result:', result);
    console.log('=====================================');
    console.log('- text:', result.text);
    console.log('- toolCalls:', result.toolCalls);
    console.log('- toolResults:', result.toolResults);
    console.log('- toolCalls length:', result.toolCalls?.length || 0);
    console.log('- toolResults length:', result.toolResults?.length || 0);
    
    const { text, toolCalls, toolResults } = result;
    
    console.log('✅ Final - Tool calls:', toolCalls?.length || 0);
    console.log('✅ Final - Tool results:', toolResults?.length || 0);
    console.log('✅ Final - Returning response:', text);
    
    return new Response(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}