'use client'

export type BorderPresetKey =
  | 'suave'
  | 'acentuada'
  | 'sem-borda'
  | 'suave-tracejada'
  | 'pontilhada-minimal'
  | 'cartao-elevado'
  | 'linha-inferior'
  | 'cantos-uniformes'
  | 'cantos-coloridos'

export interface BorderStyle {
  type: BorderPresetKey
  color: string
  width: number
  radius: number
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  sides?: 'all' | 'bottom'
  accentColor?: string
  shadow: boolean
  continuousBorder: boolean
  // Optional corner highlight configuration (for HUD-like corners without glow)
  cornerColor?: string
  cornerLength?: number // px
  cornerThickness?: number // px
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
    borderStyle: 'solid',
    sides: 'all',
    shadow: true,
    continuousBorder: true,
  },
  'acentuada': {
    type: 'acentuada',
    color: '#e5e7eb',
    width: 0.5,
    radius: 0,
    borderStyle: 'solid',
    sides: 'all',
    accentColor: '#bbb',
    shadow: false,
    continuousBorder: true,
  },
  'sem-borda': {
    type: 'sem-borda',
    color: 'transparent',
    width: 0,
    radius: 0,
    borderStyle: 'solid',
    sides: 'all',
    shadow: false,
    continuousBorder: false,
  },
  'suave-tracejada': {
    type: 'suave-tracejada',
    color: '#e5e7eb',
    width: 1,
    radius: 12,
    borderStyle: 'dashed',
    sides: 'all',
    shadow: false,
    continuousBorder: true,
  },
  'pontilhada-minimal': {
    type: 'pontilhada-minimal',
    color: '#d1d5db',
    width: 1,
    radius: 8,
    borderStyle: 'dotted',
    sides: 'all',
    shadow: false,
    continuousBorder: true,
  },
  'cartao-elevado': {
    type: 'cartao-elevado',
    color: 'transparent',
    width: 0,
    radius: 12,
    borderStyle: 'solid',
    sides: 'all',
    shadow: true,
    continuousBorder: false,
  },
  'linha-inferior': {
    type: 'linha-inferior',
    color: '#e5e7eb',
    width: 1,
    radius: 0,
    borderStyle: 'solid',
    sides: 'bottom',
    shadow: false,
    continuousBorder: false,
  },
  'cantos-coloridos': {
    type: 'cantos-coloridos',
    color: '#e5e7eb',
    width: 1,
    radius: 12,
    borderStyle: 'solid',
    sides: 'all',
    shadow: false,
    continuousBorder: true,
    cornerColor: '#3b82f6',
    cornerLength: 12,
    cornerThickness: 2,
  },
  'cantos-uniformes': {
    type: 'cantos-uniformes',
    color: '#e5e7eb', // base (borda clara)
    width: 0,         // desenhado via background-image (sem border real)
    radius: 12,
    borderStyle: 'solid',
    sides: 'all',
    shadow: false,
    continuousBorder: true,
    cornerColor: '#d1d5db', // cantos levemente mais escuros
    cornerLength: 12,
    cornerThickness: 1,
  }
}

export class BorderManager {
  static getAvailableBorders(): BorderPreview[] {
    return [
      { key: 'suave', name: 'Suave', description: 'Borda contínua arredondada com sombra opcional' },
      { key: 'acentuada', name: 'Cantos acentuados', description: 'Traços nos cantos + borda contínua leve (sem sombra)' },
      { key: 'sem-borda', name: 'Sem borda', description: 'Sem contorno, sem sombra' },
      { key: 'suave-tracejada', name: 'Suave Tracejada', description: 'Borda tracejada arredondada, leve' },
      { key: 'pontilhada-minimal', name: 'Pontilhada Minimal', description: 'Borda pontilhada sutil' },
      { key: 'cartao-elevado', name: 'Cartão Elevado', description: 'Sem borda, canto arredondado e sombra leve' },
      { key: 'linha-inferior', name: 'Linha inferior', description: 'Apenas linha na parte de baixo' },
      { key: 'cantos-coloridos', name: 'Cantos Coloridos', description: 'Cantoneiras nos quatro cantos com borda base' },
      { key: 'cantos-uniformes', name: 'Cantos Uniformes', description: 'Borda clara com cantos discretamente mais escuros' },
    ]
  }

  static isValid(key: string): key is BorderPresetKey {
    return (
      key === 'suave' ||
      key === 'acentuada' ||
      key === 'sem-borda' ||
      key === 'suave-tracejada' ||
      key === 'pontilhada-minimal' ||
      key === 'cartao-elevado' ||
      key === 'linha-inferior' ||
      key === 'cantos-coloridos' ||
      key === 'cantos-uniformes'
    )
  }

  static getStyle(
    preset: BorderPresetKey,
    opts?: Partial<Pick<BorderStyle, 'color' | 'width' | 'radius' | 'accentColor' | 'shadow' | 'borderStyle' | 'sides' | 'cornerColor' | 'cornerLength' | 'cornerThickness'>>
  ): BorderStyle {
    const base = DEFAULTS[preset]
    return {
      ...base,
      ...(opts?.color ? { color: opts.color } : {}),
      ...(typeof opts?.width === 'number' ? { width: opts.width } : {}),
      ...(typeof opts?.radius === 'number' ? { radius: opts.radius } : {}),
      ...(opts?.accentColor ? { accentColor: opts.accentColor } : {}),
      ...(typeof opts?.shadow === 'boolean' ? { shadow: opts.shadow } : {}),
      ...(opts?.borderStyle ? { borderStyle: opts.borderStyle } : {}),
      ...(opts?.sides ? { sides: opts.sides } : {}),
      ...(opts?.cornerColor ? { cornerColor: opts.cornerColor } : {}),
      ...(typeof opts?.cornerLength === 'number' ? { cornerLength: opts.cornerLength } : {}),
      ...(typeof opts?.cornerThickness === 'number' ? { cornerThickness: opts.cornerThickness } : {}),
    }
  }
}
