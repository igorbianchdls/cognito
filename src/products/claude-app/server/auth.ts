import crypto from 'node:crypto'

export type ClaudeAppAuthResult =
  | {
      ok: true
      tenantId: number
      authType: 'token'
    }
  | {
      ok: false
      status: number
      code: 'claude_app_token_not_configured' | 'claude_app_unauthorized'
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

export function verifyClaudeAppRequest(req: Request): ClaudeAppAuthResult {
  const expectedToken = String(
    process.env.COGNITO_CLAUDE_APP_TOKEN ||
      process.env.COGNITO_MCP_TOKEN ||
      '',
  ).trim()

  if (!expectedToken) {
    return {
      ok: false,
      status: 500,
      code: 'claude_app_token_not_configured',
      error: 'COGNITO_CLAUDE_APP_TOKEN ou COGNITO_MCP_TOKEN nao configurado',
    }
  }

  const token = getBearerToken(req)
  if (!token || !timingSafeTextEqual(token, expectedToken)) {
    return {
      ok: false,
      status: 401,
      code: 'claude_app_unauthorized',
      error: 'Token Claude App ausente ou invalido',
    }
  }

  return {
    ok: true,
    tenantId: resolveTenantId(req),
    authType: 'token',
  }
}
