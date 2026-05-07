import { verifyMcpRequest } from '@/products/mcp/auth/mcpAuth'
import { COGNITO_MCP_SERVER_INFO, listCognitoMcpTools } from '@/products/mcp/server/cognitoMcpServer'

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
  const auth = verifyMcpRequest(req)
  if (!auth.ok) {
    return Response.json(
      {
        ok: false,
        product: 'mcp',
        status: 'auth_failed',
        code: auth.code,
        error: auth.error,
      },
      { status: auth.status },
    )
  }

  const tools = listCognitoMcpTools().tools.map((tool) => tool.name)

  return Response.json({
    ok: true,
    product: 'mcp',
    status: 'ready',
    server: COGNITO_MCP_SERVER_INFO,
    base_url: getConfiguredBaseUrl(),
    tenant_id: auth.tenantId,
    tools,
  })
}

