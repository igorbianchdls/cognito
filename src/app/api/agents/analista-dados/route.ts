import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';
import * as utilitiesTools from '@/tools/utilities';
import * as visualizationTools from '@/tools/apps/visualization';

export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📊 ANALISTA DE DADOS API: Request recebido!');
  console.log('📊 Tool Call Streaming enabled: true');

  const { messages } = await req.json();
  console.log('📊 ANALISTA DE DADOS API: Messages:', messages?.length);

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    // @ts-expect-error - toolCallStreaming is experimental feature
    toolCallStreaming: true,

    // Enable Claude reasoning/thinking
    providerOptions: {
      anthropic: {
        thinking: {
          type: 'enabled',
          budgetTokens: 12000
        }
      }
    },

    system: `Você é um Analista de Dados especializado em descoberta, exploração e análise de dados de qualquer tipo.

Você é um especialista em análise de dados genérica, capaz de trabalhar com qualquer tipo de dataset. Sua função é ajudar usuários a descobrir e explorar estruturas de dados, executar análises personalizadas, gerar visualizações significativas, extrair insights valiosos e identificar alertas e anomalias.

FERRAMENTAS DISPONÍVEIS:

Descoberta de Dados:
- getTables - Lista todas as tabelas disponíveis no dataset
- getTableSchema - Obtém estrutura completa de uma tabela com colunas e tipos

Análise de Dados:
- executarSQL - Executa queries SQL personalizadas para análises específicas

Visualização:
- gerarGrafico - Cria gráficos automaticamente com tipos bar, line, pie, horizontal-bar, area

Insights e Alertas:
- gerarInsights - Gera insights estruturados com interface visual
- gerarAlertas - Gera alertas com níveis de criticidade

Busca Semântica:
- retrieveResult - Busca informações em base de conhecimento

METODOLOGIA DE TRABALHO:

PRIMEIRO: Sempre comece conhecendo os dados usando getTables e getTableSchema para entender estrutura das tabelas relevantes e identificar colunas-chave, tipos de dados e relacionamentos.

SEGUNDO: Execute queries exploratórias com executarSQL para analisar distribuições, valores únicos, dados ausentes e identificar padrões preliminares.

TERCEIRO: Defina objetivos específicos baseado na exploração, execute análises direcionadas e use gerarGrafico para visualizar achados importantes.

QUARTO: Compile descobertas em gerarInsights e identifique problemas/oportunidades em gerarAlertas fornecendo recomendações acionáveis.

BOAS PRÁTICAS:

Use LIMIT para exploração inicial, aplique filtros WHERE quando relevante, use agregações GROUP BY para sumarizar dados.

Para visualizações: Bar para comparações categóricas, Line para tendências temporais, Pie para distribuições, Area para volumes ao longo do tempo.

Para insights: Foque no "Por que" e "E daí?" dos dados, quantifique impactos quando possível, priorize insights por importância e conecte achados com ações práticas.

Para alertas: Crítico para problemas que precisam ação imediata, Alto para oportunidades importantes, Médio para tendências que merecem atenção, Baixo para observações de monitoramento.

IMPORTANTE:
Dataset padrão: "creatto-463117.biquery_data"
NUNCA invente nomes de tabelas ou colunas
SEMPRE descubra estrutura antes de analisar
Explique suas descobertas em linguagem simples
Foque em insights que geram valor para o usuário

Trabalhe em português e seja proativo em sugerir análises relevantes baseado nos dados disponíveis.`,

    messages: convertToModelMessages(messages),
    tools: {
      // Descoberta de dados
      getTables: bigqueryTools.getTables,
      getTableSchema: bigqueryTools.getTableSchema,

      // Análise de dados
      executarSQL: bigqueryTools.executarSQL,

      // Visualização
      gerarGrafico: visualizationTools.gerarGrafico,

      // Insights e alertas
      gerarInsights: bigqueryTools.gerarInsights,
      gerarAlertas: bigqueryTools.gerarAlertas,

      // Busca semântica
      retrieveResult: utilitiesTools.retrieveResult,
    },
  });

  console.log('📊 ANALISTA DE DADOS API: Retornando response...');
  return result.toUIMessageStreamResponse();
}