import crypto from 'crypto'

export type McpAuthResult =
  | {
      ok: true
      tenantId: number
    }
  | {
      ok: false
      status: number
      code: 'mcp_token_not_configured' | 'mcp_unauthorized'
      error: string
    }

function getBearerToken(req: Request) {
  const auth = req.headers.get('authorization') || ''
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
}

function resolveTenantId(req: Request) {
  const headerTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
  const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
  if (Number.isFinite(headerTenant) && headerTenant > 0) return headerTenant
  if (Number.isFinite(envTenant) && envTenant > 0) return envTenant
  return 1
}

function timingSafeTextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyMcpRequest(req: Request): McpAuthResult {
  const expectedToken = String(process.env.COGNITO_MCP_TOKEN || '').trim()
  if (!expectedToken) {
    return {
      ok: false,
      status: 500,
      code: 'mcp_token_not_configured',
      error: 'COGNITO_MCP_TOKEN nao configurado',
    }
  }

  const token = getBearerToken(req)
  if (!token || !timingSafeTextEqual(token, expectedToken)) {
    return {
      ok: false,
      status: 401,
      code: 'mcp_unauthorized',
      error: 'Token MCP invalido',
    }
  }

  return {
    ok: true,
    tenantId: resolveTenantId(req),
  }
}

