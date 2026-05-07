import { verifyMcpRequest } from '@/products/mcp/auth/mcpAuth'
import { handleMcpHttpRequest } from '@/products/mcp/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function GET() {
  return Response.json({
    ok: true,
    product: 'mcp',
    status: 'ready',
    transport: 'http-json-rpc',
    message: 'Endpoint MCP pronto para POST JSON-RPC autenticado.',
  })
}

export async function POST(req: Request) {
  const auth = verifyMcpRequest(req)
  if (!auth.ok) {
    return Response.json(
      {
        ok: false,
        product: 'mcp',
        code: auth.code,
        error: auth.error,
      },
      { status: auth.status },
    )
  }

  return handleMcpHttpRequest(req, { tenantId: auth.tenantId })
}
