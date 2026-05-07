import {
  createMcpDashboard,
  listMcpDashboards,
  patchMcpDashboard,
  readMcpDashboard,
  updateMcpDashboardFull,
  type McpJsonMap,
} from '@/products/mcp/adapters/artifactsAdapter'
import { MCP_DASHBOARD_TOOL_NAMES, type McpDashboardToolName } from '@/products/mcp/shared/toolNames'

type JsonRecord = Record<string, unknown>

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

  return {
    type: operationType,
    oldString: optionalText(operation.old_string),
    newString: operation.new_string == null ? null : String(operation.new_string),
    replaceAll: Boolean(operation.replace_all),
    source: operation.source == null ? null : String(operation.source),
    changeSummary: optionalText(operation.change_summary),
  }
}

function getDashboardContract(includeExample: boolean) {
  return {
    artifact_type: 'dashboard',
    source_path: 'app/dashboard.tsx',
    source_format: 'TSX completo exportando um componente default ou um root <Dashboard>.',
    supported_components: [
      'Dashboard',
      'Grid',
      'Vertical',
      'Horizontal',
      'Panel',
      'Card',
      'Query',
      'Chart',
      'KPI',
      'KPICompare',
      'Table',
      'PivotTable',
      'Filter',
      'DatePicker',
      'Insights',
      'Text',
    ],
    supported_chart_types: [
      'bar',
      'line',
      'pie',
      'horizontal-bar',
      'scatter',
      'radar',
      'treemap',
      'composed',
      'funnel',
      'sankey',
      'gauge',
    ],
    rules: [
      'Gere source TSX completo e autocontido para um dashboard.',
      'Nao use imports externos nao suportados pelo preview do workspace.',
      'Use ids estaveis em paineis, charts, KPIs, tabelas e filtros.',
      'Antes de editar dashboard existente, chame dashboard_read e use current_draft_version como expected_version.',
      'Para pequenas edicoes, prefira dashboard_patch com replace_text especifico.',
      'Para reescrita completa, use dashboard_update_full.',
    ],
    create_flow: [
      'Chame dashboard_get_contract se precisar relembrar o formato.',
      'Gere source TSX.',
      'Chame dashboard_create com title e source.',
      'Retorne artifact_id, version e url ao usuario.',
    ],
    edit_flow: [
      'Chame dashboard_read.',
      'Leia source e current_draft_version.',
      'Chame dashboard_patch ou dashboard_update_full com expected_version.',
      'Retorne a nova versao e URL.',
    ],
    example_source: includeExample
      ? `<Dashboard title="Dashboard Comercial" theme="light" chartPalette="teal">
  <Grid columns={12} gap={16}>
    <Panel id="kpi-receita" title="Receita" span={4}>
      <KPI id="receita-total" label="Receita" value="R$ 128.400" />
    </Panel>
    <Panel id="chart-vendas" title="Vendas por mes" span={8}>
      <Chart id="vendas-mes" type="bar" data={[{ label: 'Jan', value: 42000 }, { label: 'Fev', value: 53800 }]} />
    </Panel>
  </Grid>
</Dashboard>`
      : null,
  }
}

export async function executeMcpDashboardTool(
  toolName: string,
  rawArgs: unknown,
  _context: McpDashboardToolContext = {},
): Promise<McpDashboardToolExecutionResult> {
  const args = asRecord(rawArgs)

  switch (toolName) {
    case MCP_DASHBOARD_TOOL_NAMES.dashboardList:
      return {
        ok: true,
        tool: MCP_DASHBOARD_TOOL_NAMES.dashboardList,
        result: await listMcpDashboards({ limit: optionalPositiveInt(args.limit) }),
      }

    case MCP_DASHBOARD_TOOL_NAMES.dashboardRead:
      return {
        ok: true,
        tool: MCP_DASHBOARD_TOOL_NAMES.dashboardRead,
        result: await readMcpDashboard({
          artifactId: requiredText(args, 'artifact_id'),
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

