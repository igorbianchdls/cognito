'use client'

export type BorderPresetKey = 'suave' | 'acentuada' | 'sem-borda'

export interface BorderStyle {
  type: BorderPresetKey
  color: string
  width: number
  radius: number
  accentColor?: string
  shadow: boolean
  continuousBorder: boolean
}

export interface BorderPreview {
  key: BorderPresetKey
  name: string
  description: string
}

const DEFAULTS: Record<BorderPresetKey, BorderStyle> = {
  'suave': {
    type: 'suave',
    color: '#e5e7eb',
    width: 1,
    radius: 12,
    shadow: true,
    continuousBorder: true,
  },
  'acentuada': {
    type: 'acentuada',
    color: '#e5e7eb',
    width: 0.5,
    radius: 0,
    accentColor: '#bbb',
    shadow: false,
    continuousBorder: true,
  },
  'sem-borda': {
    type: 'sem-borda',
    color: 'transparent',
    width: 0,
    radius: 0,
    shadow: false,
    continuousBorder: false,
  }
}

export class BorderManager {
  static getAvailableBorders(): BorderPreview[] {
    return [
      { key: 'suave', name: 'Suave', description: 'Borda contínua arredondada com sombra opcional' },
      { key: 'acentuada', name: 'Cantos acentuados', description: 'Traços nos cantos + borda contínua leve (sem sombra)' },
      { key: 'sem-borda', name: 'Sem borda', description: 'Sem contorno, sem sombra' },
    ]
  }

  static isValid(key: string): key is BorderPresetKey {
    return key === 'suave' || key === 'acentuada' || key === 'sem-borda'
  }

  static getStyle(
    preset: BorderPresetKey,
    opts?: Partial<Pick<BorderStyle, 'color' | 'width' | 'radius' | 'accentColor' | 'shadow'>>
  ): BorderStyle {
    const base = DEFAULTS[preset]
    return {
      ...base,
      ...(opts?.color ? { color: opts.color } : {}),
      ...(typeof opts?.width === 'number' ? { width: opts.width } : {}),
      ...(typeof opts?.radius === 'number' ? { radius: opts.radius } : {}),
      ...(opts?.accentColor ? { accentColor: opts.accentColor } : {}),
      ...(typeof opts?.shadow === 'boolean' ? { shadow: opts.shadow } : {}),
    }
  }
}

