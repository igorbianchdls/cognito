import crypto from 'node:crypto'

type JsonRecord = Record<string, unknown>

type SignedPayload = {
  kind: 'authorization_code' | 'access_token'
  exp: number
  iat: number
  tenantId: number
  scope: string
  clientId?: string
  redirectUri?: string
  codeChallenge?: string
  codeChallengeMethod?: string
}

const DEFAULT_SCOPE = 'dashboards:read dashboards:write'
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30
const AUTH_CODE_TTL_SECONDS = 60 * 10

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

function base64UrlDecode(input: string) {
  const padded = input + '='.repeat((4 - (input.length % 4)) % 4)
  return Buffer.from(padded.replaceAll('-', '+').replaceAll('_', '/'), 'base64')
}

function getOAuthSecret() {
  return String(
    process.env.COGNITO_CLAUDE_APP_OAUTH_SECRET ||
      process.env.COGNITO_PLUGIN_OAUTH_SECRET ||
      process.env.COGNITO_MCP_APPS_OAUTH_SECRET ||
      process.env.COGNITO_MCP_TOKEN ||
      '',
  ).trim()
}

function getDefaultTenantId() {
  const tenantId = Number.parseInt(String(process.env.DEFAULT_TENANT_ID || '').trim(), 10)
  return Number.isFinite(tenantId) && tenantId > 0 ? tenantId : 1
}

function timingSafeTextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function signPayload(payload: SignedPayload) {
  const secret = getOAuthSecret()
  if (!secret) throw new Error('COGNITO_CLAUDE_APP_OAUTH_SECRET ou COGNITO_MCP_TOKEN nao configurado')

  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = base64UrlEncode(
    crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest(),
  )

  return `${body}.${signature}`
}

function verifySignedPayload(token: string): SignedPayload | null {
  const secret = getOAuthSecret()
  if (!secret) return null

  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expectedSignature = base64UrlEncode(
    crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest(),
  )

  if (!timingSafeTextEqual(signature, expectedSignature)) return null

  try {
    const payload = JSON.parse(base64UrlDecode(body).toString('utf8')) as SignedPayload
    if (!payload || typeof payload !== 'object') return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

function getRequestOrigin(req: Request) {
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  return host ? `${proto}://${host}` : null
}

export function getClaudeAppBaseUrl(req?: Request) {
  const explicitBaseUrl = String(
    process.env.COGNITO_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      '',
  ).trim()
  if (explicitBaseUrl) return explicitBaseUrl.replace(/\/+$/, '')

  const vercelUrl = String(process.env.VERCEL_URL || '').trim()
  if (vercelUrl) return `https://${vercelUrl.replace(/\/+$/, '')}`

  if (req) return getRequestOrigin(req)
  return null
}

export function getClaudeAppOAuthIssuer(req?: Request) {
  const baseUrl = getClaudeAppBaseUrl(req)
  return baseUrl ? `${baseUrl}/api/claude-app/oauth` : null
}

export function getClaudeAppOAuthAuthorizationServerMetadata(req: Request) {
  const issuer = getClaudeAppOAuthIssuer(req)
  if (!issuer) return null

  return {
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    registration_endpoint: `${issuer}/register`,
    response_types_supported: ['code'],
    response_modes_supported: ['query'],
    grant_types_supported: ['authorization_code'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
    code_challenge_methods_supported: ['S256', 'plain'],
    scopes_supported: ['dashboards:read', 'dashboards:write'],
    resource_parameter_supported: true,
    client_id_metadata_document_supported: false,
    service_documentation: `${getClaudeAppBaseUrl(req)}/api/claude-app/health`,
  }
}

export function getClaudeAppOAuthProtectedResourceMetadata(req: Request) {
  const baseUrl = getClaudeAppBaseUrl(req)
  const issuer = getClaudeAppOAuthIssuer(req)
  if (!baseUrl || !issuer) return null

  return {
    resource: `${baseUrl}/api/claude-app/mcp`,
    resource_name: 'Cognito Dashboards Claude App',
    authorization_servers: [issuer],
    scopes_supported: ['dashboards:read', 'dashboards:write'],
    bearer_methods_supported: ['header'],
    resource_documentation: `${baseUrl}/api/claude-app/health`,
  }
}

export function getClaudeAppOAuthWwwAuthenticateHeader(req: Request) {
  const baseUrl = getClaudeAppBaseUrl(req)
  if (!baseUrl) return 'Bearer scope="dashboards:read dashboards:write"'

  return [
    'Bearer',
    `resource_metadata="${baseUrl}/api/claude-app/.well-known/oauth-protected-resource"`,
    'scope="dashboards:read dashboards:write"',
  ].join(' ')
}

export function createClaudeOAuthAuthorizationCode(params: {
  clientId?: string
  redirectUri: string
  scope?: string
  codeChallenge?: string
  codeChallengeMethod?: string
}) {
  const now = Math.floor(Date.now() / 1000)
  return signPayload({
    kind: 'authorization_code',
    iat: now,
    exp: now + AUTH_CODE_TTL_SECONDS,
    tenantId: getDefaultTenantId(),
    scope: params.scope || DEFAULT_SCOPE,
    clientId: params.clientId,
    redirectUri: params.redirectUri,
    codeChallenge: params.codeChallenge,
    codeChallengeMethod: params.codeChallengeMethod,
  })
}

function verifyPkceChallenge(payload: SignedPayload, codeVerifier?: string) {
  if (!payload.codeChallenge) return true
  if (!codeVerifier) return false

  if (payload.codeChallengeMethod === 'plain') {
    return timingSafeTextEqual(payload.codeChallenge, codeVerifier)
  }

  const s256 = base64UrlEncode(crypto.createHash('sha256').update(codeVerifier).digest())
  return timingSafeTextEqual(payload.codeChallenge, s256)
}

export function exchangeClaudeOAuthAuthorizationCode(params: {
  code: string
  redirectUri?: string
  codeVerifier?: string
  clientId?: string
}) {
  const payload = verifySignedPayload(params.code)
  if (!payload || payload.kind !== 'authorization_code') return null
  if (payload.redirectUri && params.redirectUri && payload.redirectUri !== params.redirectUri) return null
  if (payload.clientId && params.clientId && payload.clientId !== params.clientId) return null
  if (!verifyPkceChallenge(payload, params.codeVerifier)) return null

  const now = Math.floor(Date.now() / 1000)
  const accessToken = signPayload({
    kind: 'access_token',
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
    tenantId: payload.tenantId,
    scope: payload.scope || DEFAULT_SCOPE,
    clientId: payload.clientId,
  })

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
    scope: payload.scope || DEFAULT_SCOPE,
  }
}

export function verifyClaudeAppOAuthAccessToken(token: string) {
  const payload = verifySignedPayload(token)
  if (!payload || payload.kind !== 'access_token') return null

  return {
    tenantId: payload.tenantId,
    scope: payload.scope,
  }
}

export function asJsonRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonRecord
}

export async function readOAuthRequestBody(req: Request) {
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      return asJsonRecord(await req.json())
    } catch {
      return {}
    }
  }

  const text = await req.text()
  const params = new URLSearchParams(text)
  const body: JsonRecord = {}
  for (const [key, value] of params.entries()) {
    body[key] = value
  }
  return body
}
