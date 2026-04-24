'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Calendar as UiCalendar } from '@/components/ui/calendar'
import { useData } from '@/products/bi/json-render/context'
import { DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS } from '@/products/artifacts/dashboard/contract/dashboardContract'
import {
  resolveDashboardDatePickerTheme,
  useDashboardHeaderScope,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'

type AnyRecord = Record<string, any>
type DatePickerPreset = (typeof DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS)[number]
type PickerInput = HTMLInputElement & { showPicker?: () => void }

function styleVal(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  return typeof value === 'number' ? `${value}px` : String(value)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function startOfQuarter(date: Date) {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3
  return new Date(date.getFullYear(), quarterStartMonth, 1)
}

function endOfQuarter(date: Date) {
  const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3
  return new Date(date.getFullYear(), quarterStartMonth + 3, 0)
}

function toISO(date: Date) {
  return date.toISOString().slice(0, 10)
}

function setByPath(prev: AnyRecord, path: string, value: unknown): AnyRecord {
  if (!path) return prev
  const parts = path
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean)
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

function pickerFontStyle(raw?: AnyRecord): React.CSSProperties {
  if (!raw || typeof raw !== 'object') return {}
  return {
    fontFamily: typeof raw.fontFamily === 'string' ? raw.fontFamily : undefined,
    fontSize: styleVal(raw.fontSize),
    fontWeight: raw.fontWeight,
    color: typeof raw.color === 'string' ? raw.color : undefined,
    letterSpacing: styleVal(raw.letterSpacing),
  }
}

function pickerButtonStyle(raw?: AnyRecord): React.CSSProperties {
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

function getPresetRange(preset: DatePickerPreset) {
  const today = new Date()
  if (preset === 'month') {
    return {
      from: toISO(startOfMonth(today)),
      to: toISO(endOfMonth(today)),
    }
  }
  if (preset === 'quarter') {
    return {
      from: toISO(startOfQuarter(today)),
      to: toISO(endOfQuarter(today)),
    }
  }
  const days = Number.parseInt(preset, 10)
  return {
    from: toISO(addDays(today, -(days - 1))),
    to: toISO(today),
  }
}

function isSameRange(a?: { from?: string; to?: string }, b?: { from?: string; to?: string }) {
  return String(a?.from || '') === String(b?.from || '') && String(a?.to || '') === String(b?.to || '')
}

function fmtDate(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function formatRangeLabel(value: { from?: string; to?: string }) {
  const from = fmtDate(value.from)
  const to = fmtDate(value.to)
  if (from && to) return `${from} ate ${to}`
  if (from) return from
  if (to) return to
  return 'Selecionar periodo'
}

function parseIsoDate(value?: string) {
  const raw = fmtDate(value)
  if (!raw) return undefined
  const [year, month, day] = raw.split('-').map((part) => Number(part))
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function formatDateLong(value?: string) {
  const date = parseIsoDate(value)
  if (!date) return ''
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function toLocalIso(date?: Date) {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function updateDateFilterMarkers(
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

function DateFieldWithIcon({
  value,
  onChange,
  fieldStyle,
  iconStyle,
}: {
  value: string
  onChange: (nextValue: string) => void
  fieldStyle?: React.CSSProperties
  iconStyle?: React.CSSProperties
}) {
  const inputRef = React.useRef<PickerInput | null>(null)
  const resolvedIconStyle = {
    ...(iconStyle || {}),
  } as React.CSSProperties
  const sizeMatch = String((resolvedIconStyle as AnyRecord).fontSize || '').match(/\d+/)
  const iconSize = sizeMatch ? Number(sizeMatch[0]) : 14

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        minWidth: 148,
        ...fieldStyle,
      }}
    >
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: 'inherit',
          font: 'inherit',
        }}
      />
      <button
        type="button"
        aria-label="Abrir seletor de data"
        onClick={() => {
          inputRef.current?.showPicker?.()
          inputRef.current?.focus()
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          ...resolvedIconStyle,
        }}
      >
        <CalendarIcon size={iconSize} />
      </button>
    </div>
  )
}

function DateRangeSummaryField({
  value,
  onClick,
  fieldStyle,
  iconStyle,
}: {
  value: { from?: string; to?: string }
  onClick: () => void
  fieldStyle?: React.CSSProperties
  iconStyle?: React.CSSProperties
}) {
  const resolvedIconStyle = {
    ...(iconStyle || {}),
  } as React.CSSProperties
  const sizeMatch = String((resolvedIconStyle as AnyRecord).fontSize || '').match(/\d+/)
  const iconSize = sizeMatch ? Number(sizeMatch[0]) : 14

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: 220,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        ...fieldStyle,
      }}
    >
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
          flex: 1,
        }}
      >
        {formatRangeLabel(value)}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
          flexShrink: 0,
          ...resolvedIconStyle,
        }}
      >
        <CalendarIcon size={iconSize} />
      </span>
    </button>
  )
}

