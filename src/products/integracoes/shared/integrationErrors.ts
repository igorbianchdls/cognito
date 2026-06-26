export type IntegrationErrorSource =
  | 'provider_oauth'
  | 'provider_api'
  | 'gcp_secret_manager'
  | 'gcp_auth'
  | 'gcp_api'
  | 'network'
  | 'internal'

export type IntegrationErrorInfo = {
  source: IntegrationErrorSource
  code: string
  safeMessage: string
  httpStatus?: number
  provider?: string
  operation?: string
  retryable?: boolean
  rawErrorRedacted?: Record<string, unknown>
}

const SECRET_KEYS = new Set([
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'client_secret',
  'clientSecret',
  'authorization',
  'Authorization',
  'assertion',
  'private_key',
  'privateKey',
])

export class IntegrationRuntimeError extends Error {
  info: IntegrationErrorInfo

  constructor(info: IntegrationErrorInfo) {
    super(info.safeMessage)
    this.name = 'IntegrationRuntimeError'
    this.info = info
  }
}

export function isIntegrationRuntimeError(error: unknown): error is IntegrationRuntimeError {
  return error instanceof IntegrationRuntimeError
}

function normalizeCode(value: unknown, fallback = 'unknown_error') {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return normalized || fallback
}

function redactValue(value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (value.length <= 12) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

export function redactErrorPayload(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEYS.has(key)) {
      out[key] = '[redacted]'
    } else if (item && typeof item === 'object' && !Array.isArray(item)) {
      out[key] = redactErrorPayload(item) || {}
    } else {
      out[key] = redactValue(item)
    }
  }
  return out
}

export function integrationErrorInfoFromUnknown(error: unknown): IntegrationErrorInfo {
  if (isIntegrationRuntimeError(error)) return error.info
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    if (record.name === 'ProviderError' || typeof record.kind === 'string') {
      const status = Number(record.status)
      const kind = String(record.kind || '')
      const provider = typeof record.provider === 'string' ? record.provider : undefined
      const code = status === 401 || status === 403 || kind === 'auth'
        ? 'unauthorized'
        : status ? `http_${status}` : normalizeCode(kind)
      return {
        source: kind === 'auth' ? 'provider_api' : 'provider_api',
        code,
        provider,
        httpStatus: Number.isFinite(status) ? status : undefined,
        safeMessage: error instanceof Error ? error.message : 'Falha na API do provider.',
        retryable: Boolean(record.retryable),
        rawErrorRedacted: redactErrorPayload(record.details),
      }
    }
  }
  if (error instanceof Error) {
    return {
      source: 'internal',
      code: normalizeCode(error.name || error.message),
      safeMessage: error.message || 'Falha interna de integracao.',
    }
  }
  return {
    source: 'internal',
    code: 'unknown_error',
    safeMessage: 'Falha interna de integracao.',
  }
}

export function createIntegrationRuntimeError(input: Omit<IntegrationErrorInfo, 'code'> & { code?: string }) {
  return new IntegrationRuntimeError({
    ...input,
    code: normalizeCode(input.code),
  })
}

export function isProviderReauthError(error: unknown) {
  const info = integrationErrorInfoFromUnknown(error)
  if (info.source !== 'provider_oauth' && info.source !== 'provider_api') return false
  return [
    'invalid_grant',
    'invalid_token',
    'unauthorized',
    'expired_token',
    'refresh_token_invalid',
  ].includes(info.code) || info.httpStatus === 401 || info.httpStatus === 403
}
