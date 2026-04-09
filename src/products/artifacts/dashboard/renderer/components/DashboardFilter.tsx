'use client'

import React from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { applyPrimaryDateRange } from '@/products/bi/json-render/dateFilters'
import { useData } from '@/products/bi/json-render/context'
import { FilterEditorModal, type FilterDraft } from '@/products/artifacts/dashboard/editors/filter/FilterEditorModal'
import { EditableComponentOverlay } from '@/products/artifacts/dashboard/editors/shared/EditableComponentOverlay'
import {
  resolveDashboardFilterTheme,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'
import { deepMerge } from '@/stores/ui/json-render/utils'

type AnyRecord = Record<string, any>
type SlicerOpt = { value: string | number; label: string }
type SlicerVariant = 'checklist' | 'dropdown' | 'tile'
type SlicerSelectionMode = 'single' | 'multiple'

function styleVal(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined
  return typeof v === 'number' ? `${v}px` : String(v)
}

function getPathValue(obj: any, path: string): any {
  if (!path || !obj || typeof obj !== 'object') return undefined
  const parts = path.split('.').map((s) => s.trim()).filter(Boolean)
  let curr = obj as any
  for (const part of parts) {
    if (curr == null || typeof curr !== 'object') return undefined
    curr = curr[part]
  }
  return curr
}

function mapRawToOptions(raw: any[], valueField?: string, labelField?: string): SlicerOpt[] {
  const vf = valueField || 'value'
  const lf = labelField || 'label'
  return raw.map((r: any) => ({
    value: r?.[vf] ?? r?.value,
    label: String(r?.[lf] ?? r?.label ?? r?.name ?? r?.nome ?? ''),
  }))
}

async function fetchOptionsFromSource(
  src: AnyRecord,
  args: { term?: string; data?: AnyRecord; readByPath?: (path: string, fallback?: any) => any },
): Promise<SlicerOpt[]> {
  if (!src || typeof src !== 'object') return []
  const term = String(args.term || '').trim()

  if (src.type === 'static') {
    const opts = Array.isArray(src.options) ? src.options : []
    return mapRawToOptions(opts)
  }

  if (typeof src.query === 'string' && src.query.trim()) {
    try {
      const filters = applyPrimaryDateRange({ ...((args?.data as AnyRecord)?.filters || {}) } as AnyRecord, args?.data)
      if (term && filters.q === undefined) filters.q = term
      delete filters.dateRange

      const limitRaw = Number(src.limit ?? 200)
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(2000, limitRaw)) : 200
      const res = await fetch('/api/modulos/query/execute', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          dataQuery: {
            query: src.query,
            filters,
            limit,
          },
        }),
      })
      const j = await res.json()
      if (!res.ok || j?.success === false) {
        throw new Error(String(j?.message || `Query failed (${res.status})`))
      }
      const rows = Array.isArray(j?.rows) ? j.rows : []
      return rows
        .map((r: AnyRecord): SlicerOpt => ({
          value: r?.value ?? r?.id ?? r?.key ?? '',
          label: String(r?.label ?? r?.nome ?? r?.name ?? r?.value ?? r?.id ?? ''),
        }))
        .filter((o: SlicerOpt) => o.label.trim() !== '')
    } catch (e) {
      console.error('[Dashboard/Filter] sql query failed', e)
      return []
    }
  }

  if (src.type === 'options' && typeof src.model === 'string' && typeof src.field === 'string') {
    try {
      const pageSizeRaw = Number(src.pageSize ?? src.limit ?? 50)
      const limit = Number.isFinite(pageSizeRaw) ? Math.max(1, Math.min(200, pageSizeRaw)) : 50
      const payload: AnyRecord = {
        model: src.model,
        field: src.field,
        limit,
      }
      if (term) payload.q = term

      const dependsOn = Array.isArray(src.dependsOn)
        ? src.dependsOn.filter((p: any) => typeof p === 'string' && p.trim())
        : []
      if (dependsOn.length) {
        const contextFilters: AnyRecord = {}
        for (const depPath of dependsOn) {
          const depKey = String(depPath).split('.').pop() || String(depPath)
          const depVal = args.readByPath
            ? args.readByPath(String(depPath), undefined)
            : getPathValue(args.data, String(depPath))
          if (depVal !== undefined && depVal !== null && depVal !== '' && (!Array.isArray(depVal) || depVal.length > 0)) {
            contextFilters[depKey] = depVal
          }
        }
        if (Object.keys(contextFilters).length > 0) {
          payload.contextFilters = contextFilters
        }
      }

      const res = await fetch('/api/modulos/options/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json()
      if (!res.ok || j?.success === false) {
        throw new Error(String(j?.message || `Options resolve failed (${res.status})`))
      }
      const raw = Array.isArray(j?.options) ? j.options : []
      return mapRawToOptions(raw, src.valueField, src.labelField)
    } catch (e) {
      console.error('[Dashboard/Filter] options resolve failed', e)
      return []
    }
  }

  if (src.type === 'api' && typeof src.url === 'string' && src.url) {
    try {
      const method = (src.method || 'GET').toUpperCase()
      let url = src.url as string
      if (method === 'GET' && term) url += (url.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(term)
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        ...(method === 'POST' ? { body: JSON.stringify({ ...(src.params || {}), ...(term ? { q: term } : {}) }) } : {}),
      })
      const j = await res.json()
      const raw = Array.isArray(j?.options) ? j.options : (Array.isArray(j?.rows) ? j.rows : [])
      return mapRawToOptions(raw, src.valueField, src.labelField)
    } catch {
      return []
    }
  }

  if (src.type === 'query' && typeof src.model === 'string' && typeof src.dimension === 'string') {
    try {
      const mod = String(src.model).split('.')[0]
      const body = {
        dataQuery: {
          model: src.model,
          dimension: src.dimension,
          measure: 'COUNT()',
          filters: src.filters || {},
          orderBy: { field: 'dimension', dir: 'asc' },
          limit: src.limit || 100,
        },
      }
      const res = await fetch(`/api/modulos/${mod}/query`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const j = await res.json()
      const rows = Array.isArray(j?.rows) ? j.rows : []
      return rows.map((r: any) => ({ value: r?.label ?? '', label: String(r?.label ?? '') }))
    } catch {
      return []
    }
  }

  return []
}

