'use client'

import React from 'react'

import type { HudFrameConfig } from '@/products/bi/json-render/components/FrameSurface'
import { resolveDashboardBorderRadiusPreset, resolveDashboardBorderFramePreset, type DashboardBorderPreset } from '@/products/artifacts/dashboard/borderPresets'
import { DASHBOARD_DEFAULT_CHART_PALETTE, resolveDashboardChartPaletteColors } from '@/products/artifacts/dashboard/contract/dashboardContract'
import {
  DASHBOARD_TEMPLATE_THEME_TOKENS,
  type DashboardTemplateThemeTokens,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateThemes'
import { deepMerge } from '@/stores/ui/json-render/utils'

export type DashboardCardVariantKey =
  | 'card'
  | 'kpiCard'
  | 'chartCard'
  | 'tableCard'
  | 'pivotCard'
  | 'filterCard'
  | 'noteCard'

export type DashboardCardStyle = {
  backgroundColor: string
  borderColor: string
  borderWidth: number
  borderStyle: 'solid'
  borderRadius: number
  padding: number
  boxShadow?: string
  frame: HudFrameConfig | null
}

export type DashboardThemeConfigEntry = Record<DashboardCardVariantKey, DashboardCardStyle>
export type DashboardTextVariantKey =
  | 'body'
  | 'body-muted'
  | 'body-sm'
  | 'small-muted'
  | 'lead'
  | 'eyebrow'
  | 'eyebrow-strong'
  | 'page-title'
  | 'page-title-sm'
  | 'section-title'
  | 'section-title-md'
  | 'section-title-sm'
  | 'section-title-strong'
  | 'chart-title'
  | 'chart-eyebrow'
  | 'table-title'
  | 'pivot-title'
  | 'filter-title'
  | 'insights-title'
  | 'insights-title-sm'
  | 'kpi-title'
  | 'kpi-value'
  | 'kpi-compare'
  | 'kpi-delta'

export type DashboardTextStyle = React.CSSProperties
export type DashboardTextThemeConfigEntry = Record<DashboardTextVariantKey, DashboardTextStyle>
export type DashboardDatePickerThemeConfigEntry = {
  containerStyle: React.CSSProperties
  labelStyle: React.CSSProperties
  fieldStyle: React.CSSProperties
  iconStyle: React.CSSProperties
  presetButtonStyle: React.CSSProperties
  activePresetButtonStyle: React.CSSProperties
  separatorStyle: React.CSSProperties
  popoverStyle: React.CSSProperties
}
export type DashboardInsightsThemeConfigEntry = {
  containerStyle: React.CSSProperties
  itemStyle: React.CSSProperties
  titleStyle: React.CSSProperties
  textStyle: React.CSSProperties
  iconStyle: React.CSSProperties
  dividerColor: string
}
export type DashboardFilterThemeConfigEntry = {
  labelStyle: React.CSSProperties
  controlStyle: React.CSSProperties
  optionTextStyle: React.CSSProperties
  actionStyle: React.CSSProperties
  applyButtonStyle: React.CSSProperties
  tileSelectedStyle: React.CSSProperties
  tileUnselectedStyle: React.CSSProperties
  checkColor: string
}
export type DashboardTabThemeConfigEntry = {
  base: React.CSSProperties
  active: React.CSSProperties
}
export type DashboardChartThemeConfigEntry = {
  xAxis: AnyRecord
  yAxis: AnyRecord
  grid: AnyRecord
  tooltip: AnyRecord
  legend: AnyRecord
  titleStyle: React.CSSProperties
  colorScheme: string[]
  margin: AnyRecord
}
export type DashboardTableThemeConfigEntry = AnyRecord
export type DashboardPivotTableThemeConfigEntry = AnyRecord
export type DashboardGaugeThemeConfigEntry = AnyRecord
type AnyRecord = Record<string, any>

export type DashboardChartAppearanceOverrides = {
  card?: Partial<DashboardCardStyle>
  title?: React.CSSProperties
  graph?: {
    axes?: {
      x?: AnyRecord
      y?: AnyRecord
    }
    grid?: AnyRecord
    legend?: AnyRecord
    tooltip?: AnyRecord
    margin?: AnyRecord
  }
}

export type DashboardKpiAppearanceOverrides = {
  card?: Partial<DashboardCardStyle>
  compare?: React.CSSProperties
  container?: React.CSSProperties
  description?: React.CSSProperties
  title?: React.CSSProperties
  value?: React.CSSProperties
}

export type DashboardHeaderAppearanceOverrides = {
  card?: React.CSSProperties
  datePicker?: Partial<DashboardDatePickerThemeConfigEntry>
  eyebrow?: React.CSSProperties
  subtitle?: React.CSSProperties
  title?: React.CSSProperties
}

export type DashboardAppearanceOverrides = {
  chart?: DashboardChartAppearanceOverrides
  header?: DashboardHeaderAppearanceOverrides
  kpi?: DashboardKpiAppearanceOverrides
}

type DashboardThemeSelection = {
  appearanceOverrides?: DashboardAppearanceOverrides
  themeName: string
  chartPaletteName?: string
  borderPreset?: string
}

const DashboardThemeSelectionContext = React.createContext<DashboardThemeSelection>({
  appearanceOverrides: {},
  chartPaletteName: DASHBOARD_DEFAULT_CHART_PALETTE,
  themeName: 'light',
})
const DashboardHeaderScopeContext = React.createContext(false)

const DASHBOARD_THEME_ALIASES: Record<string, string> = {
  white: 'light',
  claro: 'light',
  branco: 'light',
}

function resolveThemeKey(themeName: string | undefined) {
  const key = String(themeName || 'light').trim().toLowerCase()
  return DASHBOARD_THEME_ALIASES[key] || key
}

function deepMergeOrClone<T extends object>(base: T, override?: Partial<T> | null): T {
  if (!override || typeof override !== 'object') return deepMerge({}, base) as T
  return deepMerge(deepMerge({}, base), override as Record<string, any>) as T
}

function mergeAppearanceOverrides(
  base: DashboardAppearanceOverrides | undefined,
  override: DashboardAppearanceOverrides | undefined,
) {
  if (!override || typeof override !== 'object') return base || {}
  return deepMerge(deepMerge({}, base || {}), override as Record<string, any>) as DashboardAppearanceOverrides
}

function buildFrame(tokens: DashboardTemplateThemeTokens, borderPreset?: DashboardBorderPreset | string): HudFrameConfig | null {
  const frame = resolveDashboardBorderFramePreset(borderPreset, tokens.cardFrame)
  if (!frame) return null
  return {
    variant: 'hud',
    cornerSize: frame.cornerSize,
    cornerWidth: frame.cornerWidth,
  }
}

function buildDashboardThemeConfigEntry(
  tokens: DashboardTemplateThemeTokens,
  borderPreset?: DashboardBorderPreset | string,
): DashboardThemeConfigEntry {
  const radius = resolveDashboardBorderRadiusPreset(borderPreset, tokens.cardFrame ? 0 : 24)
  const frame = buildFrame(tokens, borderPreset)
  const baseCard: DashboardCardStyle = {
    backgroundColor: tokens.surfaceBg,
    borderColor: tokens.surfaceBorder,
    borderWidth: 1,
    borderStyle: 'solid',
    borderRadius: radius,
    padding: 22,
    frame,
  }

  return {
    card: baseCard,
    kpiCard: {
      ...baseCard,
      backgroundColor: tokens.accentSurface,
      borderColor: tokens.accentBorder,
    },
    chartCard: {
      ...baseCard,
    },
    tableCard: {
      ...baseCard,
      padding: 18,
    },
    pivotCard: {
      ...baseCard,
      padding: 18,
    },
    filterCard: {
      ...baseCard,
      backgroundColor: tokens.headerBg,
    },
    noteCard: {
      ...baseCard,
      backgroundColor: tokens.accentSurface,
      borderColor: tokens.accentBorder,
    },
  }
}

function buildDashboardTextThemeConfigEntry(tokens: DashboardTemplateThemeTokens): DashboardTextThemeConfigEntry {
  return {
    body: {
      color: tokens.textPrimary,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.6,
    },
    'body-muted': {
      color: tokens.textSecondary,
      fontSize: 14,
      fontWeight: 400,
      lineHeight: 1.6,
    },
    'body-sm': {
      color: tokens.textSecondary,
      fontSize: 13,
      fontWeight: 400,
      lineHeight: 1.5,
    },
    'small-muted': {
      color: tokens.textSecondary,
      fontSize: 12,
      fontWeight: 400,
      lineHeight: 1.4,
    },
    lead: {
      color: tokens.textSecondary,
      fontSize: 15,
      fontWeight: 400,
      lineHeight: 1.55,
    },
    eyebrow: {
      color: tokens.textSecondary,
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    'eyebrow-strong': {
      color: tokens.titleColor,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: 1.4,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    'page-title': {
      color: tokens.titleColor,
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.08,
      letterSpacing: '-0.03em',
    },
    'page-title-sm': {
      color: tokens.titleColor,
      fontSize: 28,
      fontWeight: 700,
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
    },
    'section-title': {
      color: tokens.titleColor,
      fontSize: 22,
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    'section-title-md': {
      color: tokens.titleColor,
      fontSize: 20,
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    'section-title-sm': {
      color: tokens.titleColor,
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    'section-title-strong': {
      color: tokens.titleColor,
      fontSize: 18,
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    'chart-title': {
      color: tokens.titleColor,
      fontSize: 20,
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.02em',
    },
    'chart-eyebrow': {
      color: tokens.accentText,
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    'table-title': {
      color: tokens.titleColor,
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    'pivot-title': {
      color: tokens.titleColor,
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    'filter-title': {
      color: tokens.titleColor,
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    'insights-title': {
      color: tokens.titleColor,
      fontSize: 18,
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    'insights-title-sm': {
      color: tokens.titleColor,
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 1.35,
      letterSpacing: '-0.01em',
    },
    'kpi-title': {
      color: tokens.textSecondary,
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    'kpi-value': {
      color: tokens.kpiValueColor,
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.08,
      letterSpacing: '-0.03em',
    },
    'kpi-compare': {
      color: tokens.textSecondary,
      fontSize: 12,
      fontWeight: 500,
      lineHeight: 1.4,
    },
    'kpi-delta': {
      color: tokens.textSecondary,
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.4,
    },
  }
}

function buildDashboardDatePickerThemeConfigEntry(tokens: DashboardTemplateThemeTokens): DashboardDatePickerThemeConfigEntry {
  const fieldBorder = `1px solid ${tokens.headerDatePickerBorder}`
  const fieldBackground = tokens.headerDatePickerBg
  const fieldColor = tokens.headerDatePickerColor
  return {
    containerStyle: {},
    labelStyle: {
      color: tokens.headerDatePickerLabel,
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      margin: 0,
    },
    fieldStyle: {
      minHeight: 38,
      padding: '0 10px',
      border: fieldBorder,
      borderRadius: 10,
      backgroundColor: fieldBackground,
      color: fieldColor,
      fontSize: 14,
      fontWeight: 500,
    },
    iconStyle: {
      color: tokens.headerDatePickerIcon,
      fontSize: 14,
    },
    presetButtonStyle: {
      height: 36,
      backgroundColor: fieldBackground,
      color: fieldColor,
      fontSize: 13,
      fontWeight: 500,
    },
    activePresetButtonStyle: {
      backgroundColor: tokens.headerDatePickerActiveBg,
      borderColor: tokens.headerDatePickerActiveBorder,
      color: tokens.headerDatePickerActiveText,
      fontSize: 13,
      fontWeight: 600,
    },
    separatorStyle: {
      color: tokens.headerDatePickerLabel,
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.4,
    },
    popoverStyle: {
      border: fieldBorder,
      borderRadius: 12,
      backgroundColor: fieldBackground,
      boxShadow: tokens.dark ? '0 12px 32px rgba(0, 0, 0, 0.35)' : '0 12px 32px rgba(15, 23, 42, 0.12)',
    },
  }
}

function buildDashboardInsightsThemeConfigEntry(tokens: DashboardTemplateThemeTokens): DashboardInsightsThemeConfigEntry {
  return {
    containerStyle: {},
    itemStyle: {},
    titleStyle: {
      color: tokens.titleColor,
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.6,
    },
    textStyle: {
      color: tokens.textSecondary,
      fontSize: 13,
      fontWeight: 400,
      lineHeight: 1.6,
    },
    iconStyle: {
      backgroundColor: tokens.primary,
      color: tokens.primary,
    },
    dividerColor: tokens.surfaceBorder,
  }
}

function buildDashboardFilterThemeConfigEntry(tokens: DashboardTemplateThemeTokens): DashboardFilterThemeConfigEntry {
  return {
    labelStyle: {
      color: tokens.textSecondary,
      fontSize: 11,
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    },
    controlStyle: {
      borderColor: tokens.surfaceBorder,
      backgroundColor: tokens.surfaceBg,
      color: tokens.textPrimary,
      fontSize: 13,
      fontWeight: 500,
      borderRadius: 10,
    },
    optionTextStyle: {
      color: tokens.textPrimary,
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.5,
    },
    actionStyle: {
      color: tokens.primary,
      fontSize: 11,
      fontWeight: 600,
    },
    applyButtonStyle: {
      border: `1px solid ${tokens.surfaceBorder}`,
      borderRadius: 10,
      backgroundColor: tokens.surfaceBg,
      color: tokens.textPrimary,
      fontSize: 12,
      fontWeight: 600,
      padding: '6px 10px',
    },
    tileSelectedStyle: {
      backgroundColor: tokens.primary,
      borderColor: tokens.primary,
      color: '#ffffff',
    },
    tileUnselectedStyle: {
      backgroundColor: tokens.accentSurface,
      borderColor: tokens.accentBorder,
      color: tokens.textPrimary,
    },
    checkColor: tokens.primary,
  }
}

function buildDashboardTabThemeConfigEntry(tokens: DashboardTemplateThemeTokens): DashboardTabThemeConfigEntry {
  return {
    base: {
      border: `1px solid ${tokens.surfaceBorder}`,
      borderRadius: 999,
      backgroundColor: tokens.surfaceBg,
      color: tokens.textSecondary,
      padding: '8px 12px',
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.2,
    },
    active: {
      backgroundColor: tokens.accentSurface,
      borderColor: tokens.accentBorder,
      color: tokens.titleColor,
      fontWeight: 600,
    },
  }
}

function buildDashboardChartThemeConfigEntry(tokens: DashboardTemplateThemeTokens): DashboardChartThemeConfigEntry {
  return {
    xAxis: {
      tickColor: tokens.textSecondary,
      tickFontSize: 12,
      tickMargin: 10,
    },
    yAxis: {
      tickColor: tokens.textSecondary,
      tickFontSize: 12,
      tickMargin: 8,
      width: 64,
    },
    grid: {
      enabled: true,
      vertical: false,
      stroke: tokens.surfaceBorder,
      strokeDasharray: '3 3',
    },
    tooltip: {
      enabled: true,
      contentStyle: {
        backgroundColor: tokens.surfaceBg,
        border: `1px solid ${tokens.surfaceBorder}`,
        borderRadius: 12,
        color: tokens.textPrimary,
      },
      itemStyle: {
        color: tokens.textPrimary,
      },
      labelStyle: {
        color: tokens.textSecondary,
      },
    },
    legend: {
      enabled: true,
      wrapperStyle: {
        color: tokens.textSecondary,
        fontSize: 12,
      },
    },
    titleStyle: {
      color: tokens.titleColor,
      padding: 6,
      textAlign: 'left',
    },
    colorScheme: resolveDashboardChartPaletteColors(DASHBOARD_DEFAULT_CHART_PALETTE),
    margin: { top: 10, right: 12, bottom: 12, left: 12 },
  }
}

function buildDashboardTableThemeConfigEntry(tokens: DashboardTemplateThemeTokens): DashboardTableThemeConfigEntry {
  return {
    borderColor: tokens.surfaceBorder,
    headerBackground: tokens.accentSurface,
    headerTextColor: tokens.titleColor,
    footerBackground: tokens.accentSurface,
    footerTextColor: tokens.titleColor,
    cellTextColor: tokens.textPrimary,
    rowHoverColor: tokens.accentSurface,
    rowAlternateBgColor: tokens.surfaceBg,
    radius: 12,
    containerStyle: {
      borderColor: tokens.surfaceBorder,
      borderWidth: 1,
      borderStyle: 'solid',
      borderRadius: 12,
      backgroundColor: tokens.surfaceBg,
    },
  }
}

function buildDashboardPivotTableThemeConfigEntry(tokens: DashboardTemplateThemeTokens): DashboardPivotTableThemeConfigEntry {
  return {
    borderColor: tokens.surfaceBorder,
    backgroundColor: tokens.surfaceBg,
    headerBackground: tokens.accentSurface,
    headerTextColor: tokens.titleColor,
    headerTotalBackground: tokens.pageBg,
    headerTotalTextColor: tokens.titleColor,
    cellTextColor: tokens.textPrimary,
    rowLabelColor: tokens.titleColor,
    rowTotalBackground: tokens.accentSurface,
    rowTotalTextColor: tokens.titleColor,
    footerBackground: tokens.pageBg,
    footerTextColor: tokens.titleColor,
    mutedTextColor: tokens.textSecondary,
    expandButtonBackground: tokens.surfaceBg,
    expandButtonBorderColor: tokens.surfaceBorder,
    expandButtonColor: tokens.textSecondary,
    expandButtonHoverBackground: tokens.accentSurface,
    containerStyle: {
      borderColor: tokens.surfaceBorder,
      borderWidth: 1,
      borderStyle: 'solid',
      borderRadius: 12,
      backgroundColor: tokens.surfaceBg,
    },
  }
}

function buildDashboardGaugeThemeConfigEntry(tokens: DashboardTemplateThemeTokens): DashboardGaugeThemeConfigEntry {
  return {
    trackColor: tokens.surfaceBorder,
    valueColor: tokens.primary,
    targetColor: tokens.titleColor,
    tooltipStyle: {
      backgroundColor: tokens.surfaceBg,
      border: `1px solid ${tokens.surfaceBorder}`,
      color: tokens.textPrimary,
    },
  }
}

export const DASHBOARD_THEME_CONFIG: Record<string, DashboardThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardThemeConfigEntry(tokens)]),
)
export const DASHBOARD_TEXT_THEME_CONFIG: Record<string, DashboardTextThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardTextThemeConfigEntry(tokens)]),
)
export const DASHBOARD_DATE_PICKER_THEME_CONFIG: Record<string, DashboardDatePickerThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardDatePickerThemeConfigEntry(tokens)]),
)
export const DASHBOARD_INSIGHTS_THEME_CONFIG: Record<string, DashboardInsightsThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardInsightsThemeConfigEntry(tokens)]),
)
export const DASHBOARD_FILTER_THEME_CONFIG: Record<string, DashboardFilterThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardFilterThemeConfigEntry(tokens)]),
)
export const DASHBOARD_TAB_THEME_CONFIG: Record<string, DashboardTabThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardTabThemeConfigEntry(tokens)]),
)
export const DASHBOARD_CHART_THEME_CONFIG: Record<string, DashboardChartThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardChartThemeConfigEntry(tokens)]),
)
export const DASHBOARD_TABLE_THEME_CONFIG: Record<string, DashboardTableThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardTableThemeConfigEntry(tokens)]),
)
export const DASHBOARD_PIVOT_TABLE_THEME_CONFIG: Record<string, DashboardPivotTableThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardPivotTableThemeConfigEntry(tokens)]),
)
export const DASHBOARD_GAUGE_THEME_CONFIG: Record<string, DashboardGaugeThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardGaugeThemeConfigEntry(tokens)]),
)

