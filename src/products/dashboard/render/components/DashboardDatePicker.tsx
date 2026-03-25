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

type AnyRecord = Record<string, any>
type DatePickerPreset = '7d' | '14d' | '30d' | '90d' | 'month'
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
  const days = Number.parseInt(preset, 10)
  return {
    from: toISO(addDays(today, -(days - 1))),
    to: toISO(today),
  }
}

function isSameRange(a?: { from?: string; to?: string }, b?: { from?: string; to?: string }) {
  return String(a?.from || '') === String(b?.from || '') && String(a?.to || '') === String(b?.to || '')
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
        preset === '7d' || preset === '14d' || preset === '30d' || preset === '90d' || preset === 'month',
    )

  const textStyle = pickerFontStyle(styles.textStyle as AnyRecord | undefined)
  const labelStyle = {
    ...textStyle,
    ...(applyDatePickerLabelFromCssVars((styles.labelStyle || {}) as AnyRecord, theme.cssVars) || {}),
    ...(props.labelStyle && typeof props.labelStyle === 'object' ? props.labelStyle : {}),
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
    ...pickerButtonStyle(styles.presetButtonStyle as AnyRecord | undefined),
    ...(props.presetButtonStyle && typeof props.presetButtonStyle === 'object' ? props.presetButtonStyle : {}),
  } as React.CSSProperties

  const activePresetButtonStyle = {
    backgroundColor: '#eaf1ff',
    borderColor: '#8fb3f5',
    color: '#1e4fbf',
    fontWeight: 600,
    ...pickerButtonStyle(styles.activePresetButtonStyle as AnyRecord | undefined),
    ...(props.activePresetButtonStyle && typeof props.activePresetButtonStyle === 'object' ? props.activePresetButtonStyle : {}),
  } as React.CSSProperties

  const separatorStyle = {
    ...labelStyle,
    color: labelStyle.color || '#52647F',
    ...(props.separatorStyle && typeof props.separatorStyle === 'object' ? props.separatorStyle : {}),
  } as React.CSSProperties

  function buildDateFilterMeta(value: unknown) {
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

    const range = value && typeof value === 'object' ? (value as AnyRecord) : {}
    const from = typeof range.from === 'string' ? range.from : ''
    const to = typeof range.to === 'string' ? range.to : ''
    return {
      table: dateTable,
      field: dateField,
      mode: 'range',
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }
  }

  function buildDatePickerAction(value: unknown) {
    if (!props.actionOnChange || typeof props.actionOnChange !== 'object') return null
    const dateFilter = buildDateFilterMeta(value)
    const dateRange =
      mode === 'single'
        ? (() => {
            const selected = typeof value === 'string' ? value : ''
            return selected ? { from: selected, to: selected } : undefined
          })()
        : (() => {
            const range = value && typeof value === 'object' ? (value as AnyRecord) : {}
            const from = typeof range.from === 'string' ? range.from : ''
            const to = typeof range.to === 'string' ? range.to : ''
            return from || to ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : undefined
          })()

    return {
      ...(props.actionOnChange as AnyRecord),
      ...(dateRange ? { dateRange } : {}),
      ...(dateFilter ? { dateFilter } : {}),
    }
  }

  function resolveStoredValue() {
    if (storePath) return getValueByPath(storePath, undefined)
    if (!isSemanticDatePicker) return undefined
    const raw = getValueByPath('filters.__date', undefined)
    const marker = Array.isArray(raw)
      ? raw.find((entry) => entry?.table === dateTable && entry?.field === dateField)
      : raw
    if (!marker || marker.table !== dateTable || marker.field !== dateField) return undefined
    if (mode === 'single') return typeof marker.value === 'string' ? marker.value : undefined
    return {
      from: typeof marker.from === 'string' ? marker.from : '',
      to: typeof marker.to === 'string' ? marker.to : '',
    }
  }

  function setDatePickerValue(value: unknown) {
    const dateFilter = buildDateFilterMeta(value)
    const action = buildDatePickerAction(value)

    setData((prev) => {
      let next = prev || {}
      if (storePath) next = setByPath(next, storePath, value)
      if (isSemanticDatePicker) next = setByPath(next, 'filters.__date', dateFilter)
      return next
    })

    if (action) onAction?.(action)
  }

  const defaultRange = React.useMemo(
    () => ({
      from: toISO(startOfMonth(new Date())),
      to: toISO(endOfMonth(new Date())),
    }),
    [],
  )
  const storedValue = resolveStoredValue()

  if (mode === 'single') {
    const current = typeof storedValue === 'string' ? storedValue : defaultRange.from
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 0,
          ...(styles.containerStyle && typeof styles.containerStyle === 'object' ? styles.containerStyle : {}),
        }}
      >
        {label ? <div style={labelStyle}>{label}</div> : null}
        <DateFieldWithIcon value={current} onChange={setDatePickerValue} fieldStyle={fieldStyle} iconStyle={iconStyle} />
      </div>
    )
  }

  const currentRange =
    storedValue && typeof storedValue === 'object'
      ? {
          from: typeof (storedValue as AnyRecord).from === 'string' ? (storedValue as AnyRecord).from : defaultRange.from,
          to: typeof (storedValue as AnyRecord).to === 'string' ? (storedValue as AnyRecord).to : defaultRange.to,
        }
      : defaultRange

  const activePreset = presets.find((preset) => isSameRange(currentRange, getPresetRange(preset)))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
        ...(styles.containerStyle && typeof styles.containerStyle === 'object' ? styles.containerStyle : {}),
      }}
    >
      {label ? <div style={labelStyle}>{label}</div> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setDatePickerValue(getPresetRange(preset))}
            style={{
              ...baseButtonStyle,
              ...(activePreset === preset
                ? {
                    ...activePresetButtonStyle,
                  }
                : null),
            }}
          >
            {preset === 'month' ? 'Mês' : preset}
          </button>
        ))}
        <DateFieldWithIcon
          value={currentRange.from}
          onChange={(from) => setDatePickerValue({ from, to: currentRange.to })}
          fieldStyle={fieldStyle}
          iconStyle={iconStyle}
        />
        <span style={separatorStyle}>até</span>
        <DateFieldWithIcon
          value={currentRange.to}
          onChange={(to) => setDatePickerValue({ from: currentRange.from, to })}
          fieldStyle={fieldStyle}
          iconStyle={iconStyle}
        />
      </div>
    </div>
  )
}
