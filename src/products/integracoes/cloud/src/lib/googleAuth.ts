import { withRetry, type RetryOptions } from '@/products/integracoes/connectors/runtime/retry'
import crypto from 'crypto'

type MetadataTokenResponse = {
  access_token?: string
}

type ServiceAccountCredentials = {
  client_email?: string
  private_key?: string
  token_uri?: string
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function parseServiceAccountCredentials(value: string): ServiceAccountCredentials | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const candidates = [
    trimmed,
    trimmed.replace(
      /("private_key"\s*:\s*")([\s\S]*?)("\s*,\s*"client_email")/,
      (_match, prefix: string, privateKey: string, suffix: string) => `${prefix}${privateKey.replace(/\r?\n/g, '\\n')}${suffix}`,
    ),
    Buffer.from(trimmed, 'base64').toString('utf8'),
  ]

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as ServiceAccountCredentials
      }
    } catch {
      // Try the next format.
    }
  }

  return null
}

function getServiceAccountCredentials() {
  const raw = process.env.BIGQUERY_CREDENTIALS_JSON
    || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
    || ''
  const credentials = parseServiceAccountCredentials(raw)
  if (!credentials?.client_email || !credentials.private_key) return null
  return credentials
}

async function getServiceAccountAccessToken(): Promise<string | null> {
  const credentials = getServiceAccountCredentials()
  if (!credentials) return null

  const tokenUri = credentials.token_uri || 'https://oauth2.googleapis.com/token'
  const now = Math.floor(Date.now() / 1000)
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  }))
  const unsigned = `${header}.${payload}`
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(credentials.private_key)
  const assertion = `${unsigned}.${base64Url(signature)}`
  const body = new URLSearchParams()
  body.set('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer')
  body.set('assertion', assertion)

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(Number(process.env.GCP_TOKEN_TIMEOUT_MS || 10000)),
  })
  const payloadJson = await response.json().catch(() => null) as MetadataTokenResponse | { error?: string; error_description?: string } | null
  if (!response.ok) {
    const errorPayload = payloadJson as { error?: string; error_description?: string } | null
    throw new Error(errorPayload?.error_description || errorPayload?.error || `Falha ao obter token OAuth GCP: ${response.status}`)
  }

  return (payloadJson as MetadataTokenResponse | null)?.access_token || null
}

export async function getCloudAccessToken(): Promise<string> {
  const explicitToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN?.trim()
  if (explicitToken) return explicitToken

  const serviceAccountToken = await getServiceAccountAccessToken()
  if (serviceAccountToken) return serviceAccountToken

  const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
    headers: {
      'Metadata-Flavor': 'Google',
    },
    signal: AbortSignal.timeout(5000),
  })

  if (!response.ok) {
    throw new Error(`Falha ao obter token da metadata server: ${response.status}`)
  }

  const payload = await response.json() as MetadataTokenResponse
  if (!payload.access_token) {
    throw new Error('Metadata server nao retornou access_token')
  }

  return payload.access_token
}

export async function authorizedJsonRequest<T>(
  url: string,
  init: RequestInit & { allowNotFound?: boolean; timeoutMs?: number; retry?: RetryOptions } = {},
): Promise<{ status: number; ok: boolean; payload: T | null }> {
  const token = await getCloudAccessToken()
  const { allowNotFound, timeoutMs, retry, ...fetchInit } = init
  return withRetry(async () => {
    const nextResponse = await fetch(url, {
      ...fetchInit,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      signal: init.signal || AbortSignal.timeout(timeoutMs ?? Number(process.env.GCP_HTTP_TIMEOUT_MS || 30000)),
    })
    const payload = await nextResponse.json().catch(() => null) as T | null

    if (!nextResponse.ok && !(allowNotFound && nextResponse.status === 404)) {
      const errorPayload = payload as { error?: { message?: string } } | null
      const retryableError = new Error(errorPayload?.error?.message || `Falha na chamada GCP: ${nextResponse.status}`) as Error & { status?: number }
      retryableError.status = nextResponse.status
      throw retryableError
    }

    return { status: nextResponse.status, ok: nextResponse.ok, payload }
  }, {
    attempts: Number(process.env.GCP_HTTP_RETRY_ATTEMPTS || 3),
    ...retry,
  })
}
