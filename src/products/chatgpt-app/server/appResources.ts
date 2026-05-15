import {
  DASHBOARD_WIDGET_MIME_TYPE,
  DASHBOARD_WIDGET_RESOURCE_URI,
  getDashboardWidgetHtml,
  listCognitoMcpAppResources,
  readCognitoMcpAppResource,
  type McpAppResourceContent,
} from '@/products/mcp-apps/server/appResources'

export { DASHBOARD_WIDGET_MIME_TYPE, DASHBOARD_WIDGET_RESOURCE_URI, getDashboardWidgetHtml }

export type ChatGptAppResourceContent = McpAppResourceContent

function toOpenAiWidgetCsp(meta: Record<string, unknown> | undefined) {
  const ui = meta?.ui && typeof meta.ui === 'object' ? meta.ui as Record<string, unknown> : {}
  const csp = ui.csp && typeof ui.csp === 'object' ? ui.csp as Record<string, unknown> : {}
  const connectDomains = Array.isArray(csp.connectDomains) ? csp.connectDomains : []
  const resourceDomains = Array.isArray(csp.resourceDomains) ? csp.resourceDomains : []
  const frameDomains = Array.isArray(csp.frameDomains) ? csp.frameDomains : []
  const redirectDomains = Array.isArray(csp.redirectDomains) ? csp.redirectDomains : resourceDomains

  return {
    connect_domains: connectDomains,
    resource_domains: resourceDomains,
    frame_domains: frameDomains,
    redirect_domains: redirectDomains,
  }
}

function withOpenAiResourceMeta(content: McpAppResourceContent): ChatGptAppResourceContent {
  const meta = content._meta || {}
  const ui = meta.ui && typeof meta.ui === 'object' ? meta.ui as Record<string, unknown> : {}

  return {
    ...content,
    _meta: {
      ...meta,
      'openai/widgetDescription':
        typeof ui.description === 'string'
          ? ui.description
          : 'Interface visual para listar dashboards Cognito e mostrar previews dentro do ChatGPT.',
      'openai/widgetPrefersBorder': ui.prefersBorder !== false,
      'openai/widgetCSP': toOpenAiWidgetCsp(meta),
    },
  }
}

export function listCognitoChatGptAppResources() {
  return listCognitoMcpAppResources()
}

export function readCognitoChatGptAppResource(uri: string) {
  const resource = readCognitoMcpAppResource(uri)
  if (!resource) return null

  return {
    contents: resource.contents.map(withOpenAiResourceMeta),
  }
}
