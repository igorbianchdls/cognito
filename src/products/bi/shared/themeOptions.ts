export type ThemeOption = { value: string; label: string };

export const APPS_THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'blue', label: 'Blue' },
  { value: 'dark', label: 'Dark' },
  { value: 'black', label: 'Black' },
  { value: 'slate', label: 'Slate' },
  { value: 'navy', label: 'Navy' },
  { value: 'sand', label: 'Sand' },
  { value: 'charcoal', label: 'Charcoal' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'metro', label: 'Metro' },
  { value: 'aero', label: 'Aero' },
];

export const APPS_HEADER_THEME_OPTIONS: ThemeOption[] = [
  { value: '', label: 'Auto' },
  { value: 'white', label: 'Branco' },
  { value: 'gray', label: 'Cinza Claro' },
  { value: 'purple', label: 'Roxo' },
  { value: 'dark', label: 'Dark' },
  { value: 'blue', label: 'Azul' },
  { value: 'teal', label: 'Teal' },
  { value: 'emerald', label: 'Esmeralda' },
  { value: 'amber', label: 'Âmbar' },
  { value: 'rose', label: 'Rosa' },
  { value: 'slate', label: 'Slate' },
];

export const APPS_COLOR_PRESETS: Record<string, string[]> = {
  sky: ['#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'],
  emerald: ['#34d399', '#10b981', '#059669', '#047857'],
  vibrant: ['#22d3ee', '#a78bfa', '#34d399', '#f59e0b', '#ef4444'],
  category10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'],
  ocean: ['#2563eb', '#0ea5e9', '#06b6d4', '#22d3ee', '#38bdf8', '#7dd3fc'],
  sunset: ['#f97316', '#fb7185', '#f43f5e', '#eab308', '#f59e0b', '#ef4444'],
  forest: ['#166534', '#15803d', '#16a34a', '#65a30d', '#84cc16', '#22c55e'],
  pastel: ['#93c5fd', '#a7f3d0', '#fcd34d', '#fca5a5', '#c4b5fd', '#f9a8d4'],
  neon: ['#00f5d4', '#00bbf9', '#9b5de5', '#f15bb5', '#fee440', '#00f5a0'],
  warm: ['#7c2d12', '#b45309', '#d97706', '#ea580c', '#f97316', '#fb923c'],
  cool: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'],
  monochrome: ['#0f172a', '#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'],
  earth: ['#78350f', '#92400e', '#a16207', '#3f6212', '#365314', '#14532d'],
  berry: ['#be185d', '#db2777', '#e11d48', '#f43f5e', '#fb7185', '#f9a8d4'],
  aurora: ['#22d3ee', '#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fde047'],
  tropical: ['#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#f59e0b', '#f97316'],
};
