import { atom, computed } from 'nanostores'
import type { DroppedWidget } from '@/types/widget'

// Main widgets atom
export const $widgets = atom<DroppedWidget[]>([])

// Selected widget atom
export const $selectedWidgetId = atom<string | null>(null)

// Computed for selected widget
export const $selectedWidget = computed([$widgets, $selectedWidgetId], (widgets, selectedId) => {
  if (!selectedId) return null
  return widgets.find(w => w.i === selectedId) || null
})

// Actions
export const widgetActions = {
  // Set all widgets
  setWidgets: (widgets: DroppedWidget[]) => {
    console.log('🔄 Setting widgets:', widgets.length)
    $widgets.set(widgets)
  },

  // Add widget
  addWidget: (widget: DroppedWidget) => {
    console.log('➕ Adding widget:', widget.name)
    const currentWidgets = $widgets.get()
    $widgets.set([...currentWidgets, widget])
  },

  // Edit widget
  editWidget: (widgetId: string, changes: Partial<DroppedWidget>) => {
    console.log('✏️ Editing widget:', { widgetId, changes })
    const currentWidgets = $widgets.get()
    
    // Special handling for delete
    if ('_delete' in changes) {
      console.log('🗑️ Deleting widget:', widgetId)
      const newWidgets = currentWidgets.filter(w => w.i !== widgetId)
      $widgets.set(newWidgets)
      // Clear selection if deleted widget was selected
      if ($selectedWidgetId.get() === widgetId) {
        $selectedWidgetId.set(null)
      }
      return
    }
    
    // Regular edit
    const updatedWidgets = currentWidgets.map(w => 
      w.i === widgetId ? { ...w, ...changes } : w
    )
    $widgets.set(updatedWidgets)
  },

  // Remove widget
  removeWidget: (widgetId: string) => {
    console.log('🗑️ Removing widget:', widgetId)
    const currentWidgets = $widgets.get()
    const newWidgets = currentWidgets.filter(w => w.i !== widgetId)
    $widgets.set(newWidgets)
    
    // Clear selection if removed widget was selected
    if ($selectedWidgetId.get() === widgetId) {
      $selectedWidgetId.set(null)
    }
  },

  // Select widget
  selectWidget: (widgetId: string | null) => {
    console.log('🎯 Selecting widget:', widgetId)
    $selectedWidgetId.set(widgetId)
  },

  // Update layout (for react-grid-layout)
  updateLayout: (layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    console.log('📐 Updating layout for', layout.length, 'widgets')
    const currentWidgets = $widgets.get()
    const updatedWidgets = currentWidgets.map(widget => {
      const layoutItem = layout.find(l => l.i === widget.i)
      return layoutItem ? { ...widget, ...layoutItem } : widget
    })
    $widgets.set(updatedWidgets)
  }
}