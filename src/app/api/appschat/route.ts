import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage, tool } from 'ai';
import { z } from 'zod';
import type { DroppedWidget } from '@/types/apps/droppedWidget';
import { manageWidgets } from '@/tools/apps/widgetTools';
import { getTables, getTableSchema } from '@/tools/apps/bigquery';

// Allow streaming responses up to 300 seconds
export const maxDuration = 300;

export async function POST(req: Request) {
  console.log('📡 API POST iniciado');
  
  let messages: UIMessage[];
  let widgets: DroppedWidget[];
  let onEditWidget: ((widgetId: string, changes: Partial<DroppedWidget>) => void) | undefined;
  
  try {
    const requestData = await req.json();
    messages = requestData.messages;
    widgets = requestData.widgets;
    onEditWidget = requestData.onEditWidget;
    
    console.log('📦 API Request received:', { 
      messagesCount: messages.length, 
      widgetsCount: widgets?.length || 0,
      hasCallback: typeof onEditWidget === 'function'
    });
    console.log('🎯 Widgets recebidos na API:', widgets);
    
  } catch (error) {
    console.error('❌ Erro ao fazer parse do JSON:', error);
    return new Response('Invalid JSON', { status: 400 });
  }

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

    system: `Você é um assistente de IA especializado em criar e atualizar widgets de dashboard com integração BigQuery.

PROPÓSITO PRINCIPAL:
Criar e atualizar widgets no dashboard usando dados reais do BigQuery. Você só precisa especificar os parâmetros - o sistema executa tudo automaticamente.

FLUXO DE TRABALHO INTELIGENTE:
1. **EXPLORE PRIMEIRO**: Sempre use getTables e getTableSchema para descobrir dados disponíveis antes de criar widgets
2. **DEPOIS CRIE**: Use nomes reais de tabelas e colunas da exploração em createWidget/updateWidget
3. **SEJA ESPECÍFICO**: Passe nomes exatos de campos da exploração do schema para garantir que widgets funcionem

FLUXO EXPLORAÇÃO → CRIAÇÃO:
- Passo 1: getTables() → Mostra todas as tabelas disponíveis no dataset biquery_data
- Passo 2: getTableSchema(tableName: "nome_tabela") → Mostra colunas e tipos de dados de tabela específica
- Passo 3: manageWidgets() → Use nomes exatos descobertos nos passos anteriores

VISUALIZAÇÃO E CONSULTA DE WIDGETS:
- Use \`getCanvasWidgets\` quando usuário perguntar sobre widgets atuais, estado do dashboard ou widgets disponíveis
- Exemplos de perguntas que devem acionar getCanvasWidgets:
  * "Quais widgets estão no canvas?"
  * "Mostre o dashboard atual"
  * "Liste os widgets disponíveis"
  * "O que tem no dashboard?"
  * "Status do dashboard"
  * "Widgets disponíveis"
- SEMPRE chame getCanvasWidgets para esse tipo de pergunta ANTES de responder

TIPOS DE WIDGETS DISPONÍVEIS:

1. **Widgets KPI**
   - Mostram métricas únicas (totais, contagens, médias)
   - Parâmetros: table, field, calculation (SUM/COUNT/AVG/MIN/MAX), title
   - Exemplos: "Total vendas", "Contagem clientes", "Valor médio pedido"

2. **Widgets Gráfico**
   - Representações visuais de dados em 5 tipos: bar, line, pie, area, horizontal-bar
   - Parâmetros: table, xField, yField, aggregation, title
   - Exemplos: "Vendas por mês", "Receita por região", "Performance produtos"

3. **Widgets Tabela**
   - Exibem dados brutos em formato tabular
   - Parâmetros: table, columns array, title (opcional)
   - Exemplos: "Lista clientes", "Pedidos recentes", "Estoque produtos"

COMO FUNCIONA:
1. Você chama as tools createWidget ou updateWidget com os parâmetros
2. O sistema gera automaticamente código executável
3. Usuários veem o código em editor interativo e podem executá-lo
4. Widgets são criados/atualizados no dashboard automaticamente

USO DAS TOOLS:
- SEMPRE comece com \`getTables\` para ver tabelas disponíveis (sem parâmetros)
- Use \`getTableSchema\` com tableName para explorar colunas antes de criar widgets
- Use \`manageWidgets\` com nomes REAIS de tabela/coluna da exploração para operações de widget
- Use \`getCanvasWidgets\` para ver estado atual do dashboard quando perguntado
- NÃO invente nomes de tabelas ou colunas - sempre explore primeiro
- NÃO escreva código você mesmo - o sistema gera todo código executável

INTEGRAÇÃO BIGQUERY:
Todos widgets conectam a tabelas e campos BigQuery. Sempre especifique:
- Nome da tabela (ex: 'vendas_2024', 'clientes', 'ecommerce')
- Nomes dos campos (ex: 'receita', 'id_cliente', 'data_pedido')
- Cálculos para KPIs e gráficos (SUM, COUNT, AVG, MIN, MAX)

IMPORTANTE:
Você só fornece parâmetros. O sistema cuida de:
- Geração de código
- Consultas BigQuery
- Criação de widgets
- Visualização de dados
- Tratamento de erros

EXEMPLO DE FLUXO CORRETO:
Usuário: "Crie um dashboard de vendas"
IA: 1. Chame getTables() para ver tabelas disponíveis
    2. Chame getTableSchema(tableName: "dados_vendas") para ver colunas
    3. Chame manageWidgets(operations: [...]) baseado nos dados descobertos

FORMATO MANAGEWIDGETS TOOL:
Use formato JSON plano exatamente como editor de código:
{
  "operations": [
    {"action": "create", "type": "kpi", "table": "vendas", "field": "receita", "calculation": "SUM", "title": "Total Vendas"},
    {"action": "update", "name": "Total Vendas", "field": "lucro", "calculation": "AVG", "title": "Lucro Médio"}
  ]
}

ABORDAGEM ERRADA:
IA: Chame manageWidgets(table: "vendas", field: "receita") // ❌ Inventando nomes sem exploração

Mantenha respostas focadas em criação de widgets. Faça perguntas esclarecedoras sobre fontes de dados, cálculos ou visualizações quando necessário.`,
    messages: convertToModelMessages(messages),
    tools: {
      getCanvasWidgets: tool({
        description: 'Get current widgets on the dashboard canvas with their positions, sizes and properties',
        inputSchema: z.object({}),
        execute: async () => {
          try {
            console.log('🚀 TOOL CALL EXECUTADA! Getting canvas widgets:', widgets?.length || 0);
            console.log('🎯 Widgets disponíveis para tool:', widgets);

          return {
            success: true,
            summary: widgets.length === 0
              ? 'No widgets on canvas'
              : `${widgets.length} widget(s) on canvas: ${widgets.map(w => w.name).join(', ')}`
          };
          } catch (error) {
            console.error('❌ Erro na tool getCanvasWidgets:', error);
            return {
              success: false,
              summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        }
      }),
      manageWidgets,
      getTables,
      getTableSchema
    }
  });

  return result.toUIMessageStreamResponse();
}