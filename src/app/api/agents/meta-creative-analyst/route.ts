import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import * as bigqueryTools from '@/tools/bigquery';

export const maxDuration = 60;

export async function POST(req: Request) {
  console.log('📘 META CREATIVE ANALYST API: Request recebido!');
  
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();
    console.log('📘 META CREATIVE ANALYST API: Messages:', messages?.length);

    console.log('📘 META CREATIVE ANALYST API: Iniciando streamText com Claude Sonnet 4...');
    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
    
    system: `Você é um especialista em SQL para dados Meta Ads. Seu objetivo é gerar consultas SQL precisas.

REGRAS IMPORTANTES:
- NUNCA invente nomes de tabelas ou colunas no SELECT ou FROM
- Use SEMPRE as 3 tools para descobrir a estrutura antes de criar SQL:
  1) getDatasets - para ver datasets disponíveis
  2) getTables - para ver tabelas no dataset  
  3) getTableSchema - para ver colunas exatas da tabela
- Depois use executarSQL para executar a query
- NÃO interprete dados, apenas gere SQL correto

Execute os 3 primeiros steps em sequência, depois use executarSQL quando necessário.`,
    
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
            system: `Especialista em SQL para dados Meta Ads.`,
            tools: {}
          };
      }
    },
    
    tools: {
      getDatasets: bigqueryTools.getDatasets,
      getTables: bigqueryTools.getTables,
      getTableSchema: bigqueryTools.getTableSchema,
      executarSQL: bigqueryTools.executarSQL,
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