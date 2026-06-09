import { verifyClaudeAppRequest } from '@/products/claude-app/server/auth'
import {
  COGNITO_CLAUDE_APP_SERVER_INFO,
  handleClaudeAppMcpHttpRequest,
} from '@/products/claude-app/server/claudeAppServer'
import { getClaudeAppOAuthWwwAuthenticateHeader } from '@/products/claude-app/server/oauth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET() {
  return Response.json({
    ok: true,
    product: 'claude-app',
    status: 'ready',
    transport: 'http-json-rpc',
    server: COGNITO_CLAUDE_APP_SERVER_INFO,
    message: 'Endpoint Plugin do Claude pronto para POST JSON-RPC autenticado.',
  })
}

export async function POST(req: Request) {
  const auth = verifyClaudeAppRequest(req)
  if (!auth.ok) {
    return Response.json(
      {
        ok: false,
        product: 'claude-app',
        code: auth.code,
        error: auth.error,
      },
      {
        status: auth.status,
        headers: auth.status === 401
          ? { 'WWW-Authenticate': getClaudeAppOAuthWwwAuthenticateHeader(req) }
          : undefined,
      },
    )
  }

  return handleClaudeAppMcpHttpRequest(req, { tenantId: auth.tenantId })
}
