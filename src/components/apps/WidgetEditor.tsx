'use client'

import { useStore } from '@nanostores/react'
import { $widgets, $selectedWidget, $selectedWidgetId, widgetActions } from '@/stores/widgetStore'
import { chartActions } from '@/stores/chartStore'
import { kpiActions } from '@/stores/kpiStore'
import { $canvasConfig, canvasActions } from '@/stores/canvasStore'
import { useState, useEffect, useMemo } from 'react'
import type { ChartWidget, BarChartConfig, LineChartConfig, PieChartConfig } from '@/types/chartWidgets'

// Interface for padding configuration
interface PaddingConfig {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}
import { isChartWidget, isBarChart, isLineChart, isPieChart } from '@/types/chartWidgets'
import { isKPIWidget } from '@/types/kpiWidgets'

export default function WidgetEditor() {
  const widgets = useStore($widgets)
  const selectedWidget = useStore($selectedWidget)
  const selectedWidgetId = useStore($selectedWidgetId)
  const canvasConfig = useStore($canvasConfig)

  const [editForm, setEditForm] = useState({
    x: selectedWidget?.x || 0,
    y: selectedWidget?.y || 0,
    w: selectedWidget?.w || 1,
    h: selectedWidget?.h || 1,
    color: selectedWidget?.color || '#3B82F6'
  })

  // State for collapsible sections (currently not used but preserved for future enhancement)
  // const [expandedSections, setExpandedSections] = useState({
  //   colors: true,
  //   grid: false,
  //   labels: false,
  //   legends: false,
  //   axes: false,
  //   chartSpecific: true,
  //   animation: false,
  //   // KPI sections
  //   kpiData: true,
  //   kpiStyling: false,
  //   kpiTypography: false,
  //   kpiLayout: false,
  //   kpiDisplay: false
  // })

  // KPI form state - following same pattern as editForm for charts
  const [editKPIForm, setEditKPIForm] = useState({
    name: '',
    unit: ''
  })

  // State for canvas selection - default to true when no widgets exist
  const [canvasSelected, setCanvasSelected] = useState(widgets.length === 0)

  // Computed widget-specific configurations - correct access to adapted widget
  const chartConfig = useMemo(() => {
    if (!selectedWidget || !isChartWidget(selectedWidget)) return {}
    
    // selectedWidget é DroppedWidget adaptado, não ChartWidget direto
    console.log('🔍 WidgetEditor selectedWidget estrutura completa:', {
      id: selectedWidget?.i,
      type: selectedWidget?.type,
      hasConfig: !!selectedWidget?.config,
      hasChartConfig: !!selectedWidget?.chartConfig,
      configStructure: selectedWidget?.config,
      chartConfigDirect: selectedWidget?.chartConfig,
      configChartConfig: selectedWidget?.config?.chartConfig
    })
    
    // Acesso correto: config.chartConfig (novo) ou chartConfig (legacy)
    const config = selectedWidget.config?.chartConfig || selectedWidget.chartConfig || {}
    console.log('🎯 WidgetEditor computed chartConfig final:', config)
    return config
  }, [selectedWidget])

  const kpiConfig = useMemo(() => {
    if (!selectedWidget || !isKPIWidget(selectedWidget)) return {}
    
    // selectedWidget é DroppedWidget adaptado
    console.log('🔍 WidgetEditor KPI estrutura - optimized dependencies:', {
      id: selectedWidget?.i,
      type: selectedWidget?.type,
      configStructure: selectedWidget?.config,
      configKpiConfig: selectedWidget?.config?.kpiConfig
    })
    
    // Acesso correto via adapter structure
    const config = selectedWidget.config?.kpiConfig || {}
    console.log('🎯 WidgetEditor computed kpiConfig final:', config)
    return config
  }, [selectedWidget]) // Dependencies for kpiConfig useMemo

  // Update form when selected widget ID changes (not the object reference)
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
  }, [selectedWidgetId, selectedWidget]) // Dependencies for editForm sync

  // Sync editKPIForm with kpiConfig when widget changes - specific dependencies
  useEffect(() => {
    if (selectedWidget && isKPIWidget(selectedWidget)) {
      const config = selectedWidget.config?.kpiConfig || {}
      setEditKPIForm({
        name: config.name || '',
        unit: config.unit || ''
      })
    }
  }, [
    selectedWidgetId,
    selectedWidget?.config?.kpiConfig?.name,
    selectedWidget?.config?.kpiConfig?.unit,
    selectedWidget
  ]) // Dependencies for editKPIForm sync

  // Auto-select canvas when no widgets exist
  useEffect(() => {
    if (widgets.length === 0 && !canvasSelected && !selectedWidget) {
      setCanvasSelected(true)
    }
  }, [widgets.length, canvasSelected, selectedWidget])


  // Debug: Monitor re-renders and selectedWidget changes
  useEffect(() => {
    console.log('🔄 WidgetEditor re-rendered - selectedWidget changed:', {
      id: selectedWidget?.i,
      type: selectedWidget?.type,
      isKPI: selectedWidget && isKPIWidget(selectedWidget),
      configRef: selectedWidget?.config,
      kpiConfigRef: selectedWidget?.config?.kpiConfig,
      timestamp: new Date().toISOString()
    })
  }, [selectedWidget])

  useEffect(() => {
    console.log('🎯 kpiConfig useMemo re-computed:', {
      widgetId: selectedWidget?.i,
      kpiConfig,
      timestamp: new Date().toISOString()
    })
  }, [selectedWidget?.i, selectedWidget?.config?.kpiConfig, kpiConfig])

  const handleSelectWidget = (widgetId: string) => {
    setCanvasSelected(false)
    widgetActions.selectWidget(widgetId)
  }

  const handleSelectCanvas = () => {
    setCanvasSelected(true)
    widgetActions.selectWidget(null)
  }

  const handleUpdateWidget = () => {
    if (!selectedWidget) return
    
    // Save general widget properties
    widgetActions.editWidget(selectedWidget.i, {
      x: editForm.x,
      y: editForm.y,
      w: editForm.w,
      h: editForm.h,
      color: editForm.color
    })

    // Save KPI-specific form data if this is a KPI widget
    if (isKPIWidget(selectedWidget)) {
      console.log('💾 Saving KPI form data with Apply Changes:', editKPIForm)
      kpiActions.updateKPIConfig(selectedWidget.i, {
        name: editKPIForm.name,
        unit: editKPIForm.unit
      })
    }
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

  // Handle KPI form changes - local state only like charts
  const handleKPIFormChange = (field: string, value: string) => {
    setEditKPIForm(prev => ({
      ...prev,
      [field]: value
    }))
  }


  // Handle chart configuration changes - direct to store
  const handleChartConfigChange = (field: string, value: unknown) => {
    console.log('⚙️ handleChartConfigChange ENTRADA:', { field, value })
    console.log('⚙️ Estado ANTES da mudança:', {
      selectedWidgetId: selectedWidget?.i,
      currentConfigViaConfig: selectedWidget?.config?.chartConfig,
      currentConfigDirect: selectedWidget?.chartConfig,
      fieldCurrentValue: selectedWidget?.config?.chartConfig?.[field as keyof typeof selectedWidget.config.chartConfig] || selectedWidget?.chartConfig?.[field as keyof typeof selectedWidget.chartConfig]
    })
    
    // Apply changes directly to store (no local state)
    if (selectedWidget && isChartWidget(selectedWidget)) {
      console.log('⚙️ Chamando chartActions.updateChartConfig:', selectedWidget.i, { [field]: value })
      chartActions.updateChartConfig(selectedWidget.i, { [field]: value })
      
      // Log para verificar estado depois
      setTimeout(() => {
        console.log('⚙️ Estado DEPOIS da mudança (100ms):', {
          selectedWidgetId: selectedWidget?.i,
          newConfigViaConfig: selectedWidget?.config?.chartConfig,
          newConfigDirect: selectedWidget?.chartConfig,
          fieldNewValue: selectedWidget?.config?.chartConfig?.[field as keyof typeof selectedWidget.config.chartConfig] || selectedWidget?.chartConfig?.[field as keyof typeof selectedWidget.chartConfig]
        })
      }, 100)
    } else {
      console.warn('⚠️ selectedWidget não é chart ou não existe:', selectedWidget?.type)
    }
  }

  // Handle KPI configuration changes - direct to store
  const handleKPIConfigChange = (field: string, value: unknown) => {
    console.log('⚙️ WidgetEditor handleKPIConfigChange:', { field, value })
    
    // Apply changes directly to store (no local state)
    if (selectedWidget && isKPIWidget(selectedWidget)) {
      console.log('⚙️ WidgetEditor calling kpiActions.updateKPIConfig:', selectedWidget.i, { [field]: value })
      kpiActions.updateKPIConfig(selectedWidget.i, { [field]: value })
    }
  }


  // Handle color array changes for charts
  const handleChartColorsChange = (colors: string[]) => {
    handleChartConfigChange('colors', colors)
  }



  if (widgets.length === 0) {
    return (
      <div className="h-full flex flex-col">
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
    <div className="h-full flex flex-col">
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

          {/* Canvas Settings or Widget Edit Form */}
          {canvasSelected ? (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                🎨 Canvas Settings
              </h3>
              {/* Customize the dashboard canvas appearance and behavior */}
              
              <div className="space-y-6">
                {/* Background Settings */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">🎨 Background</h4>
                  <div className="space-y-3">
                    {/* Background Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Background Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={canvasConfig.backgroundColor}
                          onChange={(e) => canvasActions.setBackgroundColor(e.target.value)}
                          className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={canvasConfig.backgroundColor}
                          onChange={(e) => canvasActions.setBackgroundColor(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    {/* Background Image */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Background Image URL (optional)
                      </label>
                      <input
                        type="url"
                        value={canvasConfig.backgroundImage || ''}
                        onChange={(e) => canvasActions.setBackgroundImage(e.target.value || undefined)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    {/* Background Image Options */}
                    {canvasConfig.backgroundImage && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Size</label>
                            <select
                              value={canvasConfig.backgroundSize}
                              onChange={(e) => canvasActions.setBackgroundSize(e.target.value as 'cover' | 'contain' | 'auto' | 'stretch')}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="cover">Cover</option>
                              <option value="contain">Contain</option>
                              <option value="auto">Auto</option>
                              <option value="stretch">Stretch</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Position</label>
                            <select
                              value={canvasConfig.backgroundPosition}
                              onChange={(e) => canvasActions.setBackgroundPosition(e.target.value as 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right')}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="center">Center</option>
                              <option value="top">Top</option>
                              <option value="bottom">Bottom</option>
                              <option value="left">Left</option>
                              <option value="right">Right</option>
                              <option value="top-left">Top Left</option>
                              <option value="top-right">Top Right</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-right">Bottom Right</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Repeat</label>
                          <select
                            value={canvasConfig.backgroundRepeat}
                            onChange={(e) => canvasActions.setBackgroundRepeat(e.target.value as 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y')}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="no-repeat">No Repeat</option>
                            <option value="repeat">Repeat</option>
                            <option value="repeat-x">Repeat X</option>
                            <option value="repeat-y">Repeat Y</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Canvas Dimensions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">📏 Canvas Dimensions</h4>
                  <div className="space-y-3">
                    {/* Canvas Mode */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Canvas Mode</label>
                      <div className="flex gap-1">
                        {[
                          { value: 'responsive', label: 'Responsive' },
                          { value: 'fixed', label: 'Fixed Size' }
                        ].map((mode) => (
                          <button
                            key={mode.value}
                            onClick={() => canvasActions.setCanvasMode(mode.value as 'responsive' | 'fixed')}
                            className={`flex-1 px-3 py-2 text-xs border rounded-md transition-colors ${
                              canvasConfig.canvasMode === mode.value
                                ? 'bg-blue-50 border-blue-300 text-blue-700'
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fixed Size Options */}
                    {canvasConfig.canvasMode === 'fixed' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                          <input
                            type="number"
                            min="300"
                            value={typeof canvasConfig.width === 'number' ? canvasConfig.width : ''}
                            onChange={(e) => canvasActions.setCanvasDimensions(
                              e.target.value ? parseInt(e.target.value) : 'auto',
                              canvasConfig.height
                            )}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Auto"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                          <input
                            type="number"
                            min="200"
                            value={typeof canvasConfig.height === 'number' ? canvasConfig.height : ''}
                            onChange={(e) => canvasActions.setCanvasDimensions(
                              canvasConfig.width,
                              e.target.value ? parseInt(e.target.value) : 'auto'
                            )}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Auto"
                          />
                        </div>
                      </div>
                    )}

                    {/* Min Height */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Min Height (px)</label>
                      <input
                        type="number"
                        min="200"
                        value={canvasConfig.minHeight}
                        onChange={(e) => canvasActions.setMinHeight(parseInt(e.target.value) || 400)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Max Width */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max Width (px)</label>
                      <input
                        type="number"
                        min="400"
                        value={canvasConfig.maxWidth || ''}
                        onChange={(e) => canvasActions.setMaxWidth(e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="No limit"
                      />
                    </div>
                  </div>
                </div>

                {/* Grid Configuration */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">📐 Grid Configuration</h4>
                  <div className="space-y-3">
                    {/* Row Height */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Row Height: {canvasConfig.rowHeight}px</label>
                      <input
                        type="range"
                        min="40"
                        max="120"
                        step="10"
                        value={canvasConfig.rowHeight}
                        onChange={(e) => canvasActions.setRowHeight(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Container Padding */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Container Padding</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">X: {canvasConfig.containerPadding[0]}px</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="5"
                            value={canvasConfig.containerPadding[0]}
                            onChange={(e) => canvasActions.setContainerPadding([parseInt(e.target.value), canvasConfig.containerPadding[1]])}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Y: {canvasConfig.containerPadding[1]}px</label>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            step="5"
                            value={canvasConfig.containerPadding[1]}
                            onChange={(e) => canvasActions.setContainerPadding([canvasConfig.containerPadding[0], parseInt(e.target.value)])}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Widget Spacing */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Widget Spacing</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">X: {canvasConfig.margin[0]}px</label>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="2"
                            value={canvasConfig.margin[0]}
                            onChange={(e) => canvasActions.setMargin([parseInt(e.target.value), canvasConfig.margin[1]])}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Y: {canvasConfig.margin[1]}px</label>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="2"
                            value={canvasConfig.margin[1]}
                            onChange={(e) => canvasActions.setMargin([canvasConfig.margin[0], parseInt(e.target.value)])}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Responsive Columns */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Responsive Columns</label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Large ({canvasConfig.breakpoints.lg})</label>
                          <input
                            type="number"
                            min="6"
                            max="24"
                            value={canvasConfig.breakpoints.lg}
                            onChange={(e) => canvasActions.setBreakpoints({ lg: parseInt(e.target.value) || 12 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Medium ({canvasConfig.breakpoints.md})</label>
                          <input
                            type="number"
                            min="4"
                            max="20"
                            value={canvasConfig.breakpoints.md}
                            onChange={(e) => canvasActions.setBreakpoints({ md: parseInt(e.target.value) || 10 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Small ({canvasConfig.breakpoints.sm})</label>
                          <input
                            type="number"
                            min="2"
                            max="12"
                            value={canvasConfig.breakpoints.sm}
                            onChange={(e) => canvasActions.setBreakpoints({ sm: parseInt(e.target.value) || 6 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Styling Options */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">🎨 Styling</h4>
                  <div className="space-y-3">
                    {/* Border Radius */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Border Radius: {canvasConfig.borderRadius}px</label>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        step="2"
                        value={canvasConfig.borderRadius}
                        onChange={(e) => canvasActions.setBorderRadius(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Box Shadow & Overflow */}
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={canvasConfig.boxShadow}
                          onChange={(e) => canvasActions.setBoxShadow(e.target.checked)}
                          className="rounded"
                        />
                        Box Shadow
                      </label>
                      
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">Overflow</label>
                        <select
                          value={canvasConfig.overflow}
                          onChange={(e) => canvasActions.setOverflow(e.target.value as 'visible' | 'hidden' | 'scroll' | 'auto')}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                          <option value="visible">Visible</option>
                          <option value="hidden">Hidden</option>
                          <option value="scroll">Scroll</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="pt-2">
                  <button
                    onClick={() => canvasActions.resetToDefaults()}
                    className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    🔄 Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          ) : selectedWidget ? (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Edit &quot;{selectedWidget.name}&quot;
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

                {/* Chart-Specific Configuration */}
                {selectedWidget && isChartWidget(selectedWidget) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Chart Configuration</h4>
                    
                    {/* Title & Description */}
                    <div>
                      <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">📝 Title & Description</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                          <input
                            type="text"
                            value={(chartConfig as Record<string, unknown>)?.title as string || ''}
                            onChange={(e) => handleChartConfigChange('title', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter chart title"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                          <input
                            type="text"
                            value={(chartConfig as Record<string, unknown>)?.subtitle as string || ''}
                            onChange={(e) => handleChartConfigChange('subtitle', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter chart subtitle"
                          />
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={(chartConfig as Record<string, unknown>)?.showTitle as boolean !== false}
                              onChange={(e) => handleChartConfigChange('showTitle', e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600">Show Title</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={(chartConfig as Record<string, unknown>)?.showSubtitle as boolean !== false}
                              onChange={(e) => handleChartConfigChange('showSubtitle', e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600">Show Subtitle</span>
                          </label>
                        </div>
                        
                        {/* Title Styling */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Title Styling</label>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                              <input
                                type="number"
                                min="12"
                                max="32"
                                value={(chartConfig as Record<string, unknown>)?.titleFontSize as number ?? 18}
                                onChange={(e) => handleChartConfigChange('titleFontSize', parseInt(e.target.value) || 18)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Font Weight</label>
                              <select
                                value={(chartConfig as Record<string, unknown>)?.titleFontWeight as number ?? 700}
                                onChange={(e) => handleChartConfigChange('titleFontWeight', parseInt(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value={400}>Normal</option>
                                <option value={500}>Medium</option>
                                <option value={600}>Semi Bold</option>
                                <option value={700}>Bold</option>
                                <option value={800}>Extra Bold</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Color</label>
                              <input
                                type="color"
                                value={(chartConfig as Record<string, unknown>)?.titleColor as string ?? '#111827'}
                                onChange={(e) => handleChartConfigChange('titleColor', e.target.value)}
                                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Title Padding</label>
                            <div className="grid grid-cols-4 gap-1">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Top</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="32"
                                  value={typeof (chartConfig as Record<string, unknown>)?.titlePadding === 'object' ? ((chartConfig as Record<string, unknown>)?.titlePadding as PaddingConfig)?.top ?? 8 : 8}
                                  onChange={(e) => {
                                    const currentPadding = (chartConfig as Record<string, unknown>)?.titlePadding as PaddingConfig | number | undefined || {};
                                    const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 8, right: 8, bottom: 8, left: 8 };
                                    handleChartConfigChange('titlePadding', { ...newPadding, top: parseInt(e.target.value) || 0 });
                                  }}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Right</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="32"
                                  value={typeof (chartConfig as Record<string, unknown>)?.titlePadding === 'object' ? ((chartConfig as Record<string, unknown>)?.titlePadding as PaddingConfig)?.right ?? 8 : 8}
                                  onChange={(e) => {
                                    const currentPadding = (chartConfig as Record<string, unknown>)?.titlePadding as PaddingConfig | number | undefined || {};
                                    const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 8, right: 8, bottom: 8, left: 8 };
                                    handleChartConfigChange('titlePadding', { ...newPadding, right: parseInt(e.target.value) || 0 });
                                  }}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Bottom</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="32"
                                  value={typeof (chartConfig as Record<string, unknown>)?.titlePadding === 'object' ? ((chartConfig as Record<string, unknown>)?.titlePadding as PaddingConfig)?.bottom ?? 8 : 8}
                                  onChange={(e) => {
                                    const currentPadding = (chartConfig as Record<string, unknown>)?.titlePadding as PaddingConfig | number | undefined || {};
                                    const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 8, right: 8, bottom: 8, left: 8 };
                                    handleChartConfigChange('titlePadding', { ...newPadding, bottom: parseInt(e.target.value) || 0 });
                                  }}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Left</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="32"
                                  value={typeof (chartConfig as Record<string, unknown>)?.titlePadding === 'object' ? ((chartConfig as Record<string, unknown>)?.titlePadding as PaddingConfig)?.left ?? 8 : 8}
                                  onChange={(e) => {
                                    const currentPadding = (chartConfig as Record<string, unknown>)?.titlePadding as PaddingConfig | number | undefined || {};
                                    const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 8, right: 8, bottom: 8, left: 8 };
                                    handleChartConfigChange('titlePadding', { ...newPadding, left: parseInt(e.target.value) || 0 });
                                  }}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Subtitle Styling */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Subtitle Styling</label>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                              <input
                                type="number"
                                min="10"
                                max="20"
                                value={(chartConfig as Record<string, unknown>)?.subtitleFontSize as number ?? 14}
                                onChange={(e) => handleChartConfigChange('subtitleFontSize', parseInt(e.target.value) || 14)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Font Weight</label>
                              <select
                                value={(chartConfig as Record<string, unknown>)?.subtitleFontWeight as number ?? 400}
                                onChange={(e) => handleChartConfigChange('subtitleFontWeight', parseInt(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value={300}>Light</option>
                                <option value={400}>Normal</option>
                                <option value={500}>Medium</option>
                                <option value={600}>Semi Bold</option>
                                <option value={700}>Bold</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Color</label>
                              <input
                                type="color"
                                value={(chartConfig as Record<string, unknown>)?.subtitleColor as string ?? '#6B7280'}
                                onChange={(e) => handleChartConfigChange('subtitleColor', e.target.value)}
                                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Subtitle Padding</label>
                            <div className="grid grid-cols-4 gap-1">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Top</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="32"
                                  value={typeof (chartConfig as Record<string, unknown>)?.subtitlePadding === 'object' ? ((chartConfig as Record<string, unknown>)?.subtitlePadding as PaddingConfig)?.top ?? 8 : 8}
                                  onChange={(e) => {
                                    const currentPadding = (chartConfig as Record<string, unknown>)?.subtitlePadding as PaddingConfig | number | undefined || {};
                                    const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 8, right: 8, bottom: 8, left: 8 };
                                    handleChartConfigChange('subtitlePadding', { ...newPadding, top: parseInt(e.target.value) || 0 });
                                  }}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Right</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="32"
                                  value={typeof (chartConfig as Record<string, unknown>)?.subtitlePadding === 'object' ? ((chartConfig as Record<string, unknown>)?.subtitlePadding as PaddingConfig)?.right ?? 8 : 8}
                                  onChange={(e) => {
                                    const currentPadding = (chartConfig as Record<string, unknown>)?.subtitlePadding as PaddingConfig | number | undefined || {};
                                    const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 8, right: 8, bottom: 8, left: 8 };
                                    handleChartConfigChange('subtitlePadding', { ...newPadding, right: parseInt(e.target.value) || 0 });
                                  }}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Bottom</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="32"
                                  value={typeof (chartConfig as Record<string, unknown>)?.subtitlePadding === 'object' ? ((chartConfig as Record<string, unknown>)?.subtitlePadding as PaddingConfig)?.bottom ?? 8 : 8}
                                  onChange={(e) => {
                                    const currentPadding = (chartConfig as Record<string, unknown>)?.subtitlePadding as PaddingConfig | number | undefined || {};
                                    const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 8, right: 8, bottom: 8, left: 8 };
                                    handleChartConfigChange('subtitlePadding', { ...newPadding, bottom: parseInt(e.target.value) || 0 });
                                  }}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Left</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="32"
                                  value={typeof (chartConfig as Record<string, unknown>)?.subtitlePadding === 'object' ? ((chartConfig as Record<string, unknown>)?.subtitlePadding as PaddingConfig)?.left ?? 8 : 8}
                                  onChange={(e) => {
                                    const currentPadding = (chartConfig as Record<string, unknown>)?.subtitlePadding as PaddingConfig | number | undefined || {};
                                    const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 8, right: 8, bottom: 8, left: 8 };
                                    handleChartConfigChange('subtitlePadding', { ...newPadding, left: parseInt(e.target.value) || 0 });
                                  }}
                                  className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Chart Padding */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Chart Padding</label>
                          <div className="grid grid-cols-4 gap-1">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Top</label>
                              <input
                                type="number"
                                min="0"
                                max="32"
                                value={typeof (chartConfig as Record<string, unknown>)?.chartPadding === 'object' ? ((chartConfig as Record<string, unknown>)?.chartPadding as PaddingConfig)?.top ?? 0 : 0}
                                onChange={(e) => {
                                  const currentPadding = (chartConfig as Record<string, unknown>)?.chartPadding as PaddingConfig | number | undefined || {};
                                  const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 0, right: 0, bottom: 0, left: 0 };
                                  handleChartConfigChange('chartPadding', { ...newPadding, top: parseInt(e.target.value) || 0 });
                                }}
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Right</label>
                              <input
                                type="number"
                                min="0"
                                max="32"
                                value={typeof (chartConfig as Record<string, unknown>)?.chartPadding === 'object' ? ((chartConfig as Record<string, unknown>)?.chartPadding as PaddingConfig)?.right ?? 0 : 0}
                                onChange={(e) => {
                                  const currentPadding = (chartConfig as Record<string, unknown>)?.chartPadding as PaddingConfig | number | undefined || {};
                                  const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 0, right: 0, bottom: 0, left: 0 };
                                  handleChartConfigChange('chartPadding', { ...newPadding, right: parseInt(e.target.value) || 0 });
                                }}
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Bottom</label>
                              <input
                                type="number"
                                min="0"
                                max="32"
                                value={typeof (chartConfig as Record<string, unknown>)?.chartPadding === 'object' ? ((chartConfig as Record<string, unknown>)?.chartPadding as PaddingConfig)?.bottom ?? 0 : 0}
                                onChange={(e) => {
                                  const currentPadding = (chartConfig as Record<string, unknown>)?.chartPadding as PaddingConfig | number | undefined || {};
                                  const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 0, right: 0, bottom: 0, left: 0 };
                                  handleChartConfigChange('chartPadding', { ...newPadding, bottom: parseInt(e.target.value) || 0 });
                                }}
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Left</label>
                              <input
                                type="number"
                                min="0"
                                max="32"
                                value={typeof (chartConfig as Record<string, unknown>)?.chartPadding === 'object' ? ((chartConfig as Record<string, unknown>)?.chartPadding as PaddingConfig)?.left ?? 0 : 0}
                                onChange={(e) => {
                                  const currentPadding = (chartConfig as Record<string, unknown>)?.chartPadding as PaddingConfig | number | undefined || {};
                                  const newPadding = typeof currentPadding === 'object' ? currentPadding : { top: 0, right: 0, bottom: 0, left: 0 };
                                  handleChartConfigChange('chartPadding', { ...newPadding, left: parseInt(e.target.value) || 0 });
                                }}
                                className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Colors & Styling */}
                    <div>
                      <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🎨 Colors & Styling</h5>
                      <div className="space-y-3">
                        {/* Chart Colors */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Chart Colors</label>
                          <div className="space-y-2">
                            {(chartConfig.colors || ['#2563eb']).map((color, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="color"
                                  value={color}
                                  onChange={(e) => {
                                    const newColors = [...(chartConfig.colors || ['#2563eb'])]
                                    newColors[index] = e.target.value
                                    handleChartColorsChange(newColors)
                                  }}
                                  className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={color}
                                  onChange={(e) => {
                                    const newColors = [...(chartConfig.colors || ['#2563eb'])]
                                    newColors[index] = e.target.value
                                    handleChartColorsChange(newColors)
                                  }}
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {(chartConfig.colors || []).length > 1 && (
                                  <button
                                    onClick={() => {
                                      const newColors = (chartConfig.colors || []).filter((_, i) => i !== index)
                                      handleChartColorsChange(newColors)
                                    }}
                                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newColors = [...(chartConfig.colors || ['#2563eb']), '#10b981']
                                handleChartColorsChange(newColors)
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              + Add Color
                            </button>
                          </div>
                        </div>

                        {/* Border & Styling */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
                            <input
                              type="number"
                              min="0"
                              value={(chartConfig as Record<string, unknown>).borderRadius as number ?? 4}
                              onChange={(e) => handleChartConfigChange('borderRadius', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Border Width</label>
                            <input
                              type="number"
                              min="0"
                              value={(chartConfig as Record<string, unknown>).borderWidth as number ?? 0}
                              onChange={(e) => handleChartConfigChange('borderWidth', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grid & Axes */}
                    <div>
                      <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">📐 Grid & Axes</h5>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={chartConfig.enableGridX || false}
                              onChange={(e) => handleChartConfigChange('enableGridX', e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600">Enable X Grid</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={chartConfig.enableGridY !== false}
                              onChange={(e) => handleChartConfigChange('enableGridY', e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600">Enable Y Grid</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Labels */}
                    <div>
                      <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🏷️ Labels</h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(chartConfig as Record<string, unknown>).enableLabel as boolean || false}
                            onChange={(e) => handleChartConfigChange('enableLabel', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-600">Enable Labels</span>
                        </label>
                        
                        {(chartConfig as Record<string, unknown>).enableLabel as boolean && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Label Position</label>
                              <select
                                value={(chartConfig as Record<string, unknown>).labelPosition as string || 'middle'}
                                onChange={(e) => handleChartConfigChange('labelPosition', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="start">Start</option>
                                <option value="middle">Middle</option>
                                <option value="end">End</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Skip Width</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={(chartConfig as Record<string, unknown>).labelSkipWidth as number ?? 0}
                                  onChange={(e) => handleChartConfigChange('labelSkipWidth', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Skip Height</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={(chartConfig as Record<string, unknown>).labelSkipHeight as number ?? 0}
                                  onChange={(e) => handleChartConfigChange('labelSkipHeight', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Legends */}
                    <div>
                      <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🏛️ Legends</h5>
                      <div className="space-y-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(chartConfig as Record<string, unknown>).legends ? 
                              ((chartConfig as Record<string, unknown>).legends as Record<string, unknown>).enabled !== false : true}
                            onChange={(e) => handleChartConfigChange('legends', { 
                              ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                              enabled: e.target.checked 
                            })}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-600">Enable Legends</span>
                        </label>
                        
                        {((chartConfig as Record<string, unknown>).legends ? 
                          ((chartConfig as Record<string, unknown>).legends as Record<string, unknown>).enabled !== false : true) && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Position (Anchor)</label>
                              <select
                                value={((chartConfig as Record<string, unknown>).legends as Record<string, unknown>)?.anchor as string || 'bottom'}
                                onChange={(e) => handleChartConfigChange('legends', { 
                                  ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                                  anchor: e.target.value 
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="top-left">Top Left</option>
                                <option value="top">Top</option>
                                <option value="top-right">Top Right</option>
                                <option value="right">Right</option>
                                <option value="bottom-right">Bottom Right</option>
                                <option value="bottom">Bottom</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Direction</label>
                              <select
                                value={((chartConfig as Record<string, unknown>).legends as Record<string, unknown>)?.direction as string || 'row'}
                                onChange={(e) => handleChartConfigChange('legends', { 
                                  ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                                  direction: e.target.value 
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="row">Row</option>
                                <option value="column">Column</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Symbol Shape</label>
                              <select
                                value={((chartConfig as Record<string, unknown>).legends as Record<string, unknown>)?.symbolShape as string || 'circle'}
                                onChange={(e) => handleChartConfigChange('legends', { 
                                  ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                                  symbolShape: e.target.value 
                                })}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="circle">Circle</option>
                                <option value="square">Square</option>
                                <option value="triangle">Triangle</option>
                                <option value="diamond">Diamond</option>
                              </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Item Width</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={((chartConfig as Record<string, unknown>).legends as Record<string, unknown>)?.itemWidth as number ?? 80}
                                  onChange={(e) => handleChartConfigChange('legends', { 
                                    ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                                    itemWidth: parseInt(e.target.value) || 80 
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Item Height</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={((chartConfig as Record<string, unknown>).legends as Record<string, unknown>)?.itemHeight as number ?? 18}
                                  onChange={(e) => handleChartConfigChange('legends', { 
                                    ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                                    itemHeight: parseInt(e.target.value) || 18 
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Items Spacing</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={((chartConfig as Record<string, unknown>).legends as Record<string, unknown>)?.itemsSpacing as number ?? 20}
                                  onChange={(e) => handleChartConfigChange('legends', { 
                                    ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                                    itemsSpacing: parseInt(e.target.value) || 20 
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Symbol Size</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={((chartConfig as Record<string, unknown>).legends as Record<string, unknown>)?.symbolSize as number ?? 12}
                                  onChange={(e) => handleChartConfigChange('legends', { 
                                    ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                                    symbolSize: parseInt(e.target.value) || 12 
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Translate X</label>
                                <input
                                  type="number"
                                  value={((chartConfig as Record<string, unknown>).legends as Record<string, unknown>)?.translateX as number ?? 0}
                                  onChange={(e) => handleChartConfigChange('legends', { 
                                    ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                                    translateX: parseInt(e.target.value) || 0 
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Translate Y</label>
                                <input
                                  type="number"
                                  value={((chartConfig as Record<string, unknown>).legends as Record<string, unknown>)?.translateY as number ?? 50}
                                  onChange={(e) => handleChartConfigChange('legends', { 
                                    ...((chartConfig as Record<string, unknown>).legends as Record<string, unknown> || {}), 
                                    translateY: parseInt(e.target.value) || 50 
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart Type Specific Options */}
                    {isBarChart(selectedWidget as ChartWidget) && (
                      <div>
                        <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">📊 Bar Chart Options</h5>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Group Mode</label>
                            <select
                              value={(chartConfig as BarChartConfig).groupMode || 'grouped'}
                              onChange={(e) => handleChartConfigChange('groupMode', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="grouped">Grouped</option>
                              <option value="stacked">Stacked</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Layout</label>
                            <select
                              value={(chartConfig as BarChartConfig).layout || 'vertical'}
                              onChange={(e) => handleChartConfigChange('layout', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="vertical">Vertical</option>
                              <option value="horizontal">Horizontal</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Line Chart Specific Options */}
                    {isLineChart(selectedWidget as ChartWidget) && (
                      <div>
                        <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">📈 Line Chart Options</h5>
                          <div className="space-y-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={(chartConfig as LineChartConfig).enablePoints ?? true}
                                onChange={(e) => handleChartConfigChange('enablePoints', e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-xs text-gray-600">Enable Points</span>
                            </label>
                            
                            {(chartConfig as LineChartConfig).enablePoints !== false && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Point Size</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={(chartConfig as LineChartConfig).pointSize ?? 4}
                                  onChange={(e) => handleChartConfigChange('pointSize', parseInt(e.target.value) || 4)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            )}
                            
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Line Width</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={(chartConfig as LineChartConfig).lineWidth ?? 2}
                                onChange={(e) => handleChartConfigChange('lineWidth', parseInt(e.target.value) || 2)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Curve Type</label>
                              <select
                                value={(chartConfig as LineChartConfig).curve || 'cardinal'}
                                onChange={(e) => handleChartConfigChange('curve', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="linear">Linear</option>
                                <option value="cardinal">Cardinal</option>
                                <option value="catmullRom">Catmull Rom</option>
                                <option value="monotoneX">Monotone X</option>
                              </select>
                            </div>
                            
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={(chartConfig as LineChartConfig).enableArea ?? false}
                                onChange={(e) => handleChartConfigChange('enableArea', e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-xs text-gray-600">Enable Area</span>
                            </label>
                            
                            {(chartConfig as LineChartConfig).enableArea && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Area Opacity</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={(chartConfig as LineChartConfig).areaOpacity ?? 0.2}
                                  onChange={(e) => handleChartConfigChange('areaOpacity', parseFloat(e.target.value) || 0.2)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            )}
                          </div>
                      </div>
                    )}

                    {/* Pie Chart Specific Options */}
                    {isPieChart(selectedWidget as ChartWidget) && (
                      <div>
                        <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🥧 Pie Chart Options</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Inner Radius</label>
                            <input
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              value={(chartConfig as PieChartConfig).innerRadius ?? 0.5}
                              onChange={(e) => handleChartConfigChange('innerRadius', parseFloat(e.target.value) || 0.5)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Pad Angle</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={(chartConfig as PieChartConfig).padAngle ?? 1}
                              onChange={(e) => handleChartConfigChange('padAngle', parseFloat(e.target.value) || 1)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Corner Radius</label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={(chartConfig as PieChartConfig).cornerRadius ?? 2}
                              onChange={(e) => handleChartConfigChange('cornerRadius', parseInt(e.target.value) || 2)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Active Outer Radius Offset</label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={(chartConfig as PieChartConfig).activeOuterRadiusOffset ?? 4}
                              onChange={(e) => handleChartConfigChange('activeOuterRadiusOffset', parseInt(e.target.value) || 4)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={(chartConfig as PieChartConfig).enableArcLinkLabels ?? false}
                              onChange={(e) => handleChartConfigChange('enableArcLinkLabels', e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600">Enable Arc Link Labels</span>
                          </label>
                          
                          {(chartConfig as PieChartConfig).enableArcLinkLabels && (
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Arc Labels Skip Angle</label>
                              <input
                                type="number"
                                min="0"
                                max="45"
                                value={(chartConfig as PieChartConfig).arcLabelsSkipAngle ?? 15}
                                onChange={(e) => handleChartConfigChange('arcLabelsSkipAngle', parseInt(e.target.value) || 15)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Animation */}
                    <div>
                      <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🎬 Animation</h5>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={chartConfig.animate === true}
                            onChange={(e) => handleChartConfigChange('animate', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-600">Enable Animation</span>
                        </label>
                        {chartConfig.animate === true && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Motion Config</label>
                            <select
                              value={chartConfig.motionConfig || 'gentle'}
                              onChange={(e) => handleChartConfigChange('motionConfig', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="gentle">Gentle</option>
                              <option value="wobbly">Wobbly</option>
                              <option value="stiff">Stiff</option>
                              <option value="slow">Slow</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* KPI-Specific Configuration */}
                {selectedWidget && isKPIWidget(selectedWidget) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">📊 KPI Configuration</h4>
                    
                    <div className="space-y-6">
                      {/* Data & Values */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">📈 Data & Values</h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">KPI Name</label>
                            <input
                              type="text"
                              value={editKPIForm.name}
                              onChange={(e) => handleKPIFormChange('name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Sales Revenue"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                              <input
                                type="text"
                                value={editKPIForm.unit}
                                onChange={(e) => handleKPIFormChange('unit', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="$, %, units"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Current Value</label>
                              <input
                                type="number"
                                step="any"
                                value={kpiConfig.value || ''}
                                onChange={(e) => handleKPIConfigChange('value', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="1247"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Target Value</label>
                              <input
                                type="number"
                                step="any"
                                value={kpiConfig.target || ''}
                                onChange={(e) => handleKPIConfigChange('target', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="1500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Change %</label>
                              <input
                                type="number"
                                step="0.1"
                                value={kpiConfig.change || ''}
                                onChange={(e) => handleKPIConfigChange('change', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="7.9"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    

                      {/* Colors & Styling */}
                      <div>
                        <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🎨 Colors & Styling</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Color Scheme</label>
                          <select
                            value={kpiConfig.colorScheme || 'blue'}
                            onChange={(e) => handleKPIConfigChange('colorScheme', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="green">🟢 Green</option>
                            <option value="blue">🔵 Blue</option>
                            <option value="orange">🟠 Orange</option>
                            <option value="red">🔴 Red</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                          <input
                            type="color"
                            value={kpiConfig.backgroundColor || '#ffffff'}
                            onChange={(e) => handleKPIConfigChange('backgroundColor', e.target.value)}
                            className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                            <input
                              type="color"
                              value={kpiConfig.borderColor || '#e5e7eb'}
                              onChange={(e) => handleKPIConfigChange('borderColor', e.target.value)}
                              className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              value={kpiConfig.borderWidth || 1}
                              onChange={(e) => handleKPIConfigChange('borderWidth', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={kpiConfig.borderRadius || 8}
                              onChange={(e) => handleKPIConfigChange('borderRadius', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex items-center">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                              <input
                                type="checkbox"
                                checked={kpiConfig.shadow !== false}
                                onChange={(e) => handleKPIConfigChange('shadow', e.target.checked)}
                                className="rounded"
                              />
                              Drop Shadow
                            </label>
                          </div>
                        </div>
                        </div>
                      </div>

                      {/* Typography */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">✍️ Typography</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Value Styling</label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                              <input
                                type="range"
                                min="16"
                                max="72"
                                step="2"
                                value={kpiConfig.valueFontSize || 36}
                                onChange={(e) => handleKPIConfigChange('valueFontSize', parseInt(e.target.value))}
                                className="w-full"
                              />
                              <span className="text-xs text-gray-500">{kpiConfig.valueFontSize || 36}px</span>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Color</label>
                              <input
                                type="color"
                                value={kpiConfig.valueColor || '#1f2937'}
                                onChange={(e) => handleKPIConfigChange('valueColor', e.target.value)}
                                className="w-full h-8 border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Weight</label>
                              <select
                                value={kpiConfig.valueFontWeight || 700}
                                onChange={(e) => handleKPIConfigChange('valueFontWeight', parseInt(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value={400}>Normal</option>
                                <option value={500}>Medium</option>
                                <option value={600}>Semi Bold</option>
                                <option value={700}>Bold</option>
                                <option value={800}>Extra Bold</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Name Styling</label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                              <input
                                type="range"
                                min="10"
                                max="24"
                                step="1"
                                value={kpiConfig.nameFontSize || 14}
                                onChange={(e) => handleKPIConfigChange('nameFontSize', parseInt(e.target.value))}
                                className="w-full"
                              />
                              <span className="text-xs text-gray-500">{kpiConfig.nameFontSize || 14}px</span>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Color</label>
                              <input
                                type="color"
                                value={kpiConfig.nameColor || '#6b7280'}
                                onChange={(e) => handleKPIConfigChange('nameColor', e.target.value)}
                                className="w-full h-8 border border-gray-300 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Weight</label>
                              <select
                                value={kpiConfig.nameFontWeight || 500}
                                onChange={(e) => handleKPIConfigChange('nameFontWeight', parseInt(e.target.value))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value={400}>Normal</option>
                                <option value={500}>Medium</option>
                                <option value={600}>Semi Bold</option>
                                <option value={700}>Bold</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Change Color</label>
                            <input
                              type="color"
                              value={kpiConfig.changeColor || '#16a34a'}
                              onChange={(e) => handleKPIConfigChange('changeColor', e.target.value)}
                              className="w-full h-8 border border-gray-300 rounded"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Target Color</label>
                            <input
                              type="color"
                              value={kpiConfig.targetColor || '#9ca3af'}
                              onChange={(e) => handleKPIConfigChange('targetColor', e.target.value)}
                              className="w-full h-8 border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                        </div>
                      </div>

                      {/* Layout & Spacing */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">📐 Layout & Spacing</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Text Alignment</label>
                          <div className="flex gap-1">
                            {[
                              { value: 'left', icon: '⬅️', label: 'Left' },
                              { value: 'center', icon: '⬆️', label: 'Center' },
                              { value: 'right', icon: '➡️', label: 'Right' }
                            ].map((align) => (
                              <button
                                key={align.value}
                                onClick={() => handleKPIConfigChange('textAlign', align.value)}
                                className={`flex-1 px-3 py-2 text-xs border rounded-md transition-colors ${
                                  (kpiConfig.textAlign || 'center') === align.value
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <span className="mr-1">{align.icon}</span>
                                {align.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
                          <input
                            type="range"
                            min="4"
                            max="32"
                            step="2"
                            value={kpiConfig.padding || 16}
                            onChange={(e) => handleKPIConfigChange('padding', parseInt(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>4px</span>
                            <span className="font-medium">{kpiConfig.padding || 16}px</span>
                            <span>32px</span>
                          </div>
                        </div>
                        </div>
                      </div>

                      {/* Display Options */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-3">📊 Display Options</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Visualization Type</label>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { value: 'card', icon: '📊', label: 'Card' },
                              { value: 'display', icon: '💻', label: 'Display' },
                              { value: 'gauge', icon: '⏲️', label: 'Gauge' }
                            ].map((type) => (
                              <button
                                key={type.value}
                                onClick={() => handleKPIConfigChange('visualizationType', type.value)}
                                className={`px-2 py-2 text-xs border rounded-md transition-colors ${
                                  (kpiConfig.visualizationType || 'card') === type.value
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="text-sm mb-1">{type.icon}</div>
                                  <div>{type.label}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={kpiConfig.showTarget !== false}
                              onChange={(e) => handleKPIConfigChange('showTarget', e.target.checked)}
                              className="rounded"
                            />
                            <span className="font-medium text-gray-600">Show Target Value</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={kpiConfig.showTrend !== false}
                              onChange={(e) => handleKPIConfigChange('showTrend', e.target.checked)}
                              className="rounded"
                            />
                            <span className="font-medium text-gray-600">Show Trend Indicator</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={kpiConfig.enableSimulation !== false}
                              onChange={(e) => handleKPIConfigChange('enableSimulation', e.target.checked)}
                              className="rounded"
                            />
                            <span className="font-medium text-gray-600">Enable Live Simulation</span>
                          </label>
                        </div>
                        {kpiConfig.enableSimulation !== false && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">Simulation Range</label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Min Value</label>
                                <input
                                  type="number"
                                  value={kpiConfig.simulationRange?.min || 800}
                                  onChange={(e) => handleKPIConfigChange('simulationRange', {
                                    ...kpiConfig.simulationRange,
                                    min: parseInt(e.target.value) || 800
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder="800"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Max Value</label>
                                <input
                                  type="number"
                                  value={kpiConfig.simulationRange?.max || 1400}
                                  onChange={(e) => handleKPIConfigChange('simulationRange', {
                                    ...kpiConfig.simulationRange,
                                    max: parseInt(e.target.value) || 1400
                                  })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                  placeholder="1400"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
          ) : (
            <div className="border-t pt-4">
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🎨</span>
                <p className="text-gray-500 mb-2">No selection</p>
                <p className="text-sm text-gray-400">
                  Click on &quot;Canvas Settings&quot; or a widget to start editing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}