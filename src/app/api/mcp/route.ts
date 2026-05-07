import { verifyMcpRequest } from '@/products/mcp/auth/mcpAuth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

const NOT_IMPLEMENTED = {
  ok: false,
  product: 'mcp',
  status: 'not_implemented',
  message: 'Endpoint MCP reservado. A implementacao do servidor MCP entra nas proximas etapas.',
}

export async function GET() {
  return Response.json({
    ok: true,
    product: 'mcp',
    status: 'reserved',
    message: 'Endpoint MCP reservado para Claude externo.',
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

  return Response.json(NOT_IMPLEMENTED, { status: 501 })
}
