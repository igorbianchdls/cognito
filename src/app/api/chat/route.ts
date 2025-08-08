import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

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

    // Define tools for SQL queries
    const tools = {
      execute_simple_sql: {
        description: 'Executa uma query SQL simples no BigQuery para responder perguntas sobre dados',
        parameters: {
          type: 'object' as const,
          properties: {
            sql_query: {
              type: 'string' as const,
              description: 'A query SQL a ser executada'
            },
            explanation: {
              type: 'string' as const,
              description: 'Explicação simples do que a query faz'
            }
          },
          required: ['sql_query', 'explanation']
        }
      }
    };

    console.log('Calling Anthropic API...');
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: messages,
      system: systemMessage + '\n\nVocê tem acesso a uma ferramenta para executar queries SQL no BigQuery. Use a ferramenta execute_simple_sql quando o usuário fizer perguntas sobre dados que requeiram consultas SQL. As tabelas disponíveis estão no dataset "biquery_data", incluindo "car_prices" e outras.',
      temperature: 0.7,
      tools: tools,
      toolChoice: 'auto',
      async onToolCall({ toolCall }) {
        if (toolCall.toolName === 'execute_simple_sql') {
          console.log('Executing SQL tool call:', toolCall.args);
          
          try {
            const { sql_query, explanation } = toolCall.args;
            
            // Execute query via BigQuery API
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/bigquery`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'execute',
                query: sql_query,
                location: 'us-central1'
              })
            });

            if (!response.ok) {
              throw new Error(`BigQuery API error: ${response.status}`);
            }

            const queryResult = await response.json();
            
            if (!queryResult.success) {
              throw new Error(queryResult.error || 'Query execution failed');
            }

            return {
              success: true,
              data: queryResult.data.data,
              rowCount: queryResult.data.totalRows,
              executionTime: queryResult.data.executionTime,
              query: sql_query,
              explanation: explanation
            };

          } catch (error) {
            console.error('SQL execution error:', error);
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              query: toolCall.args.sql_query
            };
          }
        }
      }
    });

    console.log('API call successful, returning stream...');
    return result.toTextStreamResponse();
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