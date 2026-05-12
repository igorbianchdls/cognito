import crypto from 'node:crypto'
import { verifyClaudeAppOAuthAccessToken } from '@/products/claude-app/server/oauth'

export type ClaudeAppAuthResult =
  | {
      ok: true
      tenantId: number
      authType: 'token' | 'oauth'
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

  const token = getBearerToken(req)
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'claude_app_unauthorized',
      error: 'Token Claude App ausente ou invalido',
    }
  }

  if (expectedToken && timingSafeTextEqual(token, expectedToken)) {
    return {
      ok: true,
      tenantId: resolveTenantId(req),
      authType: 'token',
    }
  }

  const oauthToken = verifyClaudeAppOAuthAccessToken(token)
  if (oauthToken) {
    return {
      ok: true,
      tenantId: oauthToken.tenantId,
      authType: 'oauth',
    }
  }

  if (!expectedToken) {
    return {
      ok: false,
      status: 500,
      code: 'claude_app_token_not_configured',
      error: 'COGNITO_CLAUDE_APP_TOKEN, COGNITO_MCP_TOKEN ou OAuth valido nao configurado',
    }
  }

  return {
    ok: false,
    status: 401,
    code: 'claude_app_unauthorized',
    error: 'Token Claude App invalido',
  }
}
