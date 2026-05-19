import { type McpToolInputSchema } from '@/products/mcp/tools/dashboardSchemas'
import { runQuery } from '@/lib/postgres'
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
  analysis: 'analysis',
  table: 'table',
  actions: 'actions',
  alerts: 'alerts',
  schedules: 'schedules',
  connectors: 'connectors',
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

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['insights', 'comparison', 'anomalies', 'forecast', 'funnel', 'executive_summary'],
      description: 'Tipo de analise visual a renderizar.',
    },
    title: { type: 'string', description: 'Titulo principal da analise.' },
    subtitle: { type: 'string', description: 'Contexto curto, como periodo ou fonte dos dados.' },
    summary: { type: 'string', description: 'Resumo executivo em uma ou duas frases.' },
    metrics: {
      type: 'array',
      description: 'Metricas destacadas no topo.',
      items: { type: 'object', additionalProperties: true },
    },
    sections: {
      type: 'array',
      description: 'Achados, riscos, oportunidades, comparacoes ou recomendacoes estruturadas.',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
          title: { type: 'string' },
          evidence: { type: 'string' },
          recommendation: { type: 'string' },
          impact_value: {},
        },
        additionalProperties: true,
      },
    },
    next_steps: {
      type: 'array',
      description: 'Proximos passos objetivos.',
      items: { type: 'string' },
    },
  },
  required: ['title'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const TABLE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Titulo da tabela.' },
    subtitle: { type: 'string', description: 'Subtitulo opcional.' },
    columns: {
      type: 'array',
      description: 'Colunas customizadas. Aceita strings ou objetos { key, label, format }.',
      items: { additionalProperties: true },
    },
    rows: {
      type: 'array',
      description: 'Linhas ja calculadas pelo agente/tool anterior.',
      items: { type: 'object', additionalProperties: true },
    },
  },
  required: ['rows'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const ACTIONS_SCHEMA = {
  type: 'object',
  properties: {
    domain: {
      type: 'string',
      enum: ['erp', 'crm', 'marketing', 'ecommerce'],
      description: 'Dominio da acao.',
    },
    action: {
      type: 'string',
      description: 'Acao permitida no dominio. ERP aceita criar, atualizar, baixar, cancelar, estornar e reabrir.',
    },
    target: {
      type: 'object',
      description: 'Alvo da acao, como { resource, id }.',
      additionalProperties: true,
    },
    payload: {
      type: 'object',
      description: 'Dados da acao.',
      additionalProperties: true,
    },
    dry_run: {
      type: 'boolean',
      description: 'Default true. Quando true, retorna preview sem executar.',
    },
    idempotency_key: { type: 'string' },
  },
  required: ['domain', 'action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const AUTOMATION_ACTION_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['list', 'create', 'update', 'pause', 'resume', 'delete', 'test', 'run_now'],
      description: 'Acao sobre alerta ou agendamento.',
    },
    id: { type: 'integer', description: 'ID para update, pause, resume, delete, test ou run_now.' },
    title: { type: 'string' },
    status: { type: 'string' },
    frequency: { type: 'string', enum: ['hourly', 'daily', 'weekly', 'monthly'] },
    channels: { type: 'array', items: { type: 'string' } },
    metadata: { type: 'object', additionalProperties: true },
    limit: { type: 'integer' },
  },
  required: ['action'],
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const ALERTS_SCHEMA = {
  ...AUTOMATION_ACTION_SCHEMA,
  properties: {
    ...AUTOMATION_ACTION_SCHEMA.properties,
    condition: {
      type: 'object',
      description: 'Condicao estruturada do alerta.',
      additionalProperties: true,
    },
  },
} as const satisfies McpToolInputSchema

const SCHEDULES_SCHEMA = {
  ...AUTOMATION_ACTION_SCHEMA,
  properties: {
    ...AUTOMATION_ACTION_SCHEMA.properties,
    artifact_kind: {
      type: 'string',
      enum: ['dashboard', 'slide', 'report'],
      description: 'Tipo de artifact a gerar quando aplicavel.',
    },
    prompt: { type: 'string', description: 'Prompt recorrente que sera executado pelo orquestrador.' },
    day_of_week: { type: 'string' },
    time: { type: 'string', description: 'Horario HH:mm.' },
  },
} as const satisfies McpToolInputSchema

const CONNECTORS_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['list', 'listar', 'mostrar', 'quais', 'status', 'test_connection', 'sync_now', 'reconnect_url'],
      description:
        'Acao operacional de conectores. Use list/status para mostrar integracoes; test_connection para teste estrutural; sync_now para preview de sincronizacao; reconnect_url para orientar reconexao.',
    },
    domain: {
      type: 'string',
      enum: ['erp', 'crm', 'marketing', 'ecommerce'],
      description: 'Filtro opcional por dominio.',
    },
    plataforma: {
      type: 'string',
      description: 'Filtro opcional por plataforma, como shopify, shopee, amazon, mercadolivre, meta_ads ou google_ads.',
    },
    connector_id: {
      type: 'string',
      description: 'ID logico retornado pela listagem, como ecommerce:12 ou marketing:3.',
    },
    dry_run: {
      type: 'boolean',
      description: 'Default true para acoes operacionais. No v1, sync_now e test_connection nao chamam APIs externas.',
    },
    limit: { type: 'integer' },
  },
  additionalProperties: true,
} as const satisfies McpToolInputSchema

