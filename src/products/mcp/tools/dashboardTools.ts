import {
  createMcpDashboard,
  listMcpDashboards,
  patchMcpDashboard,
  readMcpDashboard,
  updateMcpDashboardFull,
  type McpJsonMap,
} from '@/products/mcp/adapters/artifactsAdapter'
import { MCP_DASHBOARD_TOOL_NAMES, type McpDashboardToolName } from '@/products/mcp/shared/toolNames'
import {
  DASHBOARD_DSL_VERSION,
  DASHBOARD_SUPPORTED_CHART_PALETTES,
  DASHBOARD_SUPPORTED_CHART_TYPES,
  DASHBOARD_SUPPORTED_COMPONENTS,
  DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS,
  DASHBOARD_SUPPORTED_HTML_TAGS,
} from '@/products/artifacts/dashboard/language/dashboardLanguageManifest'

type JsonRecord = Record<string, unknown>

const DASHBOARD_INTERNAL_COMPONENTS = new Set([
  'DashboardTemplate',
  'Theme',
  'BarChart',
  'LineChart',
  'PieChart',
  'HorizontalBarChart',
  'ScatterChart',
  'RadarChart',
  'TreemapChart',
  'ComposedChart',
  'FunnelChart',
  'SankeyChart',
  'Gauge',
  'Select',
  'OptionList',
  'TextNode',
  'Br',
])

const DASHBOARD_AUTHORING_COMPONENTS = DASHBOARD_SUPPORTED_COMPONENTS.filter(
  (component) => !DASHBOARD_INTERNAL_COMPONENTS.has(component),
)

const DASHBOARD_DATE_PICKER_PRESETS = DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS

const DASHBOARD_FORMATS = ['currency', 'number', 'percent', 'integer', 'date', 'datetime', 'text'] as const

