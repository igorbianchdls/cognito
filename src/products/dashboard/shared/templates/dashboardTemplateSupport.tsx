'use client'

import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'

export type DashboardModuleUi = {
  chartScheme: string[]
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

export function buildDashboardModuleUi(themeName: string): DashboardModuleUi {
  const preset = buildThemeVars(themeName)
  const cssVars = preset.cssVars || {}
  const managers = (preset.managers || {}) as Record<string, any>
  const chartScheme = Array.isArray(managers?.color?.scheme) && managers.color.scheme.length
    ? (managers.color.scheme as string[])
    : ['#2563EB', '#0F766E', '#EA580C', '#7C3AED', '#DC2626']

  const dark = ['dark', 'black', 'slate', 'navy', 'charcoal', 'midnight', 'metro', 'aero'].includes(
    String(themeName || '').toLowerCase(),
  )
  const primary = chartScheme[0] || '#2563EB'
  const pageBg = String(cssVars.bg || (dark ? '#0F172A' : '#F6F8FC'))
  const surfaceBg = String(cssVars.surfaceBg || (dark ? '#111827' : '#FFFFFF'))
  const borderColor = String(cssVars.surfaceBorder || (dark ? '#334155' : '#DCE6F2'))
  const textPrimary = String(cssVars.fg || cssVars.h1Color || (dark ? '#E5E7EB' : '#172033'))
  const textSecondary = String(cssVars.headerSubtitle || cssVars.kpiTitleColor || (dark ? '#94A3B8' : '#536783'))
  const headerBg = String(cssVars.headerBg || surfaceBg)
  const headerText = String(cssVars.headerText || textPrimary)
  const headerSubtitle = String(cssVars.headerSubtitle || textSecondary)
  const headerDpBg = String(cssVars.headerDpBg || headerBg)
  const headerDpColor = String(cssVars.headerDpColor || headerText)
  const headerDpBorder = String(cssVars.headerDpBorder || borderColor)
  const headerDpIcon = String(cssVars.headerDpIcon || headerDpColor)
  const headerDpLabel = String(cssVars.headerDpLabel || headerSubtitle)
  const accentSurface = `color-mix(in srgb, ${surfaceBg} 84%, ${primary} 16%)`
  const accentBorder = `color-mix(in srgb, ${borderColor} 60%, ${primary} 40%)`
  const headerDpActiveBg = `color-mix(in srgb, ${headerDpBg} 72%, ${primary} 28%)`
  const headerDpActiveBorder = `color-mix(in srgb, ${headerDpBorder} 55%, ${primary} 45%)`

  return {
    chartScheme,
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
      color: dark ? '#FFFFFF' : primary,
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
      borderRadius: 22,
      border: `1px solid ${borderColor}`,
      backgroundColor: surfaceBg,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    panelCard: {
      padding: 22,
      borderRadius: 24,
      backgroundColor: surfaceBg,
      border: `1px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    panelCardAlt: {
      padding: 22,
      borderRadius: 24,
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
      color: String(cssVars.kpiValueColor || textPrimary),
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
      color: dark ? '#FFFFFF' : primary,
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
