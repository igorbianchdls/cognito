import { type McpToolInputSchema } from '@/products/mcp/tools/dashboardSchemas'
import { callCognitoMcpTool, type CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'
import { DASHBOARD_WIDGET_RESOURCE_URI } from '@/products/mcp-apps/server/appResources'
import {
  buildArtifactUrl,
  buildDashboardArtifactUrl,
  listMcpDashboards,
  readMcpArtifact,
  readMcpDashboard,
} from '@/products/mcp/adapters/artifactsAdapter'
import { MCP_ARTIFACT_TOOL_NAMES } from '@/products/mcp/shared/toolNames'
import { createDashboardEmbedToken } from '@/products/mcp-apps/server/embedToken'
import {
  callMcpAppDomainTool,
  isMcpAppDomainTool,
  listMcpAppDomainToolDefinitions,
} from '@/products/mcp-apps/server/domainTools'

export const MCP_APP_PUBLIC_TOOL_NAMES = {
  dashboards: 'dashboards',
  openArtifact: 'open_artifact',
  chart: 'chart',
  artifactAuthoring: 'artifact_authoring',
} as const

export const MCP_APP_DASHBOARD_RENDER_TOOL_NAMES = {
  dashboardRenderList: 'dashboard_render_list',
  dashboardRenderPreview: 'dashboard_render_preview',
  dashboardEmbedPreview: 'dashboard_embed_preview',
} as const

export const MCP_APP_CONNECTOR_TOOL_NAMES = {
  search: 'search',
  fetch: 'fetch',
} as const

export type McpAppDashboardRenderToolName =
  (typeof MCP_APP_DASHBOARD_RENDER_TOOL_NAMES)[keyof typeof MCP_APP_DASHBOARD_RENDER_TOOL_NAMES]

type McpAppToolDefinition = {
  name: string
  title: string
  description: string
  inputSchema: McpToolInputSchema
  outputSchema?: McpToolInputSchema
  securitySchemes?: readonly Record<string, unknown>[]
  annotations?: Record<string, unknown>
  _meta?: Record<string, unknown>
}

type JsonRecord = Record<string, unknown>

const DASHBOARDS_SCHEMA = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Texto opcional para buscar dashboards por titulo, slug, status ou id. Omita para listar dashboards recentes.',
    },
    limit: {
      type: 'integer',
      description: 'Quantidade maxima de dashboards retornados. Default 20, maximo 50.',
    },
  },
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const OPEN_ARTIFACT_SCHEMA = {
  type: 'object',
  properties: {
    kind: {
      type: 'string',
      enum: ['dashboard', 'slide', 'report'],
      description: 'Tipo do artifact a abrir.',
    },
    id: {
      type: 'string',
      description: 'ID do artifact retornado por artifact_authoring.',
    },
  },
  required: ['kind', 'id'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const ARTIFACT_AUTHORING_SCHEMA = {
  type: 'object',
  properties: {
    kind: {
      type: 'string',
      enum: ['dashboard', 'slide', 'report'],
      description: 'Tipo de artifact: dashboard, slide ou report.',
    },
    action: {
      type: 'string',
      enum: ['get_contract', 'create', 'patch', 'update_full'],
      description: 'Acao de autoria.',
    },
    id: {
      type: 'string',
      description: 'ID do artifact para patch ou update_full.',
    },
    title: {
      type: 'string',
      description: 'Titulo do artifact ao usar action=create.',
    },
    source: {
      type: 'string',
      description: 'Source TSX completo ao usar create ou update_full.',
    },
    expected_version: {
      type: 'integer',
      description: 'Versao draft esperada para patch/update_full. Opcional; se omitida, usa a versao draft atual.',
    },
    operation: {
      type: 'object',
      description: 'Operacao de patch quando action=patch. Use type=replace_text com old_string/new_string ou type=replace_full_source com source.',
      additionalProperties: true,
    },
    include_example: {
      type: 'boolean',
      description: 'Quando action=get_contract, informe true para incluir exemplo de source TSX.',
    },
    metadata: {
      type: 'object',
      description: 'Metadados opcionais persistidos no artifact.',
      additionalProperties: true,
    },
    change_summary: {
      type: 'string',
      description: 'Resumo curto opcional da mudanca.',
    },
  },
  required: ['kind', 'action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const CHART_SCHEMA = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Titulo principal do grafico.',
    },
    subtitle: {
      type: 'string',
      description: 'Subtitulo opcional, normalmente com periodo, quantidade de registros ou contexto da consulta.',
    },
    total: {
      type: 'object',
      description: 'Valor destacado no topo do card. Se omitido, a UI soma os valores das linhas.',
      properties: {
        label: { type: 'string' },
        value: {
          description: 'Valor total numerico ou texto ja formatado.',
        },
        format: {
          type: 'string',
          enum: ['currency', 'number', 'percent'],
          description: 'Formato preferencial para exibir o total.',
        },
      },
      additionalProperties: true,
    },
    chart: {
      type: 'object',
      description:
        'Configuracao visual. A tool nao executa SQL; envie os dados ja consultados em rows e indique quais campos sao label e valor.',
      properties: {
        type: {
          type: 'string',
          enum: ['donut', 'horizontal_bar', 'bar'],
          description: 'Tipo visual. donut renderiza rosca com barras de composicao ao lado.',
        },
        labelField: {
          type: 'string',
          description: 'Nome do campo de rows usado como rotulo.',
        },
        xField: {
          type: 'string',
          description: 'Alias aceito para labelField.',
        },
        valueField: {
          type: 'string',
          description: 'Nome do campo numerico de rows usado como valor.',
        },
        format: {
          type: 'string',
          enum: ['currency', 'number', 'percent'],
          description: 'Formato dos valores das series.',
        },
      },
      additionalProperties: true,
    },
    rows: {
      type: 'array',
      description: 'Linhas ja calculadas pela consulta ou tool anterior. Cada linha deve conter campo de label e valor.',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  required: ['chart', 'rows'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const RENDER_LIST_SCHEMA = {
  type: 'object',
  properties: {
    dashboards: {
      type: 'array',
      description: 'Dashboards retornados por dashboard_list.',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
    title: {
      type: 'string',
      description: 'Titulo opcional para a lista renderizada.',
    },
  },
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const RENDER_PREVIEW_SCHEMA = {
  type: 'object',
  properties: {
    dashboard: {
      type: 'object',
      description: 'Dashboard retornado por dashboard_read.',
      additionalProperties: true,
    },
    title: {
      type: 'string',
      description: 'Titulo opcional para o preview renderizado.',
    },
  },
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const EMBED_PREVIEW_SCHEMA = {
  type: 'object',
  properties: {
    artifact_id: {
      type: 'string',
      description: 'UUID do dashboard/artifact persistido.',
    },
    title: {
      type: 'string',
      description: 'Titulo opcional para o preview renderizado.',
    },
    kind: {
      type: 'string',
      enum: ['draft', 'published'],
      description: 'Versao logica a ler. Default: draft.',
    },
    version: {
      type: 'integer',
      description: 'Versao numerica especifica. Se omitida, le a mais recente do kind.',
    },
  },
  required: ['artifact_id'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const RENDER_LIST_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    tool: { type: 'string' },
    view: { type: 'string', enum: ['dashboard_list'] },
    title: { type: 'string' },
    dashboards: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  required: ['ok', 'tool', 'view'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const RENDER_PREVIEW_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    tool: { type: 'string' },
    view: { type: 'string', enum: ['dashboard_preview'] },
    title: { type: 'string' },
    dashboard: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['ok', 'tool', 'view'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const CHART_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    tool: { type: 'string' },
    view: { type: 'string', enum: ['chart'] },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    total: {
      type: 'object',
      additionalProperties: true,
    },
    chart: {
      type: 'object',
      additionalProperties: true,
    },
    rows: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  required: ['ok', 'tool', 'view'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const SEARCH_SCHEMA = {
  type: 'object',
  properties: {
    query: {
      type: 'string',
      description: 'Texto para buscar dashboards por titulo, slug ou id.',
    },
  },
  required: ['query'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const SEARCH_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          url: { type: 'string' },
          embed_url: { type: 'string' },
          metadata: {
            type: 'object',
            additionalProperties: true,
          },
        },
        required: ['id', 'title', 'url'],
        additionalProperties: true,
      },
    },
  },
  required: ['results'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const FETCH_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'ID do dashboard retornado pela tool search.',
    },
  },
  required: ['id'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const FETCH_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    title: { type: 'string' },
    text: { type: 'string' },
    url: { type: 'string' },
    embed_url: { type: 'string' },
    metadata: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['id', 'title', 'text', 'url'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const DASHBOARD_LIST_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    dashboards: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true,
      },
    },
  },
  required: ['dashboards'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const DASHBOARD_READ_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    dashboard: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['dashboard'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const DASHBOARD_WRITE_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    dashboard: {
      type: 'object',
      additionalProperties: true,
    },
    result: {
      type: 'object',
      additionalProperties: true,
    },
  },
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const ARTIFACT_AUTHORING_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    tool: { type: 'string' },
    kind: { type: 'string', enum: ['dashboard', 'slide', 'report'] },
    action: { type: 'string' },
    contract: {
      type: 'object',
      additionalProperties: true,
    },
    artifact: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['ok', 'tool', 'kind', 'action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const DASHBOARD_CONTRACT_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    contract: {
      type: 'object',
      additionalProperties: true,
    },
  },
  required: ['contract'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const COGNITO_READ_SECURITY_SCHEMES = [
  {
    type: 'oauth2',
    scopes: ['dashboards:read'],
  },
] as const

const COGNITO_WRITE_SECURITY_SCHEMES = [
  {
    type: 'oauth2',
    scopes: ['dashboards:read', 'dashboards:write'],
  },
] as const

const MODEL_AND_APP_VISIBILITY = {
  visibility: ['model', 'app'],
} as const

const DASHBOARD_WIDGET_META = {
  securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
  ui: {
    resourceUri: DASHBOARD_WIDGET_RESOURCE_URI,
    ...MODEL_AND_APP_VISIBILITY,
  },
} as const

const DATA_TOOL_META = {
  ui: MODEL_AND_APP_VISIBILITY,
} as const

export const MCP_APP_DASHBOARD_RENDER_TOOL_DEFINITIONS = [
  {
    name: MCP_APP_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderList,
    title: 'Render dashboard list',
    description:
      'Renderiza no iframe do MCP App uma lista de dashboards. Use somente depois de dashboard_list.',
    inputSchema: RENDER_LIST_SCHEMA,
    outputSchema: RENDER_LIST_OUTPUT_SCHEMA,
    securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
      idempotentHint: true,
    },
    _meta: DASHBOARD_WIDGET_META,
  },
  {
    name: MCP_APP_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderPreview,
    title: 'Render dashboard preview',
    description:
      'Renderiza no iframe do MCP App o preview/metadados de um dashboard. Use somente depois de dashboard_read.',
    inputSchema: RENDER_PREVIEW_SCHEMA,
    outputSchema: RENDER_PREVIEW_OUTPUT_SCHEMA,
    securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
      idempotentHint: true,
    },
    _meta: DASHBOARD_WIDGET_META,
  },
  {
    name: MCP_APP_DASHBOARD_RENDER_TOOL_NAMES.dashboardEmbedPreview,
    title: 'Embed dashboard preview',
    description:
      'Le um dashboard por artifact_id e renderiza o dashboard completo no iframe do MCP App com embed_url assinado.',
    inputSchema: EMBED_PREVIEW_SCHEMA,
    outputSchema: RENDER_PREVIEW_OUTPUT_SCHEMA,
    securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
      idempotentHint: true,
    },
    _meta: DASHBOARD_WIDGET_META,
  },
] as const satisfies readonly McpAppToolDefinition[]

const MCP_APP_RENDER_TOOL_NAME_SET = new Set<string>(
  Object.values(MCP_APP_DASHBOARD_RENDER_TOOL_NAMES),
)

const MCP_APP_CONNECTOR_TOOL_NAME_SET = new Set<string>(
  Object.values(MCP_APP_CONNECTOR_TOOL_NAMES),
)

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: true,
} as const

const CREATE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
  idempotentHint: false,
} as const

const UPDATE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  openWorldHint: false,
  idempotentHint: false,
} as const

function getDataToolOutputSchema(name: string) {
  switch (name) {
    case 'dashboard_list':
      return DASHBOARD_LIST_OUTPUT_SCHEMA
    case 'dashboard_read':
      return DASHBOARD_READ_OUTPUT_SCHEMA
    case 'dashboard_get_contract':
      return DASHBOARD_CONTRACT_OUTPUT_SCHEMA
    case 'dashboard_create':
    case 'dashboard_patch':
    case 'dashboard_update_full':
      return DASHBOARD_WRITE_OUTPUT_SCHEMA
    default:
      return DASHBOARD_WRITE_OUTPUT_SCHEMA
  }
}

function getDataToolAnnotations(name: string) {
  switch (name) {
    case 'dashboard_list':
    case 'dashboard_read':
    case 'dashboard_get_contract':
      return READ_ONLY_ANNOTATIONS
    case 'dashboard_create':
      return CREATE_ANNOTATIONS
    case 'dashboard_patch':
    case 'dashboard_update_full':
      return UPDATE_ANNOTATIONS
    default:
      return UPDATE_ANNOTATIONS
  }
}

function getDataToolTitle(name: string) {
  switch (name) {
    case 'dashboard_list':
      return 'List dashboards'
    case 'dashboard_read':
      return 'Read dashboard'
    case 'dashboard_get_contract':
      return 'Get dashboard contract'
    case 'dashboard_create':
      return 'Create dashboard'
    case 'dashboard_patch':
      return 'Patch dashboard'
    case 'dashboard_update_full':
      return 'Update dashboard fully'
    default:
      return name
  }
}

function getDataToolSecuritySchemes(name: string) {
  switch (name) {
    case 'dashboard_list':
    case 'dashboard_read':
    case 'dashboard_get_contract':
      return COGNITO_READ_SECURITY_SCHEMES
    default:
      return COGNITO_WRITE_SECURITY_SCHEMES
  }
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function optionalText(value: unknown) {
  const text = String(value ?? '').trim()
  return text || null
}

function isEnvEnabled(name: string) {
  const value = String(process.env[name] || '').trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

function normalizeLimit(value: unknown, fallback: number, max: number) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, max)
}

function getDashboardArtifactId(dashboard: JsonRecord) {
  return optionalText(dashboard.artifact_id || dashboard.id)
}

function buildDashboardEmbedUrl(artifactId: string, version?: unknown) {
  const token = createDashboardEmbedToken(artifactId)
  const baseUrl = buildDashboardArtifactUrl(artifactId)
  const params = new URLSearchParams({
    embed: '1',
    token,
  })
  const versionNumber = Number(version)
  if (Number.isInteger(versionNumber) && versionNumber > 0) {
    params.set('version', String(versionNumber))
  }
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.toString()}`
}

function getArtifactKind(value: unknown) {
  const kind = String(value || '').trim()
  if (kind === 'dashboard' || kind === 'slide' || kind === 'report') return kind
  return null
}

function buildArtifactEmbedUrl(kind: 'dashboard' | 'slide' | 'report', artifactId: string, version?: unknown) {
  const token = createDashboardEmbedToken(artifactId)
  const baseUrl = kind === 'dashboard'
    ? buildDashboardArtifactUrl(artifactId)
    : buildArtifactUrl(kind, artifactId)
  const params = new URLSearchParams({
    embed: '1',
    token,
  })
  const versionNumber = Number(version)
  if (Number.isInteger(versionNumber) && versionNumber > 0) {
    params.set('version', String(versionNumber))
  }
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${params.toString()}`
}

function withDashboardEmbedUrl<T extends JsonRecord>(dashboard: T): T & { embed_url?: string } {
  const artifactId = getDashboardArtifactId(dashboard)
  if (!artifactId) return dashboard
  return {
    ...dashboard,
    embed_url: buildDashboardEmbedUrl(artifactId, dashboard.version || dashboard.current_draft_version),
  }
}

function withArtifactEmbedUrl<T extends JsonRecord>(artifact: T, fallbackKind?: 'dashboard' | 'slide' | 'report'): T & { embed_url?: string } {
  const artifactId = getDashboardArtifactId(artifact)
  const kind = getArtifactKind(artifact.artifact_type || artifact.kind || fallbackKind) || 'dashboard'
  if (!artifactId) return artifact
  return {
    ...artifact,
    embed_url: buildArtifactEmbedUrl(kind, artifactId, artifact.version || artifact.current_draft_version),
  }
}

function withDashboardListEmbedUrl(dashboard: JsonRecord) {
  const artifactId = getDashboardArtifactId(dashboard)
  if (!artifactId) return dashboard
  return {
    ...dashboard,
    embed_url: buildDashboardEmbedUrl(artifactId),
  }
}

function getSearchQuery(args: JsonRecord) {
  return optionalText(args.query || args.q || args.text || args.input) || ''
}

function getFetchId(args: JsonRecord) {
  return optionalText(args.id || args.artifact_id || args.document_id) || ''
}

function dashboardMatchesQuery(dashboard: JsonRecord, query: string) {
  if (!query) return true
  const normalizedQuery = query.toLowerCase()
  return [
    dashboard.id,
    dashboard.title,
    dashboard.slug,
    dashboard.status,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery))
}

function toSearchResult(dashboard: JsonRecord) {
  const id = String(dashboard.id || '')
  return {
    id,
    title: String(dashboard.title || dashboard.slug || dashboard.id || 'Dashboard'),
    url: String(dashboard.url || ''),
    embed_url: id ? buildDashboardEmbedUrl(id) : '',
    metadata: {
      slug: dashboard.slug || null,
      status: dashboard.status || null,
      current_draft_version: dashboard.current_draft_version || null,
      current_published_version: dashboard.current_published_version || null,
      updated_at: dashboard.updated_at || null,
    },
  }
}

async function callDashboards(args: unknown) {
  const input = asRecord(args)
  const query = getSearchQuery(input)
  const limit = normalizeLimit(input.limit, 20, 50)
  const dashboards = await listMcpDashboards({ limit: Math.max(limit, 20) })
  const filteredDashboards = dashboards
    .map((dashboard) => withDashboardListEmbedUrl(dashboard as JsonRecord))
    .filter((dashboard) => dashboardMatchesQuery(dashboard, query))
    .slice(0, limit)

  const structuredContent = {
    ok: true,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.dashboards,
    view: 'dashboard_list',
    title: query ? `Dashboards: ${query}` : 'Dashboards',
    dashboards: filteredDashboards,
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
    structuredContent,
    _meta: {
      widget: DASHBOARD_WIDGET_RESOURCE_URI,
    },
    isError: false,
  }
}

async function callConnectorSearch(args: unknown) {
  const query = getSearchQuery(asRecord(args))
  const dashboards = await listMcpDashboards({ limit: 20 })
  const results = dashboards
    .map((dashboard) => dashboard as JsonRecord)
    .filter((dashboard) => dashboardMatchesQuery(dashboard, query))
    .slice(0, 10)
    .map(toSearchResult)

  const structuredContent = { results }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(structuredContent),
      },
    ],
    structuredContent,
    isError: false,
  }
}

