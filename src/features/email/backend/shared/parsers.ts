export function splitCsv(value: string | null | undefined): string[] | undefined {
  if (!value) return undefined
  const list = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list.length > 0 ? list : undefined
}

export function parseAddressList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const list = value.map((v) => String(v || '').trim()).filter(Boolean)
    return list.length > 0 ? list : undefined
  }
  if (typeof value === 'string') {
    return splitCsv(value)
  }
  return undefined
}

export function parseBoolean(value: string | null): boolean | undefined {
  if (value == null) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}
