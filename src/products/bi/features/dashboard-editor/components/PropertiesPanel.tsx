'use client'

import React from 'react'
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
        className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
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
        className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
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
        className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
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
          className="h-8 w-10 rounded border border-gray-300 bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ffffff"
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs"
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

function getProp<T>(node: Record<string, any>, path: string, fallback: T): T {
  const parts = path.split('.').filter(Boolean)
  let curr: any = node.props || {}
  for (const part of parts) {
    if (curr == null || typeof curr !== 'object') return fallback
    curr = curr[part]
  }
  return (curr === undefined ? fallback : curr) as T
}

export default function PropertiesPanel({
  tree,
  selectedPath,
  isOpen,
  onClose,
  onSetNodeProp,
  onReplaceNodeProps,
}: Props) {
  const node = React.useMemo(() => getNodeAtPath(tree, selectedPath), [tree, selectedPath])
  const [rawPropsText, setRawPropsText] = React.useState('{}')
  const [rawPropsError, setRawPropsError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<TabKey>('data')

  const supportsDataTab = Boolean(
    node && ['KPI', 'BarChart', 'LineChart', 'PieChart', 'Header', 'SlicerCard'].includes(String(node.type)),
  )
  const supportsStyleTab = Boolean(
    node && ['KPI', 'BarChart', 'LineChart', 'PieChart', 'Header', 'SlicerCard', 'Card', 'Div', 'Gauge'].includes(String(node.type)),
  )
  const supportsFr = Boolean(
    node && ['KPI', 'BarChart', 'LineChart', 'PieChart', 'Gauge', 'SlicerCard'].includes(String(node.type)),
  )

  React.useEffect(() => {
    const next = node?.props && typeof node.props === 'object' ? node.props : {}
    setRawPropsText(JSON.stringify(next, null, 2))
    setRawPropsError(null)
  }, [node && JSON.stringify(node.props || {})])

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
          <div className="flex items-center gap-1 rounded border border-gray-200 bg-gray-50 p-1">
            {supportsDataTab && (
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className={`rounded px-2 py-1 text-xs ${activeTab === 'data' ? 'bg-white border border-gray-300 text-gray-900' : 'text-gray-600 hover:bg-white'}`}
              >
                Data
              </button>
            )}
            {supportsStyleTab && (
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className={`rounded px-2 py-1 text-xs ${activeTab === 'style' ? 'bg-white border border-gray-300 text-gray-900' : 'text-gray-600 hover:bg-white'}`}
              >
                Style
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`rounded px-2 py-1 text-xs ${activeTab === 'json' ? 'bg-white border border-gray-300 text-gray-900' : 'text-gray-600 hover:bg-white'}`}
            >
              JSON
            </button>
          </div>

          {selectedPath && (
            <>
              {activeTab === 'data' && (node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'Header' || node.type === 'SlicerCard') && (
                <TextField
                  label="Título"
                  value={String(getProp(node, 'title', ''))}
                  onChange={(v) => onSetNodeProp(selectedPath, 'title', v || undefined)}
                />
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

              {activeTab === 'data' && (node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'SlicerCard') && (
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

                  {(node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'Header' || node.type === 'SlicerCard' || node.type === 'Card') && (
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

                  {(node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'SlicerCard' || node.type === 'Gauge') && (
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

                  {(node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'Header' || node.type === 'SlicerCard' || node.type === 'Card') && (
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

                  {(node.type === 'KPI' || node.type === 'BarChart' || node.type === 'LineChart' || node.type === 'PieChart' || node.type === 'SlicerCard' || node.type === 'Gauge') && (
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
                    className="min-h-[220px] w-full rounded border border-gray-300 p-2 font-mono text-[11px]"
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
                      Aplicar Props JSON
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
