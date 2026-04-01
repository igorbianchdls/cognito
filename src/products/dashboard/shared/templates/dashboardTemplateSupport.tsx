'use client'

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

type DashboardUiVariant = 'default' | 'classic'

export function getDashboardTemplatePalette(template: DashboardTemplateKey): string[] {
  return [...DASHBOARD_TEMPLATE_PALETTES[template]]
}

export function getDashboardTemplateThemeName(template: DashboardTemplateKey): string {
  return DASHBOARD_TEMPLATE_DEFAULT_THEMES[template] || 'light'
}

export function buildDashboardThemeImportSource() {
  return `import { resolveDashboardThemeTokens } from './theme-tokens'`
}

export function buildDashboardInlineUiSource(variant: DashboardUiVariant = 'default') {
  const isClassic = variant === 'classic'

  return `  const theme = resolveDashboardThemeTokens(THEME_NAME)
  const isClassic = ${JSON.stringify(isClassic)}
  const key = String(THEME_NAME || '').toLowerCase()
  const cardFrame = ['midnight', 'metro', 'aero'].includes(key)
    ? { variant: 'hud' as const, cornerSize: 10, cornerWidth: 2 }
    : ['light', 'white', 'claro', 'branco', 'sand'].includes(key)
      ? { variant: 'hud' as const, cornerSize: 6, cornerWidth: 1 }
      : { variant: 'hud' as const, cornerSize: 8, cornerWidth: 1 }
  const ui = {
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
  }`
}
