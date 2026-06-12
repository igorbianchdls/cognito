export type RetryOptions = {
  attempts?: number
  baseDelayMs?: number
  maxDelayMs?: number
  jitterRatio?: number
  shouldRetry?: (error: unknown, attempt: number) => boolean
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function defaultShouldRetry(error: unknown) {
  if (error && typeof error === 'object') {
    const status = 'status' in error ? Number((error as { status?: unknown }).status) : 0
    if (status === 408 || status === 409 || status === 425 || status === 429) return true
    if (status >= 500 && status <= 599) return true
    const code = 'code' in error ? String((error as { code?: unknown }).code || '') : ''
    if (code === 'ETIMEDOUT' || code === 'ECONNRESET' || code === 'EAI_AGAIN') return true
  }
  return error instanceof TypeError
}

function computeDelayMs(attempt: number, options: Required<Pick<RetryOptions, 'baseDelayMs' | 'maxDelayMs' | 'jitterRatio'>>) {
  const exponential = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** Math.max(0, attempt - 1))
  const jitter = exponential * options.jitterRatio * Math.random()
  return Math.round(exponential + jitter)
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3)
  const retryOptions = {
    baseDelayMs: options.baseDelayMs ?? 500,
    maxDelayMs: options.maxDelayMs ?? 8000,
    jitterRatio: options.jitterRatio ?? 0.25,
  }
  const shouldRetry = options.shouldRetry || defaultShouldRetry

  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt >= attempts || !shouldRetry(error, attempt)) throw error
      const delayMs = computeDelayMs(attempt, retryOptions)
      options.onRetry?.(error, attempt, delayMs)
      await delay(delayMs)
    }
  }

  throw lastError
}
