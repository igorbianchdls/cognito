import type React from 'react'

import type { HudFrameConfig } from '@/products/bi/json-render/components/FrameSurface'

export type AnyRecord = Record<string, any>

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
  backdropFilter?: string
  WebkitBackdropFilter?: string
  backgroundImage?: string
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
export type DashboardFilterThemeConfigEntry = {
  labelStyle: React.CSSProperties
  controlStyle: React.CSSProperties
  searchInputStyle: React.CSSProperties
  optionTextStyle: React.CSSProperties
  actionStyle: React.CSSProperties
  applyButtonStyle: React.CSSProperties
  tileSelectedStyle: React.CSSProperties
  tileUnselectedStyle: React.CSSProperties
  dropdownTriggerStyle: React.CSSProperties
  dropdownTriggerOpenStyle: React.CSSProperties
  dropdownValueStyle: React.CSSProperties
  dropdownPlaceholderStyle: React.CSSProperties
  dropdownChevronStyle: React.CSSProperties
  dropdownPopoverStyle: React.CSSProperties
  dropdownPopoverHeaderLabelStyle: React.CSSProperties
  dropdownPopoverHeaderMetaStyle: React.CSSProperties
  dropdownCommandStyle: React.CSSProperties
  dropdownItemStyle: React.CSSProperties
  dropdownItemSelectedStyle: React.CSSProperties
  dropdownIndicatorCheckedStyle: React.CSSProperties
  dropdownIndicatorUncheckedStyle: React.CSSProperties
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

export type DashboardChartAppearanceOverrides = {
  card?: Partial<DashboardCardStyle>
  title?: React.CSSProperties
  graph?: {
    axes?: { x?: AnyRecord; y?: AnyRecord }
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
export type DashboardThemeAppearanceOverrides = { fontFamily?: string }
export type DashboardAppearanceOverrides = {
  chart?: DashboardChartAppearanceOverrides
  header?: DashboardHeaderAppearanceOverrides
  kpi?: DashboardKpiAppearanceOverrides
  theme?: DashboardThemeAppearanceOverrides
}
export type DashboardThemeSelection = {
  appearanceOverrides?: DashboardAppearanceOverrides
  themeName: string
  chartPaletteName?: string
  borderPreset?: string
}
export type DashboardKpiTheme = {
  compare: { style: React.CSSProperties }
  descriptionStyle: React.CSSProperties
  style: React.CSSProperties
  titleStyle: React.CSSProperties
  valueStyle: React.CSSProperties
}
export type DashboardHeaderTheme = {
  card: React.CSSProperties
  eyebrow: React.CSSProperties
  subtitle: React.CSSProperties
  title: React.CSSProperties
}
export type DashboardPageTheme = { shell: React.CSSProperties }
