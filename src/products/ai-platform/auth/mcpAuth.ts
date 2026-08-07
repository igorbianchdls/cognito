import type { AuthInfo } from '@modelcontextprotocol/server'
import { auth } from '@clerk/nextjs/server'
import { verifyClerkToken } from '@clerk/mcp-tools/next'

import { upsertAiConnection } from '@/products/ai-platform/audit/aiAuditRepository'
import { resolveErpPrincipal } from '@/products/ai-platform/auth/resolveErpPrincipal'

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1]
  if (!payload) return {} as Record<string, unknown>
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
  } catch {
    return {} as Record<string, unknown>
  }
}

export async function verifyOttoMcpToken(_request: Request, token?: string): Promise<AuthInfo | undefined> {
  if (!token) return undefined
  const clerkAuth = await auth({ acceptsToken: 'oauth_token' })
  const verified = verifyClerkToken(clerkAuth, token)
  if (!verified) return undefined
  const payload = decodeJwtPayload(token)
  const organizationId = String(payload.org_id || payload.organization_id || '')
  if (!organizationId) return undefined
  return { ...verified, extra: { ...verified.extra, clerkOrganizationId: organizationId } }
}

function providerFromClientId(clientId: string): 'chatgpt' | 'claude' | 'other' {
  const normalized = clientId.toLowerCase()
  if (normalized.includes('chatgpt') || normalized.includes('openai')) return 'chatgpt'
  if (normalized.includes('claude') || normalized.includes('anthropic')) return 'claude'
  return 'other'
}

export async function resolveMcpPrincipal(authInfo?: AuthInfo) {
  const clerkUserId = String(authInfo?.extra?.userId || '')
  const clerkOrganizationId = String(authInfo?.extra?.clerkOrganizationId || '')
  if (!authInfo || !clerkUserId || !clerkOrganizationId) return null
  const initial = await resolveErpPrincipal({
    clerkUserId, clerkOrganizationId, scopes: authInfo.scopes, clientId: authInfo.clientId,
  })
  if (!initial) return null
  const connection = await upsertAiConnection({
    tenantId: initial.tenantId, userId: initial.userId, clientId: authInfo.clientId,
    scopes: authInfo.scopes, provider: providerFromClientId(authInfo.clientId),
  })
  if (connection.status !== 'active') return null
  return { ...initial, connectionId: Number(connection.id), writeEnabled: connection.write_enabled }
}
