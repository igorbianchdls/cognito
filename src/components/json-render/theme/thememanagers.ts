export type AnyRecord = Record<string, any>

// Normalize numeric -> px/em for fontSize/letterSpacing/padding
function toPx(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === 'number') return `${v}px`
  const s = String(v)
  if (/^\d+(\.\d+)?$/.test(s)) return `${Number(s)}px`
  return s
}
function toEm(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === 'number') return `${v}em`
  const s = String(v)
  if (/^-?\d+(\.\d+)?$/.test(s)) return `${Number(s)}em`
  return s
}

export function mapManagersToCssVars(managers: AnyRecord | undefined): Record<string, string> {
  const cssVars: Record<string, string> = {}
  const m = (managers && typeof managers === 'object') ? managers as AnyRecord : {}

  // Global font
  if (typeof m.font === 'string' && m.font) cssVars.fontFamily = m.font

  // Border style for containers
  if (m.border && typeof m.border === 'object') {
    const b = m.border as AnyRecord
    if (b.style) cssVars.containerBorderStyle = String(b.style)
    if (b.width !== undefined) cssVars.containerBorderWidth = String(b.width)
    if (b.color) cssVars.containerBorderColor = String(b.color)
    if (b.radius !== undefined) cssVars.containerRadius = String(b.radius)
    if (b.shadow) cssVars.containerShadow = String(b.shadow)
  }

  // Chart color scheme
  if (m.color && Array.isArray(m.color.scheme)) cssVars.chartColorScheme = JSON.stringify(m.color.scheme)

  // Backgrounds
  if (typeof m.background === 'string' && m.background) cssVars.bg = m.background
  if (typeof m.surface === 'string' && m.surface) cssVars.surfaceBg = m.surface

  // H1 (titles)
  if (m.h1 && typeof m.h1 === 'object') {
    const h = m.h1 as AnyRecord
    if (h.color) cssVars.h1Color = String(h.color)
    if (h.weight !== undefined) cssVars.h1FontWeight = String(h.weight)
    if (h.size !== undefined) cssVars.h1FontSize = String(h.size)
    if (h.font) cssVars.h1FontFamily = String(h.font)
    if (h.letterSpacing !== undefined) cssVars.h1LetterSpacing = String(h.letterSpacing)
    if (h.padding !== undefined) cssVars.h1Padding = String(h.padding)
  }

  // KPI styles (title/value)
  if (m.kpi && typeof m.kpi === 'object') {
    const k = m.kpi as AnyRecord
    const t = (k.title && typeof k.title === 'object') ? k.title as AnyRecord : {}
    const v = (k.value && typeof k.value === 'object') ? k.value as AnyRecord : {}
    if (t.font) cssVars.kpiTitleFontFamily = String(t.font)
    if (t.weight !== undefined) cssVars.kpiTitleFontWeight = String(t.weight)
    if (t.color) cssVars.kpiTitleColor = String(t.color)
    if (t.letterSpacing !== undefined) cssVars.kpiTitleLetterSpacing = String(t.letterSpacing)
    if (t.padding !== undefined) cssVars.kpiTitlePadding = String(t.padding)
    if (v.font) cssVars.kpiValueFontFamily = String(v.font)
    if (v.weight !== undefined) cssVars.kpiValueFontWeight = String(v.weight)
    if (v.color) cssVars.kpiValueColor = String(v.color)
    if (v.letterSpacing !== undefined) cssVars.kpiValueLetterSpacing = String(v.letterSpacing)
    if (v.padding !== undefined) cssVars.kpiValuePadding = String(v.padding)
  }

  return cssVars
}

