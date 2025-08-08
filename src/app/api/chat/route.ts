import { anthropic } from '@ai-sdk/anthropic';
import { streamText, generateText } from 'ai';

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

    // Detect if user is asking a question that might need SQL
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content || '';
    const needsSQL = /\b(quantas?\s+(linhas?|registros?|entradas?)|total\s+de|count|tabela|dados?|bigquery)\b/i.test(userMessage);

    console.log('SQL detection:', { userMessage, needsSQL });

    if (needsSQL) {
      // Handle SQL queries using generateText with tools
      console.log('Processing SQL query...');
      
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

      try {
        const result = await generateText({
          model: anthropic('claude-3-5-sonnet-20241022'),
          messages: messages,
          system: systemMessage + '\n\nVocê tem acesso a uma ferramenta para executar queries SQL no BigQuery. Use a ferramenta execute_simple_sql quando o usuário fizer perguntas sobre dados que requeiram consultas SQL. As tabelas disponíveis estão no dataset "biquery_data", incluindo "car_prices" e outras.',
          tools: tools,
          toolChoice: 'auto',
        });

        let finalResponse = result.text;

        // Process tool calls if any
        if (result.toolCalls && result.toolCalls.length > 0) {
          for (const toolCall of result.toolCalls) {
            if (toolCall.toolName === 'execute_simple_sql') {
              console.log('Executing SQL tool call:', toolCall.input);
              
              try {
                const args = toolCall.input as { sql_query: string; explanation: string };
                const { sql_query, explanation } = args;
                
                // Execute query via BigQuery API
                const response = await fetch('http://localhost:3000/api/bigquery', {
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

                // Format the result
                const rowCount = queryResult.data.totalRows;
                const firstResult = queryResult.data.data[0];
                
                if (firstResult && Object.keys(firstResult).length === 1) {
                  // Single value result (like COUNT)
                  const value = Object.values(firstResult)[0];
                  finalResponse = `A tabela tem **${value}** ${rowCount === 1 ? 'linha' : 'linhas'}.\n\n${explanation}\n\nQuery executada:\n\`\`\`sql\n${sql_query}\n\`\`\``;
                } else {
                  finalResponse = `Query executada com sucesso! ${explanation}\n\nResultados: ${rowCount} linha(s)\n\nQuery executada:\n\`\`\`sql\n${sql_query}\n\`\`\``;
                }

              } catch (error) {
                console.error('SQL execution error:', error);
                const args = toolCall.input as { sql_query: string; explanation: string };
                finalResponse = `Erro ao executar a query: ${error instanceof Error ? error.message : 'Unknown error'}\n\nQuery tentada:\n\`\`\`sql\n${args.sql_query}\n\`\`\``;
              }
            }
          }
        }

        // Return as streaming response for consistency
        return new Response(finalResponse, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });

      } catch (error) {
        console.error('Error in SQL processing:', error);
        return new Response(`Erro ao processar consulta SQL: ${error instanceof Error ? error.message : 'Unknown error'}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    }

    // Normal chat without SQL tools
    console.log('Processing normal chat...');
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: messages,
      system: systemMessage,
      temperature: 0.7,
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