async function callConnectorFetch(args: unknown) {
  const id = getFetchId(asRecord(args))
  if (!id) {
    const structuredContent = {
      id: '',
      title: 'Dashboard nao informado',
      text: 'Informe o id retornado pela busca.',
      url: '',
      metadata: {},
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
      structuredContent,
      isError: true,
    }
  }

  const dashboard = await readMcpDashboard({ artifactId: id, kind: 'draft' })
  const record = dashboard as JsonRecord
  const title = String(record.title || record.slug || record.id || 'Dashboard')
  const url = String(record.url || '')
  const embedUrl = buildDashboardEmbedUrl(id, record.version || record.current_draft_version)
  const source = String(record.source || '')
  const structuredContent = {
    id,
    title,
    text: [
      `Dashboard: ${title}`,
      `ID: ${id}`,
      `URL: ${url}`,
      `Status: ${record.status || 'draft'}`,
      `Draft version: ${record.current_draft_version || record.version || 'unknown'}`,
      '',
      source ? `Source TSX:\n${source}` : 'Source TSX nao disponivel.',
    ].join('\n'),
    url,
    embed_url: embedUrl,
    metadata: {
      slug: record.slug || null,
      status: record.status || null,
      current_draft_version: record.current_draft_version || record.version || null,
      current_published_version: record.current_published_version || null,
    },
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(structuredContent),
      },
    ],
    structuredContent,
    isError: false,
  }
}

