export const DASHBOARD_CHART_PALETTES = {
  teal: ["#0F766E","#14B8A6","#2DD4BF","#5EEAD4","#99F6E4"],
  blue: ["#1D4ED8","#3B82F6","#60A5FA","#93C5FD","#BFDBFE"],
  purple: ["#7C3AED","#8B5CF6","#A78BFA","#C4B5FD","#DDD6FE"],
  orange: ["#EA580C","#F97316","#FB923C","#FDBA74","#FED7AA"],
  red: ["#DC2626","#EF4444","#F87171","#FCA5A5","#FECACA"],
  lime: ["#4D7C0F","#65A30D","#84CC16","#A3E635","#BEF264"],
} as const

export const DASHBOARD_CHART_PALETTE_OPTIONS = [
  { value: 'teal', label: 'Teal', colors: DASHBOARD_CHART_PALETTES.teal },
  { value: 'blue', label: 'Blue', colors: DASHBOARD_CHART_PALETTES.blue },
  { value: 'purple', label: 'Purple', colors: DASHBOARD_CHART_PALETTES.purple },
  { value: 'orange', label: 'Orange', colors: DASHBOARD_CHART_PALETTES.orange },
  { value: 'red', label: 'Red', colors: DASHBOARD_CHART_PALETTES.red },
  { value: 'lime', label: 'Lime', colors: DASHBOARD_CHART_PALETTES.lime },
] as const
