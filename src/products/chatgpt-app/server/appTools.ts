import { DASHBOARD_MCP_TOOL_DEFINITIONS, type McpToolInputSchema } from '@/products/mcp/tools/dashboardSchemas'
import { callCognitoMcpTool, type CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'
import { DASHBOARD_WIDGET_RESOURCE_URI } from '@/products/chatgpt-app/server/appResources'
import {
  listMcpDashboards,
  readMcpDashboard,
} from '@/products/mcp/adapters/artifactsAdapter'
import {
  callChatGptDomainTool,
  CHATGPT_DOMAIN_TOOL_DEFINITIONS,
  isChatGptDomainTool,
} from '@/products/chatgpt-app/server/domainTools'

export const CHATGPT_DASHBOARD_RENDER_TOOL_NAMES = {
  dashboardRenderList: 'dashboard_render_list',
  dashboardRenderPreview: 'dashboard_render_preview',
} as const

export const CHATGPT_CONNECTOR_TOOL_NAMES = {
  search: 'search',
  fetch: 'fetch',
} as const

export type ChatGptDashboardRenderToolName =
  (typeof CHATGPT_DASHBOARD_RENDER_TOOL_NAMES)[keyof typeof CHATGPT_DASHBOARD_RENDER_TOOL_NAMES]

type ChatGptAppToolDefinition = {
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
  'openai/outputTemplate': DASHBOARD_WIDGET_RESOURCE_URI,
  'openai/widgetAccessible': true,
  'openai/toolInvocation/invoking': 'Renderizando dashboard...',
  'openai/toolInvocation/invoked': 'Dashboard renderizado.',
  ui: {
    resourceUri: DASHBOARD_WIDGET_RESOURCE_URI,
    ...MODEL_AND_APP_VISIBILITY,
  },
} as const

const DATA_TOOL_META = {
  ui: MODEL_AND_APP_VISIBILITY,
} as const

export const CHATGPT_DASHBOARD_RENDER_TOOL_DEFINITIONS = [
  {
    name: CHATGPT_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderList,
    title: 'Render dashboard list',
    description:
      'Renderiza no iframe do ChatGPT uma lista de dashboards. Use somente depois de dashboard_list.',
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
    name: CHATGPT_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderPreview,
    title: 'Render dashboard preview',
    description:
      'Renderiza no iframe do ChatGPT o preview/metadados de um dashboard. Use somente depois de dashboard_read.',
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
] as const satisfies readonly ChatGptAppToolDefinition[]

const CHATGPT_RENDER_TOOL_NAME_SET = new Set<string>(
  Object.values(CHATGPT_DASHBOARD_RENDER_TOOL_NAMES),
)

const CHATGPT_CONNECTOR_TOOL_NAME_SET = new Set<string>(
  Object.values(CHATGPT_CONNECTOR_TOOL_NAMES),
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

function getDataToolInvocationText(name: string) {
  switch (name) {
    case 'dashboard_list':
      return ['Listando dashboards...', 'Dashboards listados.']
    case 'dashboard_read':
      return ['Abrindo dashboard...', 'Dashboard carregado.']
    case 'dashboard_get_contract':
      return ['Lendo contrato...', 'Contrato carregado.']
    case 'dashboard_create':
      return ['Criando dashboard...', 'Dashboard criado.']
    case 'dashboard_patch':
      return ['Editando dashboard...', 'Dashboard editado.']
    case 'dashboard_update_full':
      return ['Atualizando dashboard...', 'Dashboard atualizado.']
    default:
      return ['Executando tool...', 'Tool executada.']
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
  return {
    id: String(dashboard.id || ''),
    title: String(dashboard.title || dashboard.slug || dashboard.id || 'Dashboard'),
    url: String(dashboard.url || ''),
    metadata: {
      slug: dashboard.slug || null,
      status: dashboard.status || null,
      current_draft_version: dashboard.current_draft_version || null,
      current_published_version: dashboard.current_published_version || null,
      updated_at: dashboard.updated_at || null,
    },
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

function makeRenderResult(toolName: ChatGptDashboardRenderToolName, args: unknown) {
  const input = asRecord(args)
  const view = toolName === CHATGPT_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderList
    ? 'dashboard_list'
    : 'dashboard_preview'
  const result = {
    ...input,
    ok: true,
    tool: toolName,
    view,
  }

  return {
    content: [
      {
        type: 'text',
        text: toolName === CHATGPT_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderList
          ? 'Renderizando lista de dashboards no ChatGPT.'
          : 'Renderizando preview do dashboard no ChatGPT.',
      },
    ],
    structuredContent: result,
    _meta: {
      widget: DASHBOARD_WIDGET_RESOURCE_URI,
    },
    isError: false,
  }
}

export function listCognitoChatGptAppTools() {
  return {
    tools: [
      {
        name: CHATGPT_CONNECTOR_TOOL_NAMES.search,
        title: 'Search dashboards',
        description:
          'Search Cognito dashboards by title, slug, status, or id. Use this when ChatGPT needs to discover dashboard records.',
        inputSchema: SEARCH_SCHEMA,
        outputSchema: SEARCH_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        annotations: READ_ONLY_ANNOTATIONS,
        _meta: {
          ...DATA_TOOL_META,
          securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
          'openai/toolInvocation/invoking': 'Buscando dashboards...',
          'openai/toolInvocation/invoked': 'Busca concluida.',
        },
      },
      {
        name: CHATGPT_CONNECTOR_TOOL_NAMES.fetch,
        title: 'Fetch dashboard',
        description:
          'Fetch a Cognito dashboard by id returned from search. Use this when ChatGPT needs the full dashboard details for citation or context.',
        inputSchema: FETCH_SCHEMA,
        outputSchema: FETCH_OUTPUT_SCHEMA,
        securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
        annotations: READ_ONLY_ANNOTATIONS,
        _meta: {
          ...DATA_TOOL_META,
          securitySchemes: COGNITO_READ_SECURITY_SCHEMES,
          'openai/toolInvocation/invoking': 'Carregando dashboard...',
          'openai/toolInvocation/invoked': 'Dashboard carregado.',
        },
      },
      ...CHATGPT_DOMAIN_TOOL_DEFINITIONS,
      ...DASHBOARD_MCP_TOOL_DEFINITIONS.map((tool) => ({
        name: tool.name,
        title: getDataToolTitle(tool.name),
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: getDataToolOutputSchema(tool.name),
        securitySchemes: getDataToolSecuritySchemes(tool.name),
        annotations: getDataToolAnnotations(tool.name),
        _meta: {
          ...DATA_TOOL_META,
          securitySchemes: getDataToolSecuritySchemes(tool.name),
          'openai/toolInvocation/invoking': getDataToolInvocationText(tool.name)[0],
          'openai/toolInvocation/invoked': getDataToolInvocationText(tool.name)[1],
        },
      })),
      ...CHATGPT_DASHBOARD_RENDER_TOOL_DEFINITIONS,
    ],
  }
}

function normalizeDataToolStructuredContent(name: string, structuredContent: unknown) {
  switch (name) {
    case 'dashboard_list':
      return {
        dashboards: Array.isArray(structuredContent) ? structuredContent : [],
      }
    case 'dashboard_read':
      return {
        dashboard: structuredContent,
      }
    case 'dashboard_get_contract':
      return {
        contract: structuredContent,
      }
    case 'dashboard_create':
    case 'dashboard_patch':
    case 'dashboard_update_full':
      return {
        dashboard: structuredContent,
        result: structuredContent,
      }
    default:
      return {
        result: structuredContent,
      }
  }
}

export async function callCognitoChatGptAppTool(
  name: string,
  args: unknown,
  context: CognitoMcpServerContext = {},
) {
  if (isChatGptDomainTool(name)) {
    return callChatGptDomainTool(name, args, context)
  }

  if (CHATGPT_CONNECTOR_TOOL_NAME_SET.has(name)) {
    if (name === CHATGPT_CONNECTOR_TOOL_NAMES.search) return callConnectorSearch(args)
    return callConnectorFetch(args)
  }

  if (CHATGPT_RENDER_TOOL_NAME_SET.has(name)) {
    return makeRenderResult(name as ChatGptDashboardRenderToolName, args)
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