export default function DashboardDatePicker({
  element,
  onAction,
}: {
  element: any
  onAction?: (action: any) => void
}) {
  const { setData, getValueByPath } = useData()
  const isInHeader = useDashboardHeaderScope()
  const { appearanceOverrides, themeName } = useDashboardThemeSelection()
  const theme = resolveDashboardDatePickerTheme(themeName, isInHeader ? appearanceOverrides : undefined)
  const [customPickerOpen, setCustomPickerOpen] = React.useState(false)
  const [customDatePickerOpen, setCustomDatePickerOpen] = React.useState(false)
  const customPickerRef = React.useRef<HTMLDivElement | null>(null)
  const customPickerLayerRef = React.useRef<HTMLDivElement | null>(null)
  const [customPickerPopoverPosition, setCustomPickerPopoverPosition] = React.useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(undefined)
  const [draftMonth, setDraftMonth] = React.useState<Date>(new Date())
  const [draftStartTime, setDraftStartTime] = React.useState('00:00')
  const [draftEndTime, setDraftEndTime] = React.useState('23:59')
  const props = (element?.props || {}) as AnyRecord
  const styles = (props.style || {}) as AnyRecord

  const label = typeof props.label === 'string' ? props.label : undefined
  const mode = props.mode === 'single' ? 'single' : 'range'
  const storePath = typeof props.storePath === 'string' ? props.storePath.trim() : ''
  const dateTable = typeof props.table === 'string' ? props.table.trim() : ''
  const dateField = typeof props.field === 'string' ? props.field.trim() : ''
  const isSemanticDatePicker = Boolean(dateTable && dateField)
  const presets = (Array.isArray(props.presets) ? props.presets : ['7d', '30d', 'month'])
    .map((preset) => String(preset).trim())
    .filter(
      (preset): preset is DatePickerPreset =>
        DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS.includes(preset as DatePickerPreset),
    )

  const textStyle = pickerFontStyle(styles.textStyle as AnyRecord | undefined)
  const labelStyle = {
    ...theme.labelStyle,
    ...textStyle,
    ...(styles.labelStyle && typeof styles.labelStyle === 'object' ? styles.labelStyle : {}),
    ...(props.labelStyle && typeof props.labelStyle === 'object' ? props.labelStyle : {}),
  } as React.CSSProperties

  const containerStyle = {
    ...(theme.containerStyle || {}),
    ...(styles.containerStyle && typeof styles.containerStyle === 'object' ? styles.containerStyle : {}),
    ...(props.containerStyle && typeof props.containerStyle === 'object' ? props.containerStyle : {}),
  } as React.CSSProperties

  const fieldStyle = {
    ...theme.fieldStyle,
    ...textStyle,
    ...(styles.fieldStyle && typeof styles.fieldStyle === 'object' ? styles.fieldStyle : {}),
    ...(props.fieldStyle && typeof props.fieldStyle === 'object' ? props.fieldStyle : {}),
  } as React.CSSProperties

  const resolvedFieldBorder =
    typeof fieldStyle.border === 'string'
      ? fieldStyle.border
      : `1px solid ${typeof fieldStyle.borderColor === 'string' ? fieldStyle.borderColor : '#d7e3fa'}`
  const resolvedFieldBorderColor =
    typeof fieldStyle.borderColor === 'string'
      ? fieldStyle.borderColor
      : (() => {
          const match = String(resolvedFieldBorder).match(/solid\s+(.+)$/)
          return match?.[1] || '#d7e3fa'
        })()

  const iconStyle = {
    ...(theme.iconStyle || {}),
    ...(props.iconStyle && typeof props.iconStyle === 'object' ? props.iconStyle : {}),
  } as React.CSSProperties

  const baseButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.presetButtonStyle,
    cursor: 'pointer',
    transition: 'all 120ms ease',
    ...textStyle,
    ...pickerFontStyle((styles.presetButtonStyle || styles.buttonStyle) as AnyRecord | undefined),
    ...pickerButtonStyle((styles.presetButtonStyle || styles.buttonStyle || {}) as AnyRecord),
    ...((props.presetButtonStyle && typeof props.presetButtonStyle === 'object')
      ? props.presetButtonStyle
      : (props.buttonStyle && typeof props.buttonStyle === 'object' ? props.buttonStyle : {})),
    paddingLeft: 12,
    paddingRight: 12,
    border: 'none',
    boxShadow: 'none',
  } as React.CSSProperties

  const activePresetButtonStyle = {
    ...theme.activePresetButtonStyle,
    ...pickerFontStyle(styles.activePresetButtonStyle as AnyRecord | undefined),
    ...pickerButtonStyle((styles.activePresetButtonStyle || {}) as AnyRecord),
    ...(props.activePresetButtonStyle && typeof props.activePresetButtonStyle === 'object'
      ? props.activePresetButtonStyle
      : {}),
    padding: '0 14px',
    fontWeight: 600,
    border: 'none',
    boxShadow: 'none',
  } as React.CSSProperties

  const basePresetFrameStyle = {
    display: 'inline-flex',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    border: resolvedFieldBorder,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: resolvedFieldBorderColor,
    borderRadius: 10,
    backgroundColor: typeof fieldStyle.backgroundColor === 'string' ? fieldStyle.backgroundColor : '#ffffff',
    overflow: 'hidden',
    flexShrink: 0,
  } as React.CSSProperties

  const activePresetFrameStyle = {
    ...basePresetFrameStyle,
    borderColor:
      typeof activePresetButtonStyle.borderColor === 'string'
        ? activePresetButtonStyle.borderColor
        : resolvedFieldBorderColor,
    backgroundColor:
      typeof activePresetButtonStyle.backgroundColor === 'string'
        ? activePresetButtonStyle.backgroundColor
        : basePresetFrameStyle.backgroundColor,
  } as React.CSSProperties

  const separatorStyle = {
    ...theme.separatorStyle,
    ...(styles.separatorStyle && typeof styles.separatorStyle === 'object' ? styles.separatorStyle : {}),
    ...(props.separatorStyle && typeof props.separatorStyle === 'object' ? props.separatorStyle : {}),
  } as React.CSSProperties

  function buildDateFilterMeta(value: string | { from: string; to: string }) {
    if (!isSemanticDatePicker) return undefined
    if (mode === 'single') {
      const singleValue = typeof value === 'string' ? value : ''
      return {
        table: dateTable,
        field: dateField,
        mode: 'single',
        ...(singleValue ? { value: singleValue } : {}),
      }
    }
    const range = value && typeof value === 'object' ? value : {}
    const from = fmtDate((range as AnyRecord).from)
    const to = fmtDate((range as AnyRecord).to)
    return {
      table: dateTable,
      field: dateField,
      mode: 'range',
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }
  }

  function resolveStoredDatePickerValue() {
    if (storePath) return getValueByPath(storePath, undefined)
    if (!isSemanticDatePicker) return undefined
    const raw = getValueByPath('filters.__date', undefined)
    const marker = Array.isArray(raw)
      ? raw.find((entry) => entry?.table === dateTable && entry?.field === dateField)
      : raw
    if (!marker || marker.table !== dateTable || marker.field !== dateField) return undefined
    if (mode === 'single') return typeof marker.value === 'string' ? marker.value : undefined
    return {
      from: fmtDate(marker.from),
      to: fmtDate(marker.to),
    }
  }

  function buildDatePickerAction(value: string | { from: string; to: string }) {
    if (!props.actionOnChange || typeof props.actionOnChange !== 'object') return null
    const dateFilter = buildDateFilterMeta(value)
    const dateRange =
      mode === 'single'
        ? (() => {
            const selected = typeof value === 'string' ? value : ''
            return selected ? { from: selected, to: selected } : undefined
          })()
        : (() => {
            const range = value && typeof value === 'object' ? value : {}
            const from = fmtDate((range as AnyRecord).from)
            const to = fmtDate((range as AnyRecord).to)
            return from || to ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : undefined
          })()
    return {
      ...(props.actionOnChange as AnyRecord),
      ...(dateRange ? { dateRange } : {}),
      ...(dateFilter ? { dateFilter } : {}),
    }
  }

  const storedValue = resolveStoredDatePickerValue()
  const currentValue =
    mode === 'single'
      ? typeof storedValue === 'string'
        ? storedValue
        : typeof (storedValue as AnyRecord | undefined)?.value === 'string'
          ? (storedValue as AnyRecord).value
          : ''
      : {
          from: fmtDate((storedValue as AnyRecord | undefined)?.from),
          to: fmtDate((storedValue as AnyRecord | undefined)?.to),
        }

  React.useEffect(() => {
    if (!customPickerOpen) return
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node | null
      const isInsideTrigger = Boolean(customPickerRef.current && target && customPickerRef.current.contains(target))
      const isInsidePopover = Boolean(customPickerLayerRef.current && target && customPickerLayerRef.current.contains(target))
      if (!isInsideTrigger && !isInsidePopover) {
        setCustomPickerOpen(false)
        setCustomDatePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [customPickerOpen])

  React.useEffect(() => {
    if (!customPickerOpen) {
      setCustomPickerPopoverPosition(null)
      return
    }
    updateCustomPickerPopoverPosition()
    function handleViewportChange() {
      updateCustomPickerPopoverPosition()
    }
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [customPickerOpen])

  function updateValue(nextValue: string | { from: string; to: string }) {
    const dateFilter = buildDateFilterMeta(nextValue)
    const action = buildDatePickerAction(nextValue)
    setData((prev: AnyRecord) => {
      let next = prev || {}
      if (storePath) next = setByPath(next, storePath, nextValue)
      if (isSemanticDatePicker) next = updateDateFilterMarkers(next, dateFilter, dateTable, dateField)
      return next
    })
    if (action) {
      onAction?.(action)
      return
    }
    onAction?.({
      type: 'datePickerChange',
      table: dateTable,
      field: dateField,
      mode,
      value: nextValue,
      ...(dateFilter ? { dateFilter } : {}),
    })
  }

  function applyPreset(preset: DatePickerPreset) {
    const nextRange = getPresetRange(preset)
    updateValue(mode === 'single' ? nextRange.to : nextRange)
    setCustomDatePickerOpen(false)
    setCustomPickerOpen(false)
  }

  function applyDraftRange() {
    const from = toLocalIso(draftRange?.from)
    const to = toLocalIso(draftRange?.to || draftRange?.from)
    if (!from && !to) return
    updateValue({
      from,
      to,
    })
    setCustomPickerOpen(false)
  }

  const selectedPreset =
    mode === 'range'
      ? presets.find((preset) => isSameRange(currentValue as AnyRecord, getPresetRange(preset)))
      : undefined

  const singleValue = typeof currentValue === 'string' ? currentValue : ''
  const rangeValue = typeof currentValue === 'object' ? currentValue : {}
  const triggerLabel =
    mode === 'single'
      ? singleValue || 'Selecionar data'
      : rangeValue.from && rangeValue.to
        ? `${rangeValue.from} ate ${rangeValue.to}`
        : rangeValue.from
          ? `${rangeValue.from} ate ...`
          : rangeValue.to
          ? `... ate ${rangeValue.to}`
            : 'Selecionar periodo'
  const localTimeZone =
    typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      : 'UTC'

  React.useEffect(() => {
    if (!customPickerOpen || mode !== 'range') return
    const fromDate = parseIsoDate(rangeValue.from)
    const toDate = parseIsoDate(rangeValue.to)
    const draftFrom = fromDate || toDate
    setDraftRange(
      draftFrom
        ? {
            from: draftFrom,
            ...(toDate ? { to: toDate } : {}),
          }
        : undefined,
    )
    setDraftMonth(fromDate || toDate || new Date())
    setDraftStartTime('00:00')
    setDraftEndTime('23:59')
  }, [customPickerOpen, mode, rangeValue.from, rangeValue.to])

  function updateCustomPickerPopoverPosition() {
    if (typeof window === 'undefined') return
    const anchor = customPickerRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const width = Math.min(Math.max(320, rect.width), Math.max(220, viewportWidth - 16))
    const left = Math.min(Math.max(8, rect.left), Math.max(8, viewportWidth - width - 8))
    setCustomPickerPopoverPosition({
      top: rect.bottom + 8,
      left,
      width,
    })
  }

  const customPickerPopover =
    customPickerOpen && customPickerPopoverPosition
      ? createPortal(
          <div
            ref={customPickerLayerRef}
            style={{
              position: 'fixed',
              top: customPickerPopoverPosition.top,
              left: customPickerPopoverPosition.left,
              zIndex: 1000,
              width: customPickerPopoverPosition.width,
              maxWidth: 'min(92vw, 420px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: 12,
              ...theme.popoverStyle,
            }}
          >
            {presets.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {presets.map((preset) => {
                  const isActive =
                    preset === selectedPreset ||
                    (mode === 'single' &&
                      singleValue === getPresetRange(preset).to &&
                      !isSemanticDatePicker)
                  return (
                    <div
                      key={preset}
                      style={{ ...(isActive ? activePresetFrameStyle : basePresetFrameStyle) }}
                    >
                      <button
                        type="button"
                        onClick={() => applyPreset(preset)}
                        style={{
                          ...baseButtonStyle,
                          ...(isActive ? activePresetButtonStyle : null),
                          display: 'inline-flex',
                          alignItems: 'center',
                          width: 'auto',
                          justifyContent: 'flex-start',
                          padding: '0 14px',
                          fontWeight: isActive ? 600 : (baseButtonStyle.fontWeight ?? 500),
                        }}
                      >
                        {preset}
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {mode === 'range' ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  borderTop: '1px solid rgba(148, 163, 184, 0.16)',
                  paddingTop: 2,
                }}
              >
                <div
                  style={{
                    border: '1px solid rgba(148, 163, 184, 0.16)',
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.92)',
                    padding: '10px 10px 4px',
                  }}
                >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <UiCalendar
                    mode="range"
                    month={draftMonth}
                    onMonthChange={setDraftMonth}
                    selected={draftRange}
                    onSelect={(nextRange) => {
                      setDraftRange(nextRange)
                      if (nextRange?.from && (!nextRange.to || nextRange.from.getMonth() !== draftMonth.getMonth() || nextRange.from.getFullYear() !== draftMonth.getFullYear())) {
                        setDraftMonth(nextRange.from)
                      }
                    }}
                    showOutsideDays
                    className="w-full bg-transparent p-0"
                    classNames={{
                      root: 'w-full',
                      month: 'w-full gap-3',
                      month_caption: 'flex items-center justify-center h-8 px-8 text-sm font-semibold text-slate-800',
                      nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
                      button_previous: 'h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                      button_next: 'h-8 w-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                      weekdays: 'mt-2 flex',
                      weekday: 'flex-1 text-[11px] font-medium uppercase tracking-[0.04em] text-slate-400',
                      week: 'mt-1 flex w-full',
                      day: 'relative aspect-square w-full p-0 text-center',
                      day_button:
                        'h-9 w-9 rounded-md border-0 text-sm font-medium text-slate-700 hover:bg-slate-100 data-[selected-single=true]:bg-slate-900 data-[selected-single=true]:text-white',
                      range_start: 'rounded-l-md bg-slate-100',
                      range_middle: 'bg-slate-100',
                      range_end: 'rounded-r-md bg-slate-100',
                      today: 'bg-slate-900 text-white rounded-md',
                      outside: 'text-slate-300',
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px', gap: 8, alignItems: 'end' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#475467' }}>Start</span>
                      <div
                        style={{
                          minHeight: 40,
                          border: '1px solid #E4E7EC',
                          borderRadius: 10,
                          padding: '0 12px',
                          display: 'flex',
                          alignItems: 'center',
                          background: '#FFFFFF',
                          color: draftRange?.from ? '#101828' : '#98A2B3',
                          fontSize: 14,
                        }}
                      >
                        {draftRange?.from ? formatDateLong(toLocalIso(draftRange.from)) : 'Start date'}
                      </div>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#475467' }}>&nbsp;</span>
                      <input
                        type="time"
                        value={draftStartTime}
                        onChange={(event) => setDraftStartTime(event.target.value)}
                        style={{
                          minHeight: 40,
                          border: '1px solid #E4E7EC',
                          borderRadius: 10,
                          padding: '0 12px',
                          background: '#FFFFFF',
                          color: '#101828',
                          fontSize: 14,
                        }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px', gap: 8, alignItems: 'end' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#475467' }}>End</span>
                      <div
                        style={{
                          minHeight: 40,
                          border: '1px solid #E4E7EC',
                          borderRadius: 10,
                          padding: '0 12px',
                          display: 'flex',
                          alignItems: 'center',
                          background: '#FFFFFF',
                          color: draftRange?.to || draftRange?.from ? '#101828' : '#98A2B3',
                          fontSize: 14,
                        }}
                      >
                        {draftRange?.to
                          ? formatDateLong(toLocalIso(draftRange.to))
                          : draftRange?.from
                            ? formatDateLong(toLocalIso(draftRange.from))
                            : 'End date'}
                      </div>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#475467' }}>&nbsp;</span>
                      <input
                        type="time"
                        value={draftEndTime}
                        onChange={(event) => setDraftEndTime(event.target.value)}
                        style={{
                          minHeight: 40,
                          border: '1px solid #E4E7EC',
                          borderRadius: 10,
                          padding: '0 12px',
                          background: '#FFFFFF',
                          color: '#101828',
                          fontSize: 14,
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={applyDraftRange}
                    disabled={!draftRange?.from}
                    style={{
                      minHeight: 42,
                      border: '1px solid #D0D5DD',
                      borderRadius: 10,
                      background: draftRange?.from ? '#F8FAFC' : '#F2F4F7',
                      color: draftRange?.from ? '#101828' : '#98A2B3',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: draftRange?.from ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Apply
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      color: '#667085',
                      fontSize: 12,
                    }}
                  >
                    <span>{`Local (${localTimeZone})`}</span>
                    <span aria-hidden="true">⌄</span>
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setCustomDatePickerOpen((prev) => !prev)}
                  style={{
                    ...baseButtonStyle,
                    display: 'inline-flex',
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '0 14px',
                    fontWeight: customDatePickerOpen ? 600 : (baseButtonStyle.fontWeight ?? 500),
                  }}
                >
                  <span>Data personalizada</span>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-flex',
                      transform: customDatePickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 160ms ease',
                    }}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4.5 6.5 8 10l3.5-3.5" />
                    </svg>
                  </span>
                </button>

                {customDatePickerOpen ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 8,
                      paddingTop: 2,
                    }}
                  >
                    <DateFieldWithIcon
                      value={singleValue}
                      onChange={(nextValue) => updateValue(nextValue)}
                      fieldStyle={fieldStyle}
                      iconStyle={iconStyle}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          minWidth: 0,
          ...containerStyle,
        }}
      >
        {label ? <div style={labelStyle}>{label}</div> : null}
        <div ref={customPickerRef} style={{ position: 'relative', minWidth: 220, width: '100%' }}>
          {mode === 'range' ? (
            <DateRangeSummaryField
              value={rangeValue}
              onClick={() => {
                setCustomPickerOpen((prev) => {
                  if (prev) setCustomDatePickerOpen(false)
                  return !prev
                })
              }}
              fieldStyle={fieldStyle}
              iconStyle={iconStyle}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setCustomPickerOpen((prev) => {
                  if (prev) setCustomDatePickerOpen(false)
                  return !prev
                })
              }}
              style={{
                ...fieldStyle,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...(iconStyle || {}) }}>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    width="1em"
                    height="1em"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2.25" y="3.25" width="11.5" height="10.5" rx="2" />
                    <path d="M5 1.75v3" />
                    <path d="M11 1.75v3" />
                    <path d="M2.5 6.25h11" />
                  </svg>
                </span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {triggerLabel}
                </span>
              </span>
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  ...(iconStyle || {}),
                  transform: customPickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 160ms ease',
                }}
              >
                <svg
                  viewBox="0 0 16 16"
                  width="1em"
                  height="1em"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.5 6.5 8 10l3.5-3.5" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>
      {customPickerPopover}
    </>
  )
}
