import { atom, computed } from 'nanostores'
import { $tableWidgets, tableActions, type TableWidget } from './tableStore'
import type { TableConfig } from '@/types/apps/tableWidgets'

// Union type for table widget types
type TableStyleClipboard = {
  sourceWidgetType: 'table'
  sourceWidgetId: string
  commonStyles: CommonTableStyles
  timestamp: number
} | null

// Comprehensive table styles interface - all table visual properties
export interface CommonTableStyles {
  // Header styles
  headerBackground?: string
  headerTextColor?: string
  headerFontSize?: number
  headerFontFamily?: string
  headerFontWeight?: string
  
  // Cell styles
  cellFontSize?: number
  fontSize?: number
  cellFontFamily?: string
  cellFontWeight?: string
  cellTextColor?: string
  lineHeight?: number
  letterSpacing?: number
  defaultTextAlign?: 'left' | 'center' | 'right' | 'justify'
  
  // Layout styles
  padding?: number
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  
  // Row colors
  rowHoverColor?: string
  editingCellColor?: string
  validationErrorColor?: string
  modifiedCellColor?: string
  newRowColor?: string
}

// Main clipboard atom
export const $tableStyleClipboard = atom<TableStyleClipboard>(null)

// Computed store for clipboard status
export const $hasTableStylesInClipboard = computed([$tableStyleClipboard], (clipboard) => {
  return clipboard !== null
})

// Extract styles from any table widget
function extractTableStyles(table: TableWidget): CommonTableStyles | null {
  if (!table || !table.config) return null
  
  return {
    // Header styles
    headerBackground: table.config.headerBackground,
    headerTextColor: table.config.headerTextColor,
    headerFontSize: table.config.headerFontSize,
    headerFontFamily: table.config.headerFontFamily,
    headerFontWeight: table.config.headerFontWeight,
    
    // Cell styles
    cellFontSize: table.config.cellFontSize,
    fontSize: table.config.fontSize,
    cellFontFamily: table.config.cellFontFamily,
    cellFontWeight: table.config.cellFontWeight,
    cellTextColor: table.config.cellTextColor,
    lineHeight: table.config.lineHeight,
    letterSpacing: table.config.letterSpacing,
    defaultTextAlign: table.config.defaultTextAlign,
    
    // Layout styles
    padding: table.config.padding,
    borderColor: table.config.borderColor,
    borderWidth: table.config.borderWidth,
    borderRadius: table.config.borderRadius,
    
    // Row colors
    rowHoverColor: table.config.rowHoverColor,
    editingCellColor: table.config.editingCellColor,
    validationErrorColor: table.config.validationErrorColor,
    modifiedCellColor: table.config.modifiedCellColor,
    newRowColor: table.config.newRowColor
  }
}

// Apply styles to table
function applyTableStyles(tableId: string, styles: CommonTableStyles): void {
  const configUpdates: Partial<TableConfig> = {}
  
  // Header styles
  if (styles.headerBackground !== undefined) configUpdates.headerBackground = styles.headerBackground
  if (styles.headerTextColor !== undefined) configUpdates.headerTextColor = styles.headerTextColor
  if (styles.headerFontSize !== undefined) configUpdates.headerFontSize = styles.headerFontSize
  if (styles.headerFontFamily !== undefined) configUpdates.headerFontFamily = styles.headerFontFamily
  if (styles.headerFontWeight !== undefined) configUpdates.headerFontWeight = styles.headerFontWeight
  
  // Cell styles
  if (styles.cellFontSize !== undefined) configUpdates.cellFontSize = styles.cellFontSize
  if (styles.fontSize !== undefined) configUpdates.fontSize = styles.fontSize
  if (styles.cellFontFamily !== undefined) configUpdates.cellFontFamily = styles.cellFontFamily
  if (styles.cellFontWeight !== undefined) configUpdates.cellFontWeight = styles.cellFontWeight
  if (styles.cellTextColor !== undefined) configUpdates.cellTextColor = styles.cellTextColor
  if (styles.lineHeight !== undefined) configUpdates.lineHeight = styles.lineHeight
  if (styles.letterSpacing !== undefined) configUpdates.letterSpacing = styles.letterSpacing
  if (styles.defaultTextAlign !== undefined) configUpdates.defaultTextAlign = styles.defaultTextAlign
  
  // Layout styles
  if (styles.padding !== undefined) configUpdates.padding = styles.padding
  if (styles.borderColor !== undefined) configUpdates.borderColor = styles.borderColor
  if (styles.borderWidth !== undefined) configUpdates.borderWidth = styles.borderWidth
  if (styles.borderRadius !== undefined) configUpdates.borderRadius = styles.borderRadius
  
  // Row colors
  if (styles.rowHoverColor !== undefined) configUpdates.rowHoverColor = styles.rowHoverColor
  if (styles.editingCellColor !== undefined) configUpdates.editingCellColor = styles.editingCellColor
  if (styles.validationErrorColor !== undefined) configUpdates.validationErrorColor = styles.validationErrorColor
  if (styles.modifiedCellColor !== undefined) configUpdates.modifiedCellColor = styles.modifiedCellColor
  if (styles.newRowColor !== undefined) configUpdates.newRowColor = styles.newRowColor
  
  tableActions.updateTableConfig(tableId, configUpdates)
}

// Main actions - Tables only
export const tableStyleClipboardActions = {
  copyStyles: (widgetId: string, widgetType: 'table') => {
    console.log('🎨 Copying table styles from:', widgetId)
    
    const tables = $tableWidgets.get()
    const table = tables.find(t => t.i === widgetId) ?? null
    
    if (table) {
      const commonStyles = extractTableStyles(table)
      if (!commonStyles) {
        console.warn('⚠️ Could not extract styles from table:', widgetId)
        return
      }
      
      $tableStyleClipboard.set({
        sourceWidgetType: 'table',
        sourceWidgetId: widgetId,
        commonStyles,
        timestamp: Date.now()
      })
      console.log('✅ Table styles copied to clipboard:', commonStyles)
    } else {
      console.warn('⚠️ Could not find table to copy styles from:', widgetId)
    }
  },

  pasteStyles: (targetWidgetId: string, targetWidgetType: 'table') => {
    const clipboard = $tableStyleClipboard.get()
    
    if (!clipboard) {
      console.warn('⚠️ No styles in clipboard')
      return
    }
    
    console.log('🎨 Pasting table styles to:', targetWidgetId)
    applyTableStyles(targetWidgetId, clipboard.commonStyles)
    console.log('✅ Table styles applied successfully')
  },

  clearClipboard: () => {
    console.log('🗑️ Clearing table style clipboard')
    $tableStyleClipboard.set(null)
  }
}