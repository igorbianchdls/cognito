'use client'

import * as React from 'react'

import type { ThemeOption } from '@/products/bi/shared/themeOptions'
import type { DashboardChartPaletteOption } from '@/products/artifacts/dashboard/chartPalettes'
import type { DashboardBorderPresetOption } from '@/products/artifacts/dashboard/borderPresets'
import {
  resolveDashboardCardTheme,
  resolveDashboardChartTheme,
  resolveDashboardDatePickerTheme,
  resolveDashboardHeaderTheme,
  resolveDashboardInsightsTheme,
  resolveDashboardKpiTheme,
  type DashboardAppearanceOverrides,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'

export type DashboardAppearanceMode = 'theme' | 'colors' | 'border' | 'kpi' | 'chart' | 'header' | 'insights'

function getThemePreviewStyle(theme: string) {
  const styles: Record<string, { background: string; accent: string; border: string; title: string }> = {
    light: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 60%, #e2e8f0 100%)',
      accent: '#2563eb',
      border: '#dbe2ea',
      title: '#0f172a',
    },
    blue: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 45%, #1d4ed8 100%)',
      accent: '#1d4ed8',
      border: '#93c5fd',
      title: '#eff6ff',
    },
    dark: {
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 45%, #374151 100%)',
      accent: '#60a5fa',
      border: '#374151',
      title: '#f9fafb',
    },
    black: {
      background: 'linear-gradient(135deg, #050505 0%, #0f0f10 60%, #1c1c1f 100%)',
      accent: '#f59e0b',
      border: '#2a2a2a',
      title: '#f8fafc',
    },
    slate: {
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
      accent: '#22d3ee',
      border: '#475569',
      title: '#f8fafc',
    },
    navy: {
      background: 'linear-gradient(135deg, #0b1020 0%, #11203b 55%, #1d4ed8 100%)',
      accent: '#93c5fd',
      border: '#1d4ed8',
      title: '#eff6ff',
    },
    sand: {
      background: 'linear-gradient(135deg, #faf7f0 0%, #f5efe2 55%, #e7dcc6 100%)',
      accent: '#c08457',
      border: '#e7dcc6',
      title: '#3f2d1d',
    },
    charcoal: {
      background: 'linear-gradient(135deg, #111111 0%, #222222 50%, #3b3b3b 100%)',
      accent: '#10b981',
      border: '#3b3b3b',
      title: '#f5f5f5',
    },
    midnight: {
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
      accent: '#38bdf8',
      border: '#1e293b',
      title: '#e2e8f0',
    },
    metro: {
      background: 'linear-gradient(135deg, #141414 0%, #262626 60%, #404040 100%)',
      accent: '#f43f5e',
      border: '#404040',
      title: '#fafafa',
    },
  }

  return styles[theme] || styles.light
}

function cloneAppearanceOverrides(overrides: DashboardAppearanceOverrides): DashboardAppearanceOverrides {
  return JSON.parse(JSON.stringify(overrides || {})) as DashboardAppearanceOverrides
}

function cleanupObject(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const nextEntries = Object.entries(value)
    .map(([key, child]) => [key, cleanupObject(child)] as const)
    .filter(([, child]) => {
      if (child === undefined) return false
      if (!child || typeof child !== 'object' || Array.isArray(child)) return true
      return Object.keys(child).length > 0
    })
  if (nextEntries.length === 0) return undefined
  return Object.fromEntries(nextEntries)
}

function setAppearanceOverride(
  base: DashboardAppearanceOverrides,
  path: string[],
  value: unknown,
): DashboardAppearanceOverrides {
  const next = cloneAppearanceOverrides(base)
  let current: Record<string, any> = next as Record<string, any>

  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index]
    const child = current[key]
    current[key] = child && typeof child === 'object' && !Array.isArray(child) ? { ...child } : {}
    current = current[key] as Record<string, any>
  }

  const finalKey = path[path.length - 1]
  if (value === undefined || value === null || value === '') delete current[finalKey]
  else current[finalKey] = value

  return (cleanupObject(next) || {}) as DashboardAppearanceOverrides
}

function toInputValue(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}

