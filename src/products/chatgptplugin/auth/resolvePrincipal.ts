import { createHash } from 'node:crypto'
import { clerkClient, verifyToken } from '@clerk/nextjs/server'
import { pluginQuery } from '../shared/database'
import { type ErpCapability, type ErpAccessProfile } from '@/products/erp/shared/professionalContracts'
import { effectiveCapabilities } from '@/products/auth/server/accessPolicy'
import { PluginError, type PluginPrincipal, type PluginCompany } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'

export type VerifiedOAuthToken = {
  subject: string; clientId: string; scopes: string[]; revoked: boolean; expired: boolean; expiration: number | null
  issuer: string; audience: unknown
}
export function validateOAuthToken(token: VerifiedOAuthToken, config: PluginConfig) {
  const expirationMs = token.expiration === null ? null : token.expiration < 1e12 ? token.expiration * 1000 : token.expiration
  const audiences = typeof token.audience === 'string' ? [token.audience] : token.audience
  // Motivos sem segredos: emissor, audiência e client_id são identificadores públicos.
  const reason = token.issuer !== config.issuer ? `issuer-mismatch:${token.issuer || 'ausente'}`
    : !Array.isArray(audiences) || !audiences.length ? 'audience-missing'
    : !audiences.every(item => typeof item === 'string' && item.length > 0) ? 'audience-malformed'
    : !audiences.includes(config.resource) ? `audience-mismatch:${audiences.join(' ')}`
    : token.revoked ? 'revoked'
    : token.expired || expirationMs === null || !Number.isFinite(expirationMs) || expirationMs <= Date.now() ? 'expired'
    : !token.subject.startsWith('user_') ? 'subject-not-user'
    : !config.clientIds.includes(token.clientId) ? `client-not-allowed:${token.clientId || 'ausente'}`
    : null
  if (reason) throw new PluginError('UNAUTHENTICATED', 'Token OAuth inválido ou expirado.', 401, reason)
  if (!token.scopes.includes(config.scope)) {
    throw new PluginError('INSUFFICIENT_SCOPE', 'A conexão precisa da permissão erp:read.', 403, `scopes:${token.scopes.join(' ') || 'nenhum'}`)
  }
}
// Cabeçalho e claims não verificados, usados apenas para explicar uma recusa nos logs.
function describeUnverifiedJwt(token: string): string {
  try {
    const [header, payload] = token.split('.').slice(0, 2).map(part => JSON.parse(Buffer.from(part, 'base64url').toString('utf8')))
    const aud = Array.isArray(payload.aud) ? payload.aud.join(' ') : payload.aud
    return `typ=${header.typ ?? 'ausente'} iss=${payload.iss ?? 'ausente'} aud=${aud ?? 'ausente'}`
  } catch { return 'jwt-ilegivel' }
}

type IntrospectedOAuthToken = Omit<VerifiedOAuthToken, 'issuer' | 'audience'>
export type OAuthVerificationDependencies = {
  verifyJwt: (token: string, options: Parameters<typeof verifyToken>[1]) => Promise<Record<string, unknown>>
  introspect: (token: string) => Promise<IntrospectedOAuthToken>
}
const oauthVerification: OAuthVerificationDependencies = {
  verifyJwt: verifyToken,
  introspect: async token => (await clerkClient()).idPOAuthAccessToken.verify(token),
}

export async function verifyClerkOAuthToken(accessToken: string, config: PluginConfig,
  dependencies: OAuthVerificationDependencies = oauthVerification): Promise<VerifiedOAuthToken> {
  // A introspeccao do SDK descarta aud/iss. Obtenha esses campos apenas do JWT verificado.
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken)) {
    // Tokens opacos do Clerk indicam que "Generate access tokens as JWTs" está desligado.
    throw new PluginError('UNAUTHENTICATED', 'Use um token OAuth com destino verificável.', 401, `opaque-token:${accessToken.slice(0, 4)}`)
  }
  let claims: Record<string, unknown>
  try {
    claims = await dependencies.verifyJwt(accessToken, {
      secretKey: process.env.CLERK_SECRET_KEY, audience: config.resource,
      headerType: ['at+jwt', 'application/at+jwt'], clockSkewInMs: 0,
    })
  } catch (error) {
    const reason = (error as { reason?: string })?.reason
    if (['jwk-remote-failed-to-load', 'jwk-failed-to-resolve', 'jwk-remote-invalid', 'secret-key-invalid'].includes(reason || '')) {
      throw new PluginError('AUTH_UNAVAILABLE', 'Autenticação temporariamente indisponível.', 503, `jwt:${reason}`)
    }
    throw new PluginError('UNAUTHENTICATED', 'Token OAuth inválido.', 401, `jwt:${reason || 'invalido'} ${describeUnverifiedJwt(accessToken)}`)
  }
  const scopes = Array.isArray(claims.scp) ? claims.scp : typeof claims.scope === 'string' ? claims.scope.split(' ').filter(Boolean) : []
  const verified: VerifiedOAuthToken = {
    subject: typeof claims.sub === 'string' ? claims.sub : '',
    clientId: typeof claims.client_id === 'string' ? claims.client_id : '',
    scopes: scopes.every(scope => typeof scope === 'string') ? scopes as string[] : [],
    issuer: typeof claims.iss === 'string' ? claims.iss : '', audience: claims.aud,
    revoked: false, expired: false, expiration: typeof claims.exp === 'number' ? claims.exp : null,
  }
  // O SDK ignora aud ausente; esta verificacao exige o recurso canonico, inclusive o caminho.
  validateOAuthToken(verified, config)
  let introspected: IntrospectedOAuthToken
  try { introspected = await dependencies.introspect(accessToken) }
  catch (error) {
    const status = (error as { status?: number })?.status
    if (status === 400 || status === 401 || status === 404) throw new PluginError('UNAUTHENTICATED', 'Token OAuth inválido.', 401, `introspection:${status}`)
    throw new PluginError('AUTH_UNAVAILABLE', 'Autenticação temporariamente indisponível.', 503, `introspection:${status ?? 'falha'}`)
  }
  const token = { ...introspected, issuer: verified.issuer, audience: verified.audience }
  validateOAuthToken(token, config)
  if (token.subject !== verified.subject || token.clientId !== verified.clientId
    || token.scopes.some(scope => !verified.scopes.includes(scope)) || verified.scopes.some(scope => !token.scopes.includes(scope))) {
    throw new PluginError('UNAUTHENTICATED', 'Token OAuth inconsistente.', 401, 'jwt-introspection-mismatch')
  }
  return token
}

