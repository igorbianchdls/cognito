'use client'

import { resolveDashboardTemplateThemeTokens } from '@/products/dashboard/shared/templates/dashboardTemplateThemes'

export type DashboardTemplateKey = 'classic' | 'compras' | 'financeiro' | 'metaads' | 'googleads' | 'shopify'

export const DASHBOARD_TEMPLATE_PALETTES: Record<DashboardTemplateKey, readonly string[]> = {
  classic: ['#0F766E', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'],
  compras: ['#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
  financeiro: ['#0F766E', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'],
  metaads: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'],
  googleads: ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'],
  shopify: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'],
}

export const DASHBOARD_TEMPLATE_DEFAULT_THEMES: Record<DashboardTemplateKey, string> = {
  classic: 'aero',
  compras: 'blue',
  financeiro: 'sand',
  metaads: 'midnight',
  googleads: 'metro',
  shopify: 'light',
}

type DashboardModuleThemeTokens = {
  chartScheme: string[]
  cardFrame: { variant: 'hud'; cornerSize: number; cornerWidth: number } | null
  dark: boolean
  primary: string
  pageBg: string
  surfaceBg: string
  borderColor: string
  textPrimary: string
  textSecondary: string
  kpiValueColor: string
  headerBg: string
  headerText: string
  headerSubtitle: string
  headerDpBg: string
  headerDpColor: string
  headerDpBorder: string
  headerDpIcon: string
  headerDpLabel: string
  accentSurface: string
  accentBorder: string
  headerDpActiveBg: string
  headerDpActiveBorder: string
}

export type DashboardModuleUi = {
  chartScheme: string[]
  cardFrame: { variant: 'hud'; cornerSize: number; cornerWidth: number } | null
  page: React.CSSProperties
  header: React.CSSProperties
  badge: React.CSSProperties
  noteCard: React.CSSProperties
  queryCard: React.CSSProperties
  panelCard: React.CSSProperties
  panelCardAlt: React.CSSProperties
  footer: React.CSSProperties
  eyebrow: React.CSSProperties
  title: React.CSSProperties
  subtitle: React.CSSProperties
  paragraph: React.CSSProperties
  kpiLabel: React.CSSProperties
  kpiValue: React.CSSProperties
  kpiDelta: React.CSSProperties
  headerDatePickerLabel: React.CSSProperties
  headerDatePickerField: React.CSSProperties
  headerDatePickerIcon: React.CSSProperties
  headerDatePickerPreset: React.CSSProperties
  headerDatePickerPresetActive: React.CSSProperties
  headerDatePickerSeparator: React.CSSProperties
  tableHeaderStyle: React.CSSProperties
  tableRowStyle: React.CSSProperties
  tableCellStyle: React.CSSProperties
  tableFooterStyle: React.CSSProperties
  tableBorderColor: string
  tableRowHoverColor: string
  pivotContainerStyle: React.CSSProperties
  pivotHeaderStyle: React.CSSProperties
  pivotHeaderTotalStyle: React.CSSProperties
  pivotRowLabelStyle: React.CSSProperties
  pivotCellStyle: React.CSSProperties
  pivotRowTotalStyle: React.CSSProperties
  pivotFooterStyle: React.CSSProperties
  pivotEmptyStateStyle: React.CSSProperties
  pivotExpandButtonStyle: React.CSSProperties
}

function resolveDashboardCardFrame(themeName: string) {
  const key = String(themeName || '').toLowerCase()
  if (['midnight', 'metro', 'aero'].includes(key)) {
    return { variant: 'hud' as const, cornerSize: 10, cornerWidth: 2 }
  }
  if (['light', 'white', 'claro', 'branco', 'sand'].includes(key)) {
    return { variant: 'hud' as const, cornerSize: 6, cornerWidth: 1 }
  }
  return { variant: 'hud' as const, cornerSize: 8, cornerWidth: 1 }
}

export function getDashboardTemplatePalette(template: DashboardTemplateKey): string[] {
  return [...DASHBOARD_TEMPLATE_PALETTES[template]]
}

export function getDashboardTemplateThemeName(template: DashboardTemplateKey): string {
  return DASHBOARD_TEMPLATE_DEFAULT_THEMES[template] || 'light'
}

export function buildDashboardUiFileSource() {
  return `import { resolveDashboardThemeTokens } from './theme-tokens'

function resolveDashboardCardFrame(themeName) {
  const key = String(themeName || '').toLowerCase()
  if (['midnight', 'metro', 'aero'].includes(key)) {
    return { variant: 'hud', cornerSize: 10, cornerWidth: 2 }
  }
  if (['light', 'white', 'claro', 'branco', 'sand'].includes(key)) {
    return { variant: 'hud', cornerSize: 6, cornerWidth: 1 }
  }
  return { variant: 'hud', cornerSize: 8, cornerWidth: 1 }
}

export function resolveDashboardUi(themeName, variant = 'default') {
  const theme = resolveDashboardThemeTokens(themeName)
  const cardFrame = resolveDashboardCardFrame(themeName)
  const isClassic = variant === 'classic'

  return {
    chartScheme: [theme.primary, theme.accentBorder, theme.textSecondary, theme.surfaceBorder, theme.headerSubtitle],
    cardFrame,
    page: {
      display: 'flex',
      flexDirection: 'column',
      gap: isClassic ? 20 : 24,
      minHeight: '100%',
      padding: isClassic ? 28 : 32,
      backgroundColor: theme.pageBg,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: isClassic ? 20 : 24,
      padding: isClassic ? '20px 24px' : 24,
      borderRadius: isClassic && cardFrame ? 0 : 24,
      border: \`1px solid \${theme.surfaceBorder}\`,
      backgroundColor: theme.headerBg,
      color: theme.headerText,
    },
    badge: {
      display: 'inline-flex',
      width: 'fit-content',
      alignItems: 'center',
      borderRadius: 999,
      border: \`1px solid \${theme.accentBorder}\`,
      backgroundColor: theme.accentSurface,
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: theme.accentText,
    },
    noteCard: {
      width: '30%',
      minWidth: 260,
      padding: 22,
      borderRadius: isClassic && cardFrame ? 0 : 22,
      backgroundColor: theme.accentSurface,
      border: \`1px solid \${theme.accentBorder}\`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    },
    metricCard: {
      padding: 20,
      borderRadius: isClassic && cardFrame ? 0 : 22,
      border: \`1px solid \${theme.surfaceBorder}\`,
      backgroundColor: theme.surfaceBg,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    queryCard: {
      padding: 22,
      borderRadius: isClassic && cardFrame ? 0 : 22,
      border: \`1px solid \${theme.surfaceBorder}\`,
      backgroundColor: theme.surfaceBg,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    panelCard: {
      padding: 22,
      borderRadius: cardFrame ? 0 : 24,
      backgroundColor: theme.surfaceBg,
      border: \`1px solid \${theme.surfaceBorder}\`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    panelCardAlt: {
      padding: 22,
      borderRadius: cardFrame ? 0 : 24,
      backgroundColor: theme.accentSurface,
      border: \`1px solid \${theme.accentBorder}\`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 18,
      padding: isClassic ? '16px 20px' : '18px 22px',
      borderRadius: isClassic && cardFrame ? 0 : 22,
      backgroundColor: theme.surfaceBg,
      border: \`1px solid \${theme.surfaceBorder}\`,
    },
    eyebrow: {
      margin: 0,
      fontSize: 11,
      color: theme.headerSubtitle,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    title: {
      margin: 0,
      fontSize: isClassic ? 22 : 24,
      fontWeight: 600,
      color: theme.titleColor,
      letterSpacing: '-0.03em',
    },
    subtitle: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.7,
      color: theme.textSecondary,
    },
    paragraph: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.75,
      color: theme.textSecondary,
    },
    metricLabel: {
      margin: 0,
      fontSize: 12,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    metricValue: {
      margin: '10px 0 8px 0',
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1,
      color: theme.titleColor,
      letterSpacing: '-0.04em',
    },
    metricNote: {
      margin: 0,
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 1.6,
    },
    kpiLabel: {
      margin: 0,
      fontSize: 12,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    kpiValue: {
      margin: 0,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.04em',
      color: theme.kpiValueColor,
    },
    kpiDelta: {
      margin: 0,
      fontSize: 13,
      color: theme.textSecondary,
    },
    headerDatePickerLabel: {
      margin: 0,
      fontSize: 11,
      color: theme.headerDatePickerLabel,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    headerDatePickerField: {
      minHeight: 38,
      padding: '0 10px',
      border: \`1px solid \${theme.headerDatePickerBorder}\`,
      borderRadius: 10,
      backgroundColor: theme.headerDatePickerBg,
      color: theme.headerDatePickerColor,
      fontSize: 14,
      fontWeight: 500,
    },
    headerDatePickerIcon: {
      color: theme.headerDatePickerIcon,
      fontSize: 14,
    },
    headerDatePickerPreset: {
      height: 36,
      padding: '0 12px',
      border: \`1px solid \${theme.headerDatePickerBorder}\`,
      borderRadius: 10,
      backgroundColor: theme.headerDatePickerBg,
      color: theme.headerDatePickerColor,
      fontSize: 13,
      fontWeight: 500,
    },
    headerDatePickerPresetActive: {
      backgroundColor: theme.headerDatePickerActiveBg,
      borderColor: theme.headerDatePickerActiveBorder,
      color: theme.headerDatePickerActiveText,
      fontWeight: 600,
    },
    headerDatePickerSeparator: {
      color: theme.headerDatePickerLabel,
      fontSize: 13,
      fontWeight: 500,
    },
    tableHeaderStyle: {
      backgroundColor: '#f8fafc',
      color: '#334155',
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    tableRowStyle: {
      backgroundColor: '#ffffff',
    },
    tableCellStyle: {
      color: '#475569',
      fontSize: 14,
      fontWeight: 400,
      padding: '12px 14px',
    },
    tableFooterStyle: {
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    tableBorderColor: '#d7dbe3',
    tableRowHoverColor: '#f8fafc',
    pivotContainerStyle: {
      backgroundColor: '#ffffff',
    },
    pivotHeaderStyle: {
      backgroundColor: '#f8fafc',
      color: '#334155',
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotHeaderTotalStyle: {
      backgroundColor: '#f1f5f9',
      color: '#1e293b',
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotRowLabelStyle: {
      backgroundColor: '#ffffff',
      color: '#1e293b',
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotCellStyle: {
      backgroundColor: '#ffffff',
      color: '#475569',
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotRowTotalStyle: {
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      fontSize: 14,
      fontWeight: 500,
      padding: '9px 10px',
    },
    pivotFooterStyle: {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotEmptyStateStyle: {
      color: '#64748b',
      fontSize: 14,
      padding: '18px 12px',
    },
    pivotExpandButtonStyle: {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      color: '#475569',
      hoverBackgroundColor: '#f8fafc',
    },
  }
}
`
}

function resolveDashboardModuleThemeTokens(themeName: string): DashboardModuleThemeTokens {
  const theme = resolveDashboardTemplateThemeTokens(themeName)
  const chartScheme = [theme.primary, theme.accentBorder, theme.textSecondary, theme.surfaceBorder, theme.headerSubtitle]
  const cardFrame = resolveDashboardCardFrame(themeName)

  return {
    chartScheme,
    cardFrame,
    dark: theme.dark,
    primary: theme.primary,
    pageBg: theme.pageBg,
    surfaceBg: theme.surfaceBg,
    borderColor: theme.surfaceBorder,
    textPrimary: theme.textPrimary,
    textSecondary: theme.textSecondary,
    kpiValueColor: theme.kpiValueColor,
    headerBg: theme.headerBg,
    headerText: theme.headerText,
    headerSubtitle: theme.headerSubtitle,
    headerDpBg: theme.headerDatePickerBg,
    headerDpColor: theme.headerDatePickerColor,
    headerDpBorder: theme.headerDatePickerBorder,
    headerDpIcon: theme.headerDatePickerIcon,
    headerDpLabel: theme.headerDatePickerLabel,
    accentSurface: theme.accentSurface,
    accentBorder: theme.accentBorder,
    headerDpActiveBg: theme.headerDatePickerActiveBg,
    headerDpActiveBorder: theme.headerDatePickerActiveBorder,
  }
}

export function buildDashboardModuleUi(themeName: string): DashboardModuleUi {
  const tokens = resolveDashboardModuleThemeTokens(themeName)
  const theme = resolveDashboardTemplateThemeTokens(themeName)
  const {
    chartScheme,
    cardFrame,
    pageBg,
    surfaceBg,
    borderColor,
    textPrimary,
    textSecondary,
    kpiValueColor,
    headerBg,
    headerText,
    headerSubtitle,
    headerDpBg,
    headerDpColor,
    headerDpBorder,
    headerDpIcon,
    headerDpLabel,
    accentSurface,
    accentBorder,
    headerDpActiveBg,
    headerDpActiveBorder,
  } = tokens

  return {
    chartScheme,
    cardFrame,
    page: {
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      minHeight: '100%',
      padding: 32,
      backgroundColor: pageBg,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 24,
      padding: 24,
      borderRadius: 24,
      border: `1px solid ${borderColor}`,
      backgroundColor: headerBg,
      color: headerText,
    },
    badge: {
      display: 'inline-flex',
      width: 'fit-content',
      alignItems: 'center',
      borderRadius: 999,
      border: `1px solid ${accentBorder}`,
      backgroundColor: accentSurface,
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 600,
      color: theme.accentText,
    },
    noteCard: {
      width: '30%',
      minWidth: 260,
      padding: 22,
      borderRadius: 22,
      backgroundColor: accentSurface,
      border: `1px solid ${accentBorder}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    },
    queryCard: {
      padding: 22,
      borderRadius: cardFrame ? 0 : 22,
      border: `1px solid ${borderColor}`,
      backgroundColor: surfaceBg,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    panelCard: {
      padding: 22,
      borderRadius: cardFrame ? 0 : 24,
      backgroundColor: surfaceBg,
      border: `1px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    panelCardAlt: {
      padding: 22,
      borderRadius: cardFrame ? 0 : 24,
      backgroundColor: accentSurface,
      border: `1px solid ${accentBorder}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 18,
      padding: '18px 22px',
      borderRadius: 22,
      backgroundColor: surfaceBg,
      border: `1px solid ${borderColor}`,
    },
    eyebrow: {
      margin: 0,
      fontSize: 11,
      color: headerSubtitle,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    title: {
      margin: 0,
      fontSize: 24,
      fontWeight: 600,
      color: textPrimary,
      letterSpacing: '-0.03em',
    },
    subtitle: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.7,
      color: textSecondary,
    },
    paragraph: {
      margin: 0,
      fontSize: 14,
      lineHeight: 1.75,
      color: textSecondary,
    },
    kpiLabel: {
      margin: 0,
      fontSize: 12,
      color: textSecondary,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    kpiValue: {
      margin: 0,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: '-0.04em',
      color: kpiValueColor,
    },
    kpiDelta: {
      margin: 0,
      fontSize: 13,
      color: textSecondary,
    },
    headerDatePickerLabel: {
      margin: 0,
      fontSize: 11,
      color: headerDpLabel,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    headerDatePickerField: {
      minHeight: 38,
      padding: '0 10px',
      border: `1px solid ${headerDpBorder}`,
      borderRadius: 10,
      backgroundColor: headerDpBg,
      color: headerDpColor,
      fontSize: 14,
      fontWeight: 500,
    },
    headerDatePickerIcon: {
      color: headerDpIcon,
      fontSize: 14,
    },
    headerDatePickerPreset: {
      height: 36,
      padding: '0 12px',
      border: `1px solid ${headerDpBorder}`,
      borderRadius: 10,
      backgroundColor: headerDpBg,
      color: headerDpColor,
      fontSize: 13,
      fontWeight: 500,
    },
    headerDatePickerPresetActive: {
      backgroundColor: headerDpActiveBg,
      borderColor: headerDpActiveBorder,
      color: theme.headerDatePickerActiveText,
      fontWeight: 600,
    },
    headerDatePickerSeparator: {
      color: headerDpLabel,
      fontSize: 13,
      fontWeight: 500,
    },
    tableHeaderStyle: {
      backgroundColor: '#f8fafc',
      color: '#334155',
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    tableRowStyle: {
      backgroundColor: '#ffffff',
    },
    tableCellStyle: {
      color: '#475569',
      fontSize: 14,
      fontWeight: 400,
      padding: '12px 14px',
    },
    tableFooterStyle: {
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontSize: 14,
      fontWeight: 600,
      padding: '12px 14px',
    },
    tableBorderColor: '#d7dbe3',
    tableRowHoverColor: '#f8fafc',
    pivotContainerStyle: {
      backgroundColor: '#ffffff',
    },
    pivotHeaderStyle: {
      backgroundColor: '#f8fafc',
      color: '#334155',
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotHeaderTotalStyle: {
      backgroundColor: '#f1f5f9',
      color: '#1e293b',
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotRowLabelStyle: {
      backgroundColor: '#ffffff',
      color: '#1e293b',
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotCellStyle: {
      backgroundColor: '#ffffff',
      color: '#475569',
      fontSize: 14,
      padding: '9px 10px',
    },
    pivotRowTotalStyle: {
      backgroundColor: '#f8fafc',
      color: '#1e293b',
      fontSize: 14,
      fontWeight: 500,
      padding: '9px 10px',
    },
    pivotFooterStyle: {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
      fontSize: 14,
      fontWeight: 600,
      padding: '9px 10px',
    },
    pivotEmptyStateStyle: {
      color: '#64748b',
      fontSize: 14,
      padding: '18px 12px',
    },
    pivotExpandButtonStyle: {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      color: '#475569',
      hoverBackgroundColor: '#f8fafc',
    } as React.CSSProperties,
  }
}
