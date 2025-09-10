// Background effects utility functions
// Generates SVG patterns for canvas background effects

export type BackgroundEffect = 'none' | 'noise' | 'grain' | 'dots' | 'subtle-texture'
export type EffectSize = 'small' | 'medium' | 'large'

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