export function resolveDashboardCardTheme(
  themeName?: string,
  borderPreset?: DashboardBorderPreset | string,
  appearanceOverrides?: DashboardAppearanceOverrides,
): DashboardThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  const theme = buildDashboardThemeConfigEntry(tokens, borderPreset)

  return {
    ...theme,
    chartCard: deepMergeOrClone(theme.chartCard, appearanceOverrides?.chart?.card),
    kpiCard: deepMergeOrClone(theme.kpiCard, appearanceOverrides?.kpi?.card),
  }
}

export function resolveDashboardTextVariantKey(role?: string): DashboardTextVariantKey {
  const key = String(role || 'body').trim().toLowerCase()
  if (key === 'muted') return 'body-muted'
  if (key === 'subtitle') return 'body-muted'
  if (key === 'title') return 'section-title'
  if (key === 'chart-title') return 'chart-title'
  if (key === 'chart-eyebrow') return 'chart-eyebrow'
  if (key === 'table-title') return 'table-title'
  if (key === 'pivot-title') return 'pivot-title'
  if (key === 'filter-title') return 'filter-title'
  if (key === 'insights-title') return 'insights-title'
  if (key === 'insights-title-sm') return 'insights-title-sm'
  if (key === 'kpi-title') return 'kpi-title'
  if (key === 'kpi-value') return 'kpi-value'
  if (key === 'kpi-compare') return 'kpi-compare'
  if (key === 'kpi-delta') return 'kpi-delta'
  if (key === 'body') return 'body'
  if (key === 'body-muted') return 'body-muted'
  if (key === 'body-sm') return 'body-sm'
  if (key === 'small-muted') return 'small-muted'
  if (key === 'lead') return 'lead'
  if (key === 'eyebrow') return 'eyebrow'
  if (key === 'eyebrow-strong') return 'eyebrow-strong'
  if (key === 'page-title') return 'page-title'
  if (key === 'page-title-sm') return 'page-title-sm'
  if (key === 'section-title') return 'section-title'
  if (key === 'section-title-md') return 'section-title-md'
  if (key === 'section-title-sm') return 'section-title-sm'
  if (key === 'section-title-strong') return 'section-title-strong'
  return 'body'
}