const GENERIC_APP_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    tool: { type: 'string' },
    view: { type: 'string' },
    title: { type: 'string' },
    subtitle: { type: 'string' },
    rows: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
    },
    columns: {
      type: 'array',
      items: { type: 'string' },
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

function getTenantId(context: CognitoMcpServerContext) {
  return context.tenantId && context.tenantId > 0 ? context.tenantId : 1
}

function getPositiveId(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || '').trim()).filter(Boolean)
}

function inferRowsColumns(rows: JsonRecord[]) {
  if (!rows.length) return []
  return Object.keys(rows[0] || {})
}

function normalizeTableColumns(columns: unknown, rows: JsonRecord[]) {
  if (Array.isArray(columns) && columns.length) {
    return columns
      .map((column) => {
        if (typeof column === 'string') return { key: column, label: column }
        const record = asRecord(column)
        const key = optionalText(record.key || record.field || record.name)
        if (!key) return null
        return {
          ...record,
          key,
          label: optionalText(record.label) || key,
        }
      })
      .filter(Boolean) as JsonRecord[]
  }
  return inferRowsColumns(rows).map((key) => ({ key, label: key }))
}

function makeWidgetResult(structuredContent: JsonRecord, text: string, isError = false) {
  return {
    content: [{ type: 'text', text }],
    structuredContent,
    _meta: {
      widget: DASHBOARD_WIDGET_RESOURCE_URI,
    },
    isError,
  }
}

function callAnalysis(args: unknown) {
  const input = asRecord(args)
  const type = optionalText(input.type) || 'insights'
  const title = optionalText(input.title) || 'Analise'
  const sections = normalizeChartRows(input.sections)
  const metrics = normalizeChartRows(input.metrics)
  const nextSteps = normalizeStringArray(input.next_steps || input.nextSteps)
  const structuredContent = {
    ok: true,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.analysis,
    view: 'analysis',
    type,
    title,
    subtitle: optionalText(input.subtitle),
    summary: optionalText(input.summary),
    metrics,
    sections,
    next_steps: nextSteps,
  }

  return makeWidgetResult(structuredContent, `Renderizando analise ${title}.`)
}

function callTable(args: unknown) {
  const input = asRecord(args)
  const rows = normalizeChartRows(input.rows)
  const columns = normalizeTableColumns(input.columns, rows)
  const title = optionalText(input.title) || 'Tabela'
  const structuredContent = {
    ok: true,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.table,
    view: 'table',
    title,
    subtitle: optionalText(input.subtitle) || `${rows.length} registro${rows.length === 1 ? '' : 's'}`,
    columns,
    rows,
    count: rows.length,
  }

  return makeWidgetResult(structuredContent, `Renderizando tabela ${title}.`)
}

function normalizeActionDomain(value: unknown) {
  const domain = String(value || '').trim().toLowerCase()
  if (domain === 'erp' || domain === 'crm' || domain === 'marketing' || domain === 'ecommerce') return domain
  throw new Error('domain invalido para actions. Use erp, crm, marketing ou ecommerce.')
}

