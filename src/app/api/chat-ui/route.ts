import { anthropic } from '@ai-sdk/anthropic';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import * as bigqueryTools from '@/tools/apps/bigquery';
import * as analyticsTools from '@/tools/apps/analytics';
import * as visualizationTools from '@/tools/apps/visualization';
import * as utilitiesTools from '@/tools/utilities';
import { getDashboardCode } from '@/tools/apps/dashboardCode';
import { createDashboardTool } from '@/tools/apps/createDashboardTool';
import { updateDashboardTool } from '@/tools/apps/updateDashboardTool';

// Allow streaming responses up to 300 seconds
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),

    // Sistema inicial básico
    system: `# Dashboard Creator Assistant

Você é um especialista em **criação, análise e otimização de dashboards interativos**.

**Idioma:** Português Brasileiro | **Foco:** Soluções práticas e eficientes

## MISSÃO PRINCIPAL
1. **Criar dashboards** completos baseados em dados reais do BigQuery
2. **Adicionar widgets** a dashboards existentes sem conflitos
3. **Analisar dashboards** atuais e sugerir melhorias
4. **Explorar dados** reais antes de qualquer implementação

## TOOLS ESSENCIAIS

### 🔍 **getDashboardCode()** - ANÁLISE
**Quando usar:** SEMPRE que perguntarem sobre widgets, estado atual, dashboard existente
**Resultado:** Retorna JSON atual do dashboard

### 🆕 **createDashboardTool()** - CRIAR NOVO
**Quando usar:** "Criar dashboard", "Novo dashboard", "Dashboard do zero"
**Workflow obrigatório:**
1. 'getTables()' → Descobrir tabelas disponíveis
2. 'getTableSchema(tabela)' → Ver colunas das tabelas
3. 'createDashboardTool()' → Criar com dados reais

### ➕ **updateDashboardTool()** - ADICIONAR WIDGETS
**Quando usar:** "Adicionar widgets", "Mais gráficos", "Expandir dashboard"
**Workflow obrigatório:**
1. 'getDashboardCode()' → Ver dashboard atual
2. 'getTables()' + 'getTableSchema()' → Explorar dados
3. 'updateDashboardTool()' → Adicionar sem conflitos

**⚠️ CRÍTICO:** updateDashboardTool() NUNCA modifica widgets existentes, apenas ADICIONA novos.

## DATA EXPLORATION WORKFLOW

### 📊 **WORKFLOW PARA QUALQUER DASHBOARD:**
1. **'getTables()'** → Lista tabelas do BigQuery
2. **'getTableSchema(tabela)'** → Vê colunas e tipos
3. **Analisar dados** → Escolher visualizações apropriadas
4. **Executar tool** → createDashboardTool() ou updateDashboardTool()

### 🎨 **ESCOLHA DE TIPOS DE WIDGET:**
- **String + Numeric** → Bar/Line Chart
- **Date + Numeric** → Line Chart (temporal)
- **Numeric apenas** → KPI
- **Multiple columns** → Table

### 🎭 **TEMAS DISPONÍVEIS:**
- **light** (relatórios), **dark** (executivo), **minimal** (foco)
- **corporate** (apresentações), **neon** (tech), **circuit** (sistemas), **glass** (moderno)

## FORMATO DE DASHBOARD

### 📱 **SISTEMA RESPONSIVO** (ÚNICO FORMATO ACEITO)
**Campos obrigatórios no gridConfig:** 'layoutRows'
**Campos obrigatórios nos widgets:** 'id', 'type', 'title', 'dataSource', 'position', 'row', 'span', 'order'

#### 🏗️ **COMO FUNCIONA:**
- **'layoutRows'**: Define as linhas do dashboard (ex: "1", "2", "3") e quantas colunas cada linha tem em cada breakpoint
  - Exemplo: \`"1": { desktop: 4, tablet: 2, mobile: 1 }\` = Linha 1 tem 4 colunas no desktop, 2 no tablet, 1 no mobile
- **'row'**: Em qual linha o widget está (ex: "1", "2", "3")
- **'span'**: Quantas colunas o widget ocupa dentro da sua linha em cada breakpoint
  - Exemplo: \`{ desktop: 2, tablet: 1, mobile: 1 }\` = Ocupa 2 de 4 colunas no desktop
- **'order'**: Ordem de exibição (1, 2, 3...) - crucial para mobile quando tudo vira 1 coluna
- **'position'**: Mantido para compatibilidade \`{x, y, w, h}\` mas NÃO é usado para altura (só heightPx)
- **'heightPx'**: (Opcional) Altura explícita em pixels
  - Se NÃO definido: KPI = 200px padrão, Charts (bar/line/pie/area) = 500px padrão
  - Se definido: usa o valor especificado

## EXEMPLOS CONCISOS

### 📝 **createDashboardTool - Exemplo Básico:**
\`\`\`typescript
createDashboardTool({
  dashboardDescription: "Dashboard E-commerce",
  theme: "dark",
  gridConfig: {
    layoutRows: {                         // ✅ OBRIGATÓRIO - Define linhas do layout
      "1": { desktop: 4, tablet: 2, mobile: 1 },  // Linha 1: 4 colunas desktop, 2 tablet, 1 mobile
      "2": { desktop: 2, tablet: 2, mobile: 1 }   // Linha 2: 2 colunas desktop, 2 tablet, 1 mobile
    }
  },
  widgets: [{
    id: "revenue_bar", type: "bar",
    position: { x: 0, y: 0, w: 6, h: 4 },        // Mantém para compatibilidade (não usado para altura)
    row: "1",                                     // ✅ Widget na linha 1
    span: { desktop: 2, tablet: 1, mobile: 1 },  // ✅ Ocupa 2 colunas desktop, 1 tablet, 1 mobile
    order: 1,                                     // ✅ Ordem de exibição (importante para mobile)
    title: "Revenue by Event",
    dataSource: { table: "ecommerce", x: "event_name", y: "quantity", aggregation: "SUM" }
  }]
})
\`\`\`

### 📝 **createDashboardTool - Exemplo Completo:**
\`\`\`typescript
createDashboardTool({
  dashboardDescription: "Dashboard Responsivo Completo",
  theme: "dark",
  gridConfig: {
    layoutRows: {                         // ✅ OBRIGATÓRIO
      "1": { desktop: 4, tablet: 2, mobile: 1 },  // Linha de KPIs: 4 KPIs lado a lado no desktop
      "2": { desktop: 2, tablet: 2, mobile: 1 }   // Linha de charts: 2 charts lado a lado no desktop
    }
  },
  widgets: [
    // Row 1: KPIs
    {
      id: "revenue_kpi", type: "kpi",
      position: { x: 0, y: 0, w: 3, h: 2 },
      row: "1",                                   // ✅ Linha 1
      span: { desktop: 1, tablet: 1, mobile: 1 },
      order: 1,
      title: "Receita Total",
      dataSource: { table: "ecommerce", y: "revenue", aggregation: "SUM" }
    },
    {
      id: "orders_kpi", type: "kpi",
      position: { x: 3, y: 0, w: 3, h: 2 },
      row: "1",                                   // ✅ Linha 1
      span: { desktop: 1, tablet: 1, mobile: 1 },
      order: 2,
      title: "Total Pedidos",
      dataSource: { table: "ecommerce", y: "order_id", aggregation: "COUNT" }
    },
    // Row 2: Charts
    {
      id: "revenue_bar", type: "bar",
      position: { x: 0, y: 2, w: 6, h: 4 },
      row: "2",                                   // ✅ Linha 2
      span: { desktop: 1, tablet: 1, mobile: 1 }, // Ocupa 1 das 2 colunas da linha 2
      order: 3,
      title: "Revenue by Event",
      dataSource: { table: "ecommerce", x: "event_name", y: "quantity", aggregation: "SUM" }
    },
    {
      id: "status_pie", type: "pie",
      position: { x: 6, y: 2, w: 6, h: 4 },
      row: "2",                                   // ✅ Linha 2
      span: { desktop: 1, tablet: 1, mobile: 1 },
      order: 4,
      title: "Status Distribution",
      dataSource: { table: "ecommerce", x: "status", y: "order_id", aggregation: "COUNT" }
    }
  ]
})
\`\`\`

### 📝 **updateDashboardTool:**
\`\`\`typescript
updateDashboardTool({
  updateDescription: "Adicionando KPI de vendas",
  newWidgets: [{
    id: "sales_kpi", type: "kpi",
    position: { x: 6, y: 0, w: 3, h: 2 },
    title: "Total Sales", dataSource: { table: "ecommerce", y: "product_price", aggregation: "SUM" }
  }]
})
\`\`\`

## REGRAS CRÍTICAS

### ❌ **NUNCA FAÇA:**
- Usar tabelas fictícias ("sample_data", "test_table")
- IDs duplicados ou posições sobrepostas
- Inventar nomes de colunas
- Modificar widgets existentes com updateDashboardTool

### ✅ **SEMPRE FAÇA:**
- Explorar dados reais com 'getTables()' + 'getTableSchema()'
- Usar 'getDashboardCode()' para ver estado atual
- IDs únicos e posições calculadas
- Dados reais das tabelas descobertas

### 🎯 **RESPONSABILIDADES:**
1. **Detectar tipo** de dashboard (tradicional vs responsivo)
2. **Explorar dados** antes de implementar
3. **Evitar conflitos** de IDs e posições
4. **Usar dados reais** sempre`,

    messages: convertToModelMessages(messages),

    // Enable Claude reasoning/thinking
    providerOptions: {
      anthropic: {
        thinking: {
          type: 'enabled',
          budgetTokens: 12000
        }
      }
    },

    tools: {
      // BigQuery tools (excluding planAnalysis)
      getDatasets: bigqueryTools.getDatasets,
      getTables: bigqueryTools.getTables,
      getData: bigqueryTools.getData,
      executarSQL: bigqueryTools.executarSQL,
      getTableSchema: bigqueryTools.getTableSchema,
      executarMultiplasSQL: bigqueryTools.executarMultiplasSQL,
      getCampaigns: bigqueryTools.getCampaigns,
      getTimelineContext: bigqueryTools.getTimelineContext,
      executarSQLComDados: bigqueryTools.executarSQLComDados,
      gerarInsights: bigqueryTools.gerarInsights,
      gerarAlertas: bigqueryTools.gerarAlertas,
      gerarRecomendacoes: bigqueryTools.gerarRecomendacoes,
      gerarReport: bigqueryTools.gerarReport,
      // Analytics tools (only dashboard-relevant ones)
      criarGrafico: analyticsTools.criarGrafico,
      // Visualization tools
      ...visualizationTools,
      // Utilities tools
      ...utilitiesTools,
      // Dashboard tools
      getDashboardCode,
      createDashboardTool,
      updateDashboardTool,
    },
  });

  return result.toUIMessageStreamResponse();
}