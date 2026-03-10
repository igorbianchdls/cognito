'use client'

import React from 'react'
import { Mail } from 'lucide-react'
import { SiWhatsapp } from '@icons-pack/react-simple-icons'
import type { JsonTree } from '@/products/bi/shared/types'
import { getNodeAtPath } from '@/products/bi/features/dashboard-editor/lib/jsonTreeOps'
import type { JsonNodePath } from '@/products/bi/features/dashboard-editor/types/editor-types'

type Props = {
  tree: JsonTree
  selectedPath: JsonNodePath | null
  isOpen: boolean
  onClose: () => void
  onSetNodeProp: (nodePath: JsonNodePath, propPath: string, value: unknown) => void
  onReplaceNodeProps: (nodePath: JsonNodePath, props: Record<string, any>) => void
}

type TabKey = 'data' | 'style' | 'nivo' | 'json'

const AISUMMARY_FREQUENCY_OPTIONS = [
  { value: 'none', label: 'Não repete' },
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
] as const

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTE_OPTIONS = ['00', '15', '30', '45']

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-gray-700">{children}</label>
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded bg-gray-100 px-2 py-1 text-sm outline-none ring-0 focus:bg-gray-50"
      />
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded bg-gray-100 px-2 py-1.5 text-sm outline-none ring-0 focus:bg-gray-50"
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | ''
  onChange: (v: number | undefined) => void
}) {
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        className="w-full rounded bg-gray-100 px-2 py-1 text-sm outline-none ring-0 focus:bg-gray-50"
      />
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded bg-gray-100 px-2 py-1 text-sm outline-none ring-0 focus:bg-gray-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const normalized = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value || '') ? value : '#000000'
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={normalized}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 rounded bg-gray-100 p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ffffff"
          className="w-full rounded bg-gray-100 px-2 py-1 text-sm outline-none ring-0 focus:bg-gray-50"
        />
      </div>
    </div>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}

