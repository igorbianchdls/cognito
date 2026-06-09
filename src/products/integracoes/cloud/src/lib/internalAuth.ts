import { createPublicKey, createVerify, timingSafeEqual, type KeyObject } from 'node:crypto'

type HeaderValue = string | string[] | undefined
type JwtPayload = {
  aud?: string | string[]
  email?: string
  email_verified?: boolean
  exp?: number
  iat?: number
  iss?: string
}
type JwtHeader = {
  alg?: string
  kid?: string
}
type CachedGoogleKeys = {
  expiresAt: number
  keys: Map<string, KeyObject>
}

let cachedGoogleKeys: CachedGoogleKeys | null = null

function headerValue(headers: Record<string, HeaderValue> | undefined, name: string): string | undefined {
  if (!headers) return undefined

  const value = headers[name] || headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0]
  return value
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function getInternalApiKey(): string | null {
  const value = process.env.INTEGRATIONS_INTERNAL_API_KEY?.trim()
  return value || null
}

function parseCsvEnv(name: string) {
  return String(process.env[name] || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function getDefaultControlApiUrl() {
  return 'https://integrations-control-api-305346154546.southamerica-east1.run.app'
}

function getAllowedOidcAudiences() {
  const configured = [
    ...parseCsvEnv('INTEGRATIONS_ALLOWED_OIDC_AUDIENCES'),
    ...parseCsvEnv('INTEGRATIONS_SCHEDULER_OIDC_AUDIENCE'),
  ]
  if (configured.length) return configured

  const baseUrl = String(process.env.INTEGRATIONS_CONTROL_API_URL || getDefaultControlApiUrl()).replace(/\/+$/, '')
  return [`${baseUrl}/scheduled-sync`]
}

function getAllowedOidcEmails() {
  const configured = parseCsvEnv('INTEGRATIONS_ALLOWED_OIDC_EMAILS')
  if (configured.length) return configured

  const projectId = process.env.GCP_PROJECT_ID || 'creatto-463117'
  return [`integrations-scheduler-invoker@${projectId}.iam.gserviceaccount.com`]
}

function parseJwtPart<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T
  } catch {
    return null
  }
}

async function getGoogleOidcKeys() {
  const now = Date.now()
  if (cachedGoogleKeys && cachedGoogleKeys.expiresAt > now) return cachedGoogleKeys.keys

  const response = await fetch('https://www.googleapis.com/oauth2/v3/certs', {
    signal: AbortSignal.timeout(Number(process.env.INTEGRATIONS_OIDC_CERTS_TIMEOUT_MS || 10000)),
  })
  if (!response.ok) throw new Error(`Falha ao carregar chaves OIDC Google: ${response.status}`)

  const payload = await response.json().catch(() => null) as { keys?: Array<JsonWebKey & { kid?: string }> } | null
  const keys = new Map<string, KeyObject>()
  for (const jwk of payload?.keys || []) {
    if (!jwk.kid) continue
    keys.set(jwk.kid, createPublicKey({ key: jwk, format: 'jwk' }))
  }

  const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 300)
  cachedGoogleKeys = {
    expiresAt: now + Math.max(60, maxAge) * 1000,
    keys,
  }
  return keys
}

function verifyJwtSignature(input: {
  signingInput: string
  signature: string
  key: KeyObject
}) {
  const verifier = createVerify('RSA-SHA256')
  verifier.update(input.signingInput)
  verifier.end()
  return verifier.verify(input.key, Buffer.from(input.signature, 'base64url'))
}

function validateGoogleOidcPayload(payload: JwtPayload) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') return false
  if (!payload.exp || payload.exp <= nowSeconds) return false
  if (payload.iat && payload.iat > nowSeconds + 60) return false

  const audiences = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : []
  if (!audiences.some((audience) => getAllowedOidcAudiences().includes(audience))) return false

  const email = String(payload.email || '').trim()
  if (!email || !getAllowedOidcEmails().includes(email)) return false
  if (payload.email_verified === false) return false

  return true
}

async function verifyGoogleOidcToken(token: string): Promise<boolean> {
  const [headerPart, payloadPart, signaturePart] = token.split('.')
  if (!headerPart || !payloadPart || !signaturePart) return false

  const header = parseJwtPart<JwtHeader>(headerPart)
  const payload = parseJwtPart<JwtPayload>(payloadPart)
  if (!header || !payload || header.alg !== 'RS256' || !header.kid) return false

  const key = (await getGoogleOidcKeys()).get(header.kid)
  if (!key) return false

  const signatureOk = verifyJwtSignature({
    signingInput: `${headerPart}.${payloadPart}`,
    signature: signaturePart,
    key,
  })
  return signatureOk && validateGoogleOidcPayload(payload)
}

export async function isInternalRequestAuthorized(
  headers: Record<string, HeaderValue> | undefined,
  options?: { allowGoogleOidc?: boolean },
): Promise<boolean> {
  const expected = getInternalApiKey()

  const authorization = headerValue(headers, 'authorization')?.trim()
  const bearerPrefix = 'Bearer '
  if (authorization?.startsWith(bearerPrefix)) {
    const token = authorization.slice(bearerPrefix.length).trim()
    if (expected && safeEquals(token, expected)) return true
    if (options?.allowGoogleOidc) {
      try {
        return await verifyGoogleOidcToken(token)
      } catch {
        return false
      }
    }
  }

  const apiKey = headerValue(headers, 'x-internal-api-key')?.trim()
  return Boolean(expected && apiKey && safeEquals(apiKey, expected))
}
