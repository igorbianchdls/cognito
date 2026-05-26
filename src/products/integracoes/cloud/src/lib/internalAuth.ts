import { timingSafeEqual } from 'node:crypto'

type HeaderValue = string | string[] | undefined

function headerValue(headers: Record<string, HeaderValue> | undefined, name: string): string | undefined {
  if (!headers) return undefined

  const value = headers[name] || headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0]
  return value
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false

  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function getInternalApiKey(): string | null {
  const value = process.env.INTEGRATIONS_INTERNAL_API_KEY?.trim()
  return value || null
}

export function isInternalRequestAuthorized(headers: Record<string, HeaderValue> | undefined): boolean {
  const expected = getInternalApiKey()
  if (!expected) return false

  const authorization = headerValue(headers, 'authorization')?.trim()
  const bearerPrefix = 'Bearer '
  if (authorization?.startsWith(bearerPrefix)) {
    return safeEquals(authorization.slice(bearerPrefix.length).trim(), expected)
  }

  const apiKey = headerValue(headers, 'x-internal-api-key')?.trim()
  return Boolean(apiKey && safeEquals(apiKey, expected))
}
