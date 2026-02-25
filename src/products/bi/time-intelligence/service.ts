import type { BiDateRange, BiTimePreset } from './types'

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function startOfMonth(reference: Date): Date {
  return new Date(reference.getFullYear(), reference.getMonth(), 1)
}

function endOfMonth(reference: Date): Date {
  return new Date(reference.getFullYear(), reference.getMonth() + 1, 0)
}

export function buildDateRangeFromPreset(preset: BiTimePreset, referenceDate = new Date()): BiDateRange {
  const d = new Date(referenceDate)
  switch (preset) {
    case 'today':
      return { from: toIsoDate(d), to: toIsoDate(d) }
    case 'yesterday': {
      const y = new Date(d)
      y.setDate(y.getDate() - 1)
      return { from: toIsoDate(y), to: toIsoDate(y) }
    }
    case 'this-month':
      return { from: toIsoDate(startOfMonth(d)), to: toIsoDate(endOfMonth(d)) }
    case 'last-month': {
      const lm = new Date(d.getFullYear(), d.getMonth() - 1, 1)
      return { from: toIsoDate(startOfMonth(lm)), to: toIsoDate(endOfMonth(lm)) }
    }
    case 'this-year':
      return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` }
    case 'last-year': {
      const y = d.getFullYear() - 1
      return { from: `${y}-01-01`, to: `${y}-12-31` }
    }
    case 'rolling-12-months': {
      const end = endOfMonth(d)
      const start = new Date(end.getFullYear(), end.getMonth() - 11, 1)
      return { from: toIsoDate(start), to: toIsoDate(end) }
    }
    default:
      return { from: toIsoDate(startOfMonth(d)), to: toIsoDate(endOfMonth(d)) }
  }
}