async function callActions(args: unknown, context: CognitoMcpServerContext) {
  const input = asRecord(args)
  const domain = normalizeActionDomain(input.domain)
  const action = optionalText(input.action)
  if (!action) throw new Error('action e obrigatoria para actions')

  const target = asRecord(input.target)
  const payload = asRecord(input.payload)
  const dryRun = input.dry_run !== false
  const resource = optionalText(target.resource || payload.resource)
  const id = getPositiveId(target.id || input.id)
  const title = `${domain.toUpperCase()} - ${action}`
  const preview = {
    domain,
    action,
    target,
    payload,
    dry_run: dryRun,
    risk_level: domain === 'marketing' || action.includes('cancel') || action.includes('pause') ? 'high' : 'medium',
    affected_records: id ? 1 : 0,
    confirmation_required: true,
    idempotency_key: optionalText(input.idempotency_key),
  }

  if (!dryRun && domain === 'erp') {
    if (!resource) throw new Error('target.resource e obrigatorio para executar action ERP')
    const erpResult = await callMcpAppDomainTool('erp_acoes', {
      resource,
      action,
      id: id || undefined,
      payload,
      dry_run: false,
      idempotency_key: input.idempotency_key,
    }, context)
    const structuredContent = {
      ok: !erpResult.isError,
      tool: MCP_APP_PUBLIC_TOOL_NAMES.actions,
      view: 'action_result',
      title,
      subtitle: erpResult.isError ? 'Acao nao executada' : 'Acao executada',
      domain,
      action,
      dry_run: false,
      preview,
      result: erpResult.structuredContent,
      rows: [{
        dominio: domain,
        acao: action,
        status: erpResult.isError ? 'erro' : 'executado',
        recurso: resource,
        id: id || null,
      }],
    }
    return makeWidgetResult(structuredContent, JSON.stringify(structuredContent, null, 2), Boolean(erpResult.isError))
  }

  const executable = dryRun
    ? 'preview'
    : 'execucao_real_nao_suportada_no_v1'
  const structuredContent = {
    ok: dryRun,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.actions,
    view: 'action_result',
    title,
    subtitle: dryRun
      ? 'Preview gerado. Nenhuma alteracao foi executada.'
      : 'Execucao real disponivel apenas para ERP no v1.',
    domain,
    action,
    dry_run: dryRun,
    preview,
    result: {
      status: executable,
      message: dryRun
        ? 'Revise o preview e confirme explicitamente antes de executar.'
        : 'Use dry_run=true para preview ou implemente o handler real deste dominio.',
    },
    rows: [{
      dominio: domain,
      acao: action,
      status: executable,
      recurso: resource || null,
      id: id || null,
    }],
  }
  return makeWidgetResult(structuredContent, JSON.stringify(structuredContent, null, 2), !dryRun)
}

function normalizeAutomationAction(value: unknown) {
  const action = String(value || 'list').trim().toLowerCase()
  if (action === 'listar' || action === 'mostrar' || action === 'quais') return 'list'
  if (
    action === 'list' ||
    action === 'create' ||
    action === 'update' ||
    action === 'pause' ||
    action === 'resume' ||
    action === 'delete' ||
    action === 'test' ||
    action === 'run_now'
  ) {
    return action
  }
  throw new Error('action invalida. Use list, create, update, pause, resume, delete, test ou run_now.')
}

function normalizeAutomationFrequency(value: unknown, fallback = 'daily') {
  const frequency = String(value || fallback).trim().toLowerCase()
  if (frequency === 'hourly' || frequency === 'daily' || frequency === 'weekly' || frequency === 'monthly') return frequency
  return fallback
}

function normalizeAutomationStatus(value: unknown, fallback = 'active') {
  const status = String(value || fallback).trim().toLowerCase()
  if (status === 'active' || status === 'paused' || status === 'deleted') return status
  return fallback
}

function getAutomationTitle(input: JsonRecord, fallback: string) {
  return optionalText(input.title) || fallback
}

function buildAutomationSummary(rows: JsonRecord[]) {
  const active = rows.filter((row) => row.status === 'active').length
  const paused = rows.filter((row) => row.status === 'paused').length
  const nextRunAt = rows
    .map((row) => optionalText(row.next_run_at))
    .filter((value): value is string => Boolean(value))
    .sort()[0] || null

  return {
    total: rows.length,
    active,
    paused,
    next_run_at: nextRunAt,
  }
}

