import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
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

    // Create BigQuery tools using AI SDK v5 structure
    const tools = {
      list_datasets: tool({
        description: 'Lista todos os datasets disponíveis no BigQuery',
        inputSchema: z.object({}),
        execute: async () => {
          console.log('🔧 [TOOL] list_datasets - Starting execution');
          
          try {
            // Initialize BigQuery if needed
            console.log('🔧 Checking if BigQuery service needs initialization...');
            console.log('- Service client exists:', !!bigQueryService['client']);
            
            if (!bigQueryService['client']) {
              console.log('⚡ Initializing BigQuery service...');
              await bigQueryService.initialize();
              console.log('✅ BigQuery service initialized successfully');
            } else {
              console.log('✅ BigQuery service already initialized');
            }
            
            console.log('🔍 Attempting to list datasets...');
            const datasets = await bigQueryService.listDatasets();
            console.log('✅ Datasets retrieved successfully:', datasets.length, 'datasets found');
            console.log('📊 Dataset details:', datasets);
            
            const result = { 
              datasets: datasets.map(d => ({
                id: d.id,
                friendlyName: d.friendlyName,
                description: d.description,
                location: d.location
              }))
            };
            
            console.log('📤 [TOOL] Returning datasets result:', result);
            return result;
            
          } catch (error) {
            console.error('❌ [TOOL] Error in list_datasets:', error);
            console.error('Error details:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              name: error instanceof Error ? error.name : undefined
            });
            
            // Return error info instead of throwing to help debug
            return {
              error: `Erro ao listar datasets: ${error instanceof Error ? error.message : 'Unknown error'}`,
              datasets: []
            };
          }
        }
      }),

      list_tables: tool({
        description: 'Lista tabelas do dataset biquery_data',
        inputSchema: z.object({}),
        execute: async () => {
          console.log('🔧 [TOOL] list_tables - Starting execution for dataset: biquery_data');
          
          try {
            // Initialize BigQuery if needed
            console.log('🔧 Checking if BigQuery service needs initialization...');
            console.log('- Service client exists:', !!bigQueryService['client']);
            
            if (!bigQueryService['client']) {
              console.log('⚡ Initializing BigQuery service...');
              await bigQueryService.initialize();
              console.log('✅ BigQuery service initialized successfully');
            } else {
              console.log('✅ BigQuery service already initialized');
            }
            
            console.log('🔍 Attempting to list tables for dataset: biquery_data');
            const tables = await bigQueryService.listTables('biquery_data');
            console.log('✅ Tables retrieved successfully:', tables.length, 'tables found');
            console.log('📊 Table details:', tables);
            
            const result = { 
              tables: tables.map(t => ({
                tableId: t.tableId,
                datasetId: t.datasetId,
                projectId: t.projectId,
                description: t.description,
                numRows: t.numRows,
                numBytes: t.numBytes
              }))
            };
            
            console.log('📤 [TOOL] Returning tables result:', result);
            return result;
            
          } catch (error) {
            console.error('❌ [TOOL] Error in list_tables:', error);
            console.error('Error details:', {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined,
              name: error instanceof Error ? error.name : undefined
            });
            
            // Return error info instead of throwing to help debug
            return {
              error: `Erro ao listar tabelas: ${error instanceof Error ? error.message : 'Unknown error'}`,
              tables: []
            };
          }
        }
      })
    };

    // Always use generateText with tools available
    console.log('🚀 Processing chat with BigQuery tools...');
    console.log('🎯 Available tools:', Object.keys(tools));
    console.log('💬 User messages count:', messages.length);
    
    const finalSystemMessage = systemMessage + '\n\nVocê tem acesso a ferramentas do BigQuery. SEMPRE execute as ferramentas diretamente:\n- Para perguntas sobre datasets: EXECUTE list_datasets imediatamente\n- Para perguntas sobre tabelas: EXECUTE list_tables imediatamente\n- NÃO explique que vai executar, apenas execute e apresente os resultados reais\n- NÃO diga "vou usar a função", apenas use a função';
    
    console.log('📝 System message sent to AI:');
    console.log('=====================================');
    console.log(finalSystemMessage);
    console.log('=====================================');
    
    const { text, steps } = await generateText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: messages,
      system: finalSystemMessage,
      tools: tools,
      toolChoice: 'auto',
      temperature: 0.7,
    });

    console.log('✅ AI call successful');
    console.log('📝 Final text length:', text.length);
    console.log('📋 Steps executed:', steps.length);
    console.log('📄 Final text content:');
    console.log('=====================================');
    console.log(text);
    console.log('=====================================');
    
    // Log each step individually with detailed info
    console.log('🔍 Analyzing each step:');
    steps.forEach((step, index) => {
      console.log(`📋 STEP ${index + 1}:`, {
        text: step.text ? step.text.substring(0, 100) + '...' : 'no text',
        textLength: step.text?.length || 0,
        toolCalls: step.toolCalls?.length || 0,
        toolResults: step.toolResults?.length || 0
      });
      
      if (step.toolCalls && step.toolCalls.length > 0) {
        console.log(`🛠️ STEP ${index + 1} - Tool calls:`, step.toolCalls.map(tc => ({
          toolName: tc.toolName,
          toolCallId: tc.toolCallId
        })));
      }
      
      if (step.toolResults && step.toolResults.length > 0) {
        console.log(`📊 STEP ${index + 1} - Tool results:`, step.toolResults.map(tr => tr.toolCallId));
      }
    });
    
    // Log summary
    const allToolCalls = steps.flatMap(step => step.toolCalls || []);
    const allToolResults = steps.flatMap(step => step.toolResults || []);
    console.log('📊 SUMMARY - Total tool calls:', allToolCalls.length);
    console.log('📊 SUMMARY - Total tool results:', allToolResults.length);
    
    console.log('📤 Returning final response with tool execution results...');
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