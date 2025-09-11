import { atom, computed } from 'nanostores'
import { $kpiWidgets, kpiActions } from './kpiStore'

// Simple styles interface - only KPI visual properties
export interface CommonStyles {
  // Container styles
  backgroundColor?: string
  borderColor?: string
  borderRadius?: number
  borderWidth?: number
  
  // Typography styles (KPI title)
  titleColor?: string      // maps to nameColor
  titleFontSize?: number   // maps to nameFontSize
  titleFontWeight?: number // maps to nameFontWeight
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
    backgroundColor: kpi.config.backgroundColor,
    borderColor: kpi.config.borderColor,
    borderRadius: kpi.config.borderRadius,
    borderWidth: kpi.config.borderWidth,
    titleColor: kpi.config.nameColor,
    titleFontSize: kpi.config.nameFontSize,
    titleFontWeight: kpi.config.nameFontWeight
  }
}

// Apply styles to KPI
function applyKPIStyles(kpiId: string, styles: CommonStyles): void {
  const updates: Record<string, unknown> = {}
  
  if (styles.backgroundColor !== undefined) updates.backgroundColor = styles.backgroundColor
  if (styles.borderColor !== undefined) updates.borderColor = styles.borderColor
  if (styles.borderRadius !== undefined) updates.borderRadius = styles.borderRadius
  if (styles.borderWidth !== undefined) updates.borderWidth = styles.borderWidth
  if (styles.titleColor !== undefined) updates.nameColor = styles.titleColor
  if (styles.titleFontSize !== undefined) updates.nameFontSize = styles.titleFontSize
  if (styles.titleFontWeight !== undefined) updates.nameFontWeight = styles.titleFontWeight
  
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