export function resolveDashboardTextTheme(themeName?: string): DashboardTextThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  return buildDashboardTextThemeConfigEntry(tokens)
}

export function resolveDashboardTextStyle(
  role: string | undefined,
  themeName?: string,
  _appearanceOverrides?: DashboardAppearanceOverrides,
): DashboardTextStyle {
  const theme = resolveDashboardTextTheme(themeName)
  return theme[resolveDashboardTextVariantKey(role)]
}

export function resolveDashboardDatePickerTheme(
  themeName?: string,
  appearanceOverrides?: DashboardAppearanceOverrides,
): DashboardDatePickerThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  return deepMergeOrClone(buildDashboardDatePickerThemeConfigEntry(tokens), appearanceOverrides?.header?.datePicker)
}

export function resolveDashboardInsightsTheme(themeName?: string): DashboardInsightsThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  return buildDashboardInsightsThemeConfigEntry(tokens)
}

export function resolveDashboardFilterTheme(themeName?: string): DashboardFilterThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  return buildDashboardFilterThemeConfigEntry(tokens)
}

export function resolveDashboardTabStyle(themeName?: string, active?: boolean): React.CSSProperties {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  const theme = buildDashboardTabThemeConfigEntry(tokens)
  return active ? { ...theme.base, ...theme.active } : theme.base
}

