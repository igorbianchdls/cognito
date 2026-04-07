'use client'

export type DashboardChartPaletteOption = {
  value: string
  label: string
  colors: string[]
}

export const DASHBOARD_CHART_PALETTE_OPTIONS: DashboardChartPaletteOption[] = [
  { value: 'teal', label: 'Teal', colors: ['#0F766E', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4'] },
  { value: 'blue', label: 'Blue', colors: ['#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'] },
  { value: 'indigo', label: 'Indigo', colors: ['#4338CA', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE'] },
  { value: 'purple', label: 'Purple', colors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'] },
  { value: 'pink', label: 'Pink', colors: ['#BE185D', '#EC4899', '#F472B6', '#F9A8D4', '#FBCFE8'] },
  { value: 'orange', label: 'Orange', colors: ['#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA'] },
  { value: 'amber', label: 'Amber', colors: ['#B45309', '#D97706', '#F59E0B', '#FBBF24', '#FDE68A'] },
  { value: 'red', label: 'Red', colors: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5', '#FECACA'] },
  { value: 'rose', label: 'Rose', colors: ['#BE123C', '#E11D48', '#FB7185', '#FDA4AF', '#FECDD3'] },
  { value: 'lime', label: 'Lime', colors: ['#4D7C0F', '#65A30D', '#84CC16', '#A3E635', '#BEF264'] },
  { value: 'green', label: 'Green', colors: ['#166534', '#16A34A', '#4ADE80', '#86EFAC', '#BBF7D0'] },
  { value: 'emerald', label: 'Emerald', colors: ['#047857', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'] },
  { value: 'cyan', label: 'Cyan', colors: ['#0E7490', '#06B6D4', '#22D3EE', '#67E8F9', '#A5F3FC'] },
  { value: 'slate', label: 'Slate', colors: ['#334155', '#475569', '#64748B', '#94A3B8', '#CBD5E1'] },
  {
    value: 'nivo',
    label: 'Nivo',
    colors: ['#E8C1A0', '#F47560', '#F1E15B', '#E8A838', '#61CDBB', '#97E3D5', '#A4A4A4', '#6B7280'],
  },
  {
    value: 'categorical',
    label: 'Categorical',
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'],
  },
  {
    value: 'tableau',
    label: 'Tableau',
    colors: ['#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F', '#EDC948', '#B07AA1', '#FF9DA7'],
  },
  {
    value: 'pastel',
    label: 'Pastel',
    colors: ['#8DD3C7', '#FFFFB3', '#BEBADA', '#FB8072', '#80B1D3', '#FDB462', '#B3DE69', '#FCCDE5'],
  },
  {
    value: 'sunset',
    label: 'Sunset',
    colors: ['#7C2D12', '#C2410C', '#EA580C', '#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5'],
  },
  {
    value: 'tropical',
    label: 'Tropical',
    colors: ['#0F766E', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#EAB308', '#84CC16'],
  },
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
