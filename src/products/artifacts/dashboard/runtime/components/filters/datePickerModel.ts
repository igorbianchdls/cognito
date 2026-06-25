import type React from 'react'

import { DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS } from '@/products/artifacts/dashboard/language/dashboardLanguageManifest'

type AnyRecord = Record<string, any>
export type DatePickerPreset = (typeof DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS)[number]

function styleVal(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  return typeof value === 'number' ? `${value}px` : String(value)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toISO(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function setByPath(prev: AnyRecord, path: string, value: unknown): AnyRecord {
  if (!path) return prev
  const parts = path.split('.').map((part) => part.trim()).filter(Boolean)
  if (parts.length === 0) return prev

  const root: AnyRecord = Array.isArray(prev) ? [...prev] : { ...(prev || {}) }
  let curr: AnyRecord = root
  for (let index = 0; index < parts.length; index += 1) {
    const key = parts[index]
    if (index === parts.length - 1) {
      if (value === undefined) delete curr[key]
      else curr[key] = value
      return root
    }
    curr[key] = curr[key] && typeof curr[key] === 'object' ? { ...curr[key] } : {}
    curr = curr[key]
  }
  return root
}

export function pickerFontStyle(raw?: AnyRecord): React.CSSProperties {
  if (!raw || typeof raw !== 'object') return {}
  return {
    fontFamily: typeof raw.fontFamily === 'string' ? raw.fontFamily : undefined,
    fontSize: styleVal(raw.fontSize),
    fontWeight: raw.fontWeight,
    color: typeof raw.color === 'string' ? raw.color : undefined,
    letterSpacing: styleVal(raw.letterSpacing),
  }
}

export function pickerButtonStyle(raw?: AnyRecord): React.CSSProperties {
  if (!raw || typeof raw !== 'object') return {}
  return {
    backgroundColor: typeof raw.backgroundColor === 'string' ? raw.backgroundColor : undefined,
    color: typeof raw.color === 'string' ? raw.color : undefined,
    borderColor: typeof raw.borderColor === 'string' ? raw.borderColor : undefined,
    borderWidth: styleVal(raw.borderWidth),
    borderRadius: styleVal(raw.borderRadius),
    paddingTop: styleVal(raw.paddingY),
    paddingBottom: styleVal(raw.paddingY),
    paddingLeft: styleVal(raw.paddingX),
    paddingRight: styleVal(raw.paddingX),
    padding: styleVal(raw.padding),
    width: styleVal(raw.width),
    height: styleVal(raw.height),
    ...pickerFontStyle(raw),
  }
}

export function getPresetRange(preset: DatePickerPreset) {
  const today = new Date()
  if (preset === 'month') {
    return {
      from: toISO(new Date(today.getFullYear(), today.getMonth(), 1)),
      to: toISO(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
    }
  }
  if (preset === 'quarter') {
    const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
    return {
      from: toISO(new Date(today.getFullYear(), quarterStartMonth, 1)),
      to: toISO(new Date(today.getFullYear(), quarterStartMonth + 3, 0)),
    }
  }
  const days = Number.parseInt(preset, 10)
  return {
    from: toISO(addDays(today, -(days - 1))),
    to: toISO(today),
  }
}

export function isSameRange(a?: { from?: string; to?: string }, b?: { from?: string; to?: string }) {
  return String(a?.from || '') === String(b?.from || '') && String(a?.to || '') === String(b?.to || '')
}

export function fmtDate(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function formatRangeLabel(value: { from?: string; to?: string }) {
  const from = fmtDate(value.from)
  const to = fmtDate(value.to)
  if (from && to) return `${from} ate ${to}`
  if (from) return from
  if (to) return to
  return 'Selecionar periodo'
}

export function parseIsoDate(value?: string) {
  const raw = fmtDate(value)
  if (!raw) return undefined
  const [year, month, day] = raw.split('-').map((part) => Number(part))
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

export function formatDateLong(value?: string) {
  const date = parseIsoDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function toLocalIso(date?: Date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function updateDateFilterMarkers(
  prev: AnyRecord,
  marker: AnyRecord | undefined,
  dateTable: string,
  dateField: string,
): AnyRecord {
  const current: AnyRecord = Array.isArray(prev) ? [...prev] : { ...(prev || {}) }
  const raw = (current?.filters as AnyRecord | undefined)?.__date
  const entries = Array.isArray(raw)
    ? raw.filter((entry): entry is AnyRecord => entry != null && typeof entry === 'object')
    : raw && typeof raw === 'object'
      ? [raw as AnyRecord]
      : []

  const nextEntries = entries.filter((entry) => !(entry.table === dateTable && entry.field === dateField))
  if (marker) nextEntries.push(marker)
  return setByPath(current || {}, 'filters.__date', nextEntries.length === 0 ? undefined : nextEntries.length === 1 ? nextEntries[0] : nextEntries)
}