function resolveSlicerFields(element: any, propsFields: unknown): AnyRecord[] {
  const explicitFields = Array.isArray(propsFields)
    ? propsFields.filter((field): field is AnyRecord => Boolean(field && typeof field === 'object' && !Array.isArray(field)))
    : []
  if (explicitFields.length > 0) return explicitFields

  const childDefs = Array.isArray(element?.children) ? element.children : []
  return childDefs
    .filter((child: AnyRecord) => String(child?.type || '') === 'SlicerField')
    .map((child: AnyRecord) => ((child?.props && typeof child.props === 'object' && !Array.isArray(child.props)) ? child.props as AnyRecord : {}))
    .filter((field: AnyRecord) => Object.keys(field).length > 0)
}

function resolveSlicerUiChild(element: any): { variant?: SlicerVariant; props: AnyRecord } {
  const childDefs = Array.isArray(element?.children) ? element.children : []
  for (const child of childDefs) {
    const type = String((child as AnyRecord)?.type || '').trim()
    if (type === 'OptionList') {
      return {
        variant: 'checklist',
        props:
          (child as AnyRecord)?.props && typeof (child as AnyRecord).props === 'object' && !Array.isArray((child as AnyRecord).props)
            ? ((child as AnyRecord).props as AnyRecord)
            : {},
      }
    }
    if (type === 'Select') {
      return {
        variant: 'dropdown',
        props:
          (child as AnyRecord)?.props && typeof (child as AnyRecord).props === 'object' && !Array.isArray((child as AnyRecord).props)
            ? ((child as AnyRecord).props as AnyRecord)
            : {},
      }
    }
    if (type === 'Tile') {
      return {
        variant: 'tile',
        props:
          (child as AnyRecord)?.props && typeof (child as AnyRecord).props === 'object' && !Array.isArray((child as AnyRecord).props)
            ? ((child as AnyRecord).props as AnyRecord)
            : {},
      }
    }
  }
  return { props: {} }
}