function makeRenderResult(toolName: McpAppDashboardRenderToolName, args: unknown) {
  const input = asRecord(args)
  const view = toolName === MCP_APP_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderList
    ? 'dashboard_list'
    : 'dashboard_preview'
  const dashboard = asRecord(input.dashboard)
  const result = {
    ...input,
    ...(view === 'dashboard_preview' && Object.keys(dashboard).length
      ? { dashboard: withDashboardEmbedUrl(dashboard) }
      : {}),
    ok: true,
    tool: toolName,
    view,
  }

  return {
    content: [
      {
        type: 'text',
        text: toolName === MCP_APP_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderList
          ? 'Renderizando lista de dashboards no MCP App.'
          : 'Renderizando preview do dashboard no MCP App.',
      },
    ],
    structuredContent: result,
    _meta: {
      widget: DASHBOARD_WIDGET_RESOURCE_URI,
    },
    isError: false,
  }
}

async function callDashboardEmbedPreview(args: unknown) {
  const input = asRecord(args)
  const artifactId = optionalText(input.artifact_id || input.artifactId || input.id)
  if (!artifactId) {
    const structuredContent = {
      ok: false,
      tool: MCP_APP_DASHBOARD_RENDER_TOOL_NAMES.dashboardEmbedPreview,
      view: 'dashboard_preview',
      title: 'Dashboard nao informado',
      dashboard: null,
    }

    return {
      content: [{ type: 'text', text: 'artifact_id e obrigatorio para renderizar o dashboard.' }],
      structuredContent,
      isError: true,
    }
  }

  const versionNumber = Number(input.version)
  const dashboard = await readMcpDashboard({
    artifactId,
    kind: input.kind === 'published' ? 'published' : 'draft',
    version: Number.isInteger(versionNumber) && versionNumber > 0 ? versionNumber : undefined,
  })
  const dashboardWithEmbed = withDashboardEmbedUrl(dashboard as JsonRecord)
  const title = optionalText(input.title) || String(dashboardWithEmbed.title || dashboardWithEmbed.slug || artifactId)
  const structuredContent = {
    ok: true,
    tool: MCP_APP_DASHBOARD_RENDER_TOOL_NAMES.dashboardEmbedPreview,
    view: 'dashboard_preview',
    title,
    dashboard: dashboardWithEmbed,
  }

  return {
    content: [{ type: 'text', text: `Renderizando dashboard ${title} no MCP App.` }],
    structuredContent,
    _meta: {
      widget: DASHBOARD_WIDGET_RESOURCE_URI,
    },
    isError: false,
  }
}

