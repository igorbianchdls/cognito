import { verifyChatGptAppRequest } from '@/products/chatgpt-app/server/auth'
import {
  COGNITO_CHATGPT_APP_SERVER_INFO,
  handleChatGptAppMcpHttpRequest,
} from '@/products/chatgpt-app/server/chatgptAppServer'
import { DASHBOARD_WIDGET_RESOURCE_URI, listCognitoChatGptAppResources } from '@/products/chatgpt-app/server/appResources'
import { listCognitoChatGptAppTools } from '@/products/chatgpt-app/server/appTools'
import { getChatGptAppOAuthWwwAuthenticateHeader } from '@/products/chatgpt-app/server/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET() {
  const tools = listCognitoChatGptAppTools().tools
  const resources = listCognitoChatGptAppResources().resources

  return Response.json({
    ok: true,
    product: 'chatgpt-app',
    status: 'ready',
    transport: 'http-json-rpc',
    server: COGNITO_CHATGPT_APP_SERVER_INFO,
    widget_resource_uri: DASHBOARD_WIDGET_RESOURCE_URI,
    resources: resources.map((resource) => resource.uri),
    widget_templates: tools
      .map((tool) => ({
        name: tool.name,
        output_template: tool._meta?.['openai/outputTemplate'],
        resource_uri: tool._meta?.ui && typeof tool._meta.ui === 'object'
          ? (tool._meta.ui as Record<string, unknown>).resourceUri
          : undefined,
      }))
      .filter((tool) => tool.output_template || tool.resource_uri),
    message: 'Endpoint MCP do ChatGPT App pronto para POST JSON-RPC autenticado.',
  })
}

export async function POST(req: Request) {
  const auth = verifyChatGptAppRequest(req)
  if (!auth.ok) {
    return Response.json(
      {
        ok: false,
        product: 'chatgpt-app',
        code: auth.code,
        error: auth.error,
      },
      {
        status: auth.status,
        headers: auth.status === 401
          ? { 'WWW-Authenticate': getChatGptAppOAuthWwwAuthenticateHeader(req) }
          : undefined,
      },
    )
  }

  return handleChatGptAppMcpHttpRequest(req, { tenantId: auth.tenantId })
}