function buildAutomationListResult(input: {
  tool: string
  kind: 'alerts' | 'schedules'
  action: string
  title: string
  emptyTitle: string
  rows: JsonRecord[]
}) {
  const summary = buildAutomationSummary(input.rows)
  return {
    ok: true,
    tool: input.tool,
    view: 'automation_list',
    kind: input.kind,
    action: input.action,
    title: input.title,
    subtitle: input.rows.length
      ? `${summary.total} registro${summary.total === 1 ? '' : 's'} · ${summary.active} ativo${summary.active === 1 ? '' : 's'} · ${summary.paused} pausado${summary.paused === 1 ? '' : 's'}`
      : input.emptyTitle,
    summary,
    rows: input.rows,
    columns: inferRowsColumns(input.rows),
    count: input.rows.length,
  }
}

async function listAutomationRows(table: 'alerts' | 'schedules', tenantId: number, input: JsonRecord) {
  const limit = normalizeLimit(input.limit, 20, 100)
  const rows = await runQuery<JsonRecord>(
    `
SELECT
  id::int,
  title,
  status,
  ${table === 'alerts' ? 'condition_json AS condition,' : "artifact_kind, prompt, day_of_week, time_of_day AS time,"}
  frequency,
  channels_json AS channels,
  last_run_at,
  next_run_at,
  metadata_json AS metadata,
  created_at,
  updated_at
FROM mcp_app.${table}
WHERE tenant_id = $1::int AND status <> 'deleted'
ORDER BY updated_at DESC
LIMIT $2::int
    `.trim(),
    [tenantId, limit],
  )
  return rows
}

async function callAlerts(args: unknown, context: CognitoMcpServerContext) {
  const input = asRecord(args)
  const action = normalizeAutomationAction(input.action)
  const tenantId = getTenantId(context)
  let rows: JsonRecord[] = []
  let title = 'Alertas'

  if (action === 'create') {
    const created = await runQuery<JsonRecord>(
      `
INSERT INTO mcp_app.alerts
  (tenant_id, title, status, condition_json, frequency, channels_json, metadata_json, updated_at)
VALUES ($1::int, $2::text, 'active', $3::jsonb, $4::text, $5::jsonb, $6::jsonb, now())
RETURNING id::int, title, status, condition_json AS condition, frequency, channels_json AS channels, last_run_at, next_run_at, metadata_json AS metadata, created_at, updated_at
      `.trim(),
      [
        tenantId,
        getAutomationTitle(input, 'Novo alerta'),
        JSON.stringify(asRecord(input.condition)),
        normalizeAutomationFrequency(input.frequency),
        JSON.stringify(normalizeStringArray(input.channels)),
        JSON.stringify(asRecord(input.metadata)),
      ],
    )
    rows = created
    title = 'Alerta criado'
  } else if (action === 'update') {
    const id = getPositiveId(input.id)
    if (!id) throw new Error('id e obrigatorio para atualizar alerta')
    const updated = await runQuery<JsonRecord>(
      `
UPDATE mcp_app.alerts
SET
  title = COALESCE($3::text, title),
  status = COALESCE($4::text, status),
  condition_json = COALESCE($5::jsonb, condition_json),
  frequency = COALESCE($6::text, frequency),
  channels_json = COALESCE($7::jsonb, channels_json),
  metadata_json = COALESCE($8::jsonb, metadata_json),
  updated_at = now()
WHERE tenant_id = $1::int AND id = $2::bigint
RETURNING id::int, title, status, condition_json AS condition, frequency, channels_json AS channels, last_run_at, next_run_at, metadata_json AS metadata, created_at, updated_at
      `.trim(),
      [
        tenantId,
        id,
        optionalText(input.title),
        input.status ? normalizeAutomationStatus(input.status) : null,
        input.condition ? JSON.stringify(asRecord(input.condition)) : null,
        input.frequency ? normalizeAutomationFrequency(input.frequency) : null,
        input.channels ? JSON.stringify(normalizeStringArray(input.channels)) : null,
        input.metadata ? JSON.stringify(asRecord(input.metadata)) : null,
      ],
    )
    rows = updated
    title = 'Alerta atualizado'
  } else if (action === 'pause' || action === 'resume' || action === 'delete') {
    const id = getPositiveId(input.id)
    if (!id) throw new Error('id e obrigatorio para alterar alerta')
    const status = action === 'resume' ? 'active' : action === 'pause' ? 'paused' : 'deleted'
    rows = await runQuery<JsonRecord>(
      `
UPDATE mcp_app.alerts
SET status = $3::text, updated_at = now()
WHERE tenant_id = $1::int AND id = $2::bigint
RETURNING id::int, title, status, condition_json AS condition, frequency, channels_json AS channels, last_run_at, next_run_at, metadata_json AS metadata, created_at, updated_at
      `.trim(),
      [tenantId, id, status],
    )
    title = action === 'delete' ? 'Alerta removido' : action === 'pause' ? 'Alerta pausado' : 'Alerta ativado'
  } else if (action === 'test') {
    const id = getPositiveId(input.id)
    if (!id) throw new Error('id e obrigatorio para testar alerta')
    rows = await runQuery<JsonRecord>(
      `
SELECT id::int, title, status, condition_json AS condition, frequency, channels_json AS channels, true AS test_ok, 'Teste estrutural executado; avaliador recorrente sera responsavel pela condicao real.' AS test_result
FROM mcp_app.alerts
WHERE tenant_id = $1::int AND id = $2::bigint
      `.trim(),
      [tenantId, id],
    )
    title = 'Teste de alerta'
  } else {
    rows = await listAutomationRows('alerts', tenantId, input)
  }

  if (action === 'list') {
    const structuredContent = buildAutomationListResult({
      tool: MCP_APP_PUBLIC_TOOL_NAMES.alerts,
      kind: 'alerts',
      action,
      title: 'Alertas',
      emptyTitle: 'Nenhum alerta criado.',
      rows,
    })
    return makeWidgetResult(structuredContent, JSON.stringify(structuredContent, null, 2))
  }

  const structuredContent = {
    ok: true,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.alerts,
    view: 'automation',
    kind: 'alerts',
    action,
    title,
    subtitle: `${rows.length} registro${rows.length === 1 ? '' : 's'}`,
    rows,
    columns: inferRowsColumns(rows),
    count: rows.length,
  }
  return makeWidgetResult(structuredContent, JSON.stringify(structuredContent, null, 2))
}

