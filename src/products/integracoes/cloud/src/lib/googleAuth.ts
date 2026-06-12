import { withRetry, type RetryOptions } from '@/products/integracoes/connectors/runtime/retry'

type MetadataTokenResponse = {
  access_token?: string
}

export async function getCloudAccessToken(): Promise<string> {
  const explicitToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN?.trim()
  if (explicitToken) return explicitToken

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