function resolveSlicerStorePath(config: AnyRecord | null | undefined): string {
  const explicit = String(config?.storePath || '').trim()
  if (explicit) return explicit
  const field = String(config?.field || '').trim()
  if (field) return `filters.${field}`
  return ''
}

function resolveSlicerFieldBinding(config: AnyRecord | null | undefined): { key: string; table: string; field: string } | null {
  const key = String(config?.field || '').trim()
  const table = String(config?.table || '').trim()
  if (!key || !table) return null
  return { key, table, field: key }
}

function resolveSingleSlicerField(element: any, props: AnyRecord): AnyRecord | null {
  const storePath = resolveSlicerStorePath(props)
  if (!storePath) return null
  const uiChild = resolveSlicerUiChild(element)
  const fieldKeys = [
    'label',
    'table',
    'field',
    'variant',
    'mode',
    'storePath',
    'placeholder',
    'clearable',
    'selectAll',
    'search',
    'width',
    'query',
    'limit',
    'source',
    'actionOnChange',
  ] as const
  const field: AnyRecord = { ...(uiChild.props || {}) }
  for (const key of fieldKeys) {
    if (props[key] !== undefined) field[key] = props[key]
  }
  field.storePath = storePath
  if (uiChild.variant && field.variant === undefined) field.variant = uiChild.variant
  return field
}

function resolveSlicerDefinitions(element: any, props: AnyRecord): AnyRecord[] {
  const fields = resolveSlicerFields(element, props.fields)
  if (fields.length > 0) return fields
  const single = resolveSingleSlicerField(element, props)
  return single ? [single] : []
}

function resolveSlicerPresentation(field: AnyRecord): { variant: SlicerVariant; selectionMode: SlicerSelectionMode } {
  const variant =
    field?.variant === 'dropdown' || field?.variant === 'tile' || field?.variant === 'checklist'
      ? (field.variant as SlicerVariant)
      : 'checklist'
  const selectionMode =
    field?.mode === 'single' || field?.mode === 'multiple'
      ? (field.mode as SlicerSelectionMode)
      : 'multiple'
  return { variant, selectionMode }
}

function buildSlicerControlStyle(field: AnyRecord): React.CSSProperties {
  return {
    borderColor: typeof field?.borderColor === 'string' ? field.borderColor : undefined,
    color: typeof field?.textColor === 'string' ? field.textColor : undefined,
    backgroundColor: typeof field?.backgroundColor === 'string' ? field.backgroundColor : undefined,
    fontSize: styleVal(field?.fontSize),
    fontWeight: field?.fontWeight as React.CSSProperties['fontWeight'],
    borderRadius: styleVal(field?.radius),
    padding: styleVal(field?.padding),
  }
}

function buildSlicerOptionTextStyle(field: AnyRecord, baseStyle: React.CSSProperties): React.CSSProperties {
  return {
    ...baseStyle,
    color: typeof field?.textColor === 'string' ? field.textColor : baseStyle.color,
    fontSize: styleVal(field?.fontSize) || baseStyle.fontSize,
    fontWeight: (field?.fontWeight as React.CSSProperties['fontWeight']) ?? baseStyle.fontWeight,
  }
}

function matchesSlicerValue(optionValue: string | number, selectedValue: unknown) {
  return optionValue === selectedValue || String(optionValue) === String(selectedValue)
}

function resolveDropdownSummary(
  opts: SlicerOpt[],
  stored: unknown,
  isMulti: boolean,
  placeholder?: string,
) {
  const fallback = placeholder || 'Todos'
  if (isMulti) {
    const values = Array.isArray(stored) ? stored : []
    if (values.length === 0) return fallback
    if (opts.length > 0 && values.length >= opts.length) return 'Todos'
    if (values.length === 1) {
      const match = opts.find((option) => values.some((value) => matchesSlicerValue(option.value, value)))
      return match?.label || String(values[0])
    }
    return `${values.length} selecionados`
  }

  if (stored === undefined || stored === null || stored === '') return fallback
  const match = opts.find((option) => matchesSlicerValue(option.value, stored))
  return match?.label || String(stored)
}