const DASHBOARD_COMPONENT_PROPS = {
  Dashboard: {
    required: ['id', 'title'],
    props: {
      id: 'string estavel, sem espacos',
      title: 'string',
      theme: 'string opcional, normalmente light',
      chartPalette: DASHBOARD_SUPPORTED_CHART_PALETTES,
      borderPreset: 'string opcional',
    },
  },
  Grid: {
    required: [],
    props: {
      columns: 'number, normalmente 12',
      gap: 'number em px',
      children: 'Panel/Card/layout/html',
    },
  },
  Vertical: {
    required: [],
    props: {
      gap: 'number em px',
      align: 'start | center | end | stretch',
      children: 'componentes de layout ou dados',
    },
  },
  Horizontal: {
    required: [],
    props: {
      gap: 'number em px',
      align: 'start | center | end | stretch',
      wrap: 'boolean opcional',
      children: 'componentes de layout ou dados',
    },
  },
  Panel: {
    required: ['id'],
    props: {
      id: 'string estavel, sem espacos',
      title: 'string opcional',
      span: 'number de 1 a 12 quando estiver dentro de Grid',
      children: 'KPI/Chart/Table/Filter/layout/html',
    },
  },
  Card: {
    required: [],
    props: {
      title: 'string opcional',
      span: 'number opcional quando estiver dentro de Grid',
      children: 'conteudo visual ou componentes de dados',
    },
  },
  KPI: {
    required: ['id', 'label'],
    props: {
      id: 'string estavel, sem espacos',
      label: 'string',
      dataQuery: 'objeto com query SQL; preferido para KPI dinamico',
      valuePath: 'string opcional quando o valor vem de um Query ancestral',
      comparisonMode: ['previous_period', 'previous_month', 'previous_year'],
      format: DASHBOARD_FORMATS,
    },
    data_contract: 'A query deve retornar uma linha com alias numerico value.',
  },
  KPICompare: {
    required: ['id', 'label', 'dataQuery'],
    props: {
      id: 'string estavel, sem espacos',
      label: 'string',
      dataQuery: 'objeto com query SQL',
      format: DASHBOARD_FORMATS,
    },
    data_contract: 'Use value para valor atual e previous_value quando houver comparativo.',
  },
  Chart: {
    required: ['id', 'type', 'dataQuery'],
    props: {
      id: 'string estavel, sem espacos',
      type: DASHBOARD_SUPPORTED_CHART_TYPES,
      dataQuery: 'objeto com query SQL',
      xAxis: "{ dataKey: 'label' } para bar/line/composed",
      series: "array como [{ dataKey: 'value', label: 'Receita' }]",
      format: DASHBOARD_FORMATS,
      height: 'number ou string; use 280-360 para cards comuns',
    },
    data_contract:
      'Charts simples devem retornar key opcional, label e value. Series multiplas devem retornar label e uma coluna numerica por serie declarada.',
  },
  Query: {
    required: ['dataQuery'],
    props: {
      dataQuery: 'objeto com query SQL',
      format: DASHBOARD_FORMATS,
      children: 'layout opcional quando usar dados compartilhados',
    },
  },
  Table: {
    required: ['id', 'dataQuery'],
    props: {
      id: 'string estavel, sem espacos',
      dataQuery: 'objeto com query SQL',
      columns: 'array opcional com key, label, format, align',
      height: 'number ou string opcional',
    },
    data_contract: 'A query deve retornar linhas tabulares com aliases estaveis para colunas.',
  },
  PivotTable: {
    required: ['id', 'dataQuery'],
    props: {
      id: 'string estavel, sem espacos',
      dataQuery: 'objeto com query SQL',
      rows: 'array de campos de linha',
      columns: 'array de campos de coluna',
      values: 'array de metricas',
    },
  },
  Filter: {
    required: ['id', 'field', 'table'],
    props: {
      id: 'string estavel, sem espacos',
      label: 'string',
      field: 'nome da coluna filtrada',
      table: 'schema.tabela base do filtro',
      multiple: 'boolean opcional',
    },
  },
  DatePicker: {
    required: ['id', 'field', 'table'],
    props: {
      id: 'string estavel, sem espacos',
      label: 'string',
      field: 'coluna de data',
      table: 'schema.tabela base do filtro',
      presets: DASHBOARD_DATE_PICKER_PRESETS,
    },
  },
  Tabs: {
    required: ['defaultValue'],
    props: {
      defaultValue: 'value de um Tab filho',
      children: 'Tab e TabPanel com values correspondentes',
    },
  },
  Tab: {
    required: ['value'],
    props: {
      value: 'string que identifica a aba',
      children: 'label da aba',
    },
  },
  TabPanel: {
    required: ['value'],
    props: {
      value: 'string igual a um Tab.value',
      children: 'conteudo da aba',
    },
  },
  Insights: {
    required: [],
    props: {
      items: 'array opcional de textos ou objetos de insight',
      dataQuery: 'objeto opcional com query SQL',
    },
  },
  Text: {
    required: [],
    props: {
      as: 'p | span | h1 | h2 | h3 | strong',
      children: 'texto curto',
    },
  },
  Icon: {
    required: ['name'],
    props: {
      name: 'string do icone suportado pelo runtime',
    },
  },
} as const

const DASHBOARD_DATA_QUERY_CONTRACT = {
  shape: {
    query: 'SQL BigQuery SELECT/CTE usando nomes logicos do dataset analytics do tenant.',
    limit: 'number opcional',
  },
  placeholders: ['@de', '@ate', 'parametros nomeados de filtros definidos no dashboard'],
  aliases: {
    KPI: ['value'],
    Chart: ['key opcional', 'label', 'value'],
    Table: ['aliases estaveis que batem com columns[].key quando columns for usado'],
  },
  rules: [
    'Use SELECT/CTE de leitura; nao use INSERT, UPDATE, DELETE, DDL ou multiplas instrucoes.',
    'Nao informe project ou dataset. Use FROM vendas, FROM clientes, FROM contas_receber etc.',
    'As views logicas ja pertencem ao tenant autenticado e representam o estado atual deduplicado.',
    'Use o sufixo _history apenas quando precisar consultar todas as cargas.',
    'Para filtros de data recebidos como texto ISO, use DATE(@de) e DATE(@ate) na SQL.',
    'Para moeda/percentual, retorne numero bruto e use format no componente.',
  ],
} as const

