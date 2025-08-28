import { convertToModelMessages, streamText, stepCountIs, UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import * as bigqueryTools from '@/tools/bigquery';
import * as analyticsTools from '@/tools/analytics';
import * as utilitiesTools from '@/tools/utilities';

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log('📘 META CREATIVE ANALYST API: Request recebido!');
  
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log('📘 META CREATIVE ANALYST API: Messages:', messages?.length);

    console.log('📘 META CREATIVE ANALYST API: Iniciando streamText com Claude Sonnet 4...');
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
    
    system: `Você é um assistente para análise de criativos Meta Ads. SEMPRE execute o workflow completo de 3 steps em sequência:
1) Execute getDatasets primeiro
2) Execute getTables segundo  
3) Execute getTableSchema terceiro
NUNCA pule steps. Execute um step por vez na ordem correta.`,
    
    messages: convertToModelMessages(messages),
    
    
    prepareStep: ({ stepNumber }) => {
      switch (stepNumber) {
        case 1:
          return {
            system: `Step 1: Execute getDatasets para listar todos os datasets disponíveis.`,
            tools: { getDatasets: bigqueryTools.getDatasets }
          };
        case 2:
          return {
            system: `Step 2: Execute getTables para listar tabelas no dataset escolhido.`,
            tools: { getTables: bigqueryTools.getTables }
          };
        case 3:
          return {
            system: `Step 3: Execute getTableSchema para ver as colunas e tipos da tabela.`,
            tools: { getTableSchema: bigqueryTools.getTableSchema }
          };
        default:
          return {
            system: `Assistente para análise de criativos Meta Ads.`,
            tools: {}
          };
      }
    },
    
    stopWhen: stepCountIs(3),
    tools: {
      getDatasets: bigqueryTools.getDatasets,
      getTables: bigqueryTools.getTables,
      getTableSchema: bigqueryTools.getTableSchema,
    },
  });

    console.log('📘 META CREATIVE ANALYST API: streamText criado, retornando response...');
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('❌ META CREATIVE ANALYST API ERROR:', error);
    console.error('❌ ERROR STACK:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(`Error: ${error instanceof Error ? error.message : String(error)}`, { status: 500 });
  }
}