export function resolveDashboardChartTheme(
  themeName?: string,
  chartPaletteName?: string,
  appearanceOverrides?: DashboardAppearanceOverrides,
): DashboardChartThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  const baseTheme = {
    ...buildDashboardChartThemeConfigEntry(tokens),
    colorScheme: resolveDashboardChartPaletteColors(chartPaletteName || DASHBOARD_DEFAULT_CHART_PALETTE),
  }

  return {
    ...baseTheme,
    titleStyle: deepMergeOrClone(baseTheme.titleStyle, appearanceOverrides?.chart?.title),
    xAxis: deepMergeOrClone(baseTheme.xAxis, appearanceOverrides?.chart?.graph?.axes?.x),
    yAxis: deepMergeOrClone(baseTheme.yAxis, appearanceOverrides?.chart?.graph?.axes?.y),
    grid: deepMergeOrClone(baseTheme.grid, appearanceOverrides?.chart?.graph?.grid),
    legend: deepMergeOrClone(baseTheme.legend, appearanceOverrides?.chart?.graph?.legend),
    tooltip: deepMergeOrClone(baseTheme.tooltip, appearanceOverrides?.chart?.graph?.tooltip),
    margin: deepMergeOrClone(baseTheme.margin, appearanceOverrides?.chart?.graph?.margin),
  }
}

