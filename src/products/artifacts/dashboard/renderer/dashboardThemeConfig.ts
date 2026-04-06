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

export const DASHBOARD_THEME_CONFIG: Record<string, DashboardThemeConfigEntry> = Object.fromEntries(
  Object.entries(DASHBOARD_TEMPLATE_THEME_TOKENS).map(([name, tokens]) => [name, buildDashboardThemeConfigEntry(tokens)]),
)

export function resolveDashboardCardTheme(
  themeName?: string,
  borderPreset?: DashboardBorderPreset | string,
): DashboardThemeConfigEntry {
  const key = resolveThemeKey(themeName)
  const tokens = DASHBOARD_TEMPLATE_THEME_TOKENS[key] || DASHBOARD_TEMPLATE_THEME_TOKENS.light
  return buildDashboardThemeConfigEntry(tokens, borderPreset)
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
  const entries = Object.entries(DASHBOARD_THEME_CONFIG)
    .map(([name, config]) => `  ${name}: ${JSON.stringify(config, null, 2).replace(/\n/g, '\n  ')},`)
    .join('\n')

  return `export const DASHBOARD_THEME_CONFIG = {
${entries}
} as const

export type DashboardThemeConfig = typeof DASHBOARD_THEME_CONFIG
`
}
