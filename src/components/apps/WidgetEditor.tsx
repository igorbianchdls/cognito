'use client'

import { useStore } from '@nanostores/react'
import { $widgets, $selectedWidget, $selectedWidgetId, widgetActions } from '@/stores/widgetStore'
import { chartActions } from '@/stores/chartStore'
import { kpiActions } from '@/stores/kpiStore'
import { useState, useEffect, useMemo } from 'react'
import type { ChartWidget, BarChartConfig } from '@/types/chartWidgets'
import { isChartWidget, isBarChart } from '@/types/chartWidgets'
import type { KPIWidget } from '@/types/kpiWidgets'
import { isKPIWidget } from '@/types/kpiWidgets'
import type { DroppedWidget } from '@/types/widget'

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

  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    colors: true,
    grid: false,
    labels: false,
    legends: false,
    axes: false,
    chartSpecific: true,
    animation: false
  })

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
    console.log('🔍 WidgetEditor KPI estrutura:', {
      id: selectedWidget?.i,
      type: selectedWidget?.type,
      configStructure: selectedWidget?.config,
      configKpiConfig: selectedWidget?.config?.kpiConfig
    })
    
    // Acesso correto via adapter structure
    const config = selectedWidget.config?.kpiConfig || {}
    console.log('🎯 WidgetEditor computed kpiConfig final:', config)
    return config
  }, [selectedWidget])

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
  }, [selectedWidgetId]) // Changed to selectedWidgetId to avoid reference changes

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

  // Toggle section expansion
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Collapsible section component
  const CollapsibleSection = ({ 
    title, 
    sectionKey, 
    children 
  }: { 
    title: string
    sectionKey: keyof typeof expandedSections
    children: React.ReactNode 
  }) => (
    <div className="mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-colors"
      >
        <span>{title}</span>
        <span className={`transform transition-transform ${expandedSections[sectionKey] ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>
      {expandedSections[sectionKey] && (
        <div className="mt-3 pl-3 border-l-2 border-gray-200">
          {children}
        </div>
      )}
    </div>
  )

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
                    
                    {/* Colors & Styling Section */}
                    <CollapsibleSection title="🎨 Colors & Styling" sectionKey="colors">
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
                              value={(chartConfig as any).borderRadius ?? 4}
                              onChange={(e) => handleChartConfigChange('borderRadius', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Border Width</label>
                            <input
                              type="number"
                              min="0"
                              value={(chartConfig as any).borderWidth ?? 0}
                              onChange={(e) => handleChartConfigChange('borderWidth', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    </CollapsibleSection>

                    {/* Grid & Axes Section */}
                    <CollapsibleSection title="📐 Grid & Axes" sectionKey="grid">
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
                    </CollapsibleSection>

                    {/* Labels Section */}
                    <CollapsibleSection title="🏷️ Labels" sectionKey="labels">
                      <div className="space-y-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={(chartConfig as any).enableLabel || false}
                            onChange={(e) => handleChartConfigChange('enableLabel', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-xs text-gray-600">Enable Labels</span>
                        </label>
                        
                        {(chartConfig as any).enableLabel && (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Label Position</label>
                              <select
                                value={(chartConfig as any).labelPosition || 'middle'}
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
                                  value={(chartConfig as any).labelSkipWidth ?? 0}
                                  onChange={(e) => handleChartConfigChange('labelSkipWidth', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Skip Height</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={(chartConfig as any).labelSkipHeight ?? 0}
                                  onChange={(e) => handleChartConfigChange('labelSkipHeight', parseInt(e.target.value) || 0)}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>

                    {/* Chart Type Specific Options */}
                    {isBarChart(selectedWidget as ChartWidget) && (
                      <CollapsibleSection title="📊 Bar Chart Options" sectionKey="chartSpecific">
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
                      </CollapsibleSection>
                    )}

                    {/* Animation Section */}
                    <CollapsibleSection title="🎬 Animation" sectionKey="animation">
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
                    </CollapsibleSection>
                  </div>
                )}

                {/* KPI-Specific Configuration */}
                {selectedWidget && isKPIWidget(selectedWidget) && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">KPI Configuration</h4>
                    
                    {/* KPI Data */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Data</label>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Name</label>
                          <input
                            type="text"
                            value={kpiConfig.name || ''}
                            onChange={(e) => handleKPIConfigChange('name', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="KPI Name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Value</label>
                            <input
                              type="number"
                              value={kpiConfig.value || 0}
                              onChange={(e) => handleKPIConfigChange('value', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Unit</label>
                            <input
                              type="text"
                              value={kpiConfig.unit || ''}
                              onChange={(e) => handleKPIConfigChange('unit', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="$, %, etc."
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Target</label>
                          <input
                            type="number"
                            value={kpiConfig.target || 0}
                            onChange={(e) => handleKPIConfigChange('target', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* KPI Display Options */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Display</label>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Visualization Type</label>
                          <select
                            value={kpiConfig.visualizationType || 'card'}
                            onChange={(e) => handleKPIConfigChange('visualizationType', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="card">Card</option>
                            <option value="display">Display</option>
                            <option value="gauge">Gauge</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Color Scheme</label>
                          <select
                            value={kpiConfig.colorScheme || 'blue'}
                            onChange={(e) => handleKPIConfigChange('colorScheme', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="green">Green</option>
                            <option value="blue">Blue</option>
                            <option value="orange">Orange</option>
                            <option value="red">Red</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={kpiConfig.showTarget !== false}
                              onChange={(e) => handleKPIConfigChange('showTarget', e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600">Show Target</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={kpiConfig.showTrend !== false}
                              onChange={(e) => handleKPIConfigChange('showTrend', e.target.checked)}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600">Show Trend</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* KPI Typography */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Typography</label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Value Font Size</label>
                            <input
                              type="number"
                              min="12"
                              max="72"
                              value={kpiConfig.valueFontSize || 36}
                              onChange={(e) => handleKPIConfigChange('valueFontSize', parseInt(e.target.value) || 36)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Name Font Size</label>
                            <input
                              type="number"
                              min="8"
                              max="24"
                              value={kpiConfig.nameFontSize || 14}
                              onChange={(e) => handleKPIConfigChange('nameFontSize', parseInt(e.target.value) || 14)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Text Alignment</label>
                          <select
                            value={kpiConfig.textAlign || 'center'}
                            onChange={(e) => handleKPIConfigChange('textAlign', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
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
          )}
        </div>
      </div>
    </div>
  )
}