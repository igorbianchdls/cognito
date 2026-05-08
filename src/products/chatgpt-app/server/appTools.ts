import { DASHBOARD_MCP_TOOL_DEFINITIONS, type McpToolInputSchema } from '@/products/mcp/tools/dashboardSchemas'
import { callCognitoMcpTool, type CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'
import { DASHBOARD_WIDGET_RESOURCE_URI } from '@/products/chatgpt-app/server/appResources'

export const CHATGPT_DASHBOARD_RENDER_TOOL_NAMES = {
  dashboardRenderList: 'dashboard_render_list',
  dashboardRenderPreview: 'dashboard_render_preview',
} as const

export type ChatGptDashboardRenderToolName =
  (typeof CHATGPT_DASHBOARD_RENDER_TOOL_NAMES)[keyof typeof CHATGPT_DASHBOARD_RENDER_TOOL_NAMES]

type ChatGptAppToolDefinition = {
  name: string
  description: string
  inputSchema: McpToolInputSchema
  outputSchema?: McpToolInputSchema
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

const DASHBOARD_WIDGET_META = {
  'openai/outputTemplate': DASHBOARD_WIDGET_RESOURCE_URI,
  'openai/widgetAccessible': true,
  'openai/toolInvocation/invoking': 'Renderizando dashboard...',
  'openai/toolInvocation/invoked': 'Dashboard renderizado.',
  ui: {
    resourceUri: DASHBOARD_WIDGET_RESOURCE_URI,
    visibility: ['model', 'app'],
  },
} as const

export const CHATGPT_DASHBOARD_RENDER_TOOL_DEFINITIONS = [
  {
    name: CHATGPT_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderList,
    description:
      'Renderiza no iframe do ChatGPT uma lista de dashboards. Use somente depois de dashboard_list.',
    inputSchema: RENDER_LIST_SCHEMA,
    outputSchema: RENDER_LIST_OUTPUT_SCHEMA,
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
    description:
      'Renderiza no iframe do ChatGPT o preview/metadados de um dashboard. Use somente depois de dashboard_read.',
    inputSchema: RENDER_PREVIEW_SCHEMA,
    outputSchema: RENDER_PREVIEW_OUTPUT_SCHEMA,
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

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

function makeRenderResult(toolName: ChatGptDashboardRenderToolName, args: unknown) {
  const input = asRecord(args)
  const view = toolName === CHATGPT_DASHBOARD_RENDER_TOOL_NAMES.dashboardRenderList
    ? 'dashboard_list'
    : 'dashboard_preview'
  const result = {
    ok: true,
    tool: toolName,
    view,
    ...input,
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
      ...DASHBOARD_MCP_TOOL_DEFINITIONS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
      ...CHATGPT_DASHBOARD_RENDER_TOOL_DEFINITIONS,
    ],
  }
}

export async function callCognitoChatGptAppTool(
  name: string,
  args: unknown,
  context: CognitoMcpServerContext = {},
) {
  if (CHATGPT_RENDER_TOOL_NAME_SET.has(name)) {
    return makeRenderResult(name as ChatGptDashboardRenderToolName, args)
  }

  return callCognitoMcpTool(name, args, context)
}
