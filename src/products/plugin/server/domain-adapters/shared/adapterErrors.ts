export class DomainAdapterError extends Error {
  code: string
  details?: Record<string, unknown>

  constructor(message: string, options?: { code?: string; details?: Record<string, unknown> }) {
    super(message)
    this.name = 'DomainAdapterError'
    this.code = options?.code || 'domain_adapter_error'
    this.details = options?.details
  }
}