async function callSchedules(args: unknown, context: CognitoMcpServerContext) {
  const input = asRecord(args)
  const action = normalizeAutomationAction(input.action)
  const tenantId = getTenantId(context)
  let rows: JsonRecord[] = []
  let title = 'Agendamentos'

  if (action === 'create') {
    const prompt = optionalText(input.prompt)
    if (!prompt) throw new Error('prompt e obrigatorio para criar agendamento')
    rows = await runQuery<JsonRecord>(
      `
INSERT INTO mcp_app.schedules
  (tenant_id, title, status, artifact_kind, prompt, frequency, day_of_week, time_of_day, channels_json, metadata_json, updated_at)
VALUES ($1::int, $2::text, 'active', $3::text, $4::text, $5::text, $6::text, $7::text, $8::jsonb, $9::jsonb, now())
RETURNING id::int, title, status, artifact_kind, prompt, frequency, day_of_week, time_of_day AS time, channels_json AS channels, last_run_at, next_run_at, metadata_json AS metadata, created_at, updated_at
      `.trim(),
      [
        tenantId,
        getAutomationTitle(input, 'Novo agendamento'),
        optionalText(input.artifact_kind),
        prompt,
        normalizeAutomationFrequency(input.frequency, 'weekly'),
        optionalText(input.day_of_week),
        optionalText(input.time || input.time_of_day),
        JSON.stringify(normalizeStringArray(input.channels)),
        JSON.stringify(asRecord(input.metadata)),
      ],
    )
    title = 'Agendamento criado'
  } else if (action === 'update') {
    const id = getPositiveId(input.id)
    if (!id) throw new Error('id e obrigatorio para atualizar agendamento')
    rows = await runQuery<JsonRecord>(
      `
UPDATE mcp_app.schedules
SET
  title = COALESCE($3::text, title),
  status = COALESCE($4::text, status),
  artifact_kind = COALESCE($5::text, artifact_kind),
  prompt = COALESCE($6::text, prompt),
  frequency = COALESCE($7::text, frequency),
  day_of_week = COALESCE($8::text, day_of_week),
  time_of_day = COALESCE($9::text, time_of_day),
  channels_json = COALESCE($10::jsonb, channels_json),
  metadata_json = COALESCE($11::jsonb, metadata_json),
  updated_at = now()
WHERE tenant_id = $1::int AND id = $2::bigint
RETURNING id::int, title, status, artifact_kind, prompt, frequency, day_of_week, time_of_day AS time, channels_json AS channels, last_run_at, next_run_at, metadata_json AS metadata, created_at, updated_at
      `.trim(),
      [
        tenantId,
        id,
        optionalText(input.title),
        input.status ? normalizeAutomationStatus(input.status) : null,
        optionalText(input.artifact_kind),
        optionalText(input.prompt),
        input.frequency ? normalizeAutomationFrequency(input.frequency, 'weekly') : null,
        optionalText(input.day_of_week),
        optionalText(input.time || input.time_of_day),
        input.channels ? JSON.stringify(normalizeStringArray(input.channels)) : null,
        input.metadata ? JSON.stringify(asRecord(input.metadata)) : null,
      ],
    )
    title = 'Agendamento atualizado'
  } else if (action === 'pause' || action === 'resume' || action === 'delete') {
    const id = getPositiveId(input.id)
    if (!id) throw new Error('id e obrigatorio para alterar agendamento')
    const status = action === 'resume' ? 'active' : action === 'pause' ? 'paused' : 'deleted'
    rows = await runQuery<JsonRecord>(
      `
UPDATE mcp_app.schedules
SET status = $3::text, updated_at = now()
WHERE tenant_id = $1::int AND id = $2::bigint
RETURNING id::int, title, status, artifact_kind, prompt, frequency, day_of_week, time_of_day AS time, channels_json AS channels, last_run_at, next_run_at, metadata_json AS metadata, created_at, updated_at
      `.trim(),
      [tenantId, id, status],
    )
    title = action === 'delete' ? 'Agendamento removido' : action === 'pause' ? 'Agendamento pausado' : 'Agendamento ativado'
  } else if (action === 'run_now') {
    const id = getPositiveId(input.id)
    if (!id) throw new Error('id e obrigatorio para executar agendamento')
    rows = await runQuery<JsonRecord>(
      `
UPDATE mcp_app.schedules
SET last_run_at = now(), updated_at = now()
WHERE tenant_id = $1::int AND id = $2::bigint
RETURNING id::int, title, status, artifact_kind, prompt, frequency, day_of_week, time_of_day AS time, channels_json AS channels, last_run_at, next_run_at, metadata_json AS metadata, created_at, updated_at
      `.trim(),
      [tenantId, id],
    )
    title = 'Agendamento executado'
  } else {
    rows = await listAutomationRows('schedules', tenantId, input)
  }

  if (action === 'list') {
    const structuredContent = buildAutomationListResult({
      tool: MCP_APP_PUBLIC_TOOL_NAMES.schedules,
      kind: 'schedules',
      action,
      title: 'Agendamentos',
      emptyTitle: 'Nenhum agendamento criado.',
      rows,
    })
    return makeWidgetResult(structuredContent, JSON.stringify(structuredContent, null, 2))
  }

  const structuredContent = {
    ok: true,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.schedules,
    view: 'automation',
    kind: 'schedules',
    action,
    title,
    subtitle: `${rows.length} registro${rows.length === 1 ? '' : 's'}`,
    rows,
    columns: inferRowsColumns(rows),
    count: rows.length,
  }
  return makeWidgetResult(structuredContent, JSON.stringify(structuredContent, null, 2))
}

