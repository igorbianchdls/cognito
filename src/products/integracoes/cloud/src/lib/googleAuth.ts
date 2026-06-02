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
  init: RequestInit & { allowNotFound?: boolean } = {},
): Promise<{ status: number; ok: boolean; payload: T | null }> {
  const token = await getCloudAccessToken()
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })

  const payload = await response.json().catch(() => null) as T | null
  if (!response.ok && !(init.allowNotFound && response.status === 404)) {
    const errorPayload = payload as { error?: { message?: string } } | null
    throw new Error(errorPayload?.error?.message || `Falha na chamada GCP: ${response.status}`)
  }

  return { status: response.status, ok: response.ok, payload }
}