async function callOpenArtifact(args: unknown) {
  const input = asRecord(args)
  const kind = getArtifactKind(input.kind)
  const id = optionalText(input.id || input.artifact_id)
  if (!kind || !id) {
    const structuredContent = {
      ok: false,
      tool: MCP_APP_PUBLIC_TOOL_NAMES.openArtifact,
      view: 'dashboard_preview',
      title: 'Artifact nao informado',
      dashboard: null,
    }

    return {
      content: [{ type: 'text', text: 'kind e id sao obrigatorios para abrir o artifact.' }],
      structuredContent,
      isError: true,
    }
  }

  const artifact = await readMcpArtifact({ artifactType: kind, artifactId: id, kind: 'draft' })
  const artifactWithEmbed = withArtifactEmbedUrl(artifact as JsonRecord, kind)
  const title = String(artifactWithEmbed.title || artifactWithEmbed.slug || id)
  const structuredContent = {
    ok: true,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.openArtifact,
    view: 'dashboard_preview',
    title,
    dashboard: artifactWithEmbed,
  }

  return {
    content: [{ type: 'text', text: `Abrindo ${kind} ${title}.` }],
    structuredContent,
    _meta: {
      widget: DASHBOARD_WIDGET_RESOURCE_URI,
    },
    isError: false,
  }
}

