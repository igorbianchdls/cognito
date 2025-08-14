'use client'

import { useStore } from '@nanostores/react'
import { $widgets, $selectedWidget, $selectedWidgetId, widgetActions } from '@/stores/widgetStore'
import { useState, useEffect } from 'react'

export default function WidgetEditor() {
  const widgets = useStore($widgets)
  const selectedWidget = useStore($selectedWidget)
  const selectedWidgetId = useStore($selectedWidgetId)

  const [editForm, setEditForm] = useState({
    x: selectedWidget?.x || 0,
    y: selectedWidget?.y || 0,
    w: selectedWidget?.w || 1,
    h: selectedWidget?.h || 1,
    color: selectedWidget?.color || '#3B82F6'
  })

  // Update form when selected widget changes
  useEffect(() => {
    if (selectedWidget) {
      setEditForm({
        x: selectedWidget.x,
        y: selectedWidget.y,
        w: selectedWidget.w,
        h: selectedWidget.h,
        color: selectedWidget.color || '#3B82F6'
      })
    }
  }, [selectedWidget])

  const handleSelectWidget = (widgetId: string) => {
    widgetActions.selectWidget(widgetId)
  }

  const handleUpdateWidget = () => {
    if (!selectedWidget) return
    
    widgetActions.editWidget(selectedWidget.i, {
      x: editForm.x,
      y: editForm.y,
      w: editForm.w,
      h: editForm.h,
      color: editForm.color
    })
  }

  const handleDeleteWidget = () => {
    if (!selectedWidget) return
    
    if (confirm(`Deletar widget "${selectedWidget.name}"?`)) {
      widgetActions.removeWidget(selectedWidget.i)
    }
  }

  const handleFormChange = (field: string, value: number | string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (widgets.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Widget Editor</h2>
          <p className="text-sm text-gray-600 mt-1">
            Edit widget properties manually
          </p>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <p className="text-gray-500 mb-2">No widgets on canvas</p>
            <p className="text-sm text-gray-400">
              Drag widgets from the Widgets tab to get started
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Widget Editor</h2>
        <p className="text-sm text-gray-600 mt-1">
          {widgets.length} widget{widgets.length !== 1 ? 's' : ''} on canvas
        </p>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Widgets</h3>
          <div className="space-y-2 mb-6">
            {widgets.map((widget) => (
              <div
                key={widget.i}
                onClick={() => handleSelectWidget(widget.i)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedWidgetId === widget.i
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{widget.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{widget.name}</div>
                    <div className="text-xs text-gray-500">
                      Position: ({widget.x}, {widget.y}) • Size: {widget.w}×{widget.h}
                    </div>
                  </div>
                  {selectedWidgetId === widget.i && (
                    <span className="text-blue-500">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Edit Form */}
          {selectedWidget && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Edit "{selectedWidget.name}"
              </h3>
              
              <div className="space-y-4">
                {/* Position */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">X</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.x}
                        onChange={(e) => handleFormChange('x', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Y</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.y}
                        onChange={(e) => handleFormChange('y', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Width</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.w}
                        onChange={(e) => handleFormChange('w', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Height</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.h}
                        onChange={(e) => handleFormChange('h', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) => handleFormChange('color', e.target.value)}
                      className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editForm.color}
                      onChange={(e) => handleFormChange('color', e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleUpdateWidget}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={handleDeleteWidget}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}