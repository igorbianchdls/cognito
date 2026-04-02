'use client'

import React from 'react'
import { Calendar } from 'lucide-react'

import { useData } from '@/products/bi/json-render/context'
import {
  applyDatePickerFieldFromCssVars,
  applyDatePickerIconFromCssVars,
  applyDatePickerLabelFromCssVars,
} from '@/products/bi/json-render/helpers'
import { useThemeOverrides } from '@/products/bi/json-render/theme/ThemeContext'
import { DASHBOARD_SUPPORTED_DATE_PICKER_PRESETS } from '@/products/artifacts/dashboard/contract/dashboardContract'

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
  const theme = useThemeOverrides()
  const inputRef = React.useRef<PickerInput | null>(null)
  const iconVars = (applyDatePickerIconFromCssVars(undefined, theme.cssVars) || {}) as React.CSSProperties
  const resolvedIconStyle = {
    ...iconVars,
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
        <Calendar size={iconSize} />
      </button>
    </div>
  )
}

export default function DashboardDatePicker({
  element,
  onAction,
}: {
  element: any
  onAction?: (action: any) => void
}) {
  const theme = useThemeOverrides()
  const { setData, getValueByPath } = useData()
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
    ...textStyle,
    ...(applyDatePickerLabelFromCssVars((styles.labelStyle || {}) as AnyRecord, theme.cssVars) || {}),
    ...(props.labelStyle && typeof props.labelStyle === 'object' ? props.labelStyle : {}),
  } as React.CSSProperties

  const containerStyle = {
    ...(styles.containerStyle && typeof styles.containerStyle === 'object' ? styles.containerStyle : {}),
    ...(props.containerStyle && typeof props.containerStyle === 'object' ? props.containerStyle : {}),
  } as React.CSSProperties

  const fieldStyle = {
    minHeight: 38,
    padding: '0 10px',
    border: '1px solid #d7e3fa',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    color: '#172033',
    ...textStyle,
    ...(applyDatePickerFieldFromCssVars((styles.fieldStyle || {}) as AnyRecord, theme.cssVars) || {}),
    ...(props.fieldStyle && typeof props.fieldStyle === 'object' ? props.fieldStyle : {}),
  } as React.CSSProperties

  const iconStyle = {
    ...(props.iconStyle && typeof props.iconStyle === 'object' ? props.iconStyle : {}),
  } as React.CSSProperties

  const baseButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    padding: '0 12px',
    border: '1px solid #d7e3fa',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    color: '#425572',
    cursor: 'pointer',
    transition: 'all 120ms ease',
    ...textStyle,
    ...pickerFontStyle((styles.presetButtonStyle || styles.buttonStyle) as AnyRecord | undefined),
    ...pickerButtonStyle((styles.presetButtonStyle || styles.buttonStyle || {}) as AnyRecord),
    ...((props.presetButtonStyle && typeof props.presetButtonStyle === 'object')
      ? props.presetButtonStyle
      : (props.buttonStyle && typeof props.buttonStyle === 'object' ? props.buttonStyle : {})),
  } as React.CSSProperties

  const activePresetButtonStyle = {
    backgroundColor: '#eaf1ff',
    borderColor: '#8fb3f5',
    color: '#1e4fbf',
    fontWeight: 600,
    ...pickerFontStyle(styles.activePresetButtonStyle as AnyRecord | undefined),
    ...pickerButtonStyle((styles.activePresetButtonStyle || {}) as AnyRecord),
    ...(props.activePresetButtonStyle && typeof props.activePresetButtonStyle === 'object'
      ? props.activePresetButtonStyle
      : {}),
  } as React.CSSProperties

  const separatorStyle = {
    ...labelStyle,
    color: labelStyle.color || '#64748b',
    fontSize: 13,
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
  }

  const selectedPreset =
    mode === 'range'
      ? presets.find((preset) => isSameRange(currentValue as AnyRecord, getPresetRange(preset)))
      : undefined

  return (
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
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
        }}
      >
        {mode === 'single' ? (
          <DateFieldWithIcon
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(nextValue) => updateValue(nextValue)}
            fieldStyle={fieldStyle}
            iconStyle={iconStyle}
          />
        ) : (
          <>
            <DateFieldWithIcon
              value={typeof currentValue === 'object' ? currentValue.from || '' : ''}
              onChange={(nextValue) =>
                updateValue({
                  from: nextValue,
                  to: typeof currentValue === 'object' ? currentValue.to || '' : '',
                })
              }
              fieldStyle={fieldStyle}
              iconStyle={iconStyle}
            />
            <span style={separatorStyle}>ate</span>
            <DateFieldWithIcon
              value={typeof currentValue === 'object' ? currentValue.to || '' : ''}
              onChange={(nextValue) =>
                updateValue({
                  from: typeof currentValue === 'object' ? currentValue.from || '' : '',
                  to: nextValue,
                })
              }
              fieldStyle={fieldStyle}
              iconStyle={iconStyle}
            />
          </>
        )}

        {presets.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {presets.map((preset) => {
              const isActive =
                preset === selectedPreset ||
                (mode === 'single' &&
                  typeof currentValue === 'string' &&
                  currentValue === getPresetRange(preset).to &&
                  !isSemanticDatePicker)
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  style={{
                    ...baseButtonStyle,
                    ...(isActive ? activePresetButtonStyle : null),
                  }}
                >
                  {preset}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
