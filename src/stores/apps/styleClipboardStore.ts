import { atom, computed } from 'nanostores'
import { $kpiWidgets, kpiActions } from './kpiStore'

// Comprehensive styles interface - all KPI visual properties (excluding alignment)
export interface CommonStyles {
  // Card styles
  backgroundColor?: string
  backgroundOpacity?: number
  borderColor?: string
  borderOpacity?: number
  borderWidth?: number
  borderRadius?: number
  shadow?: boolean
  padding?: number
  
  // Value/Título (Valor Principal) styles
  valueFontSize?: number
  valueFontWeight?: number
  valueFontFamily?: string
  valueColor?: string
  titleMarginTop?: number
  titleMarginBottom?: number
  titleLetterSpacing?: number
  titleLineHeight?: number
  
  // Name/Subtítulo (Nome/Label) styles
  nameFontSize?: number
  nameFontWeight?: number
  nameFontFamily?: string
  nameColor?: string
  subtitleMarginTop?: number
  subtitleMarginBottom?: number
  subtitleLetterSpacing?: number
  subtitleLineHeight?: number
}

// Style clipboard interface - KPI only
export interface StyleClipboard {
  sourceWidgetId: string
  sourceWidgetType: 'kpi'
  commonStyles: CommonStyles
  timestamp: number
}

// Main clipboard atom
export const $styleClipboard = atom<StyleClipboard | null>(null)

// Computed for checking if clipboard has styles
export const $hasStylesInClipboard = computed([$styleClipboard], (clipboard) => {
  return clipboard !== null
})

// Extract styles from KPI
function extractKPIStyles(kpiId: string): CommonStyles | null {
  const kpis = $kpiWidgets.get()
  const kpi = kpis.find(k => k.i === kpiId)
  
  if (!kpi || !kpi.config) return null
  
  return {
    // Card styles
    backgroundColor: kpi.config.backgroundColor,
    backgroundOpacity: kpi.config.backgroundOpacity,
    borderColor: kpi.config.borderColor,
    borderOpacity: kpi.config.borderOpacity,
    borderWidth: kpi.config.borderWidth,
    borderRadius: kpi.config.borderRadius,
    shadow: kpi.config.shadow,
    padding: kpi.config.padding,
    
    // Value/Título styles
    valueFontSize: kpi.config.valueFontSize,
    valueFontWeight: kpi.config.valueFontWeight,
    valueFontFamily: kpi.config.valueFontFamily,
    valueColor: kpi.config.valueColor,
    titleMarginTop: kpi.config.titleMarginTop,
    titleMarginBottom: kpi.config.titleMarginBottom,
    titleLetterSpacing: kpi.config.titleLetterSpacing,
    titleLineHeight: kpi.config.titleLineHeight,
    
    // Name/Subtítulo styles
    nameFontSize: kpi.config.nameFontSize,
    nameFontWeight: kpi.config.nameFontWeight,
    nameFontFamily: kpi.config.nameFontFamily,
    nameColor: kpi.config.nameColor,
    subtitleMarginTop: kpi.config.subtitleMarginTop,
    subtitleMarginBottom: kpi.config.subtitleMarginBottom,
    subtitleLetterSpacing: kpi.config.subtitleLetterSpacing,
    subtitleLineHeight: kpi.config.subtitleLineHeight
  }
}

// Apply styles to KPI
function applyKPIStyles(kpiId: string, styles: CommonStyles): void {
  const updates: Record<string, unknown> = {}
  
  // Card styles
  if (styles.backgroundColor !== undefined) updates.backgroundColor = styles.backgroundColor
  if (styles.backgroundOpacity !== undefined) updates.backgroundOpacity = styles.backgroundOpacity
  if (styles.borderColor !== undefined) updates.borderColor = styles.borderColor
  if (styles.borderOpacity !== undefined) updates.borderOpacity = styles.borderOpacity
  if (styles.borderWidth !== undefined) updates.borderWidth = styles.borderWidth
  if (styles.borderRadius !== undefined) updates.borderRadius = styles.borderRadius
  if (styles.shadow !== undefined) updates.shadow = styles.shadow
  if (styles.padding !== undefined) updates.padding = styles.padding
  
  // Value/Título styles
  if (styles.valueFontSize !== undefined) updates.valueFontSize = styles.valueFontSize
  if (styles.valueFontWeight !== undefined) updates.valueFontWeight = styles.valueFontWeight
  if (styles.valueFontFamily !== undefined) updates.valueFontFamily = styles.valueFontFamily
  if (styles.valueColor !== undefined) updates.valueColor = styles.valueColor
  if (styles.titleMarginTop !== undefined) updates.titleMarginTop = styles.titleMarginTop
  if (styles.titleMarginBottom !== undefined) updates.titleMarginBottom = styles.titleMarginBottom
  if (styles.titleLetterSpacing !== undefined) updates.titleLetterSpacing = styles.titleLetterSpacing
  if (styles.titleLineHeight !== undefined) updates.titleLineHeight = styles.titleLineHeight
  
  // Name/Subtítulo styles
  if (styles.nameFontSize !== undefined) updates.nameFontSize = styles.nameFontSize
  if (styles.nameFontWeight !== undefined) updates.nameFontWeight = styles.nameFontWeight
  if (styles.nameFontFamily !== undefined) updates.nameFontFamily = styles.nameFontFamily
  if (styles.nameColor !== undefined) updates.nameColor = styles.nameColor
  if (styles.subtitleMarginTop !== undefined) updates.subtitleMarginTop = styles.subtitleMarginTop
  if (styles.subtitleMarginBottom !== undefined) updates.subtitleMarginBottom = styles.subtitleMarginBottom
  if (styles.subtitleLetterSpacing !== undefined) updates.subtitleLetterSpacing = styles.subtitleLetterSpacing
  if (styles.subtitleLineHeight !== undefined) updates.subtitleLineHeight = styles.subtitleLineHeight
  
  kpiActions.updateKPIConfig(kpiId, updates)
}

// Main actions - KPI only
export const styleClipboardActions = {
  copyStyles: (widgetId: string, widgetType: 'kpi') => {
    console.log('🎨 Copying KPI styles from:', widgetId)
    
    const commonStyles = extractKPIStyles(widgetId)
    
    if (commonStyles) {
      $styleClipboard.set({
        sourceWidgetId: widgetId,
        sourceWidgetType: 'kpi',
        commonStyles,
        timestamp: Date.now()
      })
      console.log('✅ KPI styles copied to clipboard:', commonStyles)
    } else {
      console.warn('⚠️ Could not extract styles from KPI:', widgetId)
    }
  },

  pasteStyles: (targetWidgetId: string, targetWidgetType: 'kpi') => {
    const clipboard = $styleClipboard.get()
    
    if (!clipboard) {
      console.warn('⚠️ No styles in clipboard')
      return
    }
    
    console.log('🎨 Pasting KPI styles to:', targetWidgetId)
    applyKPIStyles(targetWidgetId, clipboard.commonStyles)
    console.log('✅ KPI styles applied successfully')
  },

  clearClipboard: () => {
    console.log('🗑️ Clearing style clipboard')
    $styleClipboard.set(null)
  }
}