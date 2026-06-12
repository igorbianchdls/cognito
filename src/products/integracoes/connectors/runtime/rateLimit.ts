const lastRequestByProvider = new Map<string, number>()

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function envRateLimitMs(provider: string) {
  const envKey = `INTEGRATIONS_RATE_LIMIT_${provider.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_MS`
  return Number(process.env[envKey] || process.env.INTEGRATIONS_RATE_LIMIT_DEFAULT_MS || 0)
}

export async function waitForProviderRateLimit(provider: string, minIntervalMs = envRateLimitMs(provider)): Promise<void> {
  if (!minIntervalMs || minIntervalMs <= 0) return

  const key = provider.trim().toLowerCase()
  const now = Date.now()
  const lastRequestAt = lastRequestByProvider.get(key) || 0
  const waitMs = Math.max(0, lastRequestAt + minIntervalMs - now)
  if (waitMs > 0) await delay(waitMs)
  lastRequestByProvider.set(key, Date.now())
}
