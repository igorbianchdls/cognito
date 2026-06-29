'use client'

export function styleDimension(value: unknown): string | number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) return value
  return undefined
}

export function toNumericLayoutValue(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}
