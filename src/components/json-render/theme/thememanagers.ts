export type AnyRecord = Record<string, any>

export type H1Manager = {
  color?: string
  weight?: string | number
  size?: string | number
  font?: string
  letterSpacing?: string | number
  padding?: string | number
}

export type KpiTextManager = {
  font?: string
  weight?: string | number
  color?: string
  letterSpacing?: string | number
  padding?: string | number
}

export type SlicerTextManager = {
  font?: string
  weight?: string | number
  size?: string | number
  color?: string
  letterSpacing?: string | number
  padding?: string | number
}

export type BorderManager = {
  style?: 'none' | 'solid' | 'dashed' | 'dotted'
  width?: string | number
  color?: string
  radius?: string | number
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export type ColorManager = {
  scheme?: string[]
}

export type Managers = {
  font?: string
  border?: BorderManager
  color?: ColorManager
  background?: string
  surface?: string
  h1?: H1Manager
  kpi?: {
    title?: KpiTextManager
    value?: KpiTextManager
  }
  slicer?: {
    label?: SlicerTextManager
    option?: SlicerTextManager
  }
  datePicker?: {
    label?: SlicerTextManager
    field?: {
      font?: string
      size?: string | number
      color?: string
      background?: string
      borderColor?: string
      borderWidth?: string | number
      radius?: string | number
      paddingX?: string | number
      paddingY?: string | number
      hoverBg?: string
      focusBorderColor?: string
      placeholderColor?: string
      disabledOpacity?: string | number
    }
    icon?: {
      color?: string
      background?: string
      size?: string | number
      padding?: string | number
      radius?: string | number
      position?: 'left' | 'right'
    }
  }
}

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

export function mapManagersToCssVars(managers: Managers | undefined): Record<string, string> {
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

  // Slicer (label/option)
  if (m.slicer && typeof m.slicer === 'object') {
    const s = m.slicer as AnyRecord
    const l = (s.label && typeof s.label === 'object') ? s.label as AnyRecord : {}
    const o = (s.option && typeof s.option === 'object') ? s.option as AnyRecord : {}
    if (l.font) cssVars.slicerLabelFontFamily = String(l.font)
    if (l.weight !== undefined) cssVars.slicerLabelFontWeight = String(l.weight)
    if (l.size !== undefined) cssVars.slicerLabelFontSize = String(l.size)
    if (l.color) cssVars.slicerLabelColor = String(l.color)
    if (l.letterSpacing !== undefined) cssVars.slicerLabelLetterSpacing = String(l.letterSpacing)
    if (l.padding !== undefined) cssVars.slicerLabelPadding = String(l.padding)
    if (o.font) cssVars.slicerOptionFontFamily = String(o.font)
    if (o.weight !== undefined) cssVars.slicerOptionFontWeight = String(o.weight)
    if (o.size !== undefined) cssVars.slicerOptionFontSize = String(o.size)
    if (o.color) cssVars.slicerOptionColor = String(o.color)
    if (o.letterSpacing !== undefined) cssVars.slicerOptionLetterSpacing = String(o.letterSpacing)
    if (o.padding !== undefined) cssVars.slicerOptionPadding = String(o.padding)
  }

  // DatePicker
  if (m.datePicker && typeof m.datePicker === 'object') {
    const d = m.datePicker as AnyRecord
    const l = (d.label && typeof d.label === 'object') ? d.label as AnyRecord : {}
    const f = (d.field && typeof d.field === 'object') ? d.field as AnyRecord : {}
    const i = (d.icon && typeof d.icon === 'object') ? d.icon as AnyRecord : {}
    // Label
    if (l.font) cssVars.dpLabelFontFamily = String(l.font)
    if (l.weight !== undefined) cssVars.dpLabelFontWeight = String(l.weight)
    if (l.size !== undefined) cssVars.dpLabelFontSize = String(l.size)
    if (l.color) cssVars.dpLabelColor = String(l.color)
    if (l.letterSpacing !== undefined) cssVars.dpLabelLetterSpacing = String(l.letterSpacing)
    if (l.padding !== undefined) cssVars.dpLabelPadding = String(l.padding)
    // Field
    if (f.font) cssVars.dpFontFamily = String(f.font)
    if (f.size !== undefined) cssVars.dpFontSize = String(f.size)
    if (f.color) cssVars.dpColor = String(f.color)
    if (f.background) cssVars.dpBg = String(f.background)
    if (f.borderColor) cssVars.dpBorderColor = String(f.borderColor)
    if (f.borderWidth !== undefined) cssVars.dpBorderWidth = String(f.borderWidth)
    if (f.radius !== undefined) cssVars.dpRadius = String(f.radius)
    if (f.paddingX !== undefined) cssVars.dpPx = String(f.paddingX)
    if (f.paddingY !== undefined) cssVars.dpPy = String(f.paddingY)
    if (f.hoverBg) cssVars.dpHoverBg = String(f.hoverBg)
    if (f.focusBorderColor) cssVars.dpFocusBorder = String(f.focusBorderColor)
    if (f.placeholderColor) cssVars.dpPlaceholder = String(f.placeholderColor)
    if (f.disabledOpacity !== undefined) cssVars.dpDisabledOpacity = String(f.disabledOpacity)
    // Icon
    if (i.color) cssVars.dpIconColor = String(i.color)
    if (i.background) cssVars.dpIconBg = String(i.background)
    if (i.size !== undefined) cssVars.dpIconSize = String(i.size)
    if (i.padding !== undefined) cssVars.dpIconPadding = String(i.padding)
    if (i.radius !== undefined) cssVars.dpIconRadius = String(i.radius)
    if (i.position) cssVars.dpIconPosition = String(i.position)
  }

  return cssVars
}
