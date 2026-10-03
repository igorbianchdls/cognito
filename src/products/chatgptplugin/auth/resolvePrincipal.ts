import { clerkClient } from '@clerk/nextjs/server'
import { pluginQuery } from '../shared/database'
import { ERP_CAPABILITIES, type ErpCapability, type ErpAccessProfile } from '@/products/erp/shared/professionalContracts'
import { PluginError, type PluginPrincipal, type PluginCompany } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'

export type VerifiedOAuthToken = {
  subject: string; clientId: string; scopes: string[]; revoked: boolean; expired: boolean; expiration: number | null
}
export function validateOAuthToken(token: VerifiedOAuthToken, config: PluginConfig) {
  const expirationMs = token.expiration === null ? null : token.expiration < 1e12 ? token.expiration * 1000 : token.expiration
  if (token.revoked || token.expired || (expirationMs !== null && (!Number.isFinite(expirationMs) || expirationMs <= Date.now()))
    || !token.subject.startsWith('user_') || !config.clientIds.includes(token.clientId)) {
    throw new PluginError('UNAUTHENTICATED', 'Token OAuth invalido ou expirado.', 401)
  }
  if (!token.scopes.includes(config.scope)) throw new PluginError('INSUFFICIENT_SCOPE', 'A conexao precisa da permissao erp:read.', 403)
}

export async function loadPluginPrincipal(clerkUserId: string, clientId: string, scopes: string[]): Promise<PluginPrincipal> {
  const rows = await pluginQuery<{
    user_id: string; tenant_id: string; tenant_name: string; role: string
    profile: ErpAccessProfile; capabilities: ErpCapability[]
  }>(
    `SELECT users.id::text AS user_id, tenants.id::text AS tenant_id, tenants.name AS tenant_name,
       memberships.role, memberships.erp_profile_id AS profile,
       COALESCE(array_agg(permissions.capability) FILTER (WHERE permissions.capability IS NOT NULL), ARRAY[]::text[]) AS capabilities
     FROM shared.users AS users
     JOIN shared.tenant_memberships AS memberships ON memberships.user_id = users.id
     JOIN shared.tenants AS tenants ON tenants.id = memberships.tenant_id
     LEFT JOIN shared.erp_profile_permissions AS permissions ON permissions.profile_id = memberships.erp_profile_id
     WHERE users.clerk_user_id = $1 AND memberships.status = 'active' AND tenants.status = 'active'
       AND memberships.role IN ('owner','admin','member','viewer')
     GROUP BY users.id, tenants.id, tenants.name, memberships.role, memberships.erp_profile_id
     ORDER BY tenants.id`, [clerkUserId],
  )
  if (!rows.length) throw new PluginError('ACCESS_DENIED', 'Usuario sem vinculo ativo com uma empresa do ERP.', 403)
  const companies: PluginCompany[] = rows.map(row => ({
    id: Number(row.tenant_id), name: row.tenant_name,
    profile: row.profile || (['owner', 'admin'].includes(row.role) ? 'administrador' : 'consulta'),
    capabilities: ['owner', 'admin'].includes(row.role) ? [...ERP_CAPABILITIES]
      : row.capabilities.filter(c => ERP_CAPABILITIES.includes(c)),
  }))
  return { userId: Number(rows[0].user_id), clerkUserId, clientId, scopes, companies }
}

export async function resolvePluginPrincipal(request: Request, config: PluginConfig): Promise<PluginPrincipal> {
  const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') || '')
  if (!match || match[1].length > 8192) throw new PluginError('UNAUTHENTICATED', 'Conecte sua conta do ERP.', 401)
  if (!process.env.CLERK_SECRET_KEY || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    throw new PluginError('CONFIGURATION_REQUIRED', 'Configure as credenciais do Clerk.', 503)
  }
  const encodedHost = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.split('_')[2] || ''
  const clerkHost = Buffer.from(encodedHost,'base64').toString('utf8').replace(/\$$/,'')
  if (clerkHost !== new URL(config.issuer).hostname) {
    throw new PluginError('CONFIGURATION_REQUIRED', 'O emissor OAuth deve pertencer a instancia Clerk configurada.', 503)
  }
  // A API da instancia Clerk verifica validade e revogacao, sem cookies de sessao.
  const client = await clerkClient()
  let token: VerifiedOAuthToken
  try { token = await client.idPOAuthAccessToken.verify(match[1]) }
  catch (error) {
    const status = (error as { status?: number }).status
    if (status === 400 || status === 401 || status === 404) throw new PluginError('UNAUTHENTICATED', 'Token OAuth invalido.', 401)
    throw new PluginError('AUTH_UNAVAILABLE', 'Autenticacao temporariamente indisponivel.', 503)
  }
  validateOAuthToken(token, config)
  return loadPluginPrincipal(token.subject, token.clientId, token.scopes)
}
