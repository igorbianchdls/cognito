import { verifyMcpRequest } from '@/products/mcp/auth/mcpAuth'
import {
  COGNITO_CHATGPT_APP_SERVER_INFO,
  handleChatGptAppMcpHttpRequest,
} from '@/products/chatgpt-app/server/chatgptAppServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET() {
  return Response.json({
    ok: true,
    product: 'chatgpt-app',
    status: 'ready',
    transport: 'http-json-rpc',
    server: COGNITO_CHATGPT_APP_SERVER_INFO,
    message: 'Endpoint MCP do ChatGPT App pronto para POST JSON-RPC autenticado.',
  })
}

export async function POST(req: Request) {
  const auth = verifyMcpRequest(req)
  if (!auth.ok) {
    return Response.json(
      {
        ok: false,
        product: 'chatgpt-app',
        code: auth.code,
        error: auth.error,
      },
      { status: auth.status },
    )
  }

  return handleChatGptAppMcpHttpRequest(req, { tenantId: auth.tenantId })
}

