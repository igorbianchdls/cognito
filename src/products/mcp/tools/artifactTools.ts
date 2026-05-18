import {
  createMcpArtifact,
  patchMcpArtifact,
  readMcpArtifact,
  updateMcpArtifactFull,
  type McpArtifactKind,
  type McpJsonMap,
} from '@/products/mcp/adapters/artifactsAdapter'
import { MCP_ARTIFACT_TOOL_NAMES, type McpArtifactToolName } from '@/products/mcp/shared/toolNames'
import { getDashboardContract, McpDashboardToolInputError } from '@/products/mcp/tools/dashboardTools'
import { REPORT_TEMPLATE_SOURCE } from '@/products/artifacts/report/templates/reportTemplate'
import {
  REPORT_SUPPORTED_CHART_TYPES,
  REPORT_SUPPORTED_COMPONENTS,
  REPORT_SUPPORTED_HTML_TAGS,
} from '@/products/artifacts/report/contract/reportContract'
import { SLIDE_TEMPLATE_SOURCE } from '@/products/artifacts/slide/templates/slideTemplate'
import {
  SLIDE_SUPPORTED_CHART_TYPES,
  SLIDE_SUPPORTED_COMPONENTS,
  SLIDE_SUPPORTED_HTML_TAGS,
} from '@/products/artifacts/slide/contract/slideContract'

type JsonRecord = Record<string, unknown>
type ArtifactAction = 'get_contract' | 'create' | 'patch' | 'update_full'

export type McpArtifactToolContext = {
  tenantId?: number
}

export type McpArtifactToolExecutionResult = {
  ok: true
  tool: McpArtifactToolName
  result: unknown
}

const ARTIFACT_FORMATS = ['currency', 'number', 'percent', 'integer', 'date', 'datetime', 'text'] as const

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

function normalizeArtifactKind(value: unknown): McpArtifactKind {
  const kind = String(value || '').trim()
  if (kind === 'dashboard' || kind === 'slide' || kind === 'report') return kind
  throw new McpDashboardToolInputError('kind deve ser dashboard, slide ou report', { field: 'kind' })
}

function normalizeAction(value: unknown): ArtifactAction {
  const action = String(value || '').trim()
  if (action === 'get_contract' || action === 'create' || action === 'patch' || action === 'update_full') {
    return action
  }
  throw new McpDashboardToolInputError('action invalida. Use get_contract, create, patch ou update_full.', {
    field: 'action',
  })
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
    type: operationType as 'replace_text' | 'replace_full_source',
    oldString: optionalText(operation.old_string),
    newString: operation.new_string == null ? null : String(operation.new_string),
    replaceAll: Boolean(operation.replace_all),
    source: operation.source == null ? null : String(operation.source),
    changeSummary: optionalText(operation.change_summary),
  }
}

function directRootTag(source: string) {
  return String(source || '').replace(/^[\uFEFF]/, '').trim().match(/^<([A-Z][A-Za-z0-9]*)\b/)?.[1] || null
}

function assertSourceMatchesKind(kind: McpArtifactKind, source: string) {
  const tag = directRootTag(source)
  if (!tag) return
  const allowed = kind === 'dashboard'
    ? ['Dashboard', 'DashboardTemplate']
    : kind === 'report'
      ? ['Report', 'ReportTemplate']
      : ['Slide', 'SlideTemplate']

  if (!allowed.includes(tag)) {
    throw new McpDashboardToolInputError(`source incompativel: kind=${kind} nao aceita root <${tag}>`, {
      kind,
      root: tag,
      allowed,
    })
  }
}