function normalizeConnectorAction(value: unknown) {
  const action = String(value || 'list').trim().toLowerCase()
  if (action === 'listar' || action === 'mostrar' || action === 'quais') return 'list'
  if (
    action === 'list' ||
    action === 'status' ||
    action === 'test_connection' ||
    action === 'sync_now' ||
    action === 'reconnect_url'
  ) {
    return action
  }
  throw new Error('action invalida para connectors. Use list, status, test_connection, sync_now ou reconnect_url.')
}

function buildConnectorSummary(rows: JsonRecord[]) {
  const connected = rows.filter((row) => row.health === 'connected').length
  const warning = rows.filter((row) => row.health === 'warning').length
  const error = rows.filter((row) => row.health === 'error').length
  const lastSyncAt = rows
    .map((row) => optionalText(row.last_sync_at))
    .filter((value): value is string => Boolean(value))
    .sort()
    .pop() || null

  return {
    total: rows.length,
    connected,
    warning,
    error,
    last_sync_at: lastSyncAt,
  }
}

async function listConnectorRows(tenantId: number, input: JsonRecord) {
  const rows = await runQuery<JsonRecord>(
    `
WITH latest_runs AS (
  SELECT
    DISTINCT ON (connector_id)
    connector_id,
    status AS last_run_status,
    started_at AS last_run_started_at,
    finished_at AS last_run_finished_at,
    records_in AS last_run_records_in,
    records_updated AS last_run_records_updated,
    records_failed AS last_run_records_failed,
    error_message AS last_run_error
  FROM mcp_app.connector_sync_runs
  WHERE tenant_id = $1::int
  ORDER BY connector_id, started_at DESC
)
SELECT
  c.id::text AS id,
  CONCAT(c.domain, ':', c.id::text) AS connector_id,
  c.domain,
  c.provider AS plataforma,
  c.provider,
  c.name,
  c.external_account_id AS external_id,
  c.status AS connection_status,
  CASE
    WHEN c.status = 'connected' THEN 'connected'
    WHEN c.status = 'error' THEN 'error'
    ELSE 'warning'
  END AS health,
  c.last_sync_at,
  c.updated_at AS source_updated_at,
  c.scopes_json AS scopes,
  NULL::timestamptz AS expires_at,
  c.last_error,
  c.records_synced,
  c.source_table,
  c.source_id,
  c.metadata_json,
  r.last_run_status,
  r.last_run_started_at,
  r.last_run_finished_at,
  r.last_run_records_in,
  r.last_run_records_updated,
  r.last_run_records_failed,
  r.last_run_error
FROM mcp_app.connectors c
LEFT JOIN latest_runs r ON r.connector_id = c.id
WHERE c.tenant_id = $1::int
ORDER BY c.domain, c.provider, c.name
    `.trim(),
    [tenantId],
  )

  const domain = optionalText(input.domain)
  const platform = optionalText(input.plataforma || input.platform)
  const connectorId = optionalText(input.connector_id || input.id)
  return rows
    .filter((row) => !domain || row.domain === domain)
    .filter((row) => !platform || row.plataforma === platform)
    .filter((row) => !connectorId || row.connector_id === connectorId || row.id === connectorId)
    .slice(0, normalizeLimit(input.limit, 50, 200))
}

