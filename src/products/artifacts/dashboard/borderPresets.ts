'use client'

export type DashboardBorderPreset = 'theme_default' | 'rounded_minimal' | 'hud_bold'

export type DashboardBorderPresetOption = {
  value: DashboardBorderPreset
  label: string
  description: string
}

export const DASHBOARD_BORDER_PRESET_OPTIONS: DashboardBorderPresetOption[] = [
  { value: 'theme_default', label: 'Padrão do tema', description: 'Usa a moldura padrão do tema atual.' },
  { value: 'rounded_minimal', label: 'Arredondado', description: 'Remove a moldura SVG e usa cantos arredondados.' },
  { value: 'hud_bold', label: 'HUD forte', description: 'Mantém a moldura SVG com cantos mais fortes.' },
]

export type DashboardCardFrame =
  | {
      variant: 'hud'
      cornerSize: number
      cornerWidth: number
    }
  | null

export function resolveDashboardBorderFramePreset(
  preset: string | null | undefined,
  fallback: DashboardCardFrame,
): DashboardCardFrame {
  switch (String(preset || '').trim()) {
    case 'rounded_minimal':
      return null
    case 'hud_bold':
      return { variant: 'hud', cornerSize: 10, cornerWidth: 2 }
    case 'theme_default':
    default:
      return fallback
  }
}

export function resolveDashboardBorderRadiusPreset(
  preset: string | null | undefined,
  fallback: number,
) {
  switch (String(preset || '').trim()) {
    case 'rounded_minimal':
      return 24
    case 'hud_bold':
      return 0
    case 'theme_default':
    default:
      return fallback
  }
}
