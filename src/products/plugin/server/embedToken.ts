import crypto from 'node:crypto'

type DashboardEmbedTokenPayload = {
  kind: 'dashboard_embed'
  artifactId: string
  iat: number
  exp: number
}

const DEFAULT_EMBED_TOKEN_TTL_SECONDS = 60 * 15

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

function getEmbedSecret() {
  return String(
    process.env.COGNITO_PLUGIN_EMBED_SECRET ||
      process.env.COGNITO_PLUGIN_OAUTH_SECRET ||
      process.env.COGNITO_MCP_APPS_EMBED_SECRET ||
      process.env.COGNITO_MCP_APPS_OAUTH_SECRET ||
      process.env.COGNITO_CHATGPT_APP_EMBED_SECRET ||
      process.env.COGNITO_CHATGPT_APP_OAUTH_SECRET ||
      process.env.COGNITO_CLAUDE_APP_EMBED_SECRET ||
      process.env.COGNITO_CLAUDE_APP_OAUTH_SECRET ||
      process.env.COGNITO_MCP_TOKEN ||
      '',
  ).trim()
}

function timingSafeTextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function signPayload(payload: DashboardEmbedTokenPayload) {
  const secret = getEmbedSecret()
  if (!secret) throw new Error('Secret de embed nao configurado')

  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = base64UrlEncode(
    crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest(),
  )

  return `${body}.${signature}`
}

function verifySignedPayload(token: string): DashboardEmbedTokenPayload | null {
  const secret = getEmbedSecret()
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
    const payload = JSON.parse(base64UrlDecode(body).toString('utf8')) as DashboardEmbedTokenPayload
    if (!payload || payload.kind !== 'dashboard_embed') return null
    if (!payload.artifactId) return null
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function createDashboardEmbedToken(artifactId: string, ttlSeconds = DEFAULT_EMBED_TOKEN_TTL_SECONDS) {
  const now = Math.floor(Date.now() / 1000)
  return signPayload({
    kind: 'dashboard_embed',
    artifactId,
    iat: now,
    exp: now + Math.max(60, ttlSeconds),
  })
}

export function verifyDashboardEmbedToken(token: string, artifactId: string) {
  const payload = verifySignedPayload(token)
  return Boolean(payload && payload.artifactId === artifactId)
}