function getPagedArtifactContract(kind: 'report' | 'slide', includeExample: boolean) {
  const isReport = kind === 'report'
  return {
    artifact_type: kind,
    dsl_version: `${kind}.v1`,
    source_path: `app/${kind}.tsx`,
    source_format:
      `TSX declarativo completo exportando um componente default ou comecando diretamente em um root <${isReport ? 'ReportTemplate' : 'SlideTemplate'}>.`,
    authoring_model:
      'Use TSX como DSL declarativa. Nao gere React livre fora dos componentes e HTML suportados.',
    supported_components: [...(isReport ? REPORT_SUPPORTED_COMPONENTS : SLIDE_SUPPORTED_COMPONENTS)],
    supported_html_tags: [...(isReport ? REPORT_SUPPORTED_HTML_TAGS : SLIDE_SUPPORTED_HTML_TAGS)],
    supported_chart_types: [...(isReport ? REPORT_SUPPORTED_CHART_TYPES : SLIDE_SUPPORTED_CHART_TYPES)],
    supported_formats: [...ARTIFACT_FORMATS],
    component_props: {
      [isReport ? 'ReportTemplate' : 'SlideTemplate']: {
        required: ['name', 'title'],
        props: {
          name: 'string estavel, sem espacos',
          title: 'string',
          children: isReport ? 'paginas <Report>' : 'slides <Slide>',
        },
      },
      [isReport ? 'Report' : 'Slide']: {
        required: [],
        props: {
          title: 'string opcional',
          width: 'number opcional em px',
          height: 'number opcional em px',
          children: 'HTML suportado, Card, Chart, Table, PivotTable e Query',
        },
      },
      Chart: {
        required: ['type', 'dataQuery'],
        props: {
          type: isReport ? [...REPORT_SUPPORTED_CHART_TYPES] : [...SLIDE_SUPPORTED_CHART_TYPES],
          dataQuery: 'objeto com query SQL',
          xAxis: "{ dataKey: 'label' }",
          series: "array como [{ dataKey: 'value', label: 'Receita' }]",
          format: ARTIFACT_FORMATS,
        },
      },
      Table: {
        required: ['dataQuery'],
        props: {
          dataQuery: 'objeto com query SQL',
          columns: 'array opcional com key, label, format, align',
        },
      },
      Card: {
        required: [],
        props: {
          children: 'conteudo visual, texto ou componentes de dados',
        },
      },
    },
    data_query_contract: {
      shape: {
        query: 'SQL SELECT/CTE em string.',
        limit: 'number opcional',
      },
      placeholders: ['{{tenant_id}}', '{{de}}', '{{ate}}'],
      aliases: {
        Chart: ['label', 'value'],
        Table: ['aliases estaveis que batem com columns[].key quando columns for usado'],
      },
      rules: [
        'Use SELECT/CTE de leitura; nao use INSERT, UPDATE, DELETE, DDL ou multiplas instrucoes.',
        'Sempre filtre por tenant_id quando consultar tabelas multi-tenant.',
        'Retorne numero bruto para moeda/percentual e use format no componente.',
      ],
    },
    rules: [
      `O root deve ser <${isReport ? 'ReportTemplate' : 'SlideTemplate'}> para multiplas paginas ou <${isReport ? 'Report' : 'Slide'}> para uma pagina unica.`,
      'Nao use imports externos nao suportados pelo preview do workspace.',
      'Nao invente componentes fora de supported_components nem props de dados fora de component_props.',
      'Para edicoes, leia a versao draft atual e use expected_version.',
    ],
    example_source: includeExample ? (isReport ? REPORT_TEMPLATE_SOURCE : SLIDE_TEMPLATE_SOURCE) : null,
  }
}

export function getArtifactContract(kind: McpArtifactKind, includeExample: boolean) {
  if (kind === 'dashboard') return getDashboardContract(includeExample)
  return getPagedArtifactContract(kind, includeExample)
}

async function getExpectedVersion(kind: McpArtifactKind, artifactId: string, explicitVersion: unknown) {
  const expectedVersion = optionalPositiveInt(explicitVersion)
  if (expectedVersion) return expectedVersion
  const current = await readMcpArtifact({ artifactType: kind, artifactId, kind: 'draft' })
  const currentVersion = Number(asRecord(current).current_draft_version || asRecord(current).version)
  if (!Number.isInteger(currentVersion) || currentVersion <= 0) {
    throw new McpDashboardToolInputError('Nao foi possivel identificar a versao draft atual do artifact.', {
      artifact_id: artifactId,
      kind,
    })
  }
  return currentVersion
}

export async function executeMcpArtifactTool(
  toolName: string,
  rawArgs: unknown,
  _context: McpArtifactToolContext = {},
): Promise<McpArtifactToolExecutionResult> {
  if (toolName !== MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring) {
    throw new McpDashboardToolInputError(`Tool MCP desconhecida: ${toolName}`, { toolName })
  }

  const args = asRecord(rawArgs)
  const kind = normalizeArtifactKind(args.kind)
  const action = normalizeAction(args.action)

  if (action === 'get_contract') {
    return {
      ok: true,
      tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring,
      result: {
        ok: true,
        tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring,
        kind,
        action,
        contract: getArtifactContract(kind, Boolean(args.include_example)),
      },
    }
  }

  if (action === 'create') {
    const source = requiredText(args, 'source')
    assertSourceMatchesKind(kind, source)
    const artifact = await createMcpArtifact({
      artifactType: kind,
      title: requiredText(args, 'title'),
      source,
      workspaceId: optionalText(args.workspace_id),
      slug: optionalText(args.slug),
      metadata: asMetadata(args.metadata),
      changeSummary: optionalText(args.change_summary),
    })
    return {
      ok: true,
      tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring,
      result: { ok: true, tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring, kind, action, artifact },
    }
  }

  const artifactId = optionalText(args.id || args.artifact_id)
  if (!artifactId) {
    throw new McpDashboardToolInputError('id e obrigatorio para patch/update_full', { field: 'id' })
  }
  const expectedVersion = await getExpectedVersion(kind, artifactId, args.expected_version)

  if (action === 'patch') {
    const operation = normalizePatchOperation(args.operation)
    if (operation.type === 'replace_full_source' && operation.source) {
      assertSourceMatchesKind(kind, operation.source)
    }
    const artifact = await patchMcpArtifact({
      artifactType: kind,
      artifactId,
      expectedVersion,
      operation,
    })
    return {
      ok: true,
      tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring,
      result: { ok: true, tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring, kind, action, artifact },
    }
  }

  const source = requiredText(args, 'source')
  assertSourceMatchesKind(kind, source)
  const artifact = await updateMcpArtifactFull({
    artifactType: kind,
    artifactId,
    expectedVersion,
    title: optionalText(args.title),
    source,
    slug: optionalText(args.slug),
    metadata: asMetadata(args.metadata),
    changeSummary: optionalText(args.change_summary),
  })
  return {
    ok: true,
    tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring,
    result: { ok: true, tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring, kind, action, artifact },
  }
}
