'use client'

import { useStore } from '@nanostores/react'
import { $widgets, $selectedWidget, $selectedWidgetId, widgetActions } from '@/stores/widgetStore'
import { $canvasConfig } from '@/stores/canvasStore'
import { kpiActions } from '@/stores/kpiStore'
import { useState, useEffect, useMemo } from 'react'
import { isKPIWidget } from '@/types/kpiWidgets'
import KPIConfigEditor from './editors/KPIConfigEditor'

export default function WidgetEditorNew() {
  const widgets = useStore($widgets)
  const selectedWidget = useStore($selectedWidget)
  const selectedWidgetId = useStore($selectedWidgetId)
  const canvasConfig = useStore($canvasConfig)
  
  // State para controlar se canvas está selecionado
  const [canvasSelected, setCanvasSelected] = useState(widgets.length === 0)

  // KPI form state - seguindo mesmo padrão do original
  const [editKPIForm, setEditKPIForm] = useState({
    name: '',
    unit: ''
  })

  // Computed KPI config - acesso via selectedWidget
  const kpiConfig = useMemo(() => {
    if (!selectedWidget || !isKPIWidget(selectedWidget)) return {}
    
    const config = selectedWidget.config?.kpiConfig || {}
    console.log('🎯 WidgetEditorNew computed kpiConfig:', config)
    return config
  }, [selectedWidget])

  // Sync editKPIForm with kpiConfig when widget changes
  useEffect(() => {
    if (selectedWidget && isKPIWidget(selectedWidget)) {
      const config = selectedWidget.config?.kpiConfig || {}
      setEditKPIForm({
        name: config.name || '',
        unit: config.unit || ''
      })
    }
  }, [selectedWidget?.config?.kpiConfig?.name, selectedWidget?.config?.kpiConfig?.unit, selectedWidget])

  // Auto-select canvas quando não há widgets
  useEffect(() => {
    if (widgets.length === 0 && !canvasSelected && !selectedWidget) {
      setCanvasSelected(true)
      widgetActions.selectWidget(null)
    }
  }, [widgets.length, canvasSelected, selectedWidget])

  // KPI Handlers
  const handleKPIFormChange = (field: string, value: string) => {
    setEditKPIForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleKPIConfigChange = (field: string, value: unknown) => {
    console.log('⚙️ WidgetEditorNew handleKPIConfigChange:', { field, value })
    
    if (selectedWidget && isKPIWidget(selectedWidget)) {
      console.log('⚙️ WidgetEditorNew calling kpiActions.updateKPIConfig:', selectedWidget.i, { [field]: value })
      kpiActions.updateKPIConfig(selectedWidget.i, { [field]: value })
    }
  }

  // Handlers
  const handleSelectCanvas = () => {
    setCanvasSelected(true)
    widgetActions.selectWidget(null)
  }

  const handleSelectWidget = (widgetId: string) => {
    setCanvasSelected(false)
    widgetActions.selectWidget(widgetId)
  }

  // Caso não haja widgets
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Widget Editor</h2>
          <p className="text-sm text-gray-600 mt-2">
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
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Widget Editor</h2>
        <p className="text-sm text-gray-600 mt-2">
          {widgets.length} widget{widgets.length !== 1 ? 's' : ''} on canvas
        </p>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Widgets</h3>
          <div className="space-y-2 mb-6">
            
            {/* Canvas Settings Item */}
            <div
              onClick={handleSelectCanvas}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                canvasSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎨</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">Canvas Settings</div>
                  <div className="text-xs text-gray-500">
                    Configure canvas appearance and layout
                  </div>
                </div>
                {canvasSelected && (
                  <span className="text-blue-500">✓</span>
                )}
              </div>
            </div>

            {/* Widget Items */}
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

          {/* Configuration Panel */}
          <div className="border-t pt-4">
            {canvasSelected ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  🎨 Canvas Settings
                </h3>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600">Canvas configuration will be here</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Background: {canvasConfig.backgroundColor}
                  </p>
                </div>
              </div>
            ) : selectedWidget ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Edit "{selectedWidget.name}"
                </h3>
                
                {/* General Info */}
                <div className="p-3 bg-gray-50 rounded-lg mb-4">
                  <p className="text-xs text-gray-600">
                    Type: {selectedWidget.type} • Position: ({selectedWidget.x}, {selectedWidget.y}) • Size: {selectedWidget.w}×{selectedWidget.h}
                  </p>
                </div>

                {/* KPI Configuration */}
                {isKPIWidget(selectedWidget) && (
                  <KPIConfigEditor
                    selectedWidget={selectedWidget}
                    kpiConfig={kpiConfig}
                    editKPIForm={editKPIForm}
                    onKPIFormChange={handleKPIFormChange}
                    onKPIConfigChange={handleKPIConfigChange}
                  />
                )}

                {/* Other widget types placeholder */}
                {!isKPIWidget(selectedWidget) && (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-gray-600">Configuration for {selectedWidget.type} widgets will be here</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🎨</span>
                <p className="text-gray-500 mb-2">No selection</p>
                <p className="text-sm text-gray-400">
                  Click on "Canvas Settings" or a widget to start editing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}