export function resolveDashboardTableTheme(themeName?: string): DashboardTableThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  return buildDashboardTableThemeConfigEntry(tokens)
}

export function resolveDashboardPivotTableTheme(themeName?: string): DashboardPivotTableThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  return buildDashboardPivotTableThemeConfigEntry(tokens)
}

export function resolveDashboardGaugeTheme(themeName?: string): DashboardGaugeThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  return buildDashboardGaugeThemeConfigEntry(tokens)
}

const DASHBOARD_TEXT_ROLE_SET = new Set<string>([
  'body',
  'body-muted',
  'body-sm',
  'small-muted',
  'lead',
  'eyebrow',
  'eyebrow-strong',
  'page-title',
  'page-title-sm',
  'section-title',
  'section-title-md',
  'section-title-sm',
  'section-title-strong',
  'chart-title',
  'chart-eyebrow',
  'table-title',
  'pivot-title',
  'filter-title',
  'insights-title',
  'insights-title-sm',
  'kpi-title',
  'kpi-value',
  'kpi-compare',
  'kpi-delta',
  'muted',
  'subtitle',
  'title',
])

export function resolveDashboardNodeStyle(
  role: string | undefined,
  themeName?: string,
  appearanceOverrides?: DashboardAppearanceOverrides,
  options?: { active?: boolean },
): React.CSSProperties {
  const key = String(role || '').trim().toLowerCase()
  if (!key) return {}
  if (key === 'tab') return resolveDashboardTabStyle(themeName, options?.active)
  if (DASHBOARD_TEXT_ROLE_SET.has(key)) return resolveDashboardTextStyle(key, themeName, appearanceOverrides)
  return {}
}

