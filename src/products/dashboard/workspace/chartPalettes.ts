'use client'

export type DashboardChartPaletteOption = {
  value: string
  label: string
  colors: string[]
}

export const DASHBOARD_CHART_PALETTE_OPTIONS: DashboardChartPaletteOption[] = [
  { value: 'teal', label: 'Teal', colors: ['#0F766E', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'] },
  { value: 'blue', label: 'Blue', colors: ['#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'] },
  { value: 'purple', label: 'Purple', colors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'] },
  { value: 'orange', label: 'Orange', colors: ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'] },
  { value: 'red', label: 'Red', colors: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'] },
  { value: 'lime', label: 'Lime', colors: ['#4D7C0F', '#65A30D', '#84CC16', '#A3E635', '#BEF264'] },
]

export function getDashboardChartPaletteValueFromColors(colors: string[]) {
  const normalized = JSON.stringify(colors || [])
  const matched = DASHBOARD_CHART_PALETTE_OPTIONS.find((option) => JSON.stringify(option.colors) === normalized)
  return matched?.value || DASHBOARD_CHART_PALETTE_OPTIONS[0].value
}

export function buildDashboardChartColorsFileSource() {
  const paletteObjectSource = DASHBOARD_CHART_PALETTE_OPTIONS.map(
    (option) => `  ${option.value}: ${JSON.stringify(option.colors)},`,
  ).join('\n')

  const optionsSource = DASHBOARD_CHART_PALETTE_OPTIONS.map(
    (option) => `  { value: '${option.value}', label: '${option.label}', colors: DASHBOARD_CHART_PALETTES.${option.value} },`,
  ).join('\n')

  return `export const DASHBOARD_CHART_PALETTES = {
${paletteObjectSource}
} as const

export const DASHBOARD_CHART_PALETTE_OPTIONS = [
${optionsSource}
] as const
`
}
