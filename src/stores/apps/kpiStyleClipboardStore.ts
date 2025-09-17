import { atom, computed } from 'nanostores'
import { $kpiWidgets, kpiActions } from './kpiStore'

// Comprehensive styles interface - all KPI visual properties (excluding alignment)
export interface CommonKPIStyles {
  // Container styles
  kpiContainerBackgroundColor?: string
  kpiContainerBackgroundOpacity?: number
  kpiContainerBorderColor?: string
  kpiContainerBorderOpacity?: number
  kpiContainerBorderWidth?: number
  kpiContainerBorderRadius?: number
  kpiContainerShadow?: boolean
  kpiContainerPadding?: number

  // KPI Value (number display) styles
  kpiValueFontSize?: number
  kpiValueFontWeight?: number
  kpiValueFontFamily?: string
  kpiValueColor?: string
  kpiValueMarginTop?: number
  kpiValueMarginBottom?: number
  kpiValueLetterSpacing?: number
  kpiValueLineHeight?: number

  // KPI Name (label display) styles
  kpiNameFontSize?: number
  kpiNameFontWeight?: number
  kpiNameFontFamily?: string
  kpiNameColor?: string
  kpiNameMarginTop?: number
  kpiNameMarginBottom?: number
  kpiNameLetterSpacing?: number
  kpiNameLineHeight?: number
}

// Style clipboard interface - KPI only
export interface KPIStyleClipboard {
  sourceWidgetId: string
  sourceWidgetType: 'kpi'
  commonStyles: CommonKPIStyles
  timestamp: number
}

// Main clipboard atom
export const $kpiStyleClipboard = atom<KPIStyleClipboard | null>(null)

// Computed for checking if clipboard has styles
export const $hasKPIStylesInClipboard = computed([$kpiStyleClipboard], (clipboard) => {
  return clipboard !== null
})

// Extract styles from KPI
function extractKPIStyles(kpiId: string): CommonKPIStyles | null {
  const kpis = $kpiWidgets.get()
  const kpi = kpis.find(k => k.i === kpiId)
  
  if (!kpi || !kpi.config) return null
  
  return {
    // Container styles
    kpiContainerBackgroundColor: kpi.config.kpiContainerBackgroundColor,
    kpiContainerBackgroundOpacity: kpi.config.kpiContainerBackgroundOpacity,
    kpiContainerBorderColor: kpi.config.kpiContainerBorderColor,
    kpiContainerBorderOpacity: kpi.config.kpiContainerBorderOpacity,
    kpiContainerBorderWidth: kpi.config.kpiContainerBorderWidth,
    kpiContainerBorderRadius: kpi.config.kpiContainerBorderRadius,
    kpiContainerShadow: kpi.config.kpiContainerShadow,
    kpiContainerPadding: kpi.config.kpiContainerPadding,

    // KPI Value styles
    kpiValueFontSize: kpi.config.kpiValueFontSize,
    kpiValueFontWeight: kpi.config.kpiValueFontWeight,
    kpiValueFontFamily: kpi.config.kpiValueFontFamily,
    kpiValueColor: kpi.config.kpiValueColor,
    kpiValueMarginTop: kpi.config.kpiValueMarginTop,
    kpiValueMarginBottom: kpi.config.kpiValueMarginBottom,
    kpiValueLetterSpacing: kpi.config.kpiValueLetterSpacing,
    kpiValueLineHeight: kpi.config.kpiValueLineHeight,

    // KPI Name styles
    kpiNameFontSize: kpi.config.kpiNameFontSize,
    kpiNameFontWeight: kpi.config.kpiNameFontWeight,
    kpiNameFontFamily: kpi.config.kpiNameFontFamily,
    kpiNameColor: kpi.config.kpiNameColor,
    kpiNameMarginTop: kpi.config.kpiNameMarginTop,
    kpiNameMarginBottom: kpi.config.kpiNameMarginBottom,
    kpiNameLetterSpacing: kpi.config.kpiNameLetterSpacing,
    kpiNameLineHeight: kpi.config.kpiNameLineHeight
  }
}

