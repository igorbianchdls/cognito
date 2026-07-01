import {
  createMcpArtifact,
  patchMcpArtifact,
  previewMcpDashboardQuery,
  readMcpArtifact,
  updateMcpArtifactFull,
  type McpArtifactKind,
  type McpJsonMap,
} from '@/products/mcp/adapters/artifactsAdapter'
import { MCP_ARTIFACT_TOOL_NAMES, type McpArtifactToolName } from '@/products/mcp/shared/toolNames'
import { getDashboardContract, McpDashboardToolInputError } from '@/products/mcp/tools/dashboardTools'
import {
  DOCUMENT_SUPPORTED_HTML_TAGS,
  DOCUMENT_SPECIAL_COMPONENTS,
  REPORT_DSL_VERSION,
  SLIDE_DSL_VERSION,
} from '@/products/artifacts/document/language/documentLanguageManifest'

type JsonRecord = Record<string, unknown>
type ArtifactAction = 'get_contract' | 'create' | 'patch' | 'update_full' | 'query_preview'

export type McpArtifactToolContext = {
  tenantId?: number
}

export type McpArtifactToolExecutionResult = {
  ok: true
  tool: McpArtifactToolName
  result: unknown
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

function normalizeArtifactKind(value: unknown): McpArtifactKind {
  const kind = String(value || '').trim()
  if (kind === 'dashboard' || kind === 'report' || kind === 'slide') return kind
  throw new McpDashboardToolInputError('kind deve ser dashboard, report ou slide', { field: 'kind' })
}

function normalizeAction(value: unknown): ArtifactAction {
  const action = String(value || '').trim()
  if (
    action === 'get_contract'
    || action === 'create'
    || action === 'patch'
    || action === 'update_full'
    || action === 'query_preview'
  ) {
    return action
  }
  throw new McpDashboardToolInputError('action invalida. Use get_contract, create, patch, update_full ou query_preview.', {
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
  const allowedByKind: Record<McpArtifactKind, string[]> = {
    dashboard: ['Dashboard', 'DashboardTemplate'],
    report: ['Report'],
    slide: ['Deck'],
  }
  const allowed = allowedByKind[kind]

  if (!allowed.includes(tag)) {
    throw new McpDashboardToolInputError(`source incompativel: kind=${kind} nao aceita root <${tag}>`, {
      kind,
      root: tag,
      allowed,
    })
  }
}

const REPORT_VALID_EXAMPLE = `<Report title="Relatorio Comercial - Junho 2026" size="a4">
  <page>
    <section style={{ padding: 48 }}>
      <p style={{ fontSize: 13, color: '#64748b' }}>Resumo executivo</p>
      <h1 style={{ fontSize: 34, margin: 0 }}>Vendas cresceram, mas margem pressionou</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 24 }}>
        <div style={{ border: '1px solid #e5e7eb', padding: 20 }}>
          <p>Receita</p>
          <h2>R$ 1,24M</h2>
        </div>
      </div>

      <Chart type="bar" title="Receita por canal" />
    </section>
  </page>
</Report>`

const SLIDE_VALID_EXAMPLE = `<Deck title="Plano Comercial Q3" size="16:9">
  <slide>
    <section style={{ padding: 64, background: '#111827', color: 'white' }}>
      <p style={{ color: '#93c5fd' }}>Board update</p>
      <h1 style={{ fontSize: 56, margin: 0 }}>Plano Comercial Q3</h1>
      <p style={{ fontSize: 22 }}>Crescimento com eficiencia de margem</p>
    </section>
  </slide>
</Deck>`

function getHtmlLikeArtifactContract(kind: Extract<McpArtifactKind, 'report' | 'slide'>, includeExample: boolean) {
  const isReport = kind === 'report'
  return {
    artifact_type: kind,
    dsl_version: isReport ? REPORT_DSL_VERSION : SLIDE_DSL_VERSION,
    source_path: isReport ? 'app/report.tsx' : 'app/deck.tsx',
    source_format:
      `TSX declarativo HTML-like completo com root <${isReport ? 'Report' : 'Deck'}>. Use HTML comum sempre que possivel.`,
    authoring_model:
      'Modelo proximo do Paper: poucos componentes proprios, tags HTML controladas e style inline para layout visual. Nao gere React livre.',
    root: isReport ? 'Report' : 'Deck',
    unit_tag: isReport ? 'page' : 'slide',
    supported_html_tags: [...DOCUMENT_SUPPORTED_HTML_TAGS],
    supported_special_components: [...DOCUMENT_SPECIAL_COMPONENTS],
    rules: [
      'Prefira tags HTML comuns como div, section, p, h1, ul, table e img.',
      'Use style inline para layout, espacamento, cor, tipografia e grids.',
      'Nao invente componentes semanticos como Metric, Insight, Columns ou Bullet.',
      'Use Chart ou DataTable somente quando precisar representar dados/visualizacao.',
      `O root deve ser <${isReport ? 'Report' : 'Deck'}>.`,
      `Use <${isReport ? 'page' : 'slide'}> para cada ${isReport ? 'pagina' : 'slide'}.`,
      'Antes de editar artifact existente, use artifact_authoring com action=patch ou update_full.',
    ],
    create_flow: [
      `Chame artifact_authoring com kind=${kind} e action=get_contract se precisar relembrar o formato.`,
      'Gere source TSX HTML-like.',
      `Chame artifact_authoring com kind=${kind}, action=create, title e source.`,
      'Retorne artifact_id, version e url ao usuario.',
    ],
    example_source: includeExample ? (isReport ? REPORT_VALID_EXAMPLE : SLIDE_VALID_EXAMPLE) : null,
  }
}

export function getArtifactContract(kind: McpArtifactKind, includeExample: boolean) {
  if (kind === 'dashboard') return getDashboardContract(includeExample)
  return getHtmlLikeArtifactContract(kind, includeExample)
}

async function getExpectedVersion(
  kind: McpArtifactKind,
  artifactId: string,
  explicitVersion: unknown,
  tenantId: number,
) {
  const expectedVersion = optionalPositiveInt(explicitVersion)
  if (expectedVersion) return expectedVersion
  const current = await readMcpArtifact({ artifactType: kind, artifactId, tenantId, kind: 'draft' })
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
  context: McpArtifactToolContext = {},
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

  if (!context.tenantId) {
    throw new McpDashboardToolInputError('tenant autenticado e obrigatorio para operar artifacts')
  }

  if (action === 'query_preview') {
    if (kind !== 'dashboard') {
      throw new McpDashboardToolInputError('query_preview esta disponivel apenas para kind=dashboard', {
        kind,
        action,
      })
    }
    const artifactId = optionalText(args.id || args.artifact_id)
    if (!artifactId) throw new McpDashboardToolInputError('id e obrigatorio para query_preview', { field: 'id' })
    const componentId = requiredText(args, 'component_id')
    const preview = await previewMcpDashboardQuery({
      tenantId: context.tenantId,
      artifactId,
      componentId,
      sampleLimit: optionalPositiveInt(args.sample_limit),
      includeProfile: args.include_profile !== false,
    })
    return {
      ok: true,
      tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring,
      result: { ok: true, tool: MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring, kind, action, preview },
    }
  }

  if (action === 'create') {
    const source = requiredText(args, 'source')
    assertSourceMatchesKind(kind, source)
    const artifact = await createMcpArtifact({
      artifactType: kind,
      tenantId: context.tenantId,
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
  const expectedVersion = await getExpectedVersion(kind, artifactId, args.expected_version, context.tenantId)

  if (action === 'patch') {
    const operation = normalizePatchOperation(args.operation)
    if (operation.type === 'replace_full_source' && operation.source) {
      assertSourceMatchesKind(kind, operation.source)
    }
    const artifact = await patchMcpArtifact({
      artifactType: kind,
      tenantId: context.tenantId,
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
    tenantId: context.tenantId,
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
