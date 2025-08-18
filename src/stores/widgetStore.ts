// Legacy widgetStore.ts - Now acts as a facade over specialized stores
// This maintains backward compatibility while routing to the new architecture

import { compositeActions, $allWidgets, $selectedWidgetId, $selectedWidget } from './compositeStore'
import type { DroppedWidget } from '@/types/widget'

// Export the composite stores as the "main" widgets store for backward compatibility
export const $widgets = $allWidgets
export { $selectedWidgetId, $selectedWidget }

// Export legacy actions that route to the new composite actions
export const widgetActions = {
  // Set all widgets - routes to composite with migration
  setWidgets: (widgets: DroppedWidget[]) => {
    console.log('🔄 [LEGACY] Setting widgets:', widgets.length)
    compositeActions.setWidgets(widgets)
  },

  // Add widget - routes to composite with type detection
  addWidget: (widget: DroppedWidget) => {
    console.log('➕ [LEGACY] Adding widget:', widget.name)
    compositeActions.addWidget(widget)
  },

  // Edit widget - routes to composite with type detection
  editWidget: (widgetId: string, changes: Partial<DroppedWidget>) => {
    console.log('✏️ [LEGACY] Editing widget:', { widgetId, changes })
    
    // Special handling for delete (legacy compatibility)
    if ('_delete' in changes) {
      console.log('🗑️ [LEGACY] Deleting widget via edit:', widgetId)
      compositeActions.removeWidget(widgetId)
      return
    }
    
    // Regular edit
    compositeActions.editWidget(widgetId, changes)
  },

  // Remove widget - routes to composite
  removeWidget: (widgetId: string) => {
    console.log('🗑️ [LEGACY] Removing widget:', widgetId)
    compositeActions.removeWidget(widgetId)
  },

  // Select widget - routes to composite
  selectWidget: (widgetId: string | null) => {
    console.log('🎯 [LEGACY] Selecting widget:', widgetId)
    compositeActions.selectWidget(widgetId)
  },

  // Update layout - routes to composite
  updateLayout: (layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    console.log('📐 [LEGACY] Updating layout for', layout.length, 'widgets')
    compositeActions.updateLayout(layout)
  }
}

// Re-export specialized stores for direct access when needed
export { chartActions } from './chartStore'
export { kpiActions } from './kpiStore' 
export { tableActions } from './tableStore'
export { compositeActions, migrationUtils } from './compositeStore'

// Export specialized store atoms for granular subscriptions
export { $chartWidgets, $selectedChartId } from './chartStore'
export { $kpiWidgets, $selectedKPIId } from './kpiStore'
export { $tableWidgets, $selectedTableId } from './tableStore'