async function callArtifactAuthoring(args: unknown, context: CognitoMcpServerContext, forcedKind?: 'dashboard' | 'slide' | 'report') {
  const input = asRecord(args)
  const kind = forcedKind || getArtifactKind(input.kind)
  if (!kind) {
    const structuredContent = {
      ok: false,
      tool: MCP_APP_PUBLIC_TOOL_NAMES.artifactAuthoring,
      error: 'kind invalido. Use dashboard, slide ou report.',
    }

    return {
      content: [{ type: 'text', text: structuredContent.error }],
      structuredContent,
      isError: true,
    }
  }

  const commonArgs = {
    ...input,
    kind,
    ...(input.id && !input.artifact_id ? { artifact_id: input.id } : {}),
  }
  const result = await callCognitoMcpTool(MCP_ARTIFACT_TOOL_NAMES.artifactAuthoring, commonArgs, context)
  const resultContent = asRecord(result.structuredContent)
  const artifact = asRecord(resultContent.artifact)
  const structuredContent = {
    ...resultContent,
    ok: true,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.artifactAuthoring,
    ...(Object.keys(artifact).length ? { artifact: withArtifactEmbedUrl(artifact, kind) } : {}),
  }

  return {
    ...result,
    structuredContent,
    content: [{ type: 'text', text: JSON.stringify(structuredContent, null, 2) }],
  }
}

