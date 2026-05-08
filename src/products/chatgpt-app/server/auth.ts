import crypto from 'node:crypto'
import { verifyChatGptAppOAuthAccessToken } from '@/products/chatgpt-app/server/oauth'

export type ChatGptAppAuthResult =
  | {
      ok: true
      tenantId: number
      authType: 'mcp_token' | 'oauth'
    }
  | {
      ok: false
      status: number
      code: 'chatgpt_app_token_not_configured' | 'chatgpt_app_unauthorized'
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

export function verifyChatGptAppRequest(req: Request): ChatGptAppAuthResult {
  const expectedToken = String(process.env.COGNITO_MCP_TOKEN || '').trim()
  if (!expectedToken) {
    return {
      ok: false,
      status: 500,
      code: 'chatgpt_app_token_not_configured',
      error: 'COGNITO_MCP_TOKEN nao configurado',
    }
  }

  const token = getBearerToken(req)
  if (!token) {
    return {
      ok: false,
      status: 401,
      code: 'chatgpt_app_unauthorized',
      error: 'Token ChatGPT App ausente',
    }
  }

  if (timingSafeTextEqual(token, expectedToken)) {
    return {
      ok: true,
      tenantId: resolveTenantId(req),
      authType: 'mcp_token',
    }
  }

  const oauthToken = verifyChatGptAppOAuthAccessToken(token)
  if (oauthToken) {
    return {
      ok: true,
      tenantId: oauthToken.tenantId,
      authType: 'oauth',
    }
  }

  return {
    ok: false,
    status: 401,
    code: 'chatgpt_app_unauthorized',
    error: 'Token ChatGPT App invalido',
  }
}