function hasDropdownSelection(stored: unknown, isMulti: boolean) {
  if (isMulti) return Array.isArray(stored) && stored.length > 0
  return !(stored === undefined || stored === null || stored === '')
}

function SlicerContent({
  element,
  fields,
  layout,
  applyMode,
  onAction,
  suppressFieldLabels = false,
  padded = false,
}: {
  element: any
  fields: AnyRecord[]
  layout: 'vertical' | 'horizontal'
  applyMode: 'auto' | 'manual'
  onAction?: (action: any) => void
  suppressFieldLabels?: boolean
  padded?: boolean
}) {
  const { themeName } = useDashboardThemeSelection()
  const theme = resolveDashboardFilterTheme(themeName)
  const { data, setData, getValueByPath } = useData()
  const [optionsMap, setOptionsMap] = React.useState<Record<number, SlicerOpt[]>>({})
  const [searchMap, setSearchMap] = React.useState<Record<number, string>>({})
  const [pendingMap, setPendingMap] = React.useState<Record<number, any>>({})
  const [openDropdownIndex, setOpenDropdownIndex] = React.useState<number | null>(null)

  function setByPath(prev: any, path: string, value: any) {
    if (!path) return prev
    const parts = path.split('.').map((s) => s.trim()).filter(Boolean)
    const root = Array.isArray(prev) ? [...prev] : { ...(prev || {}) }
    let curr: any = root
    for (let i = 0; i < parts.length; i += 1) {
      const k = parts[i]
      if (i === parts.length - 1) {
        curr[k] = value
      } else {
        curr[k] = typeof curr[k] === 'object' && curr[k] !== null ? { ...curr[k] } : {}
        curr = curr[k]
      }
    }
    return root
  }

  const effectiveGet = React.useCallback((idx: number, sp: string, isMulti: boolean) => {
    if (applyMode === 'manual' && Object.prototype.hasOwnProperty.call(pendingMap, idx)) return pendingMap[idx]
    const v = getValueByPath(sp, undefined)
    return isMulti ? (Array.isArray(v) ? v : []) : (v ?? '')
  }, [applyMode, getValueByPath, pendingMap])

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const tasks = await Promise.allSettled(fields.map(async (field, idx) => {
        const src =
          field?.source && typeof field.source === 'object'
            ? (field.source as AnyRecord)
            : (typeof field?.query === 'string' && field.query.trim()
                ? ({ query: field.query, ...(Number.isFinite(Number(field?.limit)) ? { limit: Number(field.limit) } : {}) } as AnyRecord)
                : null)
        if (!src || typeof src !== 'object') return { idx, opts: [] as SlicerOpt[] }
        const term = searchMap[idx] || ''
        const opts = await fetchOptionsFromSource(src, { term, data, readByPath: getValueByPath })
        return { idx, opts }
      }))
      if (cancelled) return
      const nextMap: Record<number, SlicerOpt[]> = {}
      for (const task of tasks) {
        if (task.status === 'fulfilled') nextMap[(task.value as any).idx] = (task.value as any).opts
      }
      setOptionsMap(nextMap)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [fields, searchMap, data, getValueByPath])

  const onChangeField = React.useCallback((idx: number, storePath: string, value: any, autoAction?: AnyRecord) => {
    if (applyMode === 'manual') {
      setPendingMap((prev) => ({ ...prev, [idx]: value }))
      return
    }
    const field = fields[idx]
    let next = setByPath(data, storePath, value)
    const binding = resolveSlicerFieldBinding(field)
    if (binding) {
      next = setByPath(next, `filters.__fields.${binding.key}`, { table: binding.table, field: binding.field })
    }
    setData(next)
    if (autoAction && typeof autoAction === 'object') onAction?.(autoAction)
  }, [applyMode, data, fields, onAction, setData])

  const onApplyAll = React.useCallback(() => {
    let next = data
    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i]
      const storePath = resolveSlicerStorePath(field)
      if (!storePath) continue
      if (Object.prototype.hasOwnProperty.call(pendingMap, i)) {
        next = setByPath(next, storePath, pendingMap[i])
        const binding = resolveSlicerFieldBinding(field)
        if (binding) {
          next = setByPath(next, `filters.__fields.${binding.key}`, { table: binding.table, field: binding.field })
        }
      }
    }
    setData(next)
    const actionOnApply = element?.props?.actionOnApply
    if (actionOnApply && typeof actionOnApply === 'object') onAction?.(actionOnApply)
  }, [data, element?.props?.actionOnApply, fields, onAction, pendingMap, setData])

  const wrapperClassName = `${layout === 'horizontal' ? 'flex items-start gap-3 flex-wrap' : 'space-y-3'}${padded ? ' p-2' : ''}`

  return (
    <>
      <div className={wrapperClassName}>
        {fields.map((field, idx) => {
          const storePath = resolveSlicerStorePath(field)
          if (!storePath) return null

          const opts = optionsMap[idx] || []
          const width = field?.width !== undefined ? (typeof field.width === 'number' ? `${field.width}px` : field.width) : undefined
          const { variant, selectionMode } = resolveSlicerPresentation(field)
          const isMulti = selectionMode === 'multiple'
          const stored = effectiveGet(idx, storePath, isMulti)
          const clearable = field?.clearable !== false
          const selectAll = Boolean(field?.selectAll)
          const showSearch = Boolean(field?.search)
          const controlStyle = buildSlicerControlStyle(field)
          const optionTextStyle = buildSlicerOptionTextStyle(
            field,
            {
              ...theme.optionTextStyle,
              ...(field?.optionStyle && typeof field.optionStyle === 'object' ? field.optionStyle : {}),
            } as React.CSSProperties,
          )
          const listMaxHeight = styleVal(field?.maxHeight) || '12rem'
          const itemGap = styleVal(field?.itemGap) || '0.25rem'

          if (variant === 'tile') {
            const onClear = () => onChangeField(idx, storePath, isMulti ? [] : undefined, field.actionOnChange)
            return (
              <div key={`field-${idx}`} className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
                <div className="flex flex-col gap-2">
                  {showSearch && (
                    <input
                      type="text"
                      value={searchMap[idx] || ''}
                      onChange={(e) => setSearchMap((prev) => ({ ...prev, [idx]: e.target.value }))}
                      placeholder="Buscar..."
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      style={controlStyle}
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    {opts.map((option) => {
                      const selected = isMulti ? (Array.isArray(stored) && stored.includes(option.value)) : stored === option.value
                      const base = 'text-xs font-medium rounded-md min-w-[110px] h-9 px-3 border transition-all focus:outline-none active:scale-[0.98]'
                      return (
                        <button
                          key={String(option.value)}
                          type="button"
                          className={base}
                          onClick={() => {
                            if (isMulti) {
                              const arr = Array.isArray(stored) ? stored.slice() : []
                              const exists = arr.includes(option.value)
                              const nextArr = exists ? arr.filter((v: any) => v !== option.value) : [...arr, option.value]
                              onChangeField(idx, storePath, nextArr, field.actionOnChange)
                            } else {
                              const nextVal = stored === option.value ? (clearable ? undefined : option.value) : option.value
                              onChangeField(idx, storePath, nextVal, field.actionOnChange)
                            }
                          }}
                          style={(() => {
                            return {
                              ...(selected ? theme.tileSelectedStyle : theme.tileUnselectedStyle),
                              ...controlStyle,
                            } as any
                          })()}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectAll && isMulti && (
                    <button type="button" style={theme.actionStyle} onClick={() => onChangeField(idx, storePath, opts.map((option) => option.value), field.actionOnChange)}>Selecionar todos</button>
                  )}
                  {clearable && (
                    <button type="button" style={theme.actionStyle} onClick={onClear}>Limpar</button>
                  )}
                </div>
              </div>
            )
          }

          if (variant === 'checklist') {
            const onClear = () => onChangeField(idx, storePath, isMulti ? [] : undefined, field.actionOnChange)
            return (
              <div key={`field-${idx}`} className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'} style={{ width }}>
                <div className="flex flex-col gap-2">
                  {showSearch && (
                    <input
                      type="text"
                      value={searchMap[idx] || ''}
                      onChange={(e) => setSearchMap((prev) => ({ ...prev, [idx]: e.target.value }))}
                      placeholder="Buscar..."
                      className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      style={controlStyle}
                    />
                  )}
                  <div
                    className="flex flex-col overflow-y-auto"
                    style={{
                      gap: itemGap,
                      maxHeight: listMaxHeight,
                    }}
                  >
                    {opts.map((option) => (
                      <label key={String(option.value)} className="inline-flex items-center gap-2 text-xs">
                        <input
                          type={isMulti ? 'checkbox' : 'radio'}
                          className="rounded border-gray-300"
                          style={{ accentColor: typeof field?.checkColor === 'string' ? field.checkColor : theme.checkColor }}
                          name={isMulti ? undefined : `slicer-${idx}`}
                          checked={isMulti ? (Array.isArray(stored) && stored.includes(option.value)) : stored === option.value}
                          onChange={(e) => {
                            if (isMulti) {
                              const arr = Array.isArray(stored) ? stored.slice() : []
                              const nextArr = e.target.checked ? [...arr, option.value] : arr.filter((v: any) => v !== option.value)
                              onChangeField(idx, storePath, nextArr, field.actionOnChange)
                              return
                            }
                            onChangeField(idx, storePath, option.value, field.actionOnChange)
                          }}
                        />
                        <span style={optionTextStyle}>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {selectAll && isMulti && (
                      <button type="button" style={theme.actionStyle} onClick={() => onChangeField(idx, storePath, opts.map((option) => option.value), field.actionOnChange)}>Selecionar todos</button>
                    )}
                    {clearable && (
                      <button type="button" style={theme.actionStyle} onClick={onClear}>Limpar</button>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          const onClear = () => onChangeField(idx, storePath, isMulti ? [] : undefined, field.actionOnChange)
          const dropdownSummary = resolveDropdownSummary(
            opts,
            stored,
            isMulti,
            typeof field?.placeholder === 'string' ? field.placeholder : undefined,
          )
          const hasSelection = hasDropdownSelection(stored, isMulti)
          const isDropdownOpen = openDropdownIndex === idx
            return (
              <div
                key={`field-${idx}`}
                className={layout === 'horizontal' ? 'flex items-center gap-2' : 'space-y-1'}
                style={{ width }}
              >
              <Popover open={isDropdownOpen} onOpenChange={(nextOpen) => setOpenDropdownIndex(nextOpen ? idx : null)}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    style={{
                      ...(controlStyle || {}),
                      width: '100%',
                      minHeight: 42,
                      display: 'flex',
                      alignItems: 'center',
                      border: `1px solid ${isDropdownOpen ? '#60a5fa' : '#d5dde7'}`,
                      borderRadius: 12,
                      padding: 0,
                      background: '#ffffff',
                      color: '#0f172a',
                      cursor: 'pointer',
                      textAlign: 'left',
                      overflow: 'hidden',
                      boxShadow: isDropdownOpen
                        ? '0 0 0 3px rgba(96, 165, 250, 0.14)'
                        : '0 1px 2px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <span
                      style={{
                        minWidth: 0,
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: 42,
                        padding: '0 14px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: hasSelection ? '#0f172a' : '#475569',
                        fontSize: 14,
                        lineHeight: 1.3,
                        fontWeight: hasSelection ? 600 : 500,
                        ...(optionTextStyle || {}),
                      }}
                    >
                      {dropdownSummary}
                    </span>
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="start"
                  sideOffset={6}
                  className="w-[var(--radix-popover-trigger-width)] min-w-[220px] rounded-[10px] border border-slate-200 p-2 shadow-[0_14px_28px_rgba(15,23,42,0.14)]"
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '4px 4px 6px',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Selecao
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {opts.length} opcoes
                    </div>
                  </div>

                  <Command shouldFilter={false} className="rounded-[8px] bg-transparent text-slate-900">
                    {showSearch && (
                      <CommandInput
                        value={searchMap[idx] || ''}
                        onValueChange={(value) => setSearchMap((prev) => ({ ...prev, [idx]: value }))}
                        placeholder="Buscar..."
                        className="h-10 text-[13px]"
                      />
                    )}
                    <CommandList style={{ maxHeight: listMaxHeight }}>
                      <CommandEmpty>Nenhuma opcao encontrada.</CommandEmpty>
                      <CommandGroup>
                        {opts.map((option) => {
                          const checked = isMulti
                            ? (Array.isArray(stored) && stored.some((value) => matchesSlicerValue(option.value, value)))
                            : matchesSlicerValue(option.value, stored)

                          return (
                            <CommandItem
                              key={String(option.value)}
                              value={`${option.label} ${option.value}`}
                              onSelect={() => {
                                if (isMulti) {
                                  const arr = Array.isArray(stored) ? stored.slice() : []
                                  const exists = arr.some((value) => matchesSlicerValue(option.value, value))
                                  const nextArr = exists
                                    ? arr.filter((value) => !matchesSlicerValue(option.value, value))
                                    : [...arr, option.value]
                                  onChangeField(idx, storePath, nextArr, field.actionOnChange)
                                  return
                                }

                                onChangeField(
                                  idx,
                                  storePath,
                                  checked && clearable ? undefined : option.value,
                                  field.actionOnChange,
                                )
                                setOpenDropdownIndex(null)
                              }}
                              className="gap-3 rounded-[8px] px-3 py-2 data-[selected=true]:bg-slate-100"
                            >
                              <span
                                aria-hidden="true"
                                style={{
                                  width: 16,
                                  height: 16,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: `1px solid ${checked ? '#2563eb' : '#cbd5e1'}`,
                                  borderRadius: isMulti ? 4 : 999,
                                  background: checked ? '#2563eb' : '#ffffff',
                                  color: '#ffffff',
                                  fontSize: 10,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {checked ? '✓' : ''}
                              </span>
                              <span style={optionTextStyle}>{option.label}</span>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {selectAll && isMulti && (
                        <button
                          type="button"
                          style={theme.actionStyle}
                          onClick={() => onChangeField(idx, storePath, opts.map((option) => option.value), field.actionOnChange)}
                        >
                          Selecionar todos
                        </button>
                      )}
                      {clearable && (
                        <button
                          type="button"
                          style={theme.actionStyle}
                          onClick={() => {
                            onClear()
                            setOpenDropdownIndex(null)
                          }}
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      style={theme.actionStyle}
                      onClick={() => setOpenDropdownIndex(null)}
                    >
                      Fechar
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )
        })}
      </div>
      {applyMode === 'manual' && (
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={onApplyAll} style={theme.applyButtonStyle}>
            Aplicar
          </button>
        </div>
      )}
    </>
  )
}

export default function DashboardFilter({
  element,
  onAction,
}: {
  element: any
  onAction?: (action: any) => void
}) {
  const p = deepMerge({} as AnyRecord, (element?.props || {}) as AnyRecord) as AnyRecord
  const layout = (p.layout || 'vertical') as 'vertical' | 'horizontal'
  const applyMode = (p.applyMode || 'auto') as 'auto' | 'manual'
  const fields = resolveSlicerDefinitions(element, p)
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const [editorDraft, setEditorDraft] = React.useState<FilterDraft>(() => ({
    prompt: typeof p.prompt === 'string' ? p.prompt : '',
    layout,
    applyMode,
    fields: fields.map((field) => ({
      label: typeof field?.label === 'string' ? field.label : '',
      field: typeof field?.field === 'string' ? field.field : '',
      variant: typeof field?.variant === 'string' ? field.variant : 'checklist',
      mode: typeof field?.mode === 'string' ? field.mode : 'multiple',
    })),
  }))

  return (
    <>
      <EditableComponentOverlay onEdit={() => setIsEditorOpen(true)} forceVisible={isEditorOpen}>
        <SlicerContent
          element={{ ...element, props: p }}
          fields={fields}
          layout={layout}
          applyMode={applyMode}
          onAction={onAction}
        />
      </EditableComponentOverlay>

      <FilterEditorModal
        isOpen={isEditorOpen}
        initialValue={editorDraft}
        onClose={() => setIsEditorOpen(false)}
        onSave={(value) => {
          setEditorDraft(value)
          setIsEditorOpen(false)
        }}
      />
    </>
  )
}
