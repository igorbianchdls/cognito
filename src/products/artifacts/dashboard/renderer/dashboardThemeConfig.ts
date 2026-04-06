'use client'

import React from 'react'

import type { HudFrameConfig } from '@/products/bi/json-render/components/FrameSurface'
import { resolveDashboardBorderRadiusPreset, resolveDashboardBorderFramePreset, type DashboardBorderPreset } from '@/products/artifacts/dashboard/borderPresets'
import {
  DASHBOARD_TEMPLATE_THEME_TOKENS,
  type DashboardTemplateThemeTokens,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateThemes'

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

type DashboardThemeSelection = {
  themeName: string
  borderPreset?: string
}

const DashboardThemeSelectionContext = React.createContext<DashboardThemeSelection>({
  themeName: 'light',
})

const DASHBOARD_THEME_ALIASES: Record<string, string> = {
  white: 'light',
  claro: 'light',
  branco: 'light',
}

function resolveThemeKey(themeName: string | undefined) {
  const key = String(themeName || 'light').trim().toLowerCase()
  return DASHBOARD_THEME_ALIASES[key] || key
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

export const DASHBOARD_THEME_CONFIG: Record<string, DashboardThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardThemeConfigEntry(tokens)]),
)
export const DASHBOARD_TEXT_THEME_CONFIG: Record<string, DashboardTextThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardTextThemeConfigEntry(tokens)]),
)

export function resolveDashboardCardTheme(
  themeName?: string,
  borderPreset?: DashboardBorderPreset | string,
): DashboardThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  return buildDashboardThemeConfigEntry(tokens, borderPreset)
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

export function resolveDashboardTextStyle(role: string | undefined, themeName?: string): DashboardTextStyle {
  const theme = resolveDashboardTextTheme(themeName)
  return theme[resolveDashboardTextVariantKey(role)]
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
  themeName,
  borderPreset,
  children,
}: {
  themeName?: string
  borderPreset?: string
  children?: React.ReactNode
}) {
  const parent = React.useContext(DashboardThemeSelectionContext)
  const value = React.useMemo<DashboardThemeSelection>(
    () => ({
      themeName: typeof themeName === 'string' && themeName.trim() ? themeName : parent.themeName,
      borderPreset: typeof borderPreset === 'string' && borderPreset.trim() ? borderPreset : parent.borderPreset,
    }),
    [borderPreset, parent.borderPreset, parent.themeName, themeName],
  )

  return React.createElement(DashboardThemeSelectionContext.Provider, { value }, children)
}

export function useDashboardThemeSelection() {
  return React.useContext(DashboardThemeSelectionContext)
}

export function buildDashboardThemeConfigFileSource() {
  const cardEntries = Object.entries(DASHBOARD_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')
  const textEntries = Object.entries(DASHBOARD_TEXT_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')

  return `export const DASHBOARD_CARD_THEME_CONFIG = {
${cardEntries}
} as const

export const DASHBOARD_TEXT_THEME_CONFIG = {
${textEntries}
} as const

export type DashboardCardThemeConfig = typeof DASHBOARD_CARD_THEME_CONFIG
export type DashboardTextThemeConfig = typeof DASHBOARD_TEXT_THEME_CONFIG
`
}