function parseNumberInput(value: string) {
  if (!value.trim()) return undefined
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

function normalizeColorForPicker(value: string) {
  const normalized = String(value || '').trim()
  if (/^#[0-9a-f]{6}$/i.test(normalized)) return normalized
  if (/^#[0-9a-f]{3}$/i.test(normalized)) {
    const [, r, g, b] = normalized
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return '#000000'
}

function PanelSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <details open={isOpen} className="rounded-[18px] border border-[#e7e7e4] bg-[#fbfbfa]">
      <summary
        className="cursor-pointer list-none px-4 py-3"
        onClick={(event) => {
          event.preventDefault()
          setIsOpen((current) => !current)
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#111111]">{title}</div>
            {description ? <div className="mt-1 text-[12px] leading-5 text-[#6a6a67]">{description}</div> : null}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a8a85]">Editar</div>
        </div>
      </summary>
      <div className="border-t border-[#ecece8] px-4 py-4">{children}</div>
    </details>
  )
}

function FieldGrid({
  children,
}: {
  children?: React.ReactNode
}) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Field({
  label,
  children,
}: {
  label: string
  children?: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[12px] font-medium tracking-[-0.01em] text-[#51514d]">
      <span>{label}</span>
      {children}
    </label>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 rounded-[12px] border border-[#d9d9d4] bg-white px-3 text-[13px] text-[#111111] outline-none transition focus:border-[#0075E2]"
    />
  )
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | string | undefined
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="number"
      value={value === undefined ? '' : value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 rounded-[12px] border border-[#d9d9d4] bg-white px-3 text-[13px] text-[#111111] outline-none transition focus:border-[#0075E2]"
    />
  )
}

function ColorInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const pickerValue = normalizeColorForPicker(value)

  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-[#d9d9d4] bg-white px-3">
      <input
        ref={inputRef}
        type="color"
        value={pickerValue}
        onChange={(event) => onChange(event.target.value)}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-black/10"
        style={{ backgroundColor: value || 'transparent' }}
        aria-label="Selecionar cor"
        title="Selecionar cor"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="#000000"
        className="h-10 flex-1 bg-transparent text-[13px] text-[#111111] outline-none"
      />
    </div>
  )
}

function ToggleInput({
  value,
  onChange,
}: {
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`h-10 rounded-[12px] border px-3 text-[13px] font-medium transition ${
        value ? 'border-[#0075E2] bg-[#0075E2] text-white' : 'border-[#d9d9d4] bg-white text-[#4b4b47]'
      }`}
    >
      {value ? 'Ativo' : 'Inativo'}
    </button>
  )
}

function renderCardStyleEditor({
  style,
  onSet,
}: {
  style: Record<string, any>
  onSet: (path: string[], value: unknown) => void
}) {
  return (
    <FieldGrid>
      <Field label="Background">
        <ColorInput value={toInputValue(style.backgroundColor)} onChange={(value) => onSet(['backgroundColor'], value.trim() || undefined)} />
      </Field>
      <Field label="Borda">
        <ColorInput value={toInputValue(style.borderColor)} onChange={(value) => onSet(['borderColor'], value.trim() || undefined)} />
      </Field>
      <Field label="Espessura da borda">
        <NumberInput value={style.borderWidth} onChange={(value) => onSet(['borderWidth'], parseNumberInput(value))} />
      </Field>
      <Field label="Raio">
        <NumberInput value={style.borderRadius} onChange={(value) => onSet(['borderRadius'], parseNumberInput(value))} />
      </Field>
      <Field label="Padding">
        <NumberInput value={style.padding} onChange={(value) => onSet(['padding'], parseNumberInput(value))} />
      </Field>
      <Field label="Sombra">
        <TextInput value={toInputValue(style.boxShadow)} onChange={(value) => onSet(['boxShadow'], value.trim() || undefined)} placeholder="0 12px 32px rgba(...)" />
      </Field>
    </FieldGrid>
  )
}

function renderTextStyleEditor({
  style,
  onSet,
}: {
  style: Record<string, any>
  onSet: (path: string[], value: unknown) => void
}) {
  return (
    <FieldGrid>
      <Field label="Cor">
        <ColorInput value={toInputValue(style.color)} onChange={(value) => onSet(['color'], value.trim() || undefined)} />
      </Field>
      <Field label="Tamanho">
        <TextInput value={toInputValue(style.fontSize)} onChange={(value) => onSet(['fontSize'], value.trim() || undefined)} placeholder="14 ou 0.875rem" />
      </Field>
      <Field label="Peso">
        <TextInput value={toInputValue(style.fontWeight)} onChange={(value) => onSet(['fontWeight'], value.trim() || undefined)} placeholder="500" />
      </Field>
      <Field label="Line height">
        <TextInput value={toInputValue(style.lineHeight)} onChange={(value) => onSet(['lineHeight'], value.trim() || undefined)} placeholder="1.4" />
      </Field>
      <Field label="Letter spacing">
        <TextInput value={toInputValue(style.letterSpacing)} onChange={(value) => onSet(['letterSpacing'], value.trim() || undefined)} placeholder="0.04em" />
      </Field>
      <Field label="Transform">
        <TextInput value={toInputValue(style.textTransform)} onChange={(value) => onSet(['textTransform'], value.trim() || undefined)} placeholder="uppercase" />
      </Field>
    </FieldGrid>
  )
}

interface DashboardThemeModalProps {
  appearanceOverrides: DashboardAppearanceOverrides
  borderPresets: DashboardBorderPresetOption[]
  chartPalettes: DashboardChartPaletteOption[]
  isOpen: boolean
  mode: DashboardAppearanceMode
  onAppearanceOverridesChange: (nextValue: DashboardAppearanceOverrides) => void
  onClose: () => void
  onConfirm: () => void
  onModeChange: (mode: DashboardAppearanceMode) => void
  onRevert: () => void
  onSelect: (themeValue: string) => void
  onSelectBorderPreset: (borderPresetValue: string) => void
  onSelectChartPalette: (paletteValue: string) => void
  revertDisabled?: boolean
  selectedBorderPreset: string
  selectedChartPalette: string
  selectedTheme: string
  themes: ThemeOption[]
}

export function DashboardThemeModal({
  appearanceOverrides,
  borderPresets,
  chartPalettes,
  isOpen,
  mode,
  onAppearanceOverridesChange,
  onClose,
  onConfirm,
  onModeChange,
  onRevert,
  onSelect,
  onSelectBorderPreset,
  onSelectChartPalette,
  revertDisabled = false,
  selectedBorderPreset,
  selectedChartPalette,
  selectedTheme,
  themes,
}: DashboardThemeModalProps) {
  if (!isOpen) return null

  const cardTheme = resolveDashboardCardTheme(selectedTheme, selectedBorderPreset, appearanceOverrides)
  const chartTheme = resolveDashboardChartTheme(selectedTheme, selectedChartPalette, appearanceOverrides)
  const insightsTheme = resolveDashboardInsightsTheme(selectedTheme, appearanceOverrides)
  const kpiTheme = resolveDashboardKpiTheme(selectedTheme, appearanceOverrides)
  const headerTheme = resolveDashboardHeaderTheme(selectedTheme, selectedBorderPreset, appearanceOverrides)
  const datePickerTheme = resolveDashboardDatePickerTheme(selectedTheme, appearanceOverrides)

  function setOverride(path: string[], value: unknown) {
    onAppearanceOverridesChange(setAppearanceOverride(appearanceOverrides, path, value))
  }

  const titles: Record<DashboardAppearanceMode, string> = {
    theme: 'Selecionar um tema',
    colors: 'Selecionar cores do chart',
    border: 'Selecionar uma borda',
    kpi: 'Editar UI global dos KPIs',
    chart: 'Editar UI global dos charts',
    header: 'Editar UI global do header',
    insights: 'Editar UI global dos insights',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6 py-10">
      <div className="flex max-h-[88vh] w-full max-w-[960px] flex-col rounded-[24px] bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <div className="mb-5 flex items-start justify-between">
          <div className="text-[28px] font-semibold tracking-[-0.03em] text-[#111111]">{titles[mode]}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#111111] px-3 py-1 text-[12px] font-medium text-white transition hover:bg-[#2a2a2a]"
          >
            Fechar
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2 rounded-[14px] bg-[#f4f4f3] p-1">
          {[
            ['theme', 'Tema'],
            ['colors', 'Cores'],
            ['border', 'Borda'],
            ['kpi', 'KPI'],
            ['chart', 'Chart'],
            ['header', 'Header'],
            ['insights', 'Insights'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onModeChange(value as DashboardAppearanceMode)}
              className={`rounded-[12px] px-4 py-2 text-[14px] font-medium tracking-[-0.02em] transition ${
                mode === value ? 'bg-white text-[#111111] shadow-sm' : 'text-[#6a6a67] hover:text-[#111111]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {mode === 'theme' ? (
            <div className="grid grid-cols-3 gap-x-4 gap-y-5">
              {themes.map((theme) => {
                const preview = getThemePreviewStyle(theme.value)
                const isSelected = selectedTheme === theme.value

                return (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => onSelect(theme.value)}
                    className="text-left"
                  >
                    <div
                      className={`relative overflow-hidden rounded-[14px] border transition ${
                        isSelected ? 'border-[#0075E2] shadow-[0_12px_30px_rgba(0,117,226,0.18)]' : 'border-[#ececec]'
                      }`}
                      style={{ background: preview.background }}
                    >
                      <div className="h-[106px] w-full p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div
                            className="h-2.5 w-14 rounded-full"
                            style={{ backgroundColor: preview.accent }}
                          />
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: preview.border }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div
                            className="w-[56%] text-[12px] font-semibold tracking-[-0.03em]"
                            style={{ color: preview.title }}
                          >
                            {theme.label}
                          </div>
                          <div
                            className="h-2.5 w-[68%] rounded-full opacity-80"
                            style={{ backgroundColor: `${preview.title}20` }}
                          />
                          <div
                            className="h-2.5 w-[42%] rounded-full opacity-65"
                            style={{ backgroundColor: `${preview.title}16` }}
                          />
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="absolute inset-x-0 bottom-0 h-[4px] bg-[#0075E2]" />
                      ) : null}
                    </div>
                    <div
                      className="pt-2 text-center text-[15px] font-medium tracking-[-0.02em]"
                      style={{ color: isSelected ? '#0075E2' : '#111111' }}
                    >
                      {theme.label}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : mode === 'colors' ? (
            <div className="grid grid-cols-3 gap-x-4 gap-y-5">
              {chartPalettes.map((palette) => {
                const isSelected = selectedChartPalette === palette.value

                return (
                  <button
                    key={palette.value}
                    type="button"
                    onClick={() => onSelectChartPalette(palette.value)}
                    className="text-left"
                  >
                    <div
                      className={`relative overflow-hidden rounded-[14px] border bg-white p-4 transition ${
                        isSelected ? 'border-[#0075E2] shadow-[0_12px_30px_rgba(0,117,226,0.18)]' : 'border-[#ececec]'
                      }`}
                    >
                      <div className="mb-4 flex gap-2">
                        {palette.colors.map((color) => (
                          <div
                            key={color}
                            className="h-16 flex-1 rounded-[10px]"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="text-[15px] font-medium tracking-[-0.02em] text-[#111111]">{palette.label}</div>
                      {isSelected ? (
                        <div className="absolute inset-x-0 bottom-0 h-[4px] bg-[#0075E2]" />
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : mode === 'border' ? (
            <div className="grid grid-cols-2 gap-4">
              {borderPresets.map((preset) => {
                const isSelected = selectedBorderPreset === preset.value
                const isHud = preset.value === 'theme_default' || preset.value === 'hud_compact' || preset.value === 'hud_bold'
                const borderRadius =
                  preset.value === 'rounded_minimal' ? 18 :
                  preset.value === 'rounded_soft' ? 12 :
                  preset.value === 'straight_clean' ? 0 :
                  0
                const cornerStroke = preset.value === 'hud_bold' ? 2 : 1
                const cornerInset = preset.value === 'hud_compact' ? 16 : 12

                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => onSelectBorderPreset(preset.value)}
                    className="text-left"
                  >
                    <div
                      className={`relative overflow-hidden rounded-[14px] border bg-white p-4 transition ${
                        isSelected ? 'border-[#0075E2] shadow-[0_12px_30px_rgba(0,117,226,0.18)]' : 'border-[#ececec]'
                      }`}
                    >
                      <div className="relative h-[108px] w-full rounded-[12px] bg-[#f6f7f8]">
                        <div
                          className="absolute inset-[12px] border bg-white"
                          style={{
                            borderColor: '#d6dde6',
                            borderRadius,
                          }}
                        />
                        {isHud ? (
                          <>
                            <div className="absolute h-4 w-4 border-l border-t border-[#5b7899]" style={{ left: cornerInset, top: cornerInset, borderLeftWidth: cornerStroke, borderTopWidth: cornerStroke }} />
                            <div className="absolute h-4 w-4 border-r border-t border-[#5b7899]" style={{ right: cornerInset, top: cornerInset, borderRightWidth: cornerStroke, borderTopWidth: cornerStroke }} />
                            <div className="absolute h-4 w-4 border-b border-l border-[#5b7899]" style={{ left: cornerInset, bottom: cornerInset, borderBottomWidth: cornerStroke, borderLeftWidth: cornerStroke }} />
                            <div className="absolute h-4 w-4 border-b border-r border-[#5b7899]" style={{ right: cornerInset, bottom: cornerInset, borderBottomWidth: cornerStroke, borderRightWidth: cornerStroke }} />
                          </>
                        ) : null}
                      </div>
                      <div className="mt-4 text-[15px] font-medium tracking-[-0.02em] text-[#111111]">{preset.label}</div>
                      <div className="mt-1 text-[12px] leading-5 text-[#6a6a67]">{preset.description}</div>
                      {isSelected ? (
                        <div className="absolute inset-x-0 bottom-0 h-[4px] bg-[#0075E2]" />
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : mode === 'kpi' ? (
            <div className="space-y-3">
              <PanelSection title="Card" description="Superficie externa de todos os cards variant=kpi." defaultOpen>
                {renderCardStyleEditor({
                  style: cardTheme.kpiCard,
                  onSet: (path, value) => setOverride(['kpi', 'card', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Container" description="Espacamento e alinhamento interno do KPI.">
                <FieldGrid>
                  <Field label="Gap">
                    <TextInput value={toInputValue(kpiTheme.style.gap)} onChange={(value) => setOverride(['kpi', 'container', 'gap'], value.trim() || undefined)} placeholder="8" />
                  </Field>
                  <Field label="Align items">
                    <TextInput value={toInputValue(kpiTheme.style.alignItems)} onChange={(value) => setOverride(['kpi', 'container', 'alignItems'], value.trim() || undefined)} placeholder="flex-start" />
                  </Field>
                </FieldGrid>
              </PanelSection>

              <PanelSection title="Title" description="Texto de rotulo do KPI.">
                {renderTextStyleEditor({
                  style: kpiTheme.titleStyle as Record<string, any>,
                  onSet: (path, value) => setOverride(['kpi', 'title', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Value" description="Numero principal do KPI.">
                {renderTextStyleEditor({
                  style: kpiTheme.valueStyle as Record<string, any>,
                  onSet: (path, value) => setOverride(['kpi', 'value', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Compare" description="Linha comparativa e delta do KPI.">
                {renderTextStyleEditor({
                  style: kpiTheme.compare.style as Record<string, any>,
                  onSet: (path, value) => setOverride(['kpi', 'compare', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Description" description="Descricao auxiliar abaixo do valor.">
                {renderTextStyleEditor({
                  style: kpiTheme.descriptionStyle as Record<string, any>,
                  onSet: (path, value) => setOverride(['kpi', 'description', ...path], value),
                })}
              </PanelSection>
            </div>
          ) : mode === 'chart' ? (
            <div className="space-y-3">
              <PanelSection title="Card" description="Card global dos charts." defaultOpen>
                {renderCardStyleEditor({
                  style: cardTheme.chartCard,
                  onSet: (path, value) => setOverride(['chart', 'card', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Title" description="Titulo semantico dos charts.">
                {renderTextStyleEditor({
                  style: chartTheme.titleStyle as Record<string, any>,
                  onSet: (path, value) => setOverride(['chart', 'title', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Grafico" description="Partes internas do grafico e do tema do Recharts.">
                <div className="space-y-3">
                  <PanelSection title="Axes" description="Eixos X e Y." defaultOpen>
                    <FieldGrid>
                      <Field label="X tick color">
                        <ColorInput value={toInputValue(chartTheme.xAxis.tickColor)} onChange={(value) => setOverride(['chart', 'graph', 'axes', 'x', 'tickColor'], value.trim() || undefined)} />
                      </Field>
                      <Field label="X tick size">
                        <NumberInput value={chartTheme.xAxis.tickFontSize} onChange={(value) => setOverride(['chart', 'graph', 'axes', 'x', 'tickFontSize'], parseNumberInput(value))} />
                      </Field>
                      <Field label="X tick margin">
                        <NumberInput value={chartTheme.xAxis.tickMargin} onChange={(value) => setOverride(['chart', 'graph', 'axes', 'x', 'tickMargin'], parseNumberInput(value))} />
                      </Field>
                      <Field label="Y tick color">
                        <ColorInput value={toInputValue(chartTheme.yAxis.tickColor)} onChange={(value) => setOverride(['chart', 'graph', 'axes', 'y', 'tickColor'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Y tick size">
                        <NumberInput value={chartTheme.yAxis.tickFontSize} onChange={(value) => setOverride(['chart', 'graph', 'axes', 'y', 'tickFontSize'], parseNumberInput(value))} />
                      </Field>
                      <Field label="Y width">
                        <NumberInput value={chartTheme.yAxis.width} onChange={(value) => setOverride(['chart', 'graph', 'axes', 'y', 'width'], parseNumberInput(value))} />
                      </Field>
                    </FieldGrid>
                  </PanelSection>

                  <PanelSection title="Grid" description="Grade do grafico.">
                    <FieldGrid>
                      <Field label="Enabled">
                        <ToggleInput value={Boolean(chartTheme.grid.enabled)} onChange={(value) => setOverride(['chart', 'graph', 'grid', 'enabled'], value)} />
                      </Field>
                      <Field label="Vertical">
                        <ToggleInput value={Boolean(chartTheme.grid.vertical)} onChange={(value) => setOverride(['chart', 'graph', 'grid', 'vertical'], value)} />
                      </Field>
                      <Field label="Stroke">
                        <ColorInput value={toInputValue(chartTheme.grid.stroke)} onChange={(value) => setOverride(['chart', 'graph', 'grid', 'stroke'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Dasharray">
                        <TextInput value={toInputValue(chartTheme.grid.strokeDasharray)} onChange={(value) => setOverride(['chart', 'graph', 'grid', 'strokeDasharray'], value.trim() || undefined)} placeholder="3 3" />
                      </Field>
                    </FieldGrid>
                  </PanelSection>

                  <PanelSection title="Legend" description="Legenda e rotulos de serie.">
                    <FieldGrid>
                      <Field label="Enabled">
                        <ToggleInput value={Boolean(chartTheme.legend.enabled)} onChange={(value) => setOverride(['chart', 'graph', 'legend', 'enabled'], value)} />
                      </Field>
                      <Field label="Cor">
                        <ColorInput value={toInputValue(chartTheme.legend.wrapperStyle?.color)} onChange={(value) => setOverride(['chart', 'graph', 'legend', 'wrapperStyle', 'color'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Tamanho">
                        <TextInput value={toInputValue(chartTheme.legend.wrapperStyle?.fontSize)} onChange={(value) => setOverride(['chart', 'graph', 'legend', 'wrapperStyle', 'fontSize'], value.trim() || undefined)} placeholder="12" />
                      </Field>
                    </FieldGrid>
                  </PanelSection>

                  <PanelSection title="Tooltip" description="Bloco flutuante do tooltip.">
                    <FieldGrid>
                      <Field label="Enabled">
                        <ToggleInput value={Boolean(chartTheme.tooltip.enabled)} onChange={(value) => setOverride(['chart', 'graph', 'tooltip', 'enabled'], value)} />
                      </Field>
                      <Field label="Background">
                        <ColorInput value={toInputValue(chartTheme.tooltip.contentStyle?.backgroundColor)} onChange={(value) => setOverride(['chart', 'graph', 'tooltip', 'contentStyle', 'backgroundColor'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Borda">
                        <TextInput value={toInputValue(chartTheme.tooltip.contentStyle?.border)} onChange={(value) => setOverride(['chart', 'graph', 'tooltip', 'contentStyle', 'border'], value.trim() || undefined)} placeholder="1px solid #dbe2ea" />
                      </Field>
                      <Field label="Raio">
                        <NumberInput value={chartTheme.tooltip.contentStyle?.borderRadius} onChange={(value) => setOverride(['chart', 'graph', 'tooltip', 'contentStyle', 'borderRadius'], parseNumberInput(value))} />
                      </Field>
                      <Field label="Texto">
                        <ColorInput value={toInputValue(chartTheme.tooltip.itemStyle?.color)} onChange={(value) => setOverride(['chart', 'graph', 'tooltip', 'itemStyle', 'color'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Label">
                        <ColorInput value={toInputValue(chartTheme.tooltip.labelStyle?.color)} onChange={(value) => setOverride(['chart', 'graph', 'tooltip', 'labelStyle', 'color'], value.trim() || undefined)} />
                      </Field>
                    </FieldGrid>
                  </PanelSection>

                  <PanelSection title="Margin" description="Margens internas do chart.">
                    <FieldGrid>
                      <Field label="Top">
                        <NumberInput value={chartTheme.margin.top} onChange={(value) => setOverride(['chart', 'graph', 'margin', 'top'], parseNumberInput(value))} />
                      </Field>
                      <Field label="Right">
                        <NumberInput value={chartTheme.margin.right} onChange={(value) => setOverride(['chart', 'graph', 'margin', 'right'], parseNumberInput(value))} />
                      </Field>
                      <Field label="Bottom">
                        <NumberInput value={chartTheme.margin.bottom} onChange={(value) => setOverride(['chart', 'graph', 'margin', 'bottom'], parseNumberInput(value))} />
                      </Field>
                      <Field label="Left">
                        <NumberInput value={chartTheme.margin.left} onChange={(value) => setOverride(['chart', 'graph', 'margin', 'left'], parseNumberInput(value))} />
                      </Field>
                    </FieldGrid>
                  </PanelSection>
                </div>
              </PanelSection>
            </div>
          ) : mode === 'header' ? (
            <div className="space-y-3">
              <PanelSection title="Card" description="Container do header do dashboard." defaultOpen>
                <FieldGrid>
                  <Field label="Background">
                    <ColorInput value={toInputValue(headerTheme.card.backgroundColor)} onChange={(value) => setOverride(['header', 'card', 'backgroundColor'], value.trim() || undefined)} />
                  </Field>
                  <Field label="Cor do texto">
                    <ColorInput value={toInputValue(headerTheme.card.color)} onChange={(value) => setOverride(['header', 'card', 'color'], value.trim() || undefined)} />
                  </Field>
                  <Field label="Borda">
                    <TextInput value={toInputValue(headerTheme.card.border)} onChange={(value) => setOverride(['header', 'card', 'border'], value.trim() || undefined)} placeholder="1px solid #dbe2ea" />
                  </Field>
                  <Field label="Raio">
                    <TextInput value={toInputValue(headerTheme.card.borderRadius)} onChange={(value) => setOverride(['header', 'card', 'borderRadius'], value.trim() || undefined)} placeholder="24" />
                  </Field>
                  <Field label="Padding">
                    <TextInput value={toInputValue(headerTheme.card.padding)} onChange={(value) => setOverride(['header', 'card', 'padding'], value.trim() || undefined)} placeholder="20px 24px" />
                  </Field>
                  <Field label="Gap">
                    <TextInput value={toInputValue(headerTheme.card.gap)} onChange={(value) => setOverride(['header', 'card', 'gap'], value.trim() || undefined)} placeholder="24" />
                  </Field>
                </FieldGrid>
              </PanelSection>

              <PanelSection title="Eyebrow" description="Texto auxiliar do topo do header.">
                {renderTextStyleEditor({
                  style: headerTheme.eyebrow as Record<string, any>,
                  onSet: (path, value) => setOverride(['header', 'eyebrow', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Title" description="Titulo principal do header.">
                {renderTextStyleEditor({
                  style: headerTheme.title as Record<string, any>,
                  onSet: (path, value) => setOverride(['header', 'title', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Subtitle" description="Texto descritivo abaixo do titulo.">
                {renderTextStyleEditor({
                  style: headerTheme.subtitle as Record<string, any>,
                  onSet: (path, value) => setOverride(['header', 'subtitle', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Date Picker" description="Estilos do seletor de periodo no header.">
                <div className="space-y-3">
                  <PanelSection title="Label" description="Rotulo do date picker." defaultOpen>
                    {renderTextStyleEditor({
                      style: datePickerTheme.labelStyle as Record<string, any>,
                      onSet: (path, value) => setOverride(['header', 'datePicker', 'labelStyle', ...path], value),
                    })}
                  </PanelSection>

                  <PanelSection title="Field" description="Campo principal do periodo.">
                    <FieldGrid>
                      <Field label="Background">
                        <ColorInput value={toInputValue(datePickerTheme.fieldStyle.backgroundColor)} onChange={(value) => setOverride(['header', 'datePicker', 'fieldStyle', 'backgroundColor'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Texto">
                        <ColorInput value={toInputValue(datePickerTheme.fieldStyle.color)} onChange={(value) => setOverride(['header', 'datePicker', 'fieldStyle', 'color'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Borda">
                        <TextInput value={toInputValue(datePickerTheme.fieldStyle.border)} onChange={(value) => setOverride(['header', 'datePicker', 'fieldStyle', 'border'], value.trim() || undefined)} placeholder="1px solid #dbe2ea" />
                      </Field>
                      <Field label="Raio">
                        <TextInput value={toInputValue(datePickerTheme.fieldStyle.borderRadius)} onChange={(value) => setOverride(['header', 'datePicker', 'fieldStyle', 'borderRadius'], value.trim() || undefined)} placeholder="10" />
                      </Field>
                      <Field label="Padding">
                        <TextInput value={toInputValue(datePickerTheme.fieldStyle.padding)} onChange={(value) => setOverride(['header', 'datePicker', 'fieldStyle', 'padding'], value.trim() || undefined)} placeholder="0 10px" />
                      </Field>
                      <Field label="Min height">
                        <TextInput value={toInputValue(datePickerTheme.fieldStyle.minHeight)} onChange={(value) => setOverride(['header', 'datePicker', 'fieldStyle', 'minHeight'], value.trim() || undefined)} placeholder="38" />
                      </Field>
                    </FieldGrid>
                  </PanelSection>

                  <PanelSection title="Icon" description="Icone do calendario.">
                    {renderTextStyleEditor({
                      style: datePickerTheme.iconStyle as Record<string, any>,
                      onSet: (path, value) => setOverride(['header', 'datePicker', 'iconStyle', ...path], value),
                    })}
                  </PanelSection>

                  <PanelSection title="Preset" description="Botoes de periodo pre-definido.">
                    <FieldGrid>
                      <Field label="Background">
                        <ColorInput value={toInputValue(datePickerTheme.presetButtonStyle.backgroundColor)} onChange={(value) => setOverride(['header', 'datePicker', 'presetButtonStyle', 'backgroundColor'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Texto">
                        <ColorInput value={toInputValue(datePickerTheme.presetButtonStyle.color)} onChange={(value) => setOverride(['header', 'datePicker', 'presetButtonStyle', 'color'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Altura">
                        <TextInput value={toInputValue(datePickerTheme.presetButtonStyle.height)} onChange={(value) => setOverride(['header', 'datePicker', 'presetButtonStyle', 'height'], value.trim() || undefined)} placeholder="36" />
                      </Field>
                      <Field label="Peso">
                        <TextInput value={toInputValue(datePickerTheme.presetButtonStyle.fontWeight)} onChange={(value) => setOverride(['header', 'datePicker', 'presetButtonStyle', 'fontWeight'], value.trim() || undefined)} placeholder="500" />
                      </Field>
                    </FieldGrid>
                  </PanelSection>

                  <PanelSection title="Preset ativo" description="Estado ativo dos botoes de preset.">
                    <FieldGrid>
                      <Field label="Background">
                        <ColorInput value={toInputValue(datePickerTheme.activePresetButtonStyle.backgroundColor)} onChange={(value) => setOverride(['header', 'datePicker', 'activePresetButtonStyle', 'backgroundColor'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Texto">
                        <ColorInput value={toInputValue(datePickerTheme.activePresetButtonStyle.color)} onChange={(value) => setOverride(['header', 'datePicker', 'activePresetButtonStyle', 'color'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Borda">
                        <ColorInput value={toInputValue(datePickerTheme.activePresetButtonStyle.borderColor)} onChange={(value) => setOverride(['header', 'datePicker', 'activePresetButtonStyle', 'borderColor'], value.trim() || undefined)} />
                      </Field>
                      <Field label="Peso">
                        <TextInput value={toInputValue(datePickerTheme.activePresetButtonStyle.fontWeight)} onChange={(value) => setOverride(['header', 'datePicker', 'activePresetButtonStyle', 'fontWeight'], value.trim() || undefined)} placeholder="600" />
                      </Field>
                    </FieldGrid>
                  </PanelSection>

                  <PanelSection title="Separator" description="Separador entre presets e campo de data.">
                    {renderTextStyleEditor({
                      style: datePickerTheme.separatorStyle as Record<string, any>,
                      onSet: (path, value) => setOverride(['header', 'datePicker', 'separatorStyle', ...path], value),
                    })}
                  </PanelSection>
                </div>
              </PanelSection>
            </div>
          ) : (
            <div className="space-y-3">
              <PanelSection title="Container" description="Bloco externo do componente de insights." defaultOpen>
                <FieldGrid>
                  <Field label="Gap">
                    <TextInput value={toInputValue(insightsTheme.containerStyle.gap)} onChange={(value) => setOverride(['insights', 'container', 'gap'], value.trim() || undefined)} placeholder="12" />
                  </Field>
                  <Field label="Min width">
                    <TextInput value={toInputValue(insightsTheme.containerStyle.minWidth)} onChange={(value) => setOverride(['insights', 'container', 'minWidth'], value.trim() || undefined)} placeholder="0" />
                  </Field>
                </FieldGrid>
              </PanelSection>

              <PanelSection title="Item" description="Linha individual de cada insight.">
                <FieldGrid>
                  <Field label="Padding">
                    <TextInput value={toInputValue(insightsTheme.itemStyle.padding)} onChange={(value) => setOverride(['insights', 'item', 'padding'], value.trim() || undefined)} placeholder="8px 0" />
                  </Field>
                  <Field label="Background">
                    <ColorInput value={toInputValue(insightsTheme.itemStyle.backgroundColor)} onChange={(value) => setOverride(['insights', 'item', 'backgroundColor'], value.trim() || undefined)} />
                  </Field>
                </FieldGrid>
              </PanelSection>

              <PanelSection title="Title" description="Titulo expansivel dos insights com heading.">
                {renderTextStyleEditor({
                  style: insightsTheme.titleStyle as Record<string, any>,
                  onSet: (path, value) => setOverride(['insights', 'title', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Text" description="Texto principal de cada insight.">
                {renderTextStyleEditor({
                  style: insightsTheme.textStyle as Record<string, any>,
                  onSet: (path, value) => setOverride(['insights', 'text', ...path], value),
                })}
              </PanelSection>

              <PanelSection title="Marker" description="Cor e visual do marcador lateral.">
                <FieldGrid>
                  <Field label="Cor">
                    <ColorInput value={toInputValue(insightsTheme.iconStyle.backgroundColor || insightsTheme.iconStyle.color)} onChange={(value) => setOverride(['insights', 'icon', 'backgroundColor'], value.trim() || undefined)} />
                  </Field>
                  <Field label="Texto/Icon color">
                    <ColorInput value={toInputValue(insightsTheme.iconStyle.color)} onChange={(value) => setOverride(['insights', 'icon', 'color'], value.trim() || undefined)} />
                  </Field>
                </FieldGrid>
              </PanelSection>

              <PanelSection title="Divider" description="Cor do divisor entre itens quando habilitado.">
                <FieldGrid>
                  <Field label="Divider color">
                    <ColorInput value={toInputValue(insightsTheme.dividerColor)} onChange={(value) => setOverride(['insights', 'dividerColor'], value.trim() || undefined)} />
                  </Field>
                </FieldGrid>
              </PanelSection>
            </div>
          )}
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onRevert}
            disabled={revertDisabled}
            className="rounded-[12px] border border-[#d4d4d4] bg-white px-5 py-3 text-[15px] font-medium tracking-[-0.02em] text-[#3a3a3a] transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[12px] bg-[#111111] px-5 py-3 text-[15px] font-medium tracking-[-0.02em] text-white transition hover:bg-[#2a2a2a]"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
