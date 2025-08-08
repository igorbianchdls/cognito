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

    // Create BigQuery tools using AI SDK v5 structure
    const tools = {
      list_datasets: tool({
        description: 'Lista todos os datasets disponíveis no BigQuery',
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bigquery?action=datasets`);
            const result = await response.json();
            
            if (result.success) {
              return { datasets: result.data };
            } else {
              throw new Error(result.error || 'Failed to fetch datasets');
            }
          } catch (error) {
            console.error('Error fetching datasets:', error);
            throw new Error(`Erro ao listar datasets: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }),

      list_tables: tool({
        description: 'Lista tabelas do dataset biquery_data',
        inputSchema: z.object({}),
        execute: async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bigquery?action=tables&dataset=biquery_data`);
            const result = await response.json();
            
            if (result.success) {
              return { tables: result.data };
            } else {
              throw new Error(result.error || 'Failed to fetch tables');
            }
          } catch (error) {
            console.error('Error fetching tables:', error);
            throw new Error(`Erro ao listar tabelas: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      })
    };

    // Always use generateText with tools available
    console.log('Processing chat with BigQuery tools...');
    const result = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: messages,
      system: systemMessage + '\n\nVocê tem acesso a ferramentas para consultar dados do BigQuery:\n- list_datasets: Lista todos os datasets disponíveis\n- list_tables: Lista tabelas do dataset biquery_data\n\nUse essas ferramentas quando o usuário perguntar sobre datasets ou tabelas.',
      tools: tools,
      toolChoice: 'auto',
      temperature: 0.7,
    });

    console.log('API call successful, returning response...');
    return new Response(result.text, {
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