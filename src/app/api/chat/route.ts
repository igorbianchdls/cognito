import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { bigQueryService } from '@/services/bigquery';

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

    console.log('🚀 Starting streamText with generative UI...');
    
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      tools: {
        getWeather: tool({
          description: 'Get weather information for a specific location and display it in a beautiful weather card',
          inputSchema: z.object({
            location: z.string().describe('The location to get the weather for'),
          }),
          execute: async ({ location }) => {
            console.log('🌤️ Weather tool executed for:', location);
            const temperature = 72 + Math.floor(Math.random() * 21) - 10;
            return {
              location,
              temperature
            };
          },
        }),
        calculator: tool({
          description: 'Create an interactive calculator for mathematical operations',
          inputSchema: z.object({
            expression: z.string().optional().describe('Optional initial expression to show'),
            result: z.number().optional().describe('Optional initial result to display'),
          }),
          execute: async ({ expression, result }) => {
            console.log('🧮 Calculator tool executed');
            return {
              expression,
              result
            };
          },
        }),
        createChart: tool({
          description: 'Generate interactive charts and graphs from data',
          inputSchema: z.object({
            title: z.string().describe('Title for the chart'),
            data: z.array(z.object({
              label: z.string(),
              value: z.number()
            })).describe('Array of data points with labels and values'),
            type: z.enum(['bar', 'pie', 'line']).default('bar').describe('Type of chart to create')
          }),
          execute: async ({ title, data, type }) => {
            console.log('📊 Chart tool executed:', { title, data, type });
            return {
              title,
              data,
              type
            };
          },
        }),
        getBigQueryDatasets: tool({
          description: 'List all available BigQuery datasets in the project with their information',
          inputSchema: z.object({}),
          execute: async () => {
            console.log('📊 BigQuery datasets tool executed');
            try {
              // Initialize BigQuery service if not already done
              if (!bigQueryService['client']) {
                console.log('⚡ Initializing BigQuery service...');
                await bigQueryService.initialize();
              }
              
              console.log('🔍 Attempting to list datasets...');
              const datasets = await bigQueryService.listDatasets();
              console.log('✅ Datasets retrieved:', datasets.length);
              
              return {
                success: true,
                datasets
              };
            } catch (error) {
              console.error('❌ Error fetching datasets:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve datasets'
              };
            }
          },
        }),
        getBigQueryTables: tool({
          description: 'List all tables in a specific BigQuery dataset with their metadata',
          inputSchema: z.object({
            datasetId: z.string().describe('The dataset ID to list tables from (e.g., "biquery_data")')
          }),
          execute: async ({ datasetId }) => {
            console.log('📋 BigQuery tables tool executed for dataset:', datasetId);
            try {
              // Initialize BigQuery service if not already done
              if (!bigQueryService['client']) {
                console.log('⚡ Initializing BigQuery service...');
                await bigQueryService.initialize();
              }
              
              console.log('🔍 Attempting to list tables for dataset:', datasetId);
              const tables = await bigQueryService.listTables(datasetId);
              console.log('✅ Tables retrieved:', tables.length, 'for dataset:', datasetId);
              
              return {
                success: true,
                tables,
                datasetId
              };
            } catch (error) {
              console.error('❌ Error fetching tables:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve tables',
                datasetId
              };
            }
          },
        }),
        getBigQueryTableData: tool({
          description: 'Execute SQL queries on BigQuery tables and display data in a formatted table',
          inputSchema: z.object({
            query: z.string().describe('SQL query to execute (e.g., "SELECT * FROM `creatto-463117.biquery_data.car_prices` LIMIT 20")'),
            limit: z.number().optional().default(20).describe('Maximum number of rows to return')
          }),
          execute: async ({ query, limit = 20 }) => {
            console.log('🔍 BigQuery table data tool executed with query:', query);
            try {
              // Initialize BigQuery service if not already done
              if (!bigQueryService['client']) {
                console.log('⚡ Initializing BigQuery service...');
                await bigQueryService.initialize();
              }
              
              // Add LIMIT to query if not already present and limit is specified
              let finalQuery = query.trim();
              if (limit && !finalQuery.toLowerCase().includes('limit')) {
                finalQuery += ` LIMIT ${limit}`;
              }
              
              console.log('🚀 Executing query:', finalQuery);
              const startTime = Date.now();
              
              const result = await bigQueryService.executeQuery({
                query: finalQuery,
                location: process.env.BIGQUERY_LOCATION
              });
              
              const executionTime = Date.now() - startTime;
              console.log('✅ Query executed successfully:', {
                rows: result.data.length,
                executionTime: `${executionTime}ms`,
                bytesProcessed: result.bytesProcessed
              });

              // 🔍 DEBUG: Log da estrutura completa do resultado
              console.log('🔍 BigQuery result structure:', {
                hasData: !!result.data,
                dataLength: result.data?.length,
                totalRows: result.totalRows,
                hasSchema: !!result.schema,
                schemaLength: result.schema?.length,
                sampleData: result.data?.slice(0, 2),
                resultKeys: Object.keys(result)
              });
              console.log('🔍 Full result (first 500 chars):', JSON.stringify(result, null, 2).substring(0, 500));
              
              const toolResult = {
                success: true,
                data: result,
                query: finalQuery,
                executionTime
              };
              
              console.log('🔍 Tool result structure:', {
                success: toolResult.success,
                hasData: !!toolResult.data,
                query: toolResult.query,
                executionTime: toolResult.executionTime
              });
              
              return toolResult;
            } catch (error) {
              console.error('❌ Error executing BigQuery:', error);
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to execute query',
                query
              };
            }
          },
        })
      },
    });

    console.log('🚀 Streaming response with generative UI...');
    
    return result.toUIMessageStreamResponse();
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