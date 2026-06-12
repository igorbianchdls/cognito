export type ProviderErrorKind =
  | 'auth'
  | 'rate_limit'
  | 'timeout'
  | 'validation'
  | 'not_found'
  | 'server'
  | 'network'
  | 'unknown'

export class ProviderError extends Error {
  kind: ProviderErrorKind
  provider: string
  resource?: string
  status?: number
  retryable: boolean
  details?: Record<string, unknown>

  constructor(input: {
    message: string
    kind?: ProviderErrorKind
    provider: string
    resource?: string
    status?: number
    retryable?: boolean
    details?: Record<string, unknown>
  }) {
    super(input.message)
    this.name = 'ProviderError'
    this.kind = input.kind || 'unknown'
    this.provider = input.provider
    this.resource = input.resource
    this.status = input.status
    this.retryable = input.retryable ?? false
    this.details = input.details
  }
}

export function classifyHttpStatus(status: number): { kind: ProviderErrorKind; retryable: boolean } {
  if (status === 401 || status === 403) return { kind: 'auth', retryable: false }
  if (status === 404) return { kind: 'not_found', retryable: false }
  if (status === 408 || status === 429) return { kind: 'rate_limit', retryable: true }
  if (status >= 500) return { kind: 'server', retryable: true }
  return { kind: 'unknown', retryable: false }
}
