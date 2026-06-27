import { waitForProviderRateLimit } from '@/products/integracoes/connectors/runtime/rateLimit'
import { withRetry, type RetryOptions } from '@/products/integracoes/connectors/runtime/retry'
import { classifyHttpStatus, ProviderError } from '@/products/integracoes/connectors/runtime/providerErrors'

export type ConnectorHttpRequest = {
  provider: string
  resource?: string
  url: string
  method?: string
  headers?: Record<string, string>
  body?: unknown
  timeoutMs?: number
  retry?: RetryOptions
  rateLimitMs?: number
}

export type ConnectorHttpResponse<T> = {
  status: number
  headers: Headers
  payload: T
}

function serializeBody(body: unknown) {
  if (body == null) return undefined
  if (typeof body === 'string' || body instanceof URLSearchParams || body instanceof FormData) return body
  return JSON.stringify(body)
}

function defaultHeaders(body: unknown): Record<string, string> {
  if (body == null || typeof body === 'string' || body instanceof URLSearchParams || body instanceof FormData) return {}
  return { 'Content-Type': 'application/json' }
}

function shouldRetryNetworkError(error: unknown) {
  if (error instanceof TypeError) return true
  if (!error || typeof error !== 'object') return false
  const status = Number((error as { status?: unknown }).status || 0)
  if (status === 408 || status === 409 || status === 425 || status === 429) return true
  if (status >= 500 && status <= 599) return true
  const code = String((error as { code?: unknown }).code || '')
  return code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EAI_AGAIN'
}

async function parsePayload<T>(response: Response): Promise<T> {
  const text = await response.text()
  if (!text) return null as T
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

function nestedMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (!value || typeof value !== 'object') return null

  if (Array.isArray(value)) {
    for (const item of value) {
      const message = nestedMessage(item)
      if (message) return message
    }
    return null
  }

  const record = value as Record<string, unknown>
  const directKeys = [
    'message',
    'mensagem',
    'error',
    'erro',
    'detail',
    'details',
    'descricao',
    'description',
    'title',
  ]
  for (const key of directKeys) {
    const message = nestedMessage(record[key])
    if (message) return message
  }

  return null
}

function providerFailureMessage(provider: string, status: number, payload: unknown) {
  const providerMessage = nestedMessage(payload)
  const suffix = providerMessage ? `: ${providerMessage.slice(0, 500)}` : ''
  return `Chamada ${provider} falhou com status ${status}${suffix}`
}

export async function connectorJsonRequest<T = unknown>(request: ConnectorHttpRequest): Promise<ConnectorHttpResponse<T>> {
  const timeoutMs = request.timeoutMs ?? Number(process.env.INTEGRATIONS_HTTP_TIMEOUT_MS || 30000)
  const retry = request.retry || {
    attempts: Number(process.env.INTEGRATIONS_HTTP_RETRY_ATTEMPTS || 3),
  }
  const customShouldRetry = retry.shouldRetry

  return withRetry(async () => {
    await waitForProviderRateLimit(request.provider, request.rateLimitMs)
    const response = await fetch(request.url, {
      method: request.method || 'GET',
      headers: {
        ...defaultHeaders(request.body),
        ...(request.headers || {}),
      },
      body: serializeBody(request.body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    const payload = await parsePayload<T>(response)

    if (!response.ok) {
      const classification = classifyHttpStatus(response.status)
      throw new ProviderError({
        provider: request.provider,
        resource: request.resource,
        status: response.status,
        kind: classification.kind,
        retryable: classification.retryable,
        message: providerFailureMessage(request.provider, response.status, payload),
        details: { payload },
      })
    }

    return {
      status: response.status,
      headers: response.headers,
      payload,
    }
  }, {
    ...retry,
    shouldRetry: (error, attempt) => {
      if (error instanceof ProviderError) return error.retryable
      return customShouldRetry ? customShouldRetry(error, attempt) : shouldRetryNetworkError(error)
    },
  })
}

export async function* paginateOffset<TPage>(input: {
  initialOffset?: number
  limit: number
  maxPages?: number
  loadPage: (params: { offset: number; limit: number; page: number }) => Promise<{
    items: unknown[]
    payload: TPage
    hasMore?: boolean
  }>
}) {
  let offset = input.initialOffset || 0
  let page = 1
  while (!input.maxPages || page <= input.maxPages) {
    const result = await input.loadPage({ offset, limit: input.limit, page })
    yield result
    if (result.hasMore === false || result.items.length < input.limit) return
    offset += input.limit
    page += 1
  }
}