const DASHBOARD_VALID_EXAMPLE = `<Dashboard
  id="dashboard-comercial"
  title="Dashboard Comercial"
  theme="light"
  chartPalette="teal"
>
  <Grid columns={12} gap={16}>
    <Panel id="panel-receita" title="Receita" span={4}>
      <KPI
        id="kpi-receita-total"
        label="Receita"
        format="currency"
        dataQuery={{
          query: \`
            SELECT COALESCE(SUM(valor_total), 0) AS value
            FROM vendas
          \`,
          limit: 1,
        }}
      />
    </Panel>

    <Panel id="panel-vendas-mes" title="Vendas por mes" span={8}>
      <Chart
        id="chart-vendas-mes"
        type="bar"
        format="currency"
        height={320}
        dataQuery={{
          query: \`
            SELECT
              FORMAT_DATE('%Y-%m', DATE_TRUNC(DATE(data_pedido), MONTH)) AS label,
              COALESCE(SUM(valor_total), 0) AS value
            FROM vendas
            GROUP BY 1
            ORDER BY 1
          \`,
          limit: 12,
        }}
        xAxis={{ dataKey: 'label' }}
        series={[{ dataKey: 'value', label: 'Receita' }]}
      />
    </Panel>
  </Grid>
</Dashboard>`

export type McpDashboardToolContext = {
  tenantId?: number
}

export type McpDashboardToolExecutionResult = {
  ok: true
  tool: McpDashboardToolName
  result: unknown
}

export class McpDashboardToolInputError extends Error {
  status = 400
  code = 'mcp_invalid_tool_input'
  details?: JsonRecord

  constructor(message: string, details?: JsonRecord) {
    super(message)
    this.details = details
  }
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function asMetadata(value: unknown): McpJsonMap | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as McpJsonMap
}

function optionalText(value: unknown): string | null {
  const text = String(value ?? '').trim()
  return text || null
}

function requiredText(args: JsonRecord, field: string): string {
  const text = optionalText(args[field])
  if (!text) throw new McpDashboardToolInputError(`${field} e obrigatorio`, { field })
  return text
}

function optionalPositiveInt(value: unknown): number | null {
  if (value == null || value === '') return null
  const num = Number(value)
  if (!Number.isInteger(num) || num <= 0) return null
  return num
}

function requiredPositiveInt(args: JsonRecord, field: string): number {
  const num = optionalPositiveInt(args[field])
  if (num == null) {
    throw new McpDashboardToolInputError(`${field} deve ser inteiro positivo`, { field })
  }
  return num
}

function normalizePatchOperation(value: unknown) {
  const operation = asRecord(value)
  const operationType = String(operation.type || '').trim()
  if (operationType !== 'replace_text' && operationType !== 'replace_full_source') {
    throw new McpDashboardToolInputError('operation.type deve ser replace_text ou replace_full_source', {
      field: 'operation.type',
    })
  }
  const normalizedType = operationType as 'replace_text' | 'replace_full_source'

  return {
    type: normalizedType,
    oldString: optionalText(operation.old_string),
    newString: operation.new_string == null ? null : String(operation.new_string),
    replaceAll: Boolean(operation.replace_all),
    source: operation.source == null ? null : String(operation.source),
    changeSummary: optionalText(operation.change_summary),
  }
}

export function getDashboardContract(includeExample: boolean) {
  return {
    artifact_type: 'dashboard',
    dsl_version: DASHBOARD_DSL_VERSION,
    source_path: 'app/dashboard.tsx',
    source_format:
      'TSX declarativo completo exportando um componente default ou comecando diretamente em um root <Dashboard>.',
    authoring_model:
      'Use TSX como DSL declarativa: layout flexivel, mas componentes e props devem seguir este contrato. Nao gere React livre.',
    supported_components: [...DASHBOARD_AUTHORING_COMPONENTS],
    supported_html_tags: [...DASHBOARD_SUPPORTED_HTML_TAGS],
    supported_chart_types: [...DASHBOARD_SUPPORTED_CHART_TYPES],
    supported_chart_palettes: [...DASHBOARD_SUPPORTED_CHART_PALETTES],
    supported_date_picker_presets: [...DASHBOARD_DATE_PICKER_PRESETS],
    supported_formats: [...DASHBOARD_FORMATS],
    component_props: DASHBOARD_COMPONENT_PROPS,
    data_query_contract: DASHBOARD_DATA_QUERY_CONTRACT,
    rules: [
      'Gere source TSX completo, autocontido e declarativo para um dashboard.',
      'O root Dashboard deve ter id e title nao vazios.',
      'Nao use imports externos nao suportados pelo preview do workspace.',
      'Nao use componentes fora de supported_components nem props inventadas para componentes de dados.',
      'Use ids estaveis em paineis, charts, KPIs, tabelas e filtros.',
      'Use dataQuery para KPI, Chart, Query, Table e PivotTable dinamicos.',
      'Nao use Chart.data nem KPI.value para dados dinamicos; use dataQuery e format.',
      'Queries de KPI devem retornar alias value; queries de Chart devem retornar label e value por padrao.',
      'Antes de editar dashboard existente, use artifact_authoring com kind=dashboard.',
      'Para pequenas edicoes, prefira artifact_authoring action=patch com replace_text especifico.',
      'Para reescrita completa, use artifact_authoring action=update_full.',
    ],
    create_flow: [
      'Chame artifact_authoring com kind=dashboard e action=get_contract se precisar relembrar o formato.',
      'Gere source TSX.',
      'Chame artifact_authoring com kind=dashboard, action=create, title e source.',
      'Retorne artifact_id, version e url ao usuario.',
    ],
    edit_flow: [
      'Chame artifact_authoring com kind=dashboard e action=patch ou update_full.',
      'Se expected_version for omitida, a tool usa a versao draft atual automaticamente.',
      'Use replace_text para edicoes pontuais e update_full para reescrita completa.',
      'Retorne a nova versao e URL.',
    ],
    example_source: includeExample ? DASHBOARD_VALID_EXAMPLE : null,
  }
}

