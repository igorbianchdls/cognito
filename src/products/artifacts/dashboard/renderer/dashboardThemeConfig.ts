'use client'

import type { ThemeOverrides } from '@/products/bi/json-render/theme/builtInThemes'
import { resolveDashboardBorderRadiusPreset } from '@/products/artifacts/dashboard/borderPresets'
import {
  resolveDashboardTemplateThemeTokens,
  type DashboardTemplateThemeTokens,
} from '@/products/artifacts/dashboard/templates/dashboardTemplateThemes'

type AnyRecord = Record<string, any>

export type DashboardRendererThemeConfig = {
  tokens: DashboardTemplateThemeTokens
  cssVars: Record<string, string>
  components: ThemeOverrides['components']
}

function resolveFrameCssVars(tokens: DashboardTemplateThemeTokens, baseCssVars: Record<string, string>) {
  const cardFrame = tokens.cardFrame
  return {
    cardFrameVariant: baseCssVars.containerFrameVariant || (cardFrame?.variant ? String(cardFrame.variant) : ''),
    cardFrameBaseColor: baseCssVars.containerFrameBaseColor || '',
    cardFrameCornerColor: baseCssVars.containerFrameCornerColor || '',
    cardFrameCornerSize: baseCssVars.containerFrameCornerSize || (cardFrame ? String(cardFrame.cornerSize) : ''),
    cardFrameCornerWidth: baseCssVars.containerFrameCornerWidth || (cardFrame ? String(cardFrame.cornerWidth) : ''),
  }
}

function buildCardComponents(radius: number): ThemeOverrides['components'] {
  const baseCard = {
    backgroundColor: 'var(--surfaceBg)',
    borderColor: 'var(--surfaceBorder)',
    borderWidth: 1,
    borderRadius: 'var(--containerRadius)',
    padding: 22,
  }

  return {
    Card: baseCard,
    KpiCard: {
      backgroundColor: 'var(--kpiCardBg, var(--surfaceBg))',
      borderColor: 'var(--kpiCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: radius,
      padding: 22,
    },
    ChartCard: {
      backgroundColor: 'var(--chartCardBg, var(--surfaceBg))',
      borderColor: 'var(--chartCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: radius,
      padding: 22,
    },
    TableCard: {
      backgroundColor: 'var(--tableCardBg, var(--surfaceBg))',
      borderColor: 'var(--tableCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: radius,
      padding: 22,
    },
    PivotCard: {
      backgroundColor: 'var(--pivotCardBg, var(--surfaceBg))',
      borderColor: 'var(--pivotCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: radius,
      padding: 22,
    },
    FilterCard: {
      backgroundColor: 'var(--filterCardBg, var(--surfaceBg))',
      borderColor: 'var(--filterCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: radius,
      padding: 22,
    },
    NoteCard: {
      backgroundColor: 'var(--noteCardBg, var(--surfaceBg))',
      borderColor: 'var(--noteCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: radius,
      padding: 22,
    },
  }
}

export function resolveDashboardRendererTheme(args: {
  themeName?: string
  borderPreset?: string
  baseCssVars?: Record<string, string>
  chartPaletteColors?: string[]
}): DashboardRendererThemeConfig {
  const themeName = typeof args.themeName === 'string' && args.themeName.trim() ? args.themeName : 'light'
  const tokens = resolveDashboardTemplateThemeTokens(themeName, args.borderPreset)
  const baseCssVars = { ...((args.baseCssVars || {}) as AnyRecord) } as Record<string, string>
  const radius = resolveDashboardBorderRadiusPreset(args.borderPreset, tokens.cardFrame ? 0 : 24)
  const frameCssVars = resolveFrameCssVars(tokens, baseCssVars)

  const cssVars: Record<string, string> = {
    ...baseCssVars,
    bg: baseCssVars.bg || tokens.pageBg,
    fg: baseCssVars.fg || tokens.textPrimary,
    surfaceBg: baseCssVars.surfaceBg || tokens.surfaceBg,
    surfaceBorder: baseCssVars.surfaceBorder || tokens.surfaceBorder,
    headerBg: baseCssVars.headerBg || tokens.headerBg,
    headerText: baseCssVars.headerText || tokens.headerText,
    headerSubtitle: baseCssVars.headerSubtitle || tokens.headerSubtitle,
    kpiValueColor: baseCssVars.kpiValueColor || tokens.kpiValueColor,
    titleColor: baseCssVars.titleColor || tokens.titleColor,
    chartColorScheme: JSON.stringify(args.chartPaletteColors || []),
    containerRadius: String(radius),
    containerFrameVariant: '',
    containerFrameBaseColor: '',
    containerFrameCornerColor: '',
    containerFrameCornerSize: '',
    containerFrameCornerWidth: '',
    ...frameCssVars,
  }

  return {
    tokens,
    cssVars,
    components: buildCardComponents(radius),
  }
}

export function buildDashboardThemeConfigFileSource() {
  return `export const DASHBOARD_THEME_CONFIG = {
  light: {
    card: {
      backgroundColor: 'var(--surfaceBg)',
      borderColor: 'var(--surfaceBorder)',
      borderWidth: 1,
      borderRadius: 'var(--containerRadius)',
      padding: 22,
      frame: 'var(--cardFrameVariant)',
    },
    kpiCard: {
      backgroundColor: 'var(--kpiCardBg, var(--surfaceBg))',
      borderColor: 'var(--kpiCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: 'var(--containerRadius)',
      padding: 22,
      frame: 'var(--kpiCardFrameVariant, var(--cardFrameVariant))',
    },
    chartCard: {
      backgroundColor: 'var(--chartCardBg, var(--surfaceBg))',
      borderColor: 'var(--chartCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: 'var(--containerRadius)',
      padding: 22,
      frame: 'var(--chartCardFrameVariant, var(--cardFrameVariant))',
    },
    tableCard: {
      backgroundColor: 'var(--tableCardBg, var(--surfaceBg))',
      borderColor: 'var(--tableCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: 'var(--containerRadius)',
      padding: 22,
      frame: 'var(--tableCardFrameVariant, var(--cardFrameVariant))',
    },
    pivotCard: {
      backgroundColor: 'var(--pivotCardBg, var(--surfaceBg))',
      borderColor: 'var(--pivotCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: 'var(--containerRadius)',
      padding: 22,
      frame: 'var(--pivotCardFrameVariant, var(--cardFrameVariant))',
    },
    filterCard: {
      backgroundColor: 'var(--filterCardBg, var(--surfaceBg))',
      borderColor: 'var(--filterCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: 'var(--containerRadius)',
      padding: 22,
      frame: 'var(--filterCardFrameVariant, var(--cardFrameVariant))',
    },
    noteCard: {
      backgroundColor: 'var(--noteCardBg, var(--surfaceBg))',
      borderColor: 'var(--noteCardBorder, var(--surfaceBorder))',
      borderWidth: 1,
      borderRadius: 'var(--containerRadius)',
      padding: 22,
      frame: 'var(--noteCardFrameVariant, var(--cardFrameVariant))',
    },
    kpi: {
      title: 'data-ui=kpi-title',
      value: 'data-ui=kpi-value',
      compare: 'data-ui=kpi-compare',
    },
    chart: {
      title: 'Text variant="section-title"',
      palette: 'chartColorScheme',
    },
    datePicker: {
      label: 'theme-driven in renderer',
      field: 'theme-driven in renderer',
      icon: 'theme-driven in renderer',
      presets: 'theme-driven in renderer',
    },
  },
} as const

export type DashboardThemeConfig = typeof DASHBOARD_THEME_CONFIG
`
}
