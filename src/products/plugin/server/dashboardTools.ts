import {
  createMcpDashboard,
  listMcpDashboards,
  patchMcpDashboard,
  readMcpDashboard,
  updateMcpDashboardFull,
  type McpJsonMap,
} from '@/products/plugin/server/artifactsAdapter'
import { MCP_DASHBOARD_TOOL_NAMES, type McpDashboardToolName } from '@/products/plugin/server/toolNames'
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
])

const DASHBOARD_AUTHORING_COMPONENTS = DASHBOARD_SUPPORTED_COMPONENTS.filter(
  (component) => !DASHBOARD_INTERNAL_COMPONENTS.has(component),
)

const DASHBOARD_DATE_PICKER_PRESETS = DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS

const DASHBOARD_FORMATS = ['currency', 'number', 'percent', 'integer', 'date', 'datetime', 'text'] as const

const DASHBOARD_COMPONENT_PROPS = {
 Dashboard: { required: ['id', 'title'], props: { id: 'string', title: 'string', theme: 'string opcional', chartPalette: DASHBOARD_SUPPORTED_CHART_PALETTES } },
 KPI: { required: ['id', 'value'], props: { id: 'string', title: 'string', value: 'numero fornecido; null para valor ainda indisponivel', format: DASHBOARD_FORMATS } },
 Chart: { required: ['id', 'type', 'data'], props: { id: 'string', type: DASHBOARD_SUPPORTED_CHART_TYPES, data: 'array de registros fornecidos', xAxis: "{ dataKey: 'label' }", series: "[{ dataKey: 'value', label: 'Valor' }]", height: 'number ou string', format: DASHBOARD_FORMATS } },
 Table: { required: ['id', 'data'], props: { id: 'string', data: 'array de registros fornecidos', columns: "[{ accessorKey: 'label', header: 'Descricao' }]" } },
 PivotTable: { required: ['id', 'data'], props: { id: 'string', data: 'array de registros fornecidos', rows: 'campos de linha', columns: 'campos de coluna', values: 'metricas agregadas localmente' } },
 Tabs: { required: ['defaultValue'], props: { defaultValue: 'valor inicial', children: 'Tab e TabPanel com valores correspondentes' } },
 Tab: { required: ['value'], props: { value: 'identificador da aba', children: 'rotulo' } },
 TabPanel: { required: ['value'], props: { value: 'identificador da aba', children: 'conteudo' } },
} as const



const DASHBOARD_VALID_EXAMPLE = `<Dashboard id="resumo" title="Resumo">
  <header><h1>Resumo</h1><p>Preencha os componentes com dados verificados.</p></header>
  <KPI id="indicador" title="Indicador" value={null} format="number" />
  <Chart id="grafico" type="bar" data={[]} height={280} xAxis={{ dataKey: 'label' }} series={[{ dataKey: 'value', label: 'Valor' }]} />
  <Table id="tabela" data={[]} columns={[{ accessorKey: 'label', header: 'Descricao' }]} />
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
  kind: 'dashboard', dsl_version: DASHBOARD_DSL_VERSION, source_format: 'tsx',
  supported_components: DASHBOARD_AUTHORING_COMPONENTS.filter(component => component !== 'KPICompare' && component !== 'Filter' && component !== 'DatePicker'),
  supported_html_tags: [...DASHBOARD_SUPPORTED_HTML_TAGS],
  supported_chart_types: [...DASHBOARD_SUPPORTED_CHART_TYPES],
  supported_chart_palettes: [...DASHBOARD_SUPPORTED_CHART_PALETTES],
  supported_formats: [...DASHBOARD_FORMATS], component_props: DASHBOARD_COMPONENT_PROPS,
  data_contract: { mode: 'inline', queries_supported: false, description: 'Dados fornecidos diretamente. Nao executa SQL nem consulta fontes externas.' },
  rules: [
   'Gere source TSX completo, autocontido e declarativo. Use ids estaveis.',
   'Use tags HTML suportadas para layout e texto; nao use componentes inventados.',
   'Use KPI.value e Chart.data, Table.data ou PivotTable.data com dados verificados.',
   'Nao gere dataQuery, query, Query nem consultas SQL. Nao invente valores de negocio.',
   'Sem dados suficientes, use listas vazias e value=null com indicacao de indisponibilidade.',
   'Os relatorios nativos do ERP permanecem disponiveis no ERP.',
  ],
  create_flow: ['Consulte artifact_authoring kind=dashboard action=get_contract.', 'Gere TSX e salve com action=create, title e source.', 'Retorne artifact_id, version e url.'],
  edit_flow: ['Use artifact_authoring action=patch para alteracoes pontuais ou update_full para reescrita.', 'Se expected_version for omitida, a tool usa a versao draft atual automaticamente.', 'Retorne a nova versao e URL.'],
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