function normalizeChartRows(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is JsonRecord => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
}

function callChart(args: unknown) {
  const input = asRecord(args)
  const rows = normalizeChartRows(input.rows)
  const chart = asRecord(input.chart)
  const total = asRecord(input.total)
  const title = optionalText(input.title) || 'Grafico'
  const subtitle = optionalText(input.subtitle) || `${rows.length} registro${rows.length === 1 ? '' : 's'}`
  const structuredContent = {
    ok: true,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.chart,
    view: 'chart',
    title,
    subtitle,
    ...(Object.keys(total).length ? { total } : {}),
    chart,
    rows,
  }

  return {
    content: [{ type: 'text', text: `Renderizando grafico ${title}.` }],
    structuredContent,
    _meta: {
      widget: DASHBOARD_WIDGET_RESOURCE_URI,
    },
    isError: false,
  }
}

export function listCognitoMcpAppTools() {
  return {
    tools: [
      {
        name: MCP_APP_PUBLIC_TOOL_NAMES.dashboards,
        title: 'Dashboards',
        description:
          'Lista ou busca dashboards Cognito e renderiza cards no app. Use antes de open_artifact quando o usuario nao souber o id.',
        inputSchema: DASHBOARDS_SCHEMA,
        outputSchema: RENDER_LIST_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        annotations: READ_ONLY_ANNOTATIONS,
        _meta: {
          ...DASHBOARD_WIDGET_META,
          securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        },
      },
      {
        name: MCP_APP_PUBLIC_TOOL_NAMES.openArtifact,
        title: 'Open artifact',
        description:
          'Abre um artifact completo no app interativo. Use com kind=dashboard, slide ou report e id retornado por artifact_authoring.',
        inputSchema: OPEN_ARTIFACT_SCHEMA,
        outputSchema: RENDER_PREVIEW_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        annotations: READ_ONLY_ANNOTATIONS,
        _meta: {
          ...DASHBOARD_WIDGET_META,
          securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        },
      },
      {
        name: MCP_APP_PUBLIC_TOOL_NAMES.chart,
        title: 'Chart',
        description:
          'Renderiza um grafico no app interativo usando dados estruturados ja calculados. Nao executa SQL; use depois de uma tool de dados como erp, crm, marketing, ecommerce ou sql.',
        inputSchema: CHART_SCHEMA,
        outputSchema: CHART_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        annotations: READ_ONLY_ANNOTATIONS,
        _meta: {
          ...DASHBOARD_WIDGET_META,
          securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        },
      },
      {
        name: MCP_APP_PUBLIC_TOOL_NAMES.artifactAuthoring,
        title: 'Artifact authoring',
        description:
          'Cria e edita artifacts Cognito usando TSX declarativo versionado. Use kind=dashboard, slide ou report; action=get_contract, create, patch ou update_full.',
        inputSchema: ARTIFACT_AUTHORING_SCHEMA,
        outputSchema: ARTIFACT_AUTHORING_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_WRITE_SECURITY_SCHEMES,
        annotations: UPDATE_ANNOTATIONS,
        _meta: {
          ...DATA_TOOL_META,
          securitySchemes: COGNITO_WRITE_SECURITY_SCHEMES,
        },
      },
      ...listMcpAppDomainToolDefinitions(),
    ],
  }
}