export async function loadPluginPrincipal(clerkUserId: string, clientId: string, scopes: string[]): Promise<PluginPrincipal> {
  const rows = await pluginQuery<{
    user_id: string; email: string | null; full_name: string | null; empresa_id: string; tenant_name: string; role: string
    profile: ErpAccessProfile; capabilities: ErpCapability[]
  }>(
    `SELECT users.id::text AS user_id, users.email::text AS email, users.full_name::text AS full_name, tenants.id::text AS empresa_id, tenants.name AS tenant_name,
       memberships.role, memberships.perfil_acesso_id AS profile,
       COALESCE(array_agg(permissions.capability) FILTER (WHERE permissions.capability IS NOT NULL), ARRAY[]::text[]) AS capabilities
     FROM shared.usuarios AS users
     JOIN shared.usuarios_empresas AS memberships ON memberships.usuario_id = users.id
     JOIN shared.empresas AS tenants ON tenants.id = memberships.empresa_id
     LEFT JOIN shared.permissoes_perfil AS permissions ON permissions.perfil_acesso_id = memberships.perfil_acesso_id
     WHERE users.clerk_user_id = $1 AND users.status='active' AND memberships.status = 'active' AND NOT memberships.suspenso_localmente AND tenants.status = 'active'
       AND memberships.role IN ('owner','admin','member','viewer')
     GROUP BY users.id, users.email, users.full_name, tenants.id, tenants.name, memberships.role, memberships.perfil_acesso_id
     ORDER BY tenants.id`, [clerkUserId],
  )
  if (!rows.length) throw new PluginError('ACCESS_DENIED', 'Usuário sem vínculo ativo com uma empresa do ERP.', 403)
  const companies: PluginCompany[] = rows.map(row => ({
    id: Number(row.empresa_id), name: row.tenant_name,
    profile: row.profile || (['owner', 'admin'].includes(row.role) ? 'administrador' : 'consulta'),
    capabilities: effectiveCapabilities(row.role, row.capabilities),
  }))
  return { userId: Number(rows[0].user_id), clerkUserId, clientId, scopes, companies, name: rows[0].full_name, email: rows[0].email }
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
    throw new PluginError('CONFIGURATION_REQUIRED', 'O emissor OAuth deve pertencer à instância Clerk configurada.', 503)
  }
  const token = await cachedVerification(match[1], config)
  return loadPluginPrincipal(token.subject, token.clientId, token.scopes)
}

// Evita uma introspecção no Clerk a cada chamada da mesma conversa. Revogação passa a valer
// em até VERIFICATION_TTL_MS; expiração e configuração continuam conferidas a cada uso.
const VERIFICATION_TTL_MS = 30_000
const verifiedTokens = new Map<string, { token: VerifiedOAuthToken; until: number }>()
export async function cachedVerification(accessToken: string, config: PluginConfig,
  verify: typeof verifyClerkOAuthToken = verifyClerkOAuthToken): Promise<VerifiedOAuthToken> {
  const key = createHash('sha256').update(accessToken).digest('hex'), now = Date.now()
  const hit = verifiedTokens.get(key)
  if (hit && hit.until > now) {
    validateOAuthToken(hit.token, config)
    return hit.token
  }
  verifiedTokens.delete(key)
  const token = await verify(accessToken, config)
  const expirationMs = token.expiration! < 1e12 ? token.expiration! * 1000 : token.expiration!
  if (verifiedTokens.size >= 1000) verifiedTokens.delete(verifiedTokens.keys().next().value!)
  verifiedTokens.set(key, { token, until: Math.min(now + VERIFICATION_TTL_MS, expirationMs) })
  return token
}