export function resolveDashboardCardVariantKey(props: Record<string, any> | undefined): DashboardCardVariantKey {
  const variant = typeof props?.variant === 'string' ? props.variant.trim().toLowerCase() : ''
  if (variant === 'kpi') return 'kpiCard'
  if (variant === 'chart') return 'chartCard'
  if (variant === 'table') return 'tableCard'
  if (variant === 'pivot') return 'pivotCard'
  if (variant === 'filter') return 'filterCard'
  if (variant === 'note') return 'noteCard'
  return 'card'
}

export function DashboardThemeSelectionProvider({
  appearanceOverrides,
  themeName,
  chartPaletteName,
  borderPreset,
  children,
}: {
  appearanceOverrides?: DashboardAppearanceOverrides
  themeName?: string
  chartPaletteName?: string
  borderPreset?: string
  children?: React.ReactNode
}) {
  const parent = React.useContext(DashboardThemeSelectionContext)
  const value = React.useMemo<DashboardThemeSelection>(
    () => ({
      appearanceOverrides: mergeAppearanceOverrides(parent.appearanceOverrides, appearanceOverrides),
      chartPaletteName:
        typeof chartPaletteName === 'string' && chartPaletteName.trim()
          ? chartPaletteName
          : parent.chartPaletteName,
      themeName: typeof themeName === 'string' && themeName.trim() ? themeName : parent.themeName,
      borderPreset: typeof borderPreset === 'string' && borderPreset.trim() ? borderPreset : parent.borderPreset,
    }),
    [appearanceOverrides, borderPreset, chartPaletteName, parent.appearanceOverrides, parent.borderPreset, parent.chartPaletteName, parent.themeName, themeName],
  )

  return React.createElement(DashboardThemeSelectionContext.Provider, { value }, children)
}