function normalizeDataToolStructuredContent(name: string, structuredContent: unknown) {
  switch (name) {
    case 'dashboard_list':
      return {
        dashboards: Array.isArray(structuredContent)
          ? structuredContent.map((dashboard) => withDashboardListEmbedUrl(asRecord(dashboard)))
          : [],
      }
    case 'dashboard_read':
      return {
        dashboard: withDashboardEmbedUrl(asRecord(structuredContent)),
      }
    case 'dashboard_get_contract':
      return {
        contract: structuredContent,
      }
    case 'dashboard_create':
    case 'dashboard_patch':
    case 'dashboard_update_full':
      return {
        dashboard: withDashboardEmbedUrl(asRecord(structuredContent)),
        result: withDashboardEmbedUrl(asRecord(structuredContent)),
      }
    default:
      return {
        result: structuredContent,
      }
  }
}

export async function callCognitoMcpAppTool(
  name: string,
  args: unknown,
  context: CognitoMcpServerContext = {},
) {
  if (name === MCP_APP_PUBLIC_TOOL_NAMES.dashboards) {
    return callDashboards(args)
  }

  if (name === MCP_APP_PUBLIC_TOOL_NAMES.openArtifact) {
    return callOpenArtifact(args)
  }

  if (name === MCP_APP_PUBLIC_TOOL_NAMES.chart) {
    return callChart(args)
  }

  if (name === MCP_APP_PUBLIC_TOOL_NAMES.artifactAuthoring) {
    return callArtifactAuthoring(args, context)
  }

  if (isMcpAppDomainTool(name)) {
    return callMcpAppDomainTool(name, args, context)
  }

  if (MCP_APP_CONNECTOR_TOOL_NAME_SET.has(name)) {
    if (name === MCP_APP_CONNECTOR_TOOL_NAMES.search) return callConnectorSearch(args)
    return callConnectorFetch(args)
  }

  if (MCP_APP_RENDER_TOOL_NAME_SET.has(name)) {
    if (name === MCP_APP_DASHBOARD_RENDER_TOOL_NAMES.dashboardEmbedPreview) {
      return callDashboardEmbedPreview(args)
    }
    return makeRenderResult(name as McpAppDashboardRenderToolName, args)
  }

  const result = await callCognitoMcpTool(name, args, context)
  const structuredContent = normalizeDataToolStructuredContent(name, result.structuredContent)

  return {
    ...result,
    structuredContent,
    content: [
      {
        type: 'text',
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
  }
}
