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

export async function POST() {
  return Response.json(NOT_IMPLEMENTED, { status: 501 })
}

