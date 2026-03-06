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

type TabKey = 'data' | 'style' | 'json'

const AISUMMARY_FREQUENCY_OPTIONS = [
  { value: 'none', label: 'Não repete' },
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
] as const

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTE_OPTIONS = ['00', '15', '30', '45']

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-medium text-gray-700">{children}</label>
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
        className="w-full rounded bg-gray-100 px-2 py-1 text-xs outline-none ring-0 focus:bg-gray-50"
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
        className="w-full rounded bg-gray-100 px-2 py-1.5 text-xs outline-none ring-0 focus:bg-gray-50"
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
        className="w-full rounded bg-gray-100 px-2 py-1 text-xs outline-none ring-0 focus:bg-gray-50"
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
        className="w-full rounded bg-gray-100 px-2 py-1 text-xs outline-none ring-0 focus:bg-gray-50"
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
          className="w-full rounded bg-gray-100 px-2 py-1 text-xs outline-none ring-0 focus:bg-gray-50"
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
    <label className="flex items-center gap-2 text-xs text-gray-700">
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
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-colors ${
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

  const supportsDataTab = Boolean(
    node && ['KPI', 'BarChart', 'LineChart', 'PieChart', 'Header', 'SlicerCard', 'AISummary', 'Table'].includes(String(node.type)),
  )
  const supportsStyleTab = Boolean(
    node && ['KPI', 'BarChart', 'LineChart', 'PieChart', 'Header', 'SlicerCard', 'Card', 'Div', 'Gauge', 'AISummary', 'Table'].includes(String(node.type)),
  )
  const supportsFr = Boolean(
    node && ['KPI', 'BarChart', 'LineChart', 'PieChart', 'Gauge', 'SlicerCard', 'AISummary', 'Table'].includes(String(node.type)),
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
    if (supportsStyleTab) {
      setActiveTab('style')
      return
    }
    setActiveTab('json')
  }, [selectedPath?.join('.'), node?.type, supportsDataTab, supportsStyleTab])

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
    <div className="h-full rounded-md border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <div>
          <div className="text-xs font-semibold text-gray-900">Propriedades</div>
          <div className="text-[11px] text-gray-500">
            {node ? `${String(node.type)} • ${selectedPath?.join('.') || 'root'}` : 'Nenhum componente selecionado'}
          </div>
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
                        className="w-full rounded bg-gray-100 px-2 py-1 text-xs outline-none ring-0 focus:bg-gray-50"
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
                        className="w-full rounded bg-gray-100 px-2 py-1 text-xs outline-none ring-0 focus:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
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
                        className="w-full rounded bg-gray-100 px-2 py-1 text-xs outline-none ring-0 focus:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
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

              {activeTab === 'data' && (node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'Header' || node.type === 'SlicerCard' || node.type === 'Table') && (
                <TextField
                  label="Título"
                  value={String(getProp(node, 'title', ''))}
                  onChange={(v) => onSetNodeProp(selectedPath, 'title', v || undefined)}
                />
              )}

              {activeTab === 'data' && node.type === 'Table' && (
                <div className="space-y-2 rounded border border-gray-200 p-2">
                  <div className="text-[11px] font-medium text-gray-700">Dados da Tabela</div>
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
                    <div className="text-[11px] font-medium text-gray-700">Edição</div>
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
                      className="w-full rounded bg-gray-100 px-2 py-1.5 text-xs outline-none ring-0 focus:bg-gray-50"
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

              {activeTab === 'data' && (node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart') && (
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

              {activeTab === 'data' && (node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart') && (
                <>
                  {node.type === 'KPI' && (
                    <TextField
                      label="valuePath"
                      value={String(getProp(node, 'valuePath', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'valuePath', v || undefined)}
                      placeholder="ex.: vendas.kpis.faturamento"
                    />
                  )}
                  <TextAreaField
                    label="dataQuery.query"
                    value={String(getProp(node, 'dataQuery.query', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.query', v || undefined)}
                    placeholder="SELECT ... AS dimensao, ... AS valor"
                    rows={8}
                  />
                  <TextField
                    label="dataQuery.model"
                    value={String(getProp(node, 'dataQuery.model', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.model', v || undefined)}
                    placeholder="ex.: vendas.pedidos"
                  />
                  {node.type !== 'KPI' && (
                    <TextField
                      label="dataQuery.dimension"
                      value={String(getProp(node, 'dataQuery.dimension', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.dimension', v || undefined)}
                    />
                  )}
                  <TextField
                    label="dataQuery.measure"
                    value={String(getProp(node, 'dataQuery.measure', ''))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.measure', v || undefined)}
                    placeholder="ex.: SUM(valor_total)"
                  />
                  {node.type !== 'KPI' && (
                    <>
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
                  {node.type === 'KPI' && (
                    <TextField
                      label="dataQuery.yField"
                      value={String(getProp(node, 'dataQuery.yField', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'dataQuery.yField', v || undefined)}
                      placeholder="ex.: valor"
                    />
                  )}
                </>
              )}

              {activeTab === 'data' && node.type === 'BarChart' && (
                <SelectField
                  label="Layout"
                  value={String(getProp(node, 'nivo.layout', 'vertical'))}
                  options={[
                    { value: 'vertical', label: 'Vertical' },
                    { value: 'horizontal', label: 'Horizontal' },
                  ]}
                  onChange={(v) => onSetNodeProp(selectedPath, 'nivo.layout', v)}
                />
              )}

              {activeTab === 'data' && node.type === 'LineChart' && (
                <div className="space-y-2">
                  <TextField
                    label="Curva"
                    value={String(getProp(node, 'nivo.curve', 'linear'))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'nivo.curve', v || undefined)}
                  />
                  <CheckboxField
                    label="Área"
                    checked={Boolean(getProp(node, 'nivo.area', false))}
                    onChange={(v) => onSetNodeProp(selectedPath, 'nivo.area', v)}
                  />
                </div>
              )}

              {activeTab === 'data' && node.type === 'PieChart' && (
                <NumberField
                  label="nivo.innerRadius"
                  value={Number(getProp(node, 'nivo.innerRadius', '')) || ''}
                  onChange={(v) => onSetNodeProp(selectedPath, 'nivo.innerRadius', v)}
                />
              )}

              {activeTab === 'data' && node.type === 'Header' && (
                <div className="space-y-2">
                  <SelectField
                    label="controlsPosition"
                    value={String(getProp(node, 'controlsPosition', 'right'))}
                    options={[
                      { value: 'left', label: 'Left' },
                      { value: 'right', label: 'Right' },
                      { value: 'below', label: 'Below' },
                    ]}
                    onChange={(v) => onSetNodeProp(selectedPath, 'controlsPosition', v)}
                  />
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

              {activeTab === 'data' && (node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'SlicerCard' || node.type === 'Table') && (
                <CheckboxField
                  label="Borderless"
                  checked={Boolean(getProp(node, 'borderless', false))}
                  onChange={(v) => onSetNodeProp(selectedPath, 'borderless', v)}
                />
              )}

              {activeTab === 'style' && (
                <>
                  {supportsFr && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-[11px] font-medium text-gray-700">Layout</div>
                      <NumberField
                        label="fr (largura relativa)"
                        value={Number(getProp(node, 'fr', '')) || ''}
                        onChange={(v) => onSetNodeProp(selectedPath, 'fr', v)}
                      />
                    </div>
                  )}

                  {(node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'Header' || node.type === 'SlicerCard' || node.type === 'Card' || node.type === 'AISummary' || node.type === 'Table') && (
                    <TextField
                      label="Título"
                      value={String(getProp(node, 'title', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'title', v || undefined)}
                    />
                  )}

                  {(node.type === 'Header' || node.type === 'Div' || node.type === 'Card') && (
                    <ColorField
                      label="backgroundColor"
                      value={String(getProp(node, 'backgroundColor', ''))}
                      onChange={(v) => onSetNodeProp(selectedPath, 'backgroundColor', v || undefined)}
                    />
                  )}

                  {(node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'SlicerCard' || node.type === 'Gauge' || node.type === 'AISummary' || node.type === 'Table') && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-[11px] font-medium text-gray-700">Container Style</div>
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

                  {(node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'Header' || node.type === 'SlicerCard' || node.type === 'Card' || node.type === 'AISummary' || node.type === 'Table') && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-[11px] font-medium text-gray-700">Title Style</div>
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

                  {node.type === 'AISummary' && (
                    <>
                      <div className="space-y-2 rounded border border-gray-200 p-2">
                        <div className="text-[11px] font-medium text-gray-700">Texto dos Itens</div>
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
                        <div className="text-[11px] font-medium text-gray-700">Ícones</div>
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
                      <div className="text-[11px] font-medium text-gray-700">Header Colors</div>
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

                  {(node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart') && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-[11px] font-medium text-gray-700">Chart Style</div>
                      <NumberField
                        label="height"
                        value={Number(getProp(node, 'height', '')) || ''}
                        onChange={(v) => onSetNodeProp(selectedPath, 'height', v)}
                      />
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
                    </div>
                  )}

                  {node.type === 'Table' && (
                    <div className="space-y-2 rounded border border-gray-200 p-2">
                      <div className="text-[11px] font-medium text-gray-700">Table Style</div>
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

                  {(node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'SlicerCard' || node.type === 'Gauge' || node.type === 'AISummary' || node.type === 'Table') && (
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
                  <div className="mb-1 text-[11px] font-medium text-gray-700">Props JSON (avançado)</div>
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
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-2">
              <button
                type="button"
                className="rounded border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!draftDirty || Boolean(rawPropsError)}
                className="rounded border border-gray-900 bg-gray-900 px-3 py-1.5 text-xs text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  if (!selectedPath) return
                  onReplaceNodePropsExternal(selectedPath, draftProps)
                }}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
