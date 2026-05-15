import { COGNITO_CHATGPT_APP_SERVER_INFO } from '@/products/chatgpt-app/server/chatgptAppServer'
import { getCognitoChatGptAppMetadata } from '@/products/chatgpt-app/server/appMetadata'
import { listCognitoChatGptAppResources } from '@/products/chatgpt-app/server/appResources'
import { listCognitoChatGptAppTools } from '@/products/chatgpt-app/server/appTools'
import { verifyChatGptAppRequest } from '@/products/chatgpt-app/server/auth'
import { getChatGptAppOAuthWwwAuthenticateHeader } from '@/products/chatgpt-app/server/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30

function getConfiguredBaseUrl() {
  const explicitBaseUrl = String(
    process.env.COGNITO_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '',
  ).trim()
  if (explicitBaseUrl) return explicitBaseUrl.replace(/\/+$/, '')

  const vercelUrl = String(process.env.VERCEL_URL || '').trim()
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, '')}`

  return null
}

export async function GET(req: Request) {
  const auth = verifyChatGptAppRequest(req)
  if (!auth.ok) {
    return Response.json(
      {
        ok: false,
        product: 'chatgpt-app',
        status: 'auth_failed',
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

  const baseUrl = getConfiguredBaseUrl()
  const tools = listCognitoChatGptAppTools().tools
  const resources = listCognitoChatGptAppResources().resources

  return Response.json({
    ok: true,
    product: 'chatgpt-app',
    status: 'ready',
    server: COGNITO_CHATGPT_APP_SERVER_INFO,
    app: getCognitoChatGptAppMetadata(),
    base_url: baseUrl,
    mcp_url: baseUrl ? `${baseUrl}/api/chatgpt-app/mcp` : null,
    tenant_id: auth.tenantId,
    auth_type: auth.authType,
    tools: tools.map((tool) => tool.name),
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
  })
}