async function callConnectors(args: unknown, context: CognitoMcpServerContext) {
  const input = asRecord(args)
  const action = normalizeConnectorAction(input.action)
  const tenantId = getTenantId(context)
  const rows = await listConnectorRows(tenantId, input)
  const connectorId = optionalText(input.connector_id || input.id)
  const selected = connectorId ? rows[0] || null : null
  const summary = buildConnectorSummary(rows)

  if (action === 'test_connection' || action === 'sync_now' || action === 'reconnect_url') {
    const target = selected || rows[0] || null
    const dryRun = input.dry_run !== false
    const result = {
      action,
      dry_run: dryRun,
      connector_id: target?.connector_id || connectorId || null,
      status: action === 'reconnect_url' ? 'url_ready' : 'preview',
      message: action === 'reconnect_url'
        ? 'Use a URL interna para iniciar reconexao no app.'
        : 'No v1 esta tool nao chama APIs externas; retorna validacao estrutural e preview operacional.',
      reconnect_url: action === 'reconnect_url' && target
        ? `/settings/integrations/${target.domain}/${target.plataforma}?connector_id=${encodeURIComponent(String(target.connector_id))}`
        : null,
    }
    const structuredContent = {
      ok: true,
      tool: MCP_APP_PUBLIC_TOOL_NAMES.connectors,
      view: 'connectors',
      action,
      title: action === 'reconnect_url' ? 'Reconectar integracao' : action === 'sync_now' ? 'Sincronizacao manual' : 'Teste de integracao',
      subtitle: target ? String(target.name || target.connector_id) : 'Nenhum conector encontrado para o filtro',
      summary,
      result,
      rows: target ? [target] : rows,
      columns: inferRowsColumns(target ? [target] : rows),
      count: target ? 1 : rows.length,
    }
    return makeWidgetResult(structuredContent, JSON.stringify(structuredContent, null, 2), false)
  }

  const structuredContent = {
    ok: true,
    tool: MCP_APP_PUBLIC_TOOL_NAMES.connectors,
    view: 'connectors',
    action,
    title: action === 'status' ? 'Status das Integracoes' : 'Conectores',
    subtitle: `${rows.length} conector${rows.length === 1 ? '' : 'es'} · ${summary.connected} conectado${summary.connected === 1 ? '' : 's'} · ${summary.warning} atencao · ${summary.error} erro${summary.error === 1 ? '' : 's'}`,
    summary,
    rows,
    columns: inferRowsColumns(rows),
    count: rows.length,
  }
  return makeWidgetResult(structuredContent, JSON.stringify(structuredContent, null, 2))
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
        name: MCP_APP_PUBLIC_TOOL_NAMES.analysis,
        title: 'Analysis',
        description:
          'Renderiza uma analise executiva no app interativo. Nao consulta dados; use depois de erp, crm, marketing, ecommerce, sql ou data_catalog para mostrar insights, anomalias, comparacoes, forecast, funil ou resumo executivo em UI propria.',
        inputSchema: ANALYSIS_SCHEMA,
        outputSchema: GENERIC_APP_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        annotations: READ_ONLY_ANNOTATIONS,
        _meta: {
          ...DASHBOARD_WIDGET_META,
          securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        },
      },
      {
        name: MCP_APP_PUBLIC_TOOL_NAMES.table,
        title: 'Table',
        description:
          'Renderiza uma tabela customizada no app interativo usando linhas ja calculadas pelo agente ou por tools anteriores. Nao executa SQL.',
        inputSchema: TABLE_SCHEMA,
        outputSchema: GENERIC_APP_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        annotations: READ_ONLY_ANNOTATIONS,
        _meta: {
          ...DASHBOARD_WIDGET_META,
          securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        },
      },
      {
        name: MCP_APP_PUBLIC_TOOL_NAMES.actions,
        title: 'Actions',
        description:
          'Prepara ou executa acoes assistidas em ERP, CRM, marketing e ecommerce. Por padrao dry_run=true e retorna apenas preview/aprovacao; execucao real v1 fica limitada ao ERP via erp_acoes.',
        inputSchema: ACTIONS_SCHEMA,
        outputSchema: GENERIC_APP_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_WRITE_SECURITY_SCHEMES,
        annotations: UPDATE_ANNOTATIONS,
        _meta: {
          ...DASHBOARD_WIDGET_META,
          securitySchemes: COGNITO_WRITE_SECURITY_SCHEMES,
        },
      },
      {
        name: MCP_APP_PUBLIC_TOOL_NAMES.alerts,
        title: 'Alerts',
        description:
          'Cria, lista, atualiza, pausa, remove e testa regras persistentes de alerta para dados conectados.',
        inputSchema: ALERTS_SCHEMA,
        outputSchema: GENERIC_APP_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_WRITE_SECURITY_SCHEMES,
        annotations: UPDATE_ANNOTATIONS,
        _meta: {
          ...DASHBOARD_WIDGET_META,
          securitySchemes: COGNITO_WRITE_SECURITY_SCHEMES,
        },
      },
      {
        name: MCP_APP_PUBLIC_TOOL_NAMES.schedules,
        title: 'Schedules',
        description:
          'Cria, lista, atualiza, pausa, remove e executa agendamentos recorrentes de analises, relatorios, slides ou dashboards.',
        inputSchema: SCHEDULES_SCHEMA,
        outputSchema: GENERIC_APP_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_WRITE_SECURITY_SCHEMES,
        annotations: UPDATE_ANNOTATIONS,
        _meta: {
          ...DASHBOARD_WIDGET_META,
          securitySchemes: COGNITO_WRITE_SECURITY_SCHEMES,
        },
      },
      {
        name: MCP_APP_PUBLIC_TOOL_NAMES.connectors,
        title: 'Connectors',
        description:
          'Mostra status operacional das integracoes conectadas: ERP, CRM, ecommerce e marketing. Use para listar conectores, verificar ultimo sync, erros, escopos, volume sincronizado, testar conexao, preparar sync manual ou obter URL de reconexao.',
        inputSchema: CONNECTORS_SCHEMA,
        outputSchema: GENERIC_APP_OUTPUT_SCHEMA,
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

  if (name === MCP_APP_PUBLIC_TOOL_NAMES.analysis) {
    return callAnalysis(args)
  }

  if (name === MCP_APP_PUBLIC_TOOL_NAMES.table) {
    return callTable(args)
  }

  if (name === MCP_APP_PUBLIC_TOOL_NAMES.actions) {
    return callActions(args, context)
  }

  if (name === MCP_APP_PUBLIC_TOOL_NAMES.alerts) {
    return callAlerts(args, context)
  }

  if (name === MCP_APP_PUBLIC_TOOL_NAMES.schedules) {
    return callSchedules(args, context)
  }

  if (name === MCP_APP_PUBLIC_TOOL_NAMES.connectors) {
    return callConnectors(args, context)
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