export async function executeMcpDashboardTool(
  toolName: string,
  rawArgs: unknown,
  context: McpDashboardToolContext = {},
): Promise<McpDashboardToolExecutionResult> {
  const args = asRecord(rawArgs)
  if (toolName !== MCP_DASHBOARD_TOOL_NAMES.dashboardGetContract && !context.tenantId) {
    throw new McpDashboardToolInputError('tenant autenticado e obrigatorio para operar dashboards')
  }
  const tenantId = context.tenantId as number

  switch (toolName) {
    case MCP_DASHBOARD_TOOL_NAMES.dashboardList:
      return {
        ok: true,
        tool: MCP_DASHBOARD_TOOL_NAMES.dashboardList,
        result: await listMcpDashboards({ limit: optionalPositiveInt(args.limit), tenantId }),
      }

    case MCP_DASHBOARD_TOOL_NAMES.dashboardRead:
      return {
        ok: true,
        tool: MCP_DASHBOARD_TOOL_NAMES.dashboardRead,
        result: await readMcpDashboard({
          artifactId: requiredText(args, 'artifact_id'),
          tenantId,
          kind: args.kind === 'published' ? 'published' : 'draft',
          version: optionalPositiveInt(args.version),
        }),
      }

    case MCP_DASHBOARD_TOOL_NAMES.dashboardCreate:
      return {
        ok: true,
        tool: MCP_DASHBOARD_TOOL_NAMES.dashboardCreate,
        result: await createMcpDashboard({
          title: requiredText(args, 'title'),
          tenantId,
          source: requiredText(args, 'source'),
          workspaceId: optionalText(args.workspace_id),
          slug: optionalText(args.slug),
          metadata: asMetadata(args.metadata),
          changeSummary: optionalText(args.change_summary),
        }),
      }

    case MCP_DASHBOARD_TOOL_NAMES.dashboardPatch:
      return {
        ok: true,
        tool: MCP_DASHBOARD_TOOL_NAMES.dashboardPatch,
        result: await patchMcpDashboard({
          artifactId: requiredText(args, 'artifact_id'),
          tenantId,
          expectedVersion: requiredPositiveInt(args, 'expected_version'),
          operation: normalizePatchOperation(args.operation),
        }),
      }

    case MCP_DASHBOARD_TOOL_NAMES.dashboardUpdateFull:
      return {
        ok: true,
        tool: MCP_DASHBOARD_TOOL_NAMES.dashboardUpdateFull,
        result: await updateMcpDashboardFull({
          artifactId: requiredText(args, 'artifact_id'),
          tenantId,
          expectedVersion: requiredPositiveInt(args, 'expected_version'),
          title: optionalText(args.title),
          source: requiredText(args, 'source'),
          slug: optionalText(args.slug),
          metadata: asMetadata(args.metadata),
          changeSummary: optionalText(args.change_summary),
        }),
      }

    case MCP_DASHBOARD_TOOL_NAMES.dashboardGetContract:
      return {
        ok: true,
        tool: MCP_DASHBOARD_TOOL_NAMES.dashboardGetContract,
        result: getDashboardContract(Boolean(args.include_example)),
      }

    default:
      throw new McpDashboardToolInputError(`Tool MCP desconhecida: ${toolName}`, { toolName })
  }
}