function ToggleChip({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition-colors ${
        selected
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${selected ? 'bg-white/15' : 'bg-gray-100'}`}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  )
}

function getProp<T>(node: Record<string, any>, path: string, fallback: T): T {
  const parts = path.split('.').filter(Boolean)
  let curr: any = node.props || {}
  for (const part of parts) {
    if (curr == null || typeof curr !== 'object') return fallback
    curr = curr[part]
  }
  return (curr === undefined ? fallback : curr) as T
}

function getStringArrayProp(node: Record<string, any>, path: string): string[] {
  const raw = getProp<any>(node, path, [])
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === 'string') : []
}

function setPropInObject(base: Record<string, any> | undefined, path: string, value: unknown) {
  const parts = path.split('.').filter(Boolean)
  const root: Record<string, any> = base && typeof base === 'object' && !Array.isArray(base) ? { ...base } : {}
  if (!parts.length) return root

  let curr: Record<string, any> = root
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]
    const prev = curr[key]
    curr[key] = prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...prev } : {}
    curr = curr[key]
  }

  const last = parts[parts.length - 1]
  if (value === undefined) delete curr[last]
  else curr[last] = value

  return root
}

function TextSpacingFields({
  node,
  selectedPath,
  onSetNodeProp,
}: {
  node: Record<string, any>
  selectedPath: JsonNodePath
  onSetNodeProp: (nodePath: JsonNodePath, propPath: string, value: unknown) => void
}) {
  return (
    <div className="space-y-2 rounded border border-gray-200 p-2">
      <div className="text-sm font-medium text-gray-700">Spacing</div>
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="margin"
          value={String(getProp(node, 'margin', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'margin', v || undefined)}
        />
        <TextField
          label="padding"
          value={String(getProp(node, 'padding', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'padding', v || undefined)}
        />
        <TextField
          label="marginTop"
          value={String(getProp(node, 'marginTop', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'marginTop', v || undefined)}
        />
        <TextField
          label="paddingTop"
          value={String(getProp(node, 'paddingTop', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'paddingTop', v || undefined)}
        />
        <TextField
          label="marginRight"
          value={String(getProp(node, 'marginRight', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'marginRight', v || undefined)}
        />
        <TextField
          label="paddingRight"
          value={String(getProp(node, 'paddingRight', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'paddingRight', v || undefined)}
        />
        <TextField
          label="marginBottom"
          value={String(getProp(node, 'marginBottom', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'marginBottom', v || undefined)}
        />
        <TextField
          label="paddingBottom"
          value={String(getProp(node, 'paddingBottom', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'paddingBottom', v || undefined)}
        />
        <TextField
          label="marginLeft"
          value={String(getProp(node, 'marginLeft', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'marginLeft', v || undefined)}
        />
        <TextField
          label="paddingLeft"
          value={String(getProp(node, 'paddingLeft', ''))}
          onChange={(v) => onSetNodeProp(selectedPath, 'paddingLeft', v || undefined)}
        />
      </div>
    </div>
  )
}

export default function PropertiesPanel({
  tree,
  selectedPath,
  isOpen,
  onClose,
  onSetNodeProp: _onSetNodeProp,
  onReplaceNodeProps: onReplaceNodePropsExternal,
}: Props) {
  const sourceNode = React.useMemo<Record<string, any> | null>(
    () => getNodeAtPath(tree, selectedPath),
    [tree, selectedPath],
  )
  const [draftProps, setDraftProps] = React.useState<Record<string, any>>({})
  const [rawPropsText, setRawPropsText] = React.useState('{}')
  const [rawPropsError, setRawPropsError] = React.useState<string | null>(null)
  const [tableColumnsText, setTableColumnsText] = React.useState('[]')
  const [tableColumnsError, setTableColumnsError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<TabKey>('data')
  const node = React.useMemo<Record<string, any> | null>(
    () => (sourceNode && typeof sourceNode === 'object' ? { ...sourceNode, props: draftProps } : sourceNode),
    [draftProps, sourceNode],
  )
  const isChartNode = Boolean(
    node && ['BarChart', 'LineChart', 'PieChart'].includes(String(node.type)),
  )

  const supportsDataTab = Boolean(
    node && ['KPI', 'KPICompare', 'Sparkline', 'BarChart', 'LineChart', 'PieChart', 'Header', 'SlicerCard', 'AISummary', 'Table', 'Icon'].includes(String(node.type)),
  )
  const supportsNivoTab = isChartNode
  const supportsStyleTab = Boolean(
    node && ['KPI', 'KPICompare', 'Sparkline', 'Header', 'SlicerCard', 'Card', 'CardTitle', 'Title', 'Subtitle', 'Icon', 'Container', 'Sidebar', 'Gauge', 'AISummary', 'Table'].includes(String(node.type)),
  )
  const supportsFr = Boolean(
    node && ['KPI', 'Sparkline', 'BarChart', 'LineChart', 'PieChart', 'Gauge', 'SlicerCard', 'AISummary', 'Table'].includes(String(node.type)),
  )

  React.useEffect(() => {
    const next = sourceNode?.props && typeof sourceNode.props === 'object' ? sourceNode.props : {}
    setDraftProps(next)
    setRawPropsText(JSON.stringify(next, null, 2))
    setRawPropsError(null)
    const rawCols = Array.isArray(next.columns) ? next.columns : []
    setTableColumnsText(JSON.stringify(rawCols, null, 2))
    setTableColumnsError(null)
  }, [sourceNode && JSON.stringify(sourceNode.props || {})])

  React.useEffect(() => {
    if (!node) {
      setActiveTab('json')
      return
    }
    if (supportsDataTab) {
      setActiveTab('data')
      return
    }
    if (supportsNivoTab) {
      setActiveTab('nivo')
      return
    }
    if (supportsStyleTab) {
      setActiveTab('style')
      return
    }
    setActiveTab('json')
  }, [selectedPath?.join('.'), node?.type, supportsDataTab, supportsNivoTab, supportsStyleTab])

  const onSetNodeProp = React.useCallback((nodePath: JsonNodePath, propPath: string, value: unknown) => {
    if (!selectedPath || !nodePath || nodePath.join('.') !== selectedPath.join('.')) return
    setDraftProps((prev) => {
      const next = setPropInObject(prev, propPath, value)
      setRawPropsText(JSON.stringify(next, null, 2))
      setRawPropsError(null)
      return next
    })
  }, [selectedPath])

  const onReplaceNodeProps = React.useCallback((nodePath: JsonNodePath, props: Record<string, any>) => {
    if (!selectedPath || !nodePath || nodePath.join('.') !== selectedPath.join('.')) return
    const next = props && typeof props === 'object' && !Array.isArray(props) ? props : {}
    setDraftProps(next)
    setRawPropsText(JSON.stringify(next, null, 2))
    setRawPropsError(null)
  }, [selectedPath])

  const draftDirty = React.useMemo(() => {
    const current = sourceNode?.props && typeof sourceNode.props === 'object' ? sourceNode.props : {}
    return JSON.stringify(current) !== JSON.stringify(draftProps)
  }, [draftProps, sourceNode])

  if (!isOpen) return null

  return (
    <div className={`h-full rounded-md bg-white transition-colors ${draftDirty ? 'border border-sky-300 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]' : 'border border-gray-200'}`}>
      <div className={`flex items-center justify-between px-3 py-3 ${draftDirty ? 'border-b border-sky-200 bg-sky-50/70' : 'border-b border-gray-200'}`}>
        <div className="text-3xl font-bold text-gray-900">
          {node ? String(node.type) : 'Nenhum componente'}
        </div>
        <button type="button" onClick={onClose} className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">
          Fechar
        </button>
      </div>

      {!node ? (
        <div className="p-3 text-xs text-gray-500">Selecione um componente e clique em Editar no menu `...`.</div>
      ) : (
        <div className="space-y-3 p-3">
          <div className="inline-flex items-center gap-1 rounded bg-gray-100 p-1">
            {supportsDataTab && (
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className={`rounded px-2 py-1 text-xs ${activeTab === 'data' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white'}`}
              >
                Data
              </button>
            )}
            {supportsStyleTab && (
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`rounded px-2 py-1 text-xs ${activeTab === 'style' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white'}`}
              >
                Style
              </button>
            )}
            {supportsNivoTab && (
              <button
                type="button"
                onClick={() => setActiveTab('nivo')}
                className={`rounded px-2 py-1 text-xs ${activeTab === 'nivo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white'}`}
              >
                Nivo
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`rounded px-2 py-1 text-xs ${activeTab === 'json' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white'}`}
            >
              JSON
            </button>
          </div>

          {selectedPath && (
            <>
              {activeTab === 'data' && node.type === 'AISummary' && (
                <div className="space-y-3 rounded border border-gray-200 p-2.5">
                  <TextField
                    label="Nome da Task/Agente"
                    value={String(getProp(node, 'task.name', getProp(node, 'title', '')))}
                    onChange={(v) => {
                      const next = v.trim()
                      onSetNodeProp(selectedPath, 'task.name', next || undefined)
                      onSetNodeProp(selectedPath, 'title', next || undefined)
                    }}
                    placeholder="Ex.: Resumo diário comercial"
                  />

                  <TextAreaField
                    label="Prompt"
                    value={String(getProp(node, 'task.prompt', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'task.prompt', v || undefined)}
                    placeholder="Ex.: Resuma riscos, oportunidades e anomalias de vendas por filial e canal."
                    rows={5}
                  />

                  <div className="space-y-1">
                    <FieldLabel>Schedule</FieldLabel>
                    <div className="grid grid-cols-[minmax(0,1fr)_92px_92px] gap-2">
                      <select
                        value={String(getProp(node, 'task.schedule.frequency', 'none'))}
                        onChange={(e) => onSetNodeProp(selectedPath, 'task.schedule.frequency', e.target.value)}
                        className="w-full rounded bg-gray-100 px-2 py-1 text-sm outline-none ring-0 focus:bg-gray-50"
                      >
                        {AISUMMARY_FREQUENCY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={String(getProp(node, 'task.schedule.hour', '08'))}
                        disabled={String(getProp(node, 'task.schedule.frequency', 'none')) === 'none'}
                        onChange={(e) => onSetNodeProp(selectedPath, 'task.schedule.hour', e.target.value)}
                        className="w-full rounded bg-gray-100 px-2 py-1 text-sm outline-none ring-0 focus:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {HOUR_OPTIONS.map((hour) => (
                          <option key={hour} value={hour}>
                            {hour}h
                          </option>
                        ))}
                      </select>
                      <select
                        value={String(getProp(node, 'task.schedule.minute', '00'))}
                        disabled={String(getProp(node, 'task.schedule.frequency', 'none')) === 'none'}
                        onChange={(e) => onSetNodeProp(selectedPath, 'task.schedule.minute', e.target.value)}
                        className="w-full rounded bg-gray-100 px-2 py-1 text-sm outline-none ring-0 focus:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {MINUTE_OPTIONS.map((minute) => (
                          <option key={minute} value={minute}>
                            :{minute}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <FieldLabel>Notificações</FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <ToggleChip
                        label="Email"
                        icon={<Mail className="h-3.5 w-3.5" />}
                        selected={getStringArrayProp(node, 'task.notifications.channels').includes('email')}
                        onClick={() => {
                          const current = getStringArrayProp(node, 'task.notifications.channels')
                          const next = current.includes('email')
                            ? current.filter((c) => c !== 'email')
                            : [...current, 'email']
                          onSetNodeProp(selectedPath, 'task.notifications.channels', next)
                        }}
                      />
                      <ToggleChip
                        label="WhatsApp"
                        icon={<SiWhatsapp size={14} />}
                        selected={getStringArrayProp(node, 'task.notifications.channels').includes('whatsapp')}
                        onClick={() => {
                          const current = getStringArrayProp(node, 'task.notifications.channels')
                          const next = current.includes('whatsapp')
                            ? current.filter((c) => c !== 'whatsapp')
                            : [...current, 'whatsapp']
                          onSetNodeProp(selectedPath, 'task.notifications.channels', next)
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && node.type === 'SlicerCard' && (
                <TextField
                  label="Título"
                  value={String(getProp(node, 'title', ''))}
                  onChange={(v) => onSetNodeProp(selectedPath, 'title', v || undefined)}
                />
              )}

              {activeTab === 'data' && node.type === 'Icon' && (
                <div className="space-y-2 rounded border border-gray-200 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <TextField
                      label="name"
                      value={String(getProp(node, 'name', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'name', v || undefined)}
                    />
                    <NumberField
                      label="size"
                      value={Number(getProp(node, 'size', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'size', v)}
                    />
                    <NumberField
                      label="strokeWidth"
                      value={Number(getProp(node, 'strokeWidth', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'strokeWidth', v)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'data' && node.type === 'Sparkline' && (
                <div className="space-y-2 rounded border border-gray-200 p-2">
                  <TextAreaField
                    label="dataQuery.query"
                    value={String(getProp(node, 'dataQuery.query', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.query', v || undefined)}
                    placeholder="SELECT ... FROM ... WHERE ..."
                    rows={6}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <TextField
                      label="dataQuery.xField"
                      value={String(getProp(node, 'dataQuery.xField', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.xField', v || undefined)}
                    />
                    <TextField
                      label="dataQuery.yField"
                      value={String(getProp(node, 'dataQuery.yField', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.yField', v || undefined)}
                    />
                    <TextField
                      label="dataQuery.keyField"
                      value={String(getProp(node, 'dataQuery.keyField', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.keyField', v || undefined)}
                    />
                    <NumberField
                      label="dataQuery.limit"
                      value={Number(getProp(node, 'dataQuery.limit', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.limit', v)}
                    />
                    <NumberField
                      label="height"
                      value={Number(getProp(node, 'height', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'height', v)}
                    />
                    <NumberField
                      label="fr"
                      value={Number(getProp(node, 'fr', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'fr', v)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'data' && node.type === 'Table' && (
                <div className="space-y-2 rounded border border-gray-200 p-2">
                  <div className="text-sm font-medium text-gray-700">Dados da Tabela</div>
                  <TextAreaField
                    label="dataQuery.query"
                    value={String(getProp(node, 'dataQuery.query', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.query', v || undefined)}
                    placeholder="SELECT ... FROM ... WHERE ..."
                    rows={8}
                  />
                  <TextField
                    label="dataPath (opcional)"
                    value={String(getProp(node, 'dataPath', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataPath', v || undefined)}
                    placeholder="ex.: vendas.tabela.rows"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label="fr"
                      value={Number(getProp(node, 'fr', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'fr', v)}
                    />
                    <NumberField
                      label="Altura"
                      value={Number(getProp(node, 'height', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'height', v)}
                    />
                    <NumberField
                      label="dataQuery.limit"
                      value={Number(getProp(node, 'dataQuery.limit', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.limit', v)}
                    />
                    <NumberField
                      label="pageSize"
                      value={Number(getProp(node, 'pageSize', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'pageSize', v)}
                    />
                  </div>
                  <TextField
                    label="searchPlaceholder"
                    value={String(getProp(node, 'searchPlaceholder', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'searchPlaceholder', v || undefined)}
                    placeholder="Buscar..."
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <CheckboxField
                      label="showColumnToggle"
                      checked={Boolean(getProp(node, 'showColumnToggle', true))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'showColumnToggle', v)}
                    />
                    <CheckboxField
                      label="showPagination"
                      checked={Boolean(getProp(node, 'showPagination', true))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'showPagination', v)}
                    />
                    <CheckboxField
                      label="enableSearch"
                      checked={Boolean(getProp(node, 'enableSearch', true))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'enableSearch', v)}
                    />
                    <CheckboxField
                      label="enableRowSelection"
                      checked={Boolean(getProp(node, 'enableRowSelection', false))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'enableRowSelection', v)}
                    />
                  </div>
                  <SelectField
                    label="selectionMode"
                    value={String(getProp(node, 'selectionMode', 'single'))}
                    options={[
                      { value: 'single', label: 'Single' },
                      { value: 'multiple', label: 'Multiple' },
                    ]}
                    onChange={(v) => onSetNodeProp(selectedPath, 'selectionMode', v)}
                  />
                  <div className="space-y-1 rounded border border-gray-200 p-2">
                    <div className="text-sm font-medium text-gray-700">Edição</div>
                    <div className="grid grid-cols-2 gap-2">
                      <CheckboxField
                        label="editableMode"
                        checked={Boolean(getProp(node, 'editableMode', false))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'editableMode', v)}
                      />
                      <SelectField
                        label="editableCells"
                        value={String(getProp(node, 'editableCells', 'none'))}
                        options={[
                          { value: 'none', label: 'Nenhuma' },
                          { value: 'all', label: 'Todas' },
                        ]}
                        onChange={(v) => onSetNodeProp(selectedPath, 'editableCells', v)}
                      />
                      <CheckboxField
                        label="allowAdd"
                        checked={Boolean(getProp(node, 'editableRowActions.allowAdd', false))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'editableRowActions.allowAdd', v)}
                      />
                      <CheckboxField
                        label="allowDelete"
                        checked={Boolean(getProp(node, 'editableRowActions.allowDelete', false))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'editableRowActions.allowDelete', v)}
                      />
                      <CheckboxField
                        label="allowDuplicate"
                        checked={Boolean(getProp(node, 'editableRowActions.allowDuplicate', false))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'editableRowActions.allowDuplicate', v)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <FieldLabel>columns (JSON array)</FieldLabel>
                    <textarea
                      value={tableColumnsText}
                      rows={7}
                      placeholder='[{"key":"pedido","header":"Pedido"}]'
                      onChange={(e) => {
                        setTableColumnsText(e.target.value)
                        setTableColumnsError(null)
                      }}
                      className="w-full rounded bg-gray-100 px-2 py-1.5 text-sm outline-none ring-0 focus:bg-gray-50"
                    />
                    {tableColumnsError && <div className="text-[11px] text-red-600">{tableColumnsError}</div>}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(tableColumnsText)
                            if (!Array.isArray(parsed)) {
                              setTableColumnsError('columns deve ser um array JSON')
                              return
                            }
                            onSetNodeProp(selectedPath, 'columns', parsed)
                            setTableColumnsError(null)
                          } catch (error) {
                            setTableColumnsError(error instanceof Error ? error.message : 'JSON inválido')
                          }
                        }}
                      >
                        Aplicar colunas
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && node.type === 'KPI' && (
                <div className="space-y-2 rounded border border-gray-200 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField
                      label="Formato"
                      value={String(getProp(node, 'format', 'number'))}
                      options={[
                        { value: 'number', label: 'Número' },
                        { value: 'currency', label: 'Moeda' },
                        { value: 'percent', label: 'Percentual' },
                      ]}
                      onChange={(v) => onSetNodeProp(selectedPath, 'format', v)}
                    />
                    <NumberField
                      label="fr"
                      value={Number(getProp(node, 'fr', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'fr', v)}
                    />
                  </div>
                  <TextField
                    label="valuePath"
                    value={String(getProp(node, 'valuePath', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'valuePath', v || undefined)}
                    placeholder="ex.: vendas.kpis.faturamento"
                  />
                  <TextField
                    label="unit"
                    value={String(getProp(node, 'unit', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'unit', v || undefined)}
                    placeholder="ex.: %"
                  />
                  <TextAreaField
                    label="dataQuery.query"
                    value={String(getProp(node, 'dataQuery.query', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.query', v || undefined)}
                    placeholder="SELECT ... AS value"
                    rows={8}
                  />
                  <TextField
                    label="dataQuery.yField"
                    value={String(getProp(node, 'dataQuery.yField', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.yField', v || undefined)}
                    placeholder="value"
                  />
                </div>
              )}

              {activeTab === 'data' && node.type === 'KPICompare' && (
                <div className="space-y-2 rounded border border-gray-200 p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField
                      label="format"
                      value={String(getProp(node, 'format', 'percent'))}
                      options={[
                        { value: 'percent', label: 'Percentual' },
                        { value: 'number', label: 'Número' },
                        { value: 'currency', label: 'Moeda' },
                      ]}
                      onChange={(v) => onSetNodeProp(selectedPath, 'format', v)}
                    />
                    <TextField
                      label="sourcePath"
                      value={String(getProp(node, 'sourcePath', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'sourcePath', v || undefined)}
                      placeholder="ex.: kpis.vendas"
                    />
                    <TextField
                      label="comparisonValueField"
                      value={String(getProp(node, 'comparisonValueField', 'delta_percent'))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'comparisonValueField', v || undefined)}
                    />
                    <TextField
                      label="labelField"
                      value={String(getProp(node, 'labelField', 'comparison_label'))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'labelField', v || undefined)}
                    />
                    <TextField
                      label="label (override)"
                      value={String(getProp(node, 'label', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'label', v || undefined)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'data' && (node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart') && (
                <div className="grid grid-cols-2 gap-2">
                  <SelectField
                    label="Formato"
                    value={String(getProp(node, 'format', 'number'))}
                    options={[
                      { value: 'number', label: 'Número' },
                      { value: 'currency', label: 'Moeda' },
                      { value: 'percent', label: 'Percentual' },
                    ]}
                    onChange={(v) => onSetNodeProp(selectedPath, 'format', v)}
                  />
                  <NumberField
                    label="fr"
                    value={Number(getProp(node, 'fr', '')) || ''}
                    onChange={(v) => onSetNodeProp(selectedPath, 'fr', v)}
                  />
                </div>
              )}

              {activeTab === 'data' && (node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart') && (
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="Altura"
                    value={Number(getProp(node, 'height', '')) || ''}
                    onChange={(v) => onSetNodeProp(selectedPath, 'height', v)}
                  />
                  <NumberField
                    label="Limite"
                    value={Number(getProp(node, 'dataQuery.limit', '')) || ''}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.limit', v)}
                  />
                </div>
              )}

              {activeTab === 'data' && (node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart') && (
                <>
                  <TextAreaField
                    label="dataQuery.query"
                    value={String(getProp(node, 'dataQuery.query', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.query', v || undefined)}
                    placeholder="SELECT ... AS dimensao, ... AS valor"
                    rows={8}
                  />
                  <TextField
                    label="dataQuery.xField"
                    value={String(getProp(node, 'dataQuery.xField', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.xField', v || undefined)}
                    placeholder="ex.: dimensao"
                  />
                  <TextField
                    label="dataQuery.yField"
                    value={String(getProp(node, 'dataQuery.yField', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.yField', v || undefined)}
                    placeholder="ex.: valor"
                  />
                  <TextField
                    label="dataQuery.keyField"
                    value={String(getProp(node, 'dataQuery.keyField', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.keyField', v || undefined)}
                    placeholder="ex.: dimensao_id"
                  />
                </>
              )}

              {activeTab === 'data' && node.type === 'Header' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <SelectField
                      label="direction"
                      value={String(getProp(node, 'direction', 'row'))}
                      options={[
                        { value: 'row', label: 'Row' },
                        { value: 'column', label: 'Column' },
                      ]}
                      onChange={(v) => onSetNodeProp(selectedPath, 'direction', v)}
                    />
                    <SelectField
                      label="justify"
                      value={String(getProp(node, 'justify', 'between'))}
                      options={[
                        { value: 'between', label: 'Between' },
                        { value: 'start', label: 'Start' },
                        { value: 'center', label: 'Center' },
                        { value: 'end', label: 'End' },
                        { value: 'around', label: 'Around' },
                        { value: 'evenly', label: 'Evenly' },
                      ]}
                      onChange={(v) => onSetNodeProp(selectedPath, 'justify', v)}
                    />
                    <SelectField
                      label="align"
                      value={String(getProp(node, 'align', 'center'))}
                      options={[
                        { value: 'center', label: 'Center' },
                        { value: 'start', label: 'Start' },
                        { value: 'end', label: 'End' },
                        { value: 'stretch', label: 'Stretch' },
                      ]}
                      onChange={(v) => onSetNodeProp(selectedPath, 'align', v)}
                    />
                    <NumberField
                      label="gap"
                      value={Number(getProp(node, 'gap', '')) || ''}
                      onChange={(v) => onSetNodeProp(selectedPath, 'gap', v)}
                    />
                  </div>
                  <CheckboxField
                    label="Date Picker visível"
                    checked={Boolean(getProp(node, 'datePicker.visible', false))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.visible', v)}
                  />
                  <SelectField
                    label="Date Picker modo"
                    value={String(getProp(node, 'datePicker.mode', 'range'))}
                    options={[
                      { value: 'range', label: 'Range' },
                      { value: 'single', label: 'Single' },
                    ]}
                    onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.mode', v)}
                  />
                  <TextField
                    label="datePicker.storePath"
                    value={String(getProp(node, 'datePicker.storePath', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.storePath', v || undefined)}
                  />
                  <TextField
                    label="datePicker.presets"
                    value={(() => {
                      const raw = getProp<any>(node, 'datePicker.presets', [])
                      return Array.isArray(raw) ? raw.join(', ') : ''
                    })()}
                    onChange={(v) => {
                      const values = v.split(',').map((x) => x.trim()).filter(Boolean)
                      onSetNodeProp(selectedPath, 'datePicker.presets', values.length ? values : undefined)
                    }}
                    placeholder="7d, 14d, 30d, 90d, month"
                  />
                </div>
              )}

              {activeTab === 'data' && node.type === 'SlicerCard' && (
                <div className="grid grid-cols-2 gap-2">
                  <SelectField
                    label="Layout"
                    value={String(getProp(node, 'layout', 'vertical'))}
                    options={[
                      { value: 'vertical', label: 'Vertical' },
                      { value: 'horizontal', label: 'Horizontal' },
                    ]}
                    onChange={(v) => onSetNodeProp(selectedPath, 'layout', v)}
                  />
                  <SelectField
                    label="Apply Mode"
                    value={String(getProp(node, 'applyMode', 'auto'))}
                    options={[
                      { value: 'auto', label: 'Auto' },
                      { value: 'manual', label: 'Manual' },
                    ]}
                    onChange={(v) => onSetNodeProp(selectedPath, 'applyMode', v)}
                  />
                </div>
              )}

              {activeTab === 'data' && node.type === 'SlicerCard' && (
                <CheckboxField
                  label="Borderless"
                  checked={Boolean(getProp(node, 'borderless', false))}
                  onChange={(v) => onSetNodeProp(selectedPath, 'borderless', v)}
                />
              )}

              {activeTab === 'nivo' && isChartNode && (
                <>
                  <div className="space-y-2 rounded border border-gray-200 p-2">
                    <div className="text-sm font-medium text-gray-700">Colors</div>
                    <TextField
                      label="colorScheme (separe por vírgula)"
                      value={(() => {
                        const raw = getProp<any>(node, 'colorScheme', '')
                        if (Array.isArray(raw)) return raw.join(', ')
                        return typeof raw === 'string' ? raw : ''
                      })()}
                      onChange={(v) => {
                        const values = v.split(',').map((x) => x.trim()).filter(Boolean)
                        onSetNodeProp(selectedPath, 'colorScheme', values.length ? values : undefined)
                      }}
                      placeholder="#3b82f6, #10b981, #f59e0b"
                    />
                    {node.type === 'BarChart' && (
                      <div className="grid grid-cols-2 gap-2">
                        <SelectField
                          label="nivo.colorBy"
                          value={String(getProp(node, 'nivo.colorBy', 'indexValue'))}
                          options={[
                            { value: 'indexValue', label: 'indexValue' },
                            { value: 'id', label: 'id' },
                          ]}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.colorBy', v)}
                        />
                        <NumberField
                          label="nivo.borderRadius"
                          value={Number(getProp(node, 'nivo.borderRadius', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.borderRadius', v)}
                        />
                      </div>
                    )}
                    {node.type === 'PieChart' && (
                      <ColorField
                        label="nivo.arcLabelsTextColor"
                        value={String(getProp(node, 'nivo.arcLabelsTextColor', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'nivo.arcLabelsTextColor', v || undefined)}
                      />
                    )}
                  </div>

                  <div className="space-y-2 rounded border border-gray-200 p-2">
                    <div className="text-sm font-medium text-gray-700">Layout</div>
                    {node.type === 'BarChart' && (
                      <div className="grid grid-cols-2 gap-2">
                        <SelectField
                          label="nivo.layout"
                          value={String(getProp(node, 'nivo.layout', 'vertical'))}
                          options={[
                            { value: 'vertical', label: 'Vertical' },
                            { value: 'horizontal', label: 'Horizontal' },
                          ]}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.layout', v)}
                        />
                        <SelectField
                          label="nivo.groupMode"
                          value={String(getProp(node, 'nivo.groupMode', 'grouped'))}
                          options={[
                            { value: 'grouped', label: 'Grouped' },
                            { value: 'stacked', label: 'Stacked' },
                          ]}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.groupMode', v)}
                        />
                        <NumberField
                          label="nivo.padding"
                          value={Number(getProp(node, 'nivo.padding', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.padding', v)}
                        />
                        <CheckboxField
                          label="nivo.autoMargin"
                          checked={Boolean(getProp(node, 'nivo.autoMargin', true))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.autoMargin', v)}
                        />
                        <NumberField
                          label="nivo.maxLabelWidth"
                          value={Number(getProp(node, 'nivo.maxLabelWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.maxLabelWidth', v)}
                        />
                      </div>
                    )}
                    {node.type === 'LineChart' && (
                      <div className="grid grid-cols-2 gap-2">
                        <TextField
                          label="nivo.curve"
                          value={String(getProp(node, 'nivo.curve', 'linear'))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.curve', v || undefined)}
                        />
                        <CheckboxField
                          label="nivo.area"
                          checked={Boolean(getProp(node, 'nivo.area', false))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.area', v)}
                        />
                        <NumberField
                          label="nivo.areaBaselineValue"
                          value={Number(getProp(node, 'nivo.areaBaselineValue', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.areaBaselineValue', v)}
                        />
                        <NumberField
                          label="nivo.pointSize"
                          value={Number(getProp(node, 'nivo.pointSize', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.pointSize', v)}
                        />
                        <CheckboxField
                          label="nivo.autoMargin"
                          checked={Boolean(getProp(node, 'nivo.autoMargin', true))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.autoMargin', v)}
                        />
                        <NumberField
                          label="nivo.maxLabelWidth"
                          value={Number(getProp(node, 'nivo.maxLabelWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.maxLabelWidth', v)}
                        />
                      </div>
                    )}
                    {node.type === 'PieChart' && (
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="nivo.innerRadius"
                          value={Number(getProp(node, 'nivo.innerRadius', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.innerRadius', v)}
                        />
                        <NumberField
                          label="nivo.padAngle"
                          value={Number(getProp(node, 'nivo.padAngle', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.padAngle', v)}
                        />
                        <NumberField
                          label="nivo.cornerRadius"
                          value={Number(getProp(node, 'nivo.cornerRadius', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.cornerRadius', v)}
                        />
                        <NumberField
                          label="nivo.activeInnerRadiusOffset"
                          value={Number(getProp(node, 'nivo.activeInnerRadiusOffset', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.activeInnerRadiusOffset', v)}
                        />
                        <NumberField
                          label="nivo.activeOuterRadiusOffset"
                          value={Number(getProp(node, 'nivo.activeOuterRadiusOffset', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.activeOuterRadiusOffset', v)}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      <NumberField
                        label="nivo.margin.top"
                        value={Number(getProp(node, 'nivo.margin.top', '')) || ''}
                        onChange={(v) => onSetNodeProp(selectedPath, 'nivo.margin.top', v)}
                      />
                      <NumberField
                        label="nivo.margin.right"
                        value={Number(getProp(node, 'nivo.margin.right', '')) || ''}
                        onChange={(v) => onSetNodeProp(selectedPath, 'nivo.margin.right', v)}
                      />
                      <NumberField
                        label="nivo.margin.bottom"
                        value={Number(getProp(node, 'nivo.margin.bottom', '')) || ''}
                        onChange={(v) => onSetNodeProp(selectedPath, 'nivo.margin.bottom', v)}
                      />
                      <NumberField
                        label="nivo.margin.left"
                        value={Number(getProp(node, 'nivo.margin.left', '')) || ''}
                        onChange={(v) => onSetNodeProp(selectedPath, 'nivo.margin.left', v)}
                      />
                    </div>
                  </div>

                  {(node.type === 'BarChart' || node.type === 'LineChart') && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Axes</div>
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="nivo.axisBottom.tickRotation"
                          value={Number(getProp(node, 'nivo.axisBottom.tickRotation', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.axisBottom.tickRotation', v)}
                        />
                        <TextField
                          label="nivo.axisBottom.legend"
                          value={String(getProp(node, 'nivo.axisBottom.legend', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.axisBottom.legend', v || undefined)}
                        />
                        <NumberField
                          label="nivo.axisBottom.legendOffset"
                          value={Number(getProp(node, 'nivo.axisBottom.legendOffset', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.axisBottom.legendOffset', v)}
                        />
                        {node.type === 'BarChart' ? (
                          <NumberField
                            label="nivo.axisBottom.maxTicks"
                            value={Number(getProp(node, 'nivo.axisBottom.maxTicks', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'nivo.axisBottom.maxTicks', v)}
                          />
                        ) : <div />}
                        <TextField
                          label="nivo.axisLeft.legend"
                          value={String(getProp(node, 'nivo.axisLeft.legend', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.axisLeft.legend', v || undefined)}
                        />
                        <NumberField
                          label="nivo.axisLeft.legendOffset"
                          value={Number(getProp(node, 'nivo.axisLeft.legendOffset', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.axisLeft.legendOffset', v)}
                        />
                        {node.type === 'BarChart' ? (
                          <NumberField
                            label="nivo.axisLeft.maxTicks"
                            value={Number(getProp(node, 'nivo.axisLeft.maxTicks', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'nivo.axisLeft.maxTicks', v)}
                          />
                        ) : <div />}
                      </div>
                    </div>
                  )}

                  {(node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart') && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Labels & Grid</div>
                      <div className="grid grid-cols-2 gap-2">
                        {node.type !== 'PieChart' && (
                          <>
                            <CheckboxField
                              label="nivo.gridX"
                              checked={Boolean(getProp(node, 'nivo.gridX', false))}
                              onChange={(v) => onSetNodeProp(selectedPath, 'nivo.gridX', v)}
                            />
                            <CheckboxField
                              label="nivo.gridY"
                              checked={Boolean(getProp(node, 'nivo.gridY', false))}
                              onChange={(v) => onSetNodeProp(selectedPath, 'nivo.gridY', v)}
                            />
                          </>
                        )}
                        {node.type === 'BarChart' && (
                          <>
                            <CheckboxField
                              label="nivo.enableLabel"
                              checked={Boolean(getProp(node, 'nivo.enableLabel', false))}
                              onChange={(v) => onSetNodeProp(selectedPath, 'nivo.enableLabel', v)}
                            />
                            <NumberField
                              label="nivo.labelSkipWidth"
                              value={Number(getProp(node, 'nivo.labelSkipWidth', '')) || ''}
                              onChange={(v) => onSetNodeProp(selectedPath, 'nivo.labelSkipWidth', v)}
                            />
                            <NumberField
                              label="nivo.labelSkipHeight"
                              value={Number(getProp(node, 'nivo.labelSkipHeight', '')) || ''}
                              onChange={(v) => onSetNodeProp(selectedPath, 'nivo.labelSkipHeight', v)}
                            />
                          </>
                        )}
                        {node.type === 'PieChart' && (
                          <>
                            <CheckboxField
                              label="nivo.enableArcLabels"
                              checked={Boolean(getProp(node, 'nivo.enableArcLabels', true))}
                              onChange={(v) => onSetNodeProp(selectedPath, 'nivo.enableArcLabels', v)}
                            />
                            <CheckboxField
                              label="nivo.enableArcLinkLabels"
                              checked={Boolean(getProp(node, 'nivo.enableArcLinkLabels', false))}
                              onChange={(v) => onSetNodeProp(selectedPath, 'nivo.enableArcLinkLabels', v)}
                            />
                            <NumberField
                              label="nivo.arcLabelsSkipAngle"
                              value={Number(getProp(node, 'nivo.arcLabelsSkipAngle', '')) || ''}
                              onChange={(v) => onSetNodeProp(selectedPath, 'nivo.arcLabelsSkipAngle', v)}
                            />
                          </>
                        )}
                        <NumberField
                          label="nivo.theme.fontSize"
                          value={Number(getProp(node, 'nivo.theme.fontSize', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.theme.fontSize', v)}
                        />
                        <ColorField
                          label="nivo.theme.textColor"
                          value={String(getProp(node, 'nivo.theme.textColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'nivo.theme.textColor', v || undefined)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 rounded border border-gray-200 p-2">
                    <div className="text-sm font-medium text-gray-700">Motion</div>
                    <div className="grid grid-cols-2 gap-2">
                      <CheckboxField
                        label="nivo.animate"
                        checked={Boolean(getProp(node, 'nivo.animate', true))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'nivo.animate', v)}
                      />
                      <TextField
                        label="nivo.motionConfig"
                        value={String(getProp(node, 'nivo.motionConfig', 'gentle'))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'nivo.motionConfig', v || undefined)}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'style' && (
                <>
                  {supportsFr && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Layout</div>
                      <NumberField
                        label="fr (largura relativa)"
                        value={Number(getProp(node, 'fr', '')) || ''}
                        onChange={(v) => onSetNodeProp(selectedPath, 'fr', v)}
                      />
                    </div>
                  )}

                  {(node.type === 'SlicerCard' || node.type === 'Card' || node.type === 'CardTitle' || node.type === 'Title' || node.type === 'Subtitle') && (
                    <TextField
                      label={node.type === 'CardTitle' || node.type === 'Title' || node.type === 'Subtitle' ? 'Texto' : 'Título'}
                      value={String(node.type === 'CardTitle' || node.type === 'Title' || node.type === 'Subtitle' ? getProp(node, 'text', getProp(node, 'title', '')) : getProp(node, 'title', ''))}
                      onChange={(v) => {
                        const next = v || undefined
                        if (node.type === 'CardTitle' || node.type === 'Title' || node.type === 'Subtitle') {
                          onSetNodeProp(selectedPath, 'text', next)
                          onSetNodeProp(selectedPath, 'title', next)
                        } else {
                          onSetNodeProp(selectedPath, 'title', next)
                        }
                      }}
                    />
                  )}

                  {node.type === 'Icon' && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Icon Style</div>
                      <div className="grid grid-cols-2 gap-2">
                        <ColorField
                          label="color"
                          value={String(getProp(node, 'color', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'color', v || undefined)}
                        />
                        <ColorField
                          label="backgroundColor"
                          value={String(getProp(node, 'backgroundColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'backgroundColor', v || undefined)}
                        />
                        <ColorField
                          label="borderColor"
                          value={String(getProp(node, 'borderColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderColor', v || undefined)}
                        />
                        <NumberField
                          label="borderWidth"
                          value={Number(getProp(node, 'borderWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderWidth', v)}
                        />
                        <NumberField
                          label="strokeWidth"
                          value={Number(getProp(node, 'strokeWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'strokeWidth', v)}
                        />
                        <NumberField
                          label="padding"
                          value={Number(getProp(node, 'padding', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'padding', v)}
                        />
                        <NumberField
                          label="radius"
                          value={Number(getProp(node, 'radius', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'radius', v)}
                        />
                      </div>
                    </div>
                  )}

                  {(node.type === 'Header' || node.type === 'Container' || node.type === 'Card' || node.type === 'Sidebar') && (
                    <ColorField
                      label="backgroundColor"
                      value={String(getProp(node, 'backgroundColor', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'backgroundColor', v || undefined)}
                    />
                  )}

                  {node.type === 'Card' && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Card Layout</div>
                      <div className="grid grid-cols-2 gap-2">
                        <SelectField
                          label="direction"
                          value={String(getProp(node, 'direction', 'column'))}
                          options={[
                            { value: 'column', label: 'Column' },
                            { value: 'row', label: 'Row' },
                          ]}
                          onChange={(v) => onSetNodeProp(selectedPath, 'direction', v)}
                        />
                        <SelectField
                          label="justify"
                          value={String(getProp(node, 'justify', 'start'))}
                          options={[
                            { value: 'start', label: 'Start' },
                            { value: 'between', label: 'Between' },
                            { value: 'center', label: 'Center' },
                            { value: 'end', label: 'End' },
                            { value: 'around', label: 'Around' },
                            { value: 'evenly', label: 'Evenly' },
                          ]}
                          onChange={(v) => onSetNodeProp(selectedPath, 'justify', v)}
                        />
                        <SelectField
                          label="align"
                          value={String(getProp(node, 'align', 'stretch'))}
                          options={[
                            { value: 'stretch', label: 'Stretch' },
                            { value: 'center', label: 'Center' },
                            { value: 'start', label: 'Start' },
                            { value: 'end', label: 'End' },
                          ]}
                          onChange={(v) => onSetNodeProp(selectedPath, 'align', v)}
                        />
                        <NumberField
                          label="gap"
                          value={Number(getProp(node, 'gap', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'gap', v)}
                        />
                        <NumberField
                          label="padding"
                          value={Number(getProp(node, 'padding', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'padding', v)}
                        />
                      </div>
                      <CheckboxField
                        label="wrap"
                        checked={Boolean(getProp(node, 'wrap', false))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'wrap', v)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <ColorField
                          label="borderColor"
                          value={String(getProp(node, 'borderColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderColor', v || undefined)}
                        />
                        <NumberField
                          label="borderWidth"
                          value={Number(getProp(node, 'borderWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderWidth', v)}
                        />
                        <NumberField
                          label="borderRadius"
                          value={Number(getProp(node, 'borderRadius', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderRadius', v)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SelectField
                          label="frame.variant"
                          value={String(getProp(node, 'frame.variant', ''))}
                          options={[
                            { value: '', label: 'Nenhum' },
                            { value: 'hud', label: 'HUD' },
                          ]}
                          onChange={(v) => onSetNodeProp(selectedPath, 'frame.variant', v || undefined)}
                        />
                        <NumberField
                          label="frame.cornerSize"
                          value={Number(getProp(node, 'frame.cornerSize', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'frame.cornerSize', v)}
                        />
                        <NumberField
                          label="frame.cornerWidth"
                          value={Number(getProp(node, 'frame.cornerWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'frame.cornerWidth', v)}
                        />
                        <ColorField
                          label="frame.baseColor"
                          value={String(getProp(node, 'frame.baseColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'frame.baseColor', v || undefined)}
                        />
                        <ColorField
                          label="frame.cornerColor"
                          value={String(getProp(node, 'frame.cornerColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'frame.cornerColor', v || undefined)}
                        />
                      </div>
                    </div>
                  )}

                  {(node.type === 'Container' || node.type === 'Sidebar') && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Flex Item</div>
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="grow"
                          value={Number(getProp(node, 'grow', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'grow', v)}
                        />
                        <NumberField
                          label="shrink"
                          value={Number(getProp(node, 'shrink', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'shrink', v)}
                        />
                      </div>
                      <TextField
                        label="basis (px, %, auto)"
                        value={String(getProp(node, 'basis', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'basis', v || undefined)}
                      />
                      <TextField
                        label="minHeight"
                        value={String(getProp(node, 'minHeight', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'minHeight', v || undefined)}
                        placeholder="ex.: 100%"
                      />
                    </div>
                  )}

                  {node.type === 'Sidebar' && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Sidebar Layout</div>
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="width"
                          value={Number(getProp(node, 'width', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'width', v)}
                        />
                        <NumberField
                          label="minWidth"
                          value={Number(getProp(node, 'minWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'minWidth', v)}
                        />
                        <NumberField
                          label="maxWidth"
                          value={Number(getProp(node, 'maxWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'maxWidth', v)}
                        />
                        <NumberField
                          label="height"
                          value={Number(getProp(node, 'height', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'height', v)}
                        />
                        <TextField
                          label="minHeight"
                          value={String(getProp(node, 'minHeight', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'minHeight', v || undefined)}
                          placeholder="ex.: 100%"
                        />
                        <NumberField
                          label="gap"
                          value={Number(getProp(node, 'gap', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'gap', v)}
                        />
                        <NumberField
                          label="padding"
                          value={Number(getProp(node, 'padding', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'padding', v)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <SelectField
                          label="direction"
                          value={String(getProp(node, 'direction', 'column'))}
                          options={[
                            { value: 'column', label: 'Column' },
                            { value: 'row', label: 'Row' },
                          ]}
                          onChange={(v) => onSetNodeProp(selectedPath, 'direction', v)}
                        />
                        <CheckboxField
                          label="sticky"
                          checked={Boolean(getProp(node, 'sticky', false))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'sticky', v)}
                        />
                        <NumberField
                          label="top"
                          value={Number(getProp(node, 'top', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'top', v)}
                        />
                        <SelectField
                          label="overflowY"
                          value={String(getProp(node, 'overflowY', 'visible'))}
                          options={[
                            { value: 'visible', label: 'Visible' },
                            { value: 'auto', label: 'Auto' },
                            { value: 'scroll', label: 'Scroll' },
                            { value: 'hidden', label: 'Hidden' },
                          ]}
                          onChange={(v) => onSetNodeProp(selectedPath, 'overflowY', v)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <ColorField
                          label="borderColor"
                          value={String(getProp(node, 'borderColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderColor', v || undefined)}
                        />
                        <NumberField
                          label="borderWidth"
                          value={Number(getProp(node, 'borderWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderWidth', v)}
                        />
                        <NumberField
                          label="borderRadius"
                          value={Number(getProp(node, 'borderRadius', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderRadius', v)}
                        />
                      </div>
                    </div>
                  )}

                  {(node.type === 'SlicerCard' || node.type === 'Gauge') && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Container Style</div>
                      <ColorField
                        label="containerStyle.backgroundColor"
                        value={String(getProp(node, 'containerStyle.backgroundColor', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'containerStyle.backgroundColor', v || undefined)}
                      />
                      <ColorField
                        label="containerStyle.borderColor"
                        value={String(getProp(node, 'containerStyle.borderColor', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'containerStyle.borderColor', v || undefined)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="containerStyle.borderWidth"
                          value={Number(getProp(node, 'containerStyle.borderWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'containerStyle.borderWidth', v)}
                        />
                        <NumberField
                          label="containerStyle.borderRadius"
                          value={Number(getProp(node, 'containerStyle.borderRadius', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'containerStyle.borderRadius', v)}
                        />
                      </div>
                    </div>
                  )}

                  {node.type === 'KPI' && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Value Style</div>
                      <ColorField
                        label="valueStyle.color"
                        value={String(getProp(node, 'valueStyle.color', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'valueStyle.color', v || undefined)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="valueStyle.fontSize"
                          value={Number(getProp(node, 'valueStyle.fontSize', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'valueStyle.fontSize', v)}
                        />
                        <NumberField
                          label="valueStyle.fontWeight"
                          value={Number(getProp(node, 'valueStyle.fontWeight', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'valueStyle.fontWeight', v)}
                        />
                      </div>
                    </div>
                  )}

                  {node.type === 'KPICompare' && (
                    <>
                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-sm font-medium text-gray-700">Compare Style</div>
                        <div className="grid grid-cols-2 gap-2">
                          <CheckboxField
                            label="showIcon"
                            checked={Boolean(getProp(node, 'showIcon', true))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'showIcon', v)}
                          />
                          <CheckboxField
                            label="invertDirection"
                            checked={Boolean(getProp(node, 'invertDirection', false))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'invertDirection', v)}
                          />
                          <ColorField
                            label="positiveColor"
                            value={String(getProp(node, 'positiveColor', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'positiveColor', v || undefined)}
                          />
                          <ColorField
                            label="negativeColor"
                            value={String(getProp(node, 'negativeColor', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'negativeColor', v || undefined)}
                          />
                          <ColorField
                            label="neutralColor"
                            value={String(getProp(node, 'neutralColor', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'neutralColor', v || undefined)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-sm font-medium text-gray-700">Value Style</div>
                        <div className="grid grid-cols-2 gap-2">
                          <ColorField
                            label="valueStyle.color"
                            value={String(getProp(node, 'valueStyle.color', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'valueStyle.color', v || undefined)}
                          />
                          <NumberField
                            label="valueStyle.fontSize"
                            value={Number(getProp(node, 'valueStyle.fontSize', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'valueStyle.fontSize', v)}
                          />
                          <NumberField
                            label="valueStyle.fontWeight"
                            value={Number(getProp(node, 'valueStyle.fontWeight', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'valueStyle.fontWeight', v)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-sm font-medium text-gray-700">Label Style</div>
                        <div className="grid grid-cols-2 gap-2">
                          <ColorField
                            label="labelStyle.color"
                            value={String(getProp(node, 'labelStyle.color', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'labelStyle.color', v || undefined)}
                          />
                          <NumberField
                            label="labelStyle.fontSize"
                            value={Number(getProp(node, 'labelStyle.fontSize', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'labelStyle.fontSize', v)}
                          />
                          <NumberField
                            label="labelStyle.fontWeight"
                            value={Number(getProp(node, 'labelStyle.fontWeight', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'labelStyle.fontWeight', v)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {node.type === 'Sparkline' && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Sparkline Style</div>
                      <div className="grid grid-cols-2 gap-2">
                        <ColorField
                          label="strokeColor"
                          value={String(getProp(node, 'strokeColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'strokeColor', v || undefined)}
                        />
                        <ColorField
                          label="fillColor"
                          value={String(getProp(node, 'fillColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'fillColor', v || undefined)}
                        />
                        <ColorField
                          label="dotColor"
                          value={String(getProp(node, 'dotColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'dotColor', v || undefined)}
                        />
                        <NumberField
                          label="strokeWidth"
                          value={Number(getProp(node, 'strokeWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'strokeWidth', v)}
                        />
                        <CheckboxField
                          label="area"
                          checked={Boolean(getProp(node, 'area', true))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'area', v)}
                        />
                        <CheckboxField
                          label="showDots"
                          checked={Boolean(getProp(node, 'showDots', false))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'showDots', v)}
                        />
                      </div>
                    </div>
                  )}

                  {(node.type === 'Header' || node.type === 'SlicerCard' || node.type === 'Card' || node.type === 'CardTitle' || node.type === 'Title' || node.type === 'Subtitle') && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Title Style</div>
                      <ColorField
                        label="titleStyle.color"
                        value={String(getProp(node, 'titleStyle.color', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'titleStyle.color', v || undefined)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="titleStyle.fontSize"
                          value={Number(getProp(node, 'titleStyle.fontSize', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'titleStyle.fontSize', v)}
                        />
                        <NumberField
                          label="titleStyle.fontWeight"
                          value={Number(getProp(node, 'titleStyle.fontWeight', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'titleStyle.fontWeight', v)}
                        />
                      </div>
                    </div>
                  )}

                  {selectedPath && (node.type === 'CardTitle' || node.type === 'Title' || node.type === 'Subtitle') && (
                    <TextSpacingFields
                      node={node}
                      selectedPath={selectedPath}
                      onSetNodeProp={onSetNodeProp}
                    />
                  )}

                  {node.type === 'AISummary' && (
                    <>
                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-sm font-medium text-gray-700">Texto dos Itens</div>
                        <ColorField
                          label="itemTextStyle.color"
                          value={String(getProp(node, 'itemTextStyle.color', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'itemTextStyle.color', v || undefined)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <NumberField
                            label="itemTextStyle.fontSize"
                            value={Number(getProp(node, 'itemTextStyle.fontSize', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'itemTextStyle.fontSize', v)}
                          />
                          <NumberField
                            label="itemGap"
                            value={Number(getProp(node, 'itemGap', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'itemGap', v)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-sm font-medium text-gray-700">Ícones</div>
                        <div className="grid grid-cols-2 gap-2">
                          <NumberField
                            label="iconBoxSize"
                            value={Number(getProp(node, 'iconBoxSize', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'iconBoxSize', v)}
                          />
                          <NumberField
                            label="iconSize"
                            value={Number(getProp(node, 'iconSize', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'iconSize', v)}
                          />
                          <NumberField
                            label="iconGap"
                            value={Number(getProp(node, 'iconGap', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'iconGap', v)}
                          />
                          <NumberField
                            label="iconBoxRadius"
                            value={Number(getProp(node, 'iconBoxRadius', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'iconBoxRadius', v)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {node.type === 'Header' && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Header Colors</div>
                      <ColorField
                        label="textColor"
                        value={String(getProp(node, 'textColor', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'textColor', v || undefined)}
                      />
                      <ColorField
                        label="subtitleColor"
                        value={String(getProp(node, 'subtitleColor', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'subtitleColor', v || undefined)}
                      />
                      <ColorField
                        label="borderColor"
                        value={String(getProp(node, 'borderColor', ''))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'borderColor', v || undefined)}
                      />
                    </div>
                  )}

                  {node.type === 'Header' && (
                    <>
                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-sm font-medium text-gray-700">Date Picker Text</div>
                        <div className="grid grid-cols-2 gap-2">
                          <TextField
                            label="datePicker.style.textStyle.fontFamily"
                            value={String(getProp(node, 'datePicker.style.textStyle.fontFamily', getProp(node, 'datePicker.style.fontFamily', '')))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.textStyle.fontFamily', v || undefined)}
                          />
                          <NumberField
                            label="datePicker.style.textStyle.fontSize"
                            value={Number(getProp(node, 'datePicker.style.textStyle.fontSize', getProp(node, 'datePicker.style.fontSize', ''))) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.textStyle.fontSize', v)}
                          />
                          <NumberField
                            label="datePicker.style.textStyle.fontWeight"
                            value={Number(getProp(node, 'datePicker.style.textStyle.fontWeight', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.textStyle.fontWeight', v)}
                          />
                          <ColorField
                            label="datePicker.style.textStyle.color"
                            value={String(getProp(node, 'datePicker.style.textStyle.color', getProp(node, 'datePicker.style.color', '')))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.textStyle.color', v || undefined)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-sm font-medium text-gray-700">Preset Button</div>
                        <div className="grid grid-cols-2 gap-2">
                          <ColorField
                            label="datePicker.style.presetButtonStyle.backgroundColor"
                            value={String(getProp(node, 'datePicker.style.presetButtonStyle.backgroundColor', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.presetButtonStyle.backgroundColor', v || undefined)}
                          />
                          <ColorField
                            label="datePicker.style.presetButtonStyle.color"
                            value={String(getProp(node, 'datePicker.style.presetButtonStyle.color', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.presetButtonStyle.color', v || undefined)}
                          />
                          <ColorField
                            label="datePicker.style.presetButtonStyle.borderColor"
                            value={String(getProp(node, 'datePicker.style.presetButtonStyle.borderColor', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.presetButtonStyle.borderColor', v || undefined)}
                          />
                          <NumberField
                            label="datePicker.style.presetButtonStyle.borderWidth"
                            value={Number(getProp(node, 'datePicker.style.presetButtonStyle.borderWidth', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.presetButtonStyle.borderWidth', v)}
                          />
                          <NumberField
                            label="datePicker.style.presetButtonStyle.borderRadius"
                            value={Number(getProp(node, 'datePicker.style.presetButtonStyle.borderRadius', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.presetButtonStyle.borderRadius', v)}
                          />
                          <TextField
                            label="datePicker.style.presetButtonStyle.fontFamily"
                            value={String(getProp(node, 'datePicker.style.presetButtonStyle.fontFamily', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.presetButtonStyle.fontFamily', v || undefined)}
                          />
                          <NumberField
                            label="datePicker.style.presetButtonStyle.fontSize"
                            value={Number(getProp(node, 'datePicker.style.presetButtonStyle.fontSize', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.presetButtonStyle.fontSize', v)}
                          />
                          <NumberField
                            label="datePicker.style.presetButtonStyle.fontWeight"
                            value={Number(getProp(node, 'datePicker.style.presetButtonStyle.fontWeight', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.presetButtonStyle.fontWeight', v)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-sm font-medium text-gray-700">Active Preset Button</div>
                        <div className="grid grid-cols-2 gap-2">
                          <ColorField
                            label="datePicker.style.activePresetButtonStyle.backgroundColor"
                            value={String(getProp(node, 'datePicker.style.activePresetButtonStyle.backgroundColor', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.activePresetButtonStyle.backgroundColor', v || undefined)}
                          />
                          <ColorField
                            label="datePicker.style.activePresetButtonStyle.color"
                            value={String(getProp(node, 'datePicker.style.activePresetButtonStyle.color', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.activePresetButtonStyle.color', v || undefined)}
                          />
                          <ColorField
                            label="datePicker.style.activePresetButtonStyle.borderColor"
                            value={String(getProp(node, 'datePicker.style.activePresetButtonStyle.borderColor', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.activePresetButtonStyle.borderColor', v || undefined)}
                          />
                          <NumberField
                            label="datePicker.style.activePresetButtonStyle.borderWidth"
                            value={Number(getProp(node, 'datePicker.style.activePresetButtonStyle.borderWidth', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.activePresetButtonStyle.borderWidth', v)}
                          />
                          <NumberField
                            label="datePicker.style.activePresetButtonStyle.borderRadius"
                            value={Number(getProp(node, 'datePicker.style.activePresetButtonStyle.borderRadius', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.activePresetButtonStyle.borderRadius', v)}
                          />
                          <TextField
                            label="datePicker.style.activePresetButtonStyle.fontFamily"
                            value={String(getProp(node, 'datePicker.style.activePresetButtonStyle.fontFamily', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.activePresetButtonStyle.fontFamily', v || undefined)}
                          />
                          <NumberField
                            label="datePicker.style.activePresetButtonStyle.fontSize"
                            value={Number(getProp(node, 'datePicker.style.activePresetButtonStyle.fontSize', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.activePresetButtonStyle.fontSize', v)}
                          />
                          <NumberField
                            label="datePicker.style.activePresetButtonStyle.fontWeight"
                            value={Number(getProp(node, 'datePicker.style.activePresetButtonStyle.fontWeight', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.activePresetButtonStyle.fontWeight', v)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-sm font-medium text-gray-700">Calendar Button</div>
                        <div className="grid grid-cols-2 gap-2">
                          <ColorField
                            label="datePicker.style.calendarButtonStyle.backgroundColor"
                            value={String(getProp(node, 'datePicker.style.calendarButtonStyle.backgroundColor', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.calendarButtonStyle.backgroundColor', v || undefined)}
                          />
                          <ColorField
                            label="datePicker.style.calendarButtonStyle.color"
                            value={String(getProp(node, 'datePicker.style.calendarButtonStyle.color', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.calendarButtonStyle.color', v || undefined)}
                          />
                          <ColorField
                            label="datePicker.style.calendarButtonStyle.borderColor"
                            value={String(getProp(node, 'datePicker.style.calendarButtonStyle.borderColor', ''))}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.calendarButtonStyle.borderColor', v || undefined)}
                          />
                          <NumberField
                            label="datePicker.style.calendarButtonStyle.borderWidth"
                            value={Number(getProp(node, 'datePicker.style.calendarButtonStyle.borderWidth', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.calendarButtonStyle.borderWidth', v)}
                          />
                          <NumberField
                            label="datePicker.style.calendarButtonStyle.borderRadius"
                            value={Number(getProp(node, 'datePicker.style.calendarButtonStyle.borderRadius', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.calendarButtonStyle.borderRadius', v)}
                          />
                          <NumberField
                            label="datePicker.style.calendarButtonStyle.width"
                            value={Number(getProp(node, 'datePicker.style.calendarButtonStyle.width', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.calendarButtonStyle.width', v)}
                          />
                          <NumberField
                            label="datePicker.style.calendarButtonStyle.height"
                            value={Number(getProp(node, 'datePicker.style.calendarButtonStyle.height', '')) || ''}
                            onChange={(v) => onSetNodeProp(selectedPath, 'datePicker.style.calendarButtonStyle.height', v)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {node.type === 'Table' && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-sm font-medium text-gray-700">Table Style</div>
                      <div className="grid grid-cols-2 gap-2">
                        <ColorField
                          label="headerBackground"
                          value={String(getProp(node, 'headerBackground', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'headerBackground', v || undefined)}
                        />
                        <ColorField
                          label="headerTextColor"
                          value={String(getProp(node, 'headerTextColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'headerTextColor', v || undefined)}
                        />
                        <ColorField
                          label="cellTextColor"
                          value={String(getProp(node, 'cellTextColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'cellTextColor', v || undefined)}
                        />
                        <ColorField
                          label="rowHoverColor"
                          value={String(getProp(node, 'rowHoverColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'rowHoverColor', v || undefined)}
                        />
                        <ColorField
                          label="borderColor"
                          value={String(getProp(node, 'borderColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderColor', v || undefined)}
                        />
                        <ColorField
                          label="rowAlternateBgColor"
                          value={String(getProp(node, 'rowAlternateBgColor', ''))}
                          onChange={(v) => onSetNodeProp(selectedPath, 'rowAlternateBgColor', v || undefined)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <NumberField
                          label="borderWidth"
                          value={Number(getProp(node, 'borderWidth', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'borderWidth', v)}
                        />
                        <NumberField
                          label="padding"
                          value={Number(getProp(node, 'padding', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'padding', v)}
                        />
                        <NumberField
                          label="headerFontSize"
                          value={Number(getProp(node, 'headerFontSize', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'headerFontSize', v)}
                        />
                        <NumberField
                          label="cellFontSize"
                          value={Number(getProp(node, 'cellFontSize', '')) || ''}
                          onChange={(v) => onSetNodeProp(selectedPath, 'cellFontSize', v)}
                        />
                      </div>
                      <CheckboxField
                        label="enableZebraStripes"
                        checked={Boolean(getProp(node, 'enableZebraStripes', false))}
                        onChange={(v) => onSetNodeProp(selectedPath, 'enableZebraStripes', v)}
                      />
                    </div>
                  )}

                  {(node.type === 'SlicerCard' || node.type === 'Gauge') && (
                    <CheckboxField
                      label="Borderless"
                      checked={Boolean(getProp(node, 'borderless', false))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'borderless', v)}
                    />
                  )}
                </>
              )}

              {activeTab === 'json' && (
                <div className="rounded border border-gray-200 p-2">
                  <div className="mb-1 text-sm font-medium text-gray-700">Props JSON (avançado)</div>
                  <textarea
                    value={rawPropsText}
                    onChange={(e) => setRawPropsText(e.target.value)}
                    className="min-h-[220px] w-full rounded bg-gray-100 p-2 font-mono text-[11px] outline-none ring-0 focus:bg-gray-50"
                    spellCheck={false}
                  />
                  {rawPropsError && <div className="mt-1 text-[11px] text-red-600">{rawPropsError}</div>}
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                      onClick={() => {
                        if (!selectedPath) return
                        try {
                          const parsed = JSON.parse(rawPropsText)
                          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                            setRawPropsError('Props JSON deve ser um objeto')
                            return
                          }
                          onReplaceNodeProps(selectedPath, parsed)
                          setRawPropsError(null)
                        } catch (error) {
                          setRawPropsError(error instanceof Error ? error.message : 'JSON inválido')
                        }
                      }}
                    >
                      Atualizar Rascunho JSON
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {selectedPath && (
            <div className={`flex items-center justify-between gap-3 border-t pt-3 ${draftDirty ? 'border-sky-200' : 'border-gray-100'}`}>
              <div className="min-w-0 text-sm">
                {draftDirty ? (
                  <span className="font-medium text-sky-700">Alterações não aplicadas</span>
                ) : (
                  <span className="text-gray-400">Sem alterações pendentes</span>
                )}
              </div>
              <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!draftDirty || Boolean(rawPropsError)}
                className={`rounded border px-3 py-1.5 text-sm text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  draftDirty && !rawPropsError
                    ? 'border-sky-600 bg-sky-600 hover:bg-sky-700'
                    : 'border-gray-900 bg-gray-900 hover:bg-black'
                }`}
                onClick={() => {
                  if (!selectedPath) return
                  onReplaceNodePropsExternal(selectedPath, draftProps)
                }}
              >
                Aplicar
              </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
