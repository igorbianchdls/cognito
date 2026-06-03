import type { IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'

export type CredentialValidationResult = {
  ok: boolean
  serialized?: string
  normalized?: Record<string, unknown> | string
  error?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function parseCredentials(value: unknown): Record<string, unknown> | string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      const parsed = JSON.parse(trimmed) as unknown
      return isRecord(parsed) ? parsed : trimmed
    } catch {
      return trimmed
    }
  }
  return isRecord(value) ? value : null
}

function validateOmieCredentials(credentials: Record<string, unknown>): CredentialValidationResult {
  if (!nonEmptyString(credentials.app_key) || !nonEmptyString(credentials.app_secret)) {
    return {
      ok: false,
      error: 'Omie exige app_key e app_secret.',
    }
  }
  return {
    ok: true,
    normalized: {
      app_key: String(credentials.app_key).trim(),
      app_secret: String(credentials.app_secret).trim(),
    },
  }
}

function validateOAuthTokenCredentials(credentials: Record<string, unknown>): CredentialValidationResult {
  if (!nonEmptyString(credentials.accessToken) && !nonEmptyString(credentials.access_token)) {
    return {
      ok: false,
      error: 'Credenciais OAuth exigem accessToken.',
    }
  }
  return { ok: true, normalized: credentials }
}

export function validateProviderCredentials(provider: IntegrationProvider, value: unknown): CredentialValidationResult {
  const credentials = parseCredentials(value)
  if (credentials == null) {
    return {
      ok: false,
      error: 'Credenciais ausentes.',
    }
  }

  if (provider.slug === 'omie') {
    if (!isRecord(credentials)) return { ok: false, error: 'Credenciais Omie precisam ser um objeto.' }
    const result = validateOmieCredentials(credentials)
    return result.ok ? { ...result, serialized: JSON.stringify(result.normalized) } : result
  }

  if (provider.authType === 'oauth2') {
    if (!isRecord(credentials)) return { ok: false, error: 'Credenciais OAuth precisam ser um objeto.' }
    const result = validateOAuthTokenCredentials(credentials)
    return result.ok ? { ...result, serialized: JSON.stringify(result.normalized) } : result
  }

  const normalized = credentials
  return {
    ok: true,
    normalized,
    serialized: typeof normalized === 'string' ? normalized : JSON.stringify(normalized),
  }
}