// Apply styles to KPI
function applyKPIStyles(kpiId: string, styles: CommonKPIStyles): void {
  const updates: Record<string, unknown> = {}
  
  // Container styles
  if (styles.kpiContainerBackgroundColor !== undefined) updates.kpiContainerBackgroundColor = styles.kpiContainerBackgroundColor
  if (styles.kpiContainerBackgroundOpacity !== undefined) updates.kpiContainerBackgroundOpacity = styles.kpiContainerBackgroundOpacity
  if (styles.kpiContainerBorderColor !== undefined) updates.kpiContainerBorderColor = styles.kpiContainerBorderColor
  if (styles.kpiContainerBorderOpacity !== undefined) updates.kpiContainerBorderOpacity = styles.kpiContainerBorderOpacity
  if (styles.kpiContainerBorderWidth !== undefined) updates.kpiContainerBorderWidth = styles.kpiContainerBorderWidth
  if (styles.kpiContainerBorderRadius !== undefined) updates.kpiContainerBorderRadius = styles.kpiContainerBorderRadius
  if (styles.kpiContainerShadow !== undefined) updates.kpiContainerShadow = styles.kpiContainerShadow
  if (styles.kpiContainerPadding !== undefined) updates.kpiContainerPadding = styles.kpiContainerPadding

  // KPI Value styles
  if (styles.kpiValueFontSize !== undefined) updates.kpiValueFontSize = styles.kpiValueFontSize
  if (styles.kpiValueFontWeight !== undefined) updates.kpiValueFontWeight = styles.kpiValueFontWeight
  if (styles.kpiValueFontFamily !== undefined) updates.kpiValueFontFamily = styles.kpiValueFontFamily
  if (styles.kpiValueColor !== undefined) updates.kpiValueColor = styles.kpiValueColor
  if (styles.kpiValueMarginTop !== undefined) updates.kpiValueMarginTop = styles.kpiValueMarginTop
  if (styles.kpiValueMarginBottom !== undefined) updates.kpiValueMarginBottom = styles.kpiValueMarginBottom
  if (styles.kpiValueLetterSpacing !== undefined) updates.kpiValueLetterSpacing = styles.kpiValueLetterSpacing
  if (styles.kpiValueLineHeight !== undefined) updates.kpiValueLineHeight = styles.kpiValueLineHeight

  // KPI Name styles
  if (styles.kpiNameFontSize !== undefined) updates.kpiNameFontSize = styles.kpiNameFontSize
  if (styles.kpiNameFontWeight !== undefined) updates.kpiNameFontWeight = styles.kpiNameFontWeight
  if (styles.kpiNameFontFamily !== undefined) updates.kpiNameFontFamily = styles.kpiNameFontFamily
  if (styles.kpiNameColor !== undefined) updates.kpiNameColor = styles.kpiNameColor
  if (styles.kpiNameMarginTop !== undefined) updates.kpiNameMarginTop = styles.kpiNameMarginTop
  if (styles.kpiNameMarginBottom !== undefined) updates.kpiNameMarginBottom = styles.kpiNameMarginBottom
  if (styles.kpiNameLetterSpacing !== undefined) updates.kpiNameLetterSpacing = styles.kpiNameLetterSpacing
  if (styles.kpiNameLineHeight !== undefined) updates.kpiNameLineHeight = styles.kpiNameLineHeight
  
  kpiActions.updateKPIConfig(kpiId, updates)
}

// Main actions - KPI only
export const kpiStyleClipboardActions = {
  copyStyles: (widgetId: string, widgetType: 'kpi') => {
    console.log('🎨 Copying KPI styles from:', widgetId)
    
    const commonStyles = extractKPIStyles(widgetId)
    
    if (commonStyles) {
      $kpiStyleClipboard.set({
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
    const clipboard = $kpiStyleClipboard.get()
    
    if (!clipboard) {
      console.warn('⚠️ No styles in clipboard')
      return
    }
    
    console.log('🎨 Pasting KPI styles to:', targetWidgetId)
    applyKPIStyles(targetWidgetId, clipboard.commonStyles)
    console.log('✅ KPI styles applied successfully')
  },

  clearClipboard: () => {
    console.log('🗑️ Clearing KPI style clipboard')
    $kpiStyleClipboard.set(null)
  }
}