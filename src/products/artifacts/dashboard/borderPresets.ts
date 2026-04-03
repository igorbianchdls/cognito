'use client'

export type DashboardBorderPreset =
  | 'theme_default'
  | 'hud_compact'
  | 'hud_bold'
  | 'rounded_minimal'
  | 'rounded_soft'
  | 'straight_clean'

export type DashboardBorderPresetOption = {
  value: DashboardBorderPreset
  label: string
  description: string
}

export const DASHBOARD_BORDER_PRESET_OPTIONS: DashboardBorderPresetOption[] = [
  { value: 'theme_default', label: 'HUD padrão', description: 'Usa a moldura padrão do tema atual.' },
  { value: 'hud_compact', label: 'HUD compacto', description: 'Mantém a moldura SVG com cantos menores.' },
  { value: 'hud_bold', label: 'HUD forte', description: 'Mantém a moldura SVG com cantos mais fortes.' },
  { value: 'rounded_minimal', label: 'Arredondado', description: 'Remove a moldura SVG e usa raio amplo.' },
  { value: 'rounded_soft', label: 'Arredondado suave', description: 'Remove a moldura SVG e usa raio médio.' },
  { value: 'straight_clean', label: 'Reto clean', description: 'Remove a moldura SVG e zera o raio dos cards.' },
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
    case 'rounded_soft':
    case 'straight_clean':
      return null
    case 'hud_compact':
      return { variant: 'hud', cornerSize: 6, cornerWidth: 1 }
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
    case 'rounded_soft':
      return 16
    case 'straight_clean':
      return 0
    case 'hud_compact':
      return 0
    case 'hud_bold':
      return 0
    case 'theme_default':
    default:
      return fallback
  }
}
