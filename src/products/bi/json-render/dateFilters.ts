type AnyRecord = Record<string, any>

export type DateFilterMarker = {
  table?: string
  field?: string
  mode?: 'range' | 'single' | string
  from?: string
  to?: string
  value?: string
}

function isObject(value: unknown): value is AnyRecord {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

export function getDateFilterMarkers(source: unknown): DateFilterMarker[] {
  const root = isObject(source) ? source : {}
  const filters = isObject(root.filters) ? root.filters : root
  const raw = filters.__date
  if (Array.isArray(raw)) return raw.filter((entry): entry is DateFilterMarker => isObject(entry))
  if (isObject(raw)) return [raw as DateFilterMarker]
  return []
}

export function getPrimaryDateRange(source: unknown): { from?: string; to?: string } | undefined {
  const markers = getDateFilterMarkers(source)
  const marker = markers[0]
  if (!marker) return undefined
  if (marker.mode === 'single') {
    const value = typeof marker.value === 'string' ? marker.value.trim() : ''
    return value ? { from: value, to: value } : undefined
  }
  const from = typeof marker.from === 'string' ? marker.from.trim() : ''
  const to = typeof marker.to === 'string' ? marker.to.trim() : ''
  return from || to ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : undefined
}

export function applyPrimaryDateRange(filters: AnyRecord, source: unknown): AnyRecord {
  const next = { ...(filters || {}) }
  if (next.de !== undefined || next.ate !== undefined) return next
  const range = getPrimaryDateRange(source)
  if (!range) return next
  if (range.from) next.de = range.from
  if (range.to) next.ate = range.to
  return next
}
