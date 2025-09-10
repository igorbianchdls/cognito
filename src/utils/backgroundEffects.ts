// Background effects utility functions
// Generates SVG patterns, gradients, and CSS filters for canvas background effects

export type BackgroundEffect = 'none' | 'noise' | 'grain' | 'dots' | 'subtle-texture'
export type EffectSize = 'small' | 'medium' | 'large'
export type GradientType = 'linear' | 'radial' | 'conic'
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color-dodge' | 'color-burn' | 'darken' | 'lighten'

/**
 * Generate SVG pattern for background effects
 */
export function generateEffectPattern(effect: BackgroundEffect, size: EffectSize = 'medium'): string {
  if (effect === 'none') return ''
  
  const sizeMap = {
    small: { scale: 0.5, density: 0.6 },
    medium: { scale: 1, density: 0.9 },
    large: { scale: 1.5, density: 1.2 }
  }
  
  const { scale, density } = sizeMap[size]
  
  switch (effect) {
    case 'noise':
      return generateNoisePattern(scale, density)
    case 'grain':
      return generateGrainPattern(scale, density)
    case 'dots':
      return generateDotsPattern(scale, density)
    case 'subtle-texture':
      return generateSubtleTexturePattern(scale, density)
    default:
      return ''
  }
}

/**
 * Generate noise pattern using SVG turbulence filter
 */
function generateNoisePattern(scale: number, density: number): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
      <defs>
        <filter id="noise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence baseFrequency="${density}" numOctaves="4" result="noise"/>
          <feColorMatrix in="noise" type="saturate" values="0"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="black" filter="url(#noise)"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Generate grain pattern using small random circles
 */
function generateGrainPattern(scale: number, density: number): string {
  const size = 100 * scale
  const numDots = Math.floor(density * 50)
  
  let circles = ''
  for (let i = 0; i < numDots; i++) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = Math.random() * 0.5 + 0.2
    circles += `<circle cx="${x}" cy="${y}" r="${r}" fill="black" opacity="${Math.random() * 0.3 + 0.1}"/>`
  }
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${circles}
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Generate dots pattern
 */
function generateDotsPattern(scale: number, density: number): string {
  const spacing = 20 / density
  const dotSize = 1 * scale
  
  let dots = ''
  for (let x = 0; x < 100; x += spacing) {
    for (let y = 0; y < 100; y += spacing) {
      dots += `<circle cx="${x}" cy="${y}" r="${dotSize}" fill="black" opacity="0.2"/>`
    }
  }
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      ${dots}
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Generate subtle texture pattern
 */
function generateSubtleTexturePattern(scale: number, density: number): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
      <defs>
        <filter id="texture">
          <feTurbulence baseFrequency="${density * 0.5}" numOctaves="2" result="texture"/>
          <feColorMatrix in="texture" type="saturate" values="0"/>
          <feOpacity in="SourceGraphic" values="0.1"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="black" filter="url(#texture)"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Generate CSS gradient string
 */
export function generateGradient(
  type: GradientType,
  colors: string[],
  direction: number = 45,
  stops: number[] = []
): string {
  if (colors.length < 2) return ''
  
  // Ensure we have stops for each color
  const colorStops = colors.map((color, index) => {
    const stop = stops[index] !== undefined ? stops[index] : (index / (colors.length - 1)) * 100
    return `${color} ${stop}%`
  })
  
  switch (type) {
    case 'linear':
      return `linear-gradient(${direction}deg, ${colorStops.join(', ')})`
    case 'radial':
      return `radial-gradient(circle, ${colorStops.join(', ')})`
    case 'conic':
      return `conic-gradient(from ${direction}deg, ${colorStops.join(', ')})`
    default:
      return ''
  }
}

/**
 * Generate CSS filter string
 */
export function generateCSSFilters(filters: {
  blur?: number
  brightness?: number
  contrast?: number
  saturate?: number
  hueRotate?: number
  sepia?: number
}): string {
  const filterParts: string[] = []
  
  if (filters.blur && filters.blur > 0) {
    filterParts.push(`blur(${filters.blur}px)`)
  }
  
  if (filters.brightness && filters.brightness !== 100) {
    filterParts.push(`brightness(${filters.brightness}%)`)
  }
  
  if (filters.contrast && filters.contrast !== 100) {
    filterParts.push(`contrast(${filters.contrast}%)`)
  }
  
  if (filters.saturate && filters.saturate !== 100) {
    filterParts.push(`saturate(${filters.saturate}%)`)
  }
  
  if (filters.hueRotate && filters.hueRotate !== 0) {
    filterParts.push(`hue-rotate(${filters.hueRotate}deg)`)
  }
  
  if (filters.sepia && filters.sepia > 0) {
    filterParts.push(`sepia(${filters.sepia}%)`)
  }
  
  return filterParts.length > 0 ? filterParts.join(' ') : 'none'
}

/**
 * Get blend mode display name
 */
export function getBlendModeDisplayName(mode: BlendMode): string {
  const names: Record<BlendMode, string> = {
    'normal': 'Normal',
    'multiply': 'Multiplicar',
    'screen': 'Clarear',
    'overlay': 'Sobrepor',
    'soft-light': 'Luz Suave',
    'hard-light': 'Luz Forte',
    'color-dodge': 'Subexposição',
    'color-burn': 'Superexposição',
    'darken': 'Escurecer',
    'lighten': 'Clarear'
  }
  return names[mode] || mode
}