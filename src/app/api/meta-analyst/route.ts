import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  console.log('🚨 === META-ANALYST API HIT! ===');
  console.log('🚨 REQUEST CHEGOU na API meta-analyst!');
  console.log('🚨 URL:', req.url);
  console.log('🚨 Method:', req.method);
  console.log('🚨 Headers:', Object.fromEntries(req.headers.entries()));
  console.log('=== META-ANALYST API DEBUG ===');
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
  console.log('API Key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 15) || 'N/A');
  
  try {
    const { messages, files } = await req.json();
    console.log('🚨 Messages received in meta-analyst:', messages?.length || 0);
    console.log('🚨 Files received in meta-analyst:', files?.length || 0);
    console.log('🚨 First message:', messages?.[0]);

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
    let systemMessage = 'Você é o MetaAnalyst, um assistente especializado em análise de dados e insights. Responda de forma clara e analítica em português brasileiro, focando em extrair insights valiosos dos dados apresentados.';
    
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

    console.log('🚀 Starting MetaAnalyst streamText...');
    
    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20241022'),
      messages: [
        { role: 'system', content: systemMessage },
        ...messages
      ],
      stopWhen: stepCountIs(3), // Enable multi-step tool calling (max 3 steps)
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
        })
      },
    });

    console.log('🚀 MetaAnalyst streaming response...');
    console.log('🚨 === META-ANALYST RETORNANDO RESPOSTA! ===');
    
    const response = result.toUIMessageStreamResponse();
    console.log('🚨 Response object:', response);
    return response;
  } catch (error) {
    console.error('🚨 === META-ANALYST ERROR! ===');
    console.error('🚨 Error in meta-analyst API:', error);
    console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack');
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}