export function useDashboardThemeSelection() {
  return React.useContext(DashboardThemeSelectionContext)
}

export function DashboardHeaderScopeProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  return React.createElement(DashboardHeaderScopeContext.Provider, { value: true }, children)
}

export function useDashboardHeaderScope() {
  return React.useContext(DashboardHeaderScopeContext)
}

export type DashboardKpiTheme = {
  compare: {
    style: React.CSSProperties
  }
  descriptionStyle: React.CSSProperties
  style: React.CSSProperties
  titleStyle: React.CSSProperties
  valueStyle: React.CSSProperties
}

const DASHBOARD_KPI_THEME_NAMES = [
  'light',
  'blue',
  'dark',
  'black',
  'slate',
  'navy',
  'sand',
  'charcoal',
  'midnight',
  'metro',
] as const

export const DASHBOARD_KPI_THEME_CONFIG: Record<string, DashboardKpiTheme> = Object.fromEntries(
  DASHBOARD_KPI_THEME_NAMES.map((themeName) => [
    themeName,
    {
      style: {
        alignItems: 'flex-start',
        gap: 8,
      },
      titleStyle: {
        ...resolveDashboardTextStyle('kpi-title', themeName),
      },
      valueStyle: {
        ...resolveDashboardTextStyle('kpi-value', themeName),
      },
      descriptionStyle: {
        ...resolveDashboardTextStyle('body-muted', themeName),
      },
      compare: {
        style: {
          ...resolveDashboardTextStyle('kpi-compare', themeName),
        },
      },
    },
  ]),
)

export function resolveDashboardKpiTheme(
  themeName: string,
  appearanceOverrides?: DashboardAppearanceOverrides,
): DashboardKpiTheme {
  const key = String(themeName || 'light').trim().toLowerCase()
  const aliases: Record<string, string> = {
    branco: 'light',
    claro: 'light',
    white: 'light',
  }
  const theme = DASHBOARD_KPI_THEME_CONFIG[aliases[key] || key] || DASHBOARD_KPI_THEME_CONFIG.light
  return {
    ...theme,
    style: deepMergeOrClone(theme.style, appearanceOverrides?.kpi?.container),
    titleStyle: deepMergeOrClone(theme.titleStyle, appearanceOverrides?.kpi?.title),
    valueStyle: deepMergeOrClone(theme.valueStyle, appearanceOverrides?.kpi?.value),
    descriptionStyle: deepMergeOrClone(theme.descriptionStyle, appearanceOverrides?.kpi?.description),
    compare: {
      ...theme.compare,
      style: deepMergeOrClone(theme.compare.style, appearanceOverrides?.kpi?.compare),
    },
  }
}

export type DashboardHeaderTheme = {
  card: React.CSSProperties
  eyebrow: React.CSSProperties
  subtitle: React.CSSProperties
  title: React.CSSProperties
}

export function resolveDashboardHeaderTheme(
  themeName?: string,
  borderPreset?: DashboardBorderPreset | string,
  appearanceOverrides?: DashboardAppearanceOverrides,
): DashboardHeaderTheme {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  const radius = resolveDashboardBorderRadiusPreset(borderPreset, tokens.cardFrame ? 0 : 24)
  const textTheme = buildDashboardTextThemeConfigEntry(tokens)
  const baseTheme: DashboardHeaderTheme = {
    card: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 24,
      padding: '20px 24px',
      borderRadius: radius,
      border: `1px solid ${tokens.surfaceBorder}`,
      backgroundColor: tokens.headerBg,
      color: tokens.headerText,
    },
    eyebrow: textTheme['eyebrow-strong'],
    title: textTheme['page-title'],
    subtitle: textTheme.lead,
  }

  return {
    card: deepMergeOrClone(baseTheme.card, appearanceOverrides?.header?.card),
    eyebrow: deepMergeOrClone(baseTheme.eyebrow, appearanceOverrides?.header?.eyebrow),
    title: deepMergeOrClone(baseTheme.title, appearanceOverrides?.header?.title),
    subtitle: deepMergeOrClone(baseTheme.subtitle, appearanceOverrides?.header?.subtitle),
  }
}

export function resolveDashboardHeaderCardOverride(appearanceOverrides?: DashboardAppearanceOverrides): React.CSSProperties {
  return appearanceOverrides?.header?.card || {}
}

export function resolveDashboardHeaderTextOverride(
  role: string | undefined,
  appearanceOverrides?: DashboardAppearanceOverrides,
): React.CSSProperties {
  const key = resolveDashboardTextVariantKey(role)
  if (key === 'eyebrow' || key === 'eyebrow-strong') return appearanceOverrides?.header?.eyebrow || {}
  if (key === 'page-title' || key === 'page-title-sm') return appearanceOverrides?.header?.title || {}
  if (key === 'lead' || key === 'body-muted') return appearanceOverrides?.header?.subtitle || {}
  return {}
}

export function buildDashboardThemeConfigFileSource() {
  const cardEntries = Object.entries(DASHBOARD_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const textEntries = Object.entries(DASHBOARD_TEXT_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const datePickerEntries = Object.entries(DASHBOARD_DATE_PICKER_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const insightsEntries = Object.entries(DASHBOARD_INSIGHTS_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const filterEntries = Object.entries(DASHBOARD_FILTER_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const tabEntries = Object.entries(DASHBOARD_TAB_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const chartEntries = Object.entries(DASHBOARD_CHART_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const tableEntries = Object.entries(DASHBOARD_TABLE_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const pivotEntries = Object.entries(DASHBOARD_PIVOT_TABLE_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const gaugeEntries = Object.entries(DASHBOARD_GAUGE_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const kpiEntries = Object.entries(DASHBOARD_KPI_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')

  return `export const DASHBOARD_CARD_THEME_CONFIG = {
${cardEntries}
} as const

export const DASHBOARD_TEXT_THEME_CONFIG = {
${textEntries}
} as const

export const DASHBOARD_DATE_PICKER_THEME_CONFIG = {
${datePickerEntries}
} as const

export const DASHBOARD_INSIGHTS_THEME_CONFIG = {
${insightsEntries}
} as const

export const DASHBOARD_FILTER_THEME_CONFIG = {
${filterEntries}
} as const

export const DASHBOARD_TAB_THEME_CONFIG = {
${tabEntries}
} as const

export const DASHBOARD_CHART_THEME_CONFIG = {
${chartEntries}
} as const

export const DASHBOARD_TABLE_THEME_CONFIG = {
${tableEntries}
} as const

export const DASHBOARD_PIVOT_TABLE_THEME_CONFIG = {
${pivotEntries}
} as const

export const DASHBOARD_GAUGE_THEME_CONFIG = {
${gaugeEntries}
} as const

export const DASHBOARD_KPI_THEME_CONFIG = {
${kpiEntries}
} as const

export type DashboardCardThemeConfig = typeof DASHBOARD_CARD_THEME_CONFIG
export type DashboardTextThemeConfig = typeof DASHBOARD_TEXT_THEME_CONFIG
export type DashboardDatePickerThemeConfig = typeof DASHBOARD_DATE_PICKER_THEME_CONFIG
export type DashboardInsightsThemeConfig = typeof DASHBOARD_INSIGHTS_THEME_CONFIG
export type DashboardFilterThemeConfig = typeof DASHBOARD_FILTER_THEME_CONFIG
export type DashboardTabThemeConfig = typeof DASHBOARD_TAB_THEME_CONFIG
export type DashboardChartThemeConfig = typeof DASHBOARD_CHART_THEME_CONFIG
export type DashboardTableThemeConfig = typeof DASHBOARD_TABLE_THEME_CONFIG
export type DashboardPivotTableThemeConfig = typeof DASHBOARD_PIVOT_TABLE_THEME_CONFIG
export type DashboardGaugeThemeConfig = typeof DASHBOARD_GAUGE_THEME_CONFIG
export type DashboardKpiThemeConfig = typeof DASHBOARD_KPI_THEME_CONFIG
`
}
