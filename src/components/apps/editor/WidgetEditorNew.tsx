'use client'

import { useStore } from '@nanostores/react'
import { $widgets, $selectedWidget, $selectedWidgetId, widgetActions } from '@/stores/apps/widgetStore'
import { $canvasConfig } from '@/stores/apps/canvasStore'
import { kpiActions } from '@/stores/apps/kpiStore'
import { tableActions } from '@/stores/apps/tableStore'
import { chartActions } from '@/stores/apps/chartStore'
import { useState, useEffect, useMemo } from 'react'
import { isKPIWidget } from '@/types/apps/kpiWidgets'
import type { KPIConfig } from '@/types/apps/kpiWidgets'
import { isImageWidget, isNavigationWidget } from '@/types/apps/widget'
import type { ImageConfig, NavigationConfig, ContainerConfig } from '@/types/apps/widget'
import { isTableWidget } from '@/types/apps/tableWidgets'
import type { TableConfig } from '@/types/apps/tableWidgets'
import { isChartWidget } from '@/types/apps/chartWidgets'
import type { BaseChartConfig } from '@/types/apps/chartWidgets'
import KPIConfigEditor from '../editors/KPIConfigEditor'
import ImageConfigEditor from '../editors/ImageConfigEditor'
import TableConfigEditor from '../editors/TableConfigEditor'
import ChartConfigEditor from '../editors/ChartConfigEditor'
import NavigationConfigEditor from '../editors/NavigationConfigEditor'
import ContainerConfigEditor from '../editors/ContainerConfigEditor'
import { ColorInput, NumberInput } from '../editors/controls'
import { Slider } from '@/components/ui/slider'

export default function WidgetEditorNew() {
  const widgets = useStore($widgets)
  const selectedWidget = useStore($selectedWidget)
  const selectedWidgetId = useStore($selectedWidgetId)
  const canvasConfig = useStore($canvasConfig)
  
  // State para controlar o modo de view: 'widgets' ou 'edit'
  const [viewMode, setViewMode] = useState<'widgets' | 'edit'>('widgets')
  
  // State para controlar a tab ativa no edit view
  const [activeEditTab, setActiveEditTab] = useState<'design' | 'layout' | 'data'>('design')
  
  // State para controlar se canvas está selecionado
  const [canvasSelected, setCanvasSelected] = useState(widgets.length === 0)

  // KPI form state - seguindo mesmo padrão do original
  const [editKPIForm, setEditKPIForm] = useState({
    name: '',
    unit: ''
  })

  // Image form state - seguindo mesmo padrão do original
  const [editImageForm, setEditImageForm] = useState({
    src: '',
    alt: '',
    title: '',
    objectFit: 'cover',
    objectPosition: 'center'
  })

  // Computed KPI config - acesso via selectedWidget
  const kpiConfig = useMemo((): KPIConfig => {
    if (!selectedWidget || !isKPIWidget(selectedWidget)) return {} as KPIConfig
    
    const config = selectedWidget.config?.kpiConfig || {} as KPIConfig
    console.log('🎯 WidgetEditorNew computed kpiConfig:', config)
    return config
  }, [selectedWidget])

  // Computed Image config - acesso via selectedWidget
  const imageConfig = useMemo((): ImageConfig => {
    if (!selectedWidget || !isImageWidget(selectedWidget)) return {} as ImageConfig
    
    const config = selectedWidget.config?.imageConfig || {} as ImageConfig
    console.log('🎯 WidgetEditorNew computed imageConfig:', config)
    return config
  }, [selectedWidget])

  // Computed Table config - acesso via selectedWidget
  const tableConfig = useMemo((): TableConfig => {
    if (!selectedWidget || !isTableWidget(selectedWidget)) return {} as TableConfig
    
    const config = selectedWidget.config?.tableConfig || {} as TableConfig
    console.log('🎯 WidgetEditorNew computed tableConfig:', config)
    return config
  }, [
    selectedWidget,
    selectedWidget?.config?.tableConfig?.fontSize,
    selectedWidget?.config?.tableConfig?.padding,
    selectedWidget?.config?.tableConfig?.headerBackground,
    selectedWidget?.config?.tableConfig?.headerTextColor,
    selectedWidget?.config?.tableConfig?.rowHoverColor,
    selectedWidget?.config?.tableConfig?.borderColor,
    selectedWidget?.config?.tableConfig?.searchPlaceholder,
    selectedWidget?.config?.tableConfig?.pageSize,
    selectedWidget?.config?.tableConfig?.showPagination,
    selectedWidget?.config?.tableConfig?.showColumnToggle,
    selectedWidget?.config?.tableConfig?.enableSearch,
    selectedWidget?.config?.tableConfig?.enableFiltering,
    selectedWidget?.config?.tableConfig?.enableRowSelection,
    selectedWidget?.config?.tableConfig?.selectionMode,
    selectedWidget?.config?.tableConfig?.enableSimulation,
    selectedWidget?.config?.tableConfig?.dataSource,
    selectedWidget?.config?.tableConfig?.enableExport,
    selectedWidget?.config?.tableConfig?.exportFormats,
    selectedWidget?.config?.tableConfig?.columns
  ])

  // Computed Chart config - acesso via selectedWidget
  const chartConfig = useMemo((): BaseChartConfig => {
    if (!selectedWidget || !isChartWidget(selectedWidget)) return {} as BaseChartConfig
    
    // Primeiro tenta o novo formato (config.chartConfig), depois o formato deprecated (chartConfig direto)
    const config = selectedWidget.config?.chartConfig || selectedWidget.chartConfig || {} as BaseChartConfig
    console.log('🎯 WidgetEditorNew computed chartConfig:', config)
    return config
  }, [
    selectedWidget,
    selectedWidget?.config?.chartConfig?.backgroundColor,
    selectedWidget?.config?.chartConfig?.borderColor,
    selectedWidget?.config?.chartConfig?.borderRadius,
    selectedWidget?.config?.chartConfig?.borderWidth,
    selectedWidget?.config?.chartConfig?.enableGridX,
    selectedWidget?.config?.chartConfig?.enableGridY,
    selectedWidget?.config?.chartConfig?.axisBottom,
    selectedWidget?.config?.chartConfig?.axisLeft,
    selectedWidget?.config?.chartConfig?.margin,
    selectedWidget?.config?.chartConfig?.padding,
    selectedWidget?.config?.chartConfig?.title,
    selectedWidget?.config?.chartConfig?.subtitle,
    selectedWidget?.config?.chartConfig?.titleFontSize,
    selectedWidget?.config?.chartConfig?.titleColor,
    selectedWidget?.config?.chartConfig?.titleFontWeight,
    selectedWidget?.config?.chartConfig?.subtitleFontSize,
    selectedWidget?.config?.chartConfig?.subtitleColor,
    selectedWidget?.config?.chartConfig?.subtitleFontWeight,
    selectedWidget?.config?.chartConfig?.showTitle,
    selectedWidget?.config?.chartConfig?.showSubtitle,
    selectedWidget?.config?.chartConfig?.enableLabel,
    selectedWidget?.config?.chartConfig?.labelTextColor,
    selectedWidget?.config?.chartConfig?.labelPosition,
    selectedWidget?.config?.chartConfig?.labelSkipWidth,
    selectedWidget?.config?.chartConfig?.labelSkipHeight,
    selectedWidget?.config?.chartConfig?.animate,
    selectedWidget?.config?.chartConfig?.motionConfig,
    // Fallback para formato deprecated
    selectedWidget?.chartConfig
  ])

  // Computed Navigation config - acesso via selectedWidget
  const navigationConfig = useMemo((): NavigationConfig => {
    if (!selectedWidget || !isNavigationWidget(selectedWidget)) return {} as NavigationConfig
    
    const config = selectedWidget.config?.navigationConfig || {} as NavigationConfig
    console.log('🎯 WidgetEditorNew computed navigationConfig:', config)
    return config
  }, [selectedWidget])

  // Computed Container config - applies to all widgets
  const containerConfig = useMemo((): ContainerConfig => {
    if (!selectedWidget) return {} as ContainerConfig
    
    const config = selectedWidget.config?.containerConfig || {} as ContainerConfig
    console.log('🎯 WidgetEditorNew computed containerConfig:', config)
    return config
  }, [
    selectedWidget,
    selectedWidget?.config?.containerConfig?.backgroundColor,
    selectedWidget?.config?.containerConfig?.backgroundOpacity,
    selectedWidget?.config?.containerConfig?.borderColor,
    selectedWidget?.config?.containerConfig?.borderOpacity,
    selectedWidget?.config?.containerConfig?.borderWidth,
    selectedWidget?.config?.containerConfig?.borderRadius
  ])

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

  // Sync editImageForm with imageConfig when widget changes
  useEffect(() => {
    if (selectedWidget && isImageWidget(selectedWidget)) {
      const config = selectedWidget.config?.imageConfig || {}
      setEditImageForm({
        src: config.src || '',
        alt: config.alt || '',
        title: config.title || '',
        objectFit: config.objectFit || 'cover',
        objectPosition: config.objectPosition || 'center'
      })
    }
  }, [
    selectedWidget?.config?.imageConfig?.src,
    selectedWidget?.config?.imageConfig?.alt,
    selectedWidget?.config?.imageConfig?.title,
    selectedWidget?.config?.imageConfig?.objectFit,
    selectedWidget?.config?.imageConfig?.objectPosition,
    selectedWidget
  ])

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

  // Image Handlers
  const handleImageConfigChange = (field: string, value: unknown) => {
    console.log('⚙️ WidgetEditorNew handleImageConfigChange:', { field, value })
    
    if (selectedWidget && isImageWidget(selectedWidget)) {
      console.log('⚙️ WidgetEditorNew calling widgetActions.editWidget for imageConfig:', selectedWidget.i, { [field]: value })
      
      // Get current imageConfig and update the specific field
      const currentImageConfig = selectedWidget.config?.imageConfig || {}
      const newImageConfig = { ...currentImageConfig, [field]: value }
      
      console.log('📝 New imageConfig:', newImageConfig)
      
      // Update the widget with the new imageConfig
      const updatePayload = {
        config: {
          ...selectedWidget.config,
          imageConfig: newImageConfig
        }
      }
      
      widgetActions.editWidget(selectedWidget.i, updatePayload)
    }
  }

  // Handle image upload and convert to Base64
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ handleImageUpload triggered', event)
    
    const file = event.target.files?.[0]
    console.log('📁 Selected file:', file)
    
    if (!file) {
      console.log('❌ No file selected')
      return
    }

    // Log file info
    console.log('📄 File info:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeKB: Math.round(file.size / 1024)
    })

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      console.log('❌ Invalid file type:', file.type)
      alert('Please select a valid image file (PNG, JPG, GIF, WebP)')
      return
    }
    console.log('✅ File type valid:', file.type)

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      console.log('❌ File too large:', file.size, 'bytes')
      alert('File size must be less than 2MB')
      return
    }
    console.log('✅ File size valid:', file.size, 'bytes')

    // Convert to Base64
    console.log('🔄 Starting Base64 conversion...')
    const reader = new FileReader()
    reader.onload = (e) => {
      console.log('📖 FileReader onload triggered')
      const base64 = e.target?.result as string
      console.log('📝 Base64 result:', base64 ? `${base64.slice(0, 50)}...` : 'null')
      
      if (base64) {
        console.log('📤 Calling handleImageConfigChange with src:', base64.slice(0, 50) + '...')
        handleImageConfigChange('src', base64)
        
        // Set default alt if empty
        if (!editImageForm.alt) {
          const fileName = file.name.split('.')[0]
          console.log('📝 Setting default alt text:', fileName)
          handleImageConfigChange('alt', fileName)
        }
        console.log('✅ Image upload completed successfully')
      } else {
        console.log('❌ Base64 conversion failed')
        alert('Failed to process image file')
      }
    }
    reader.onerror = () => {
      console.log('❌ FileReader error')
      alert('Error reading file')
    }
    reader.readAsDataURL(file)
  }

  // Handle removing image
  const handleImageRemove = () => {
    handleImageConfigChange('src', '')
  }

  // Table Handlers
  const handleTableConfigChange = (field: string, value: unknown) => {
    console.log('⚙️ WidgetEditorNew handleTableConfigChange:', { field, value })
    
    if (selectedWidget && isTableWidget(selectedWidget)) {
      console.log('⚙️ WidgetEditorNew calling tableActions.updateTableConfig:', selectedWidget.i, { [field]: value })
      tableActions.updateTableConfig(selectedWidget.i, { [field]: value })
    }
  }

  // Chart Handlers
  const handleChartConfigChange = (field: string, value: unknown) => {
    console.log('⚙️ WidgetEditorNew handleChartConfigChange:', { field, value })
    
    if (selectedWidget && isChartWidget(selectedWidget)) {
      console.log('⚙️ WidgetEditorNew calling chartActions.updateChartConfig:', selectedWidget.i, { [field]: value })
      chartActions.updateChartConfig(selectedWidget.i, { [field]: value })
    }
  }

  // Navigation Handlers
  const handleNavigationConfigChange = (field: string, value: unknown) => {
    console.log('⚙️ WidgetEditorNew handleNavigationConfigChange:', { field, value })
    
    if (selectedWidget && isNavigationWidget(selectedWidget)) {
      console.log('⚙️ WidgetEditorNew calling widgetActions.editWidget for navigationConfig:', selectedWidget.i, { [field]: value })
      
      // Get current navigationConfig and update the specific field
      const currentNavigationConfig = selectedWidget.config?.navigationConfig || {}
      const newNavigationConfig = { ...currentNavigationConfig, [field]: value }
      
      console.log('📝 New navigationConfig:', newNavigationConfig)
      
      // Update the widget with the new navigationConfig
      const updatePayload = {
        config: {
          ...selectedWidget.config,
          navigationConfig: newNavigationConfig
        }
      }
      
      widgetActions.editWidget(selectedWidget.i, updatePayload)
    }
  }

  // Container Handlers
  const handleContainerConfigChange = (field: string, value: unknown) => {
    console.log('⚙️ WidgetEditorNew handleContainerConfigChange:', { field, value })
    
    if (selectedWidget) {
      console.log('⚙️ WidgetEditorNew calling widgetActions.editWidget for containerConfig:', selectedWidget.i, { [field]: value })
      
      // Get current containerConfig and update the specific field
      const currentContainerConfig = selectedWidget.config?.containerConfig || {}
      const newContainerConfig = { ...currentContainerConfig, [field]: value }
      
      console.log('📝 New containerConfig:', newContainerConfig)
      
      // Update the widget with the new containerConfig
      const updatePayload = {
        config: {
          ...selectedWidget.config,
          containerConfig: newContainerConfig
        }
      }
      
      widgetActions.editWidget(selectedWidget.i, updatePayload)
    }
  }

  // Position & Size Handlers (for direct widget properties)
  const handleWidgetPositionChange = (field: string, value: number) => {
    console.log('📍 WidgetEditorNew handleWidgetPositionChange:', { field, value })
    
    if (selectedWidget) {
      console.log('📍 WidgetEditorNew calling widgetActions.editWidget for position:', selectedWidget.i, { [field]: value })
      
      // Update widget position/size directly
      const updatePayload = { [field]: value }
      widgetActions.editWidget(selectedWidget.i, updatePayload)
    }
  }

  // Handlers
  const handleSelectCanvas = () => {
    setCanvasSelected(true)
    widgetActions.selectWidget(null)
    setViewMode('edit') // Navegar para view de edição
  }

  const handleSelectWidget = (widgetId: string) => {
    setCanvasSelected(false)
    widgetActions.selectWidget(widgetId)
    setViewMode('edit') // Navegar para view de edição
  }

  // Voltar para lista de widgets
  const handleBackToWidgets = () => {
    setViewMode('widgets')
    // Opcional: desselecionar widget ao voltar
    // widgetActions.selectWidget(null)
    // setCanvasSelected(false)
  }

  // Caso não haja widgets
  if (widgets.length === 0) {
    return (
      <div className="flex flex-col bg-gray-50" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Header */}
        <div className="p-4 border-b border-[0.5px] border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Widget Editor</h2>
          <p className="text-sm text-gray-600 mt-2">
            Edit widget properties manually
          </p>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <p className="text-gray-600 mb-2">No widgets on canvas</p>
            <p className="text-sm text-gray-600">
              Drag widgets from the Widgets tab to get started
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Renderização das tabs do chart editor
  const renderChartDesignTab = () => (
    <div className="space-y-6">
      {/* Visual & Colors */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">🎨 Visual & Colors</h3>
        <div className="space-y-4">
          {/* Background */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Background</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 min-w-4 min-h-4 flex-shrink-0 rounded cursor-pointer border border-gray-300"
                    style={{ backgroundColor: chartConfig.backgroundColor || '#ffffff' }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = chartConfig.backgroundColor || '#ffffff';
                      input.onchange = (e) => handleChartConfigChange('backgroundColor', (e.target as HTMLInputElement).value);
                      input.click();
                    }}
                  />
                  <input
                    type="text"
                    value={(chartConfig.backgroundColor || '#ffffff').replace('#', '').toUpperCase()}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '');
                      if (/^[0-9A-Fa-f]{0,6}$/.test(hex)) {
                        handleChartConfigChange('backgroundColor', `#${hex}`);
                      }
                    }}
                    className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(((chartConfig as Record<string, unknown>).backgroundOpacity as number ?? 1) * 100)}
                    onChange={(e) => {
                      const opacity = Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) / 100;
                      handleChartConfigChange('backgroundOpacity', opacity);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Border */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Border</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 min-w-4 min-h-4 flex-shrink-0 rounded cursor-pointer border border-gray-300"
                    style={{ backgroundColor: chartConfig.borderColor || '#e5e7eb' }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = chartConfig.borderColor || '#e5e7eb';
                      input.onchange = (e) => handleChartConfigChange('borderColor', (e.target as HTMLInputElement).value);
                      input.click();
                    }}
                  />
                  <input
                    type="text"
                    value={(chartConfig.borderColor || '#e5e7eb').replace('#', '').toUpperCase()}
                    onChange={(e) => {
                      const hex = e.target.value.replace('#', '');
                      if (/^[0-9A-Fa-f]{0,6}$/.test(hex)) {
                        handleChartConfigChange('borderColor', `#${hex}`);
                      }
                    }}
                    className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                    maxLength={6}
                  />
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={chartConfig.borderWidth || 0}
                    onChange={(e) => {
                      const width = Math.max(0, Math.min(10, parseInt(e.target.value) || 0));
                      handleChartConfigChange('borderWidth', width);
                    }}
                    className="w-full h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title & Text */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">✍️ Title & Text</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title Text</label>
            <input
              type="text"
              value={chartConfig.title || ''}
              onChange={(e) => handleChartConfigChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Chart Title"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput
              label="Font Size"
              value={chartConfig.titleFontSize || 16}
              onChange={(value) => handleChartConfigChange('titleFontSize', value)}
              min={12}
              max={32}
              step={1}
              suffix="px"
            />
            <ColorInput
              label="Color"
              value={chartConfig.titleColor || '#1f2937'}
              onChange={(value) => handleChartConfigChange('titleColor', value)}
            />
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
              <select
                value={chartConfig.titleFontWeight || 600}
                onChange={(e) => handleChartConfigChange('titleFontWeight', parseInt(e.target.value))}
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
      </div>

      {/* Animation */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">🎬 Animation</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={chartConfig.animate !== false}
              onChange={(e) => handleChartConfigChange('animate', e.target.checked)}
              className="rounded"
            />
            Enable Animation
          </label>
          {chartConfig.animate !== false && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Motion Config</label>
              <select
                value={chartConfig.motionConfig || 'default'}
                onChange={(e) => handleChartConfigChange('motionConfig', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="default">Default</option>
                <option value="gentle">Gentle</option>
                <option value="wobbly">Wobbly</option>
                <option value="stiff">Stiff</option>
                <option value="slow">Slow</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Container Configuration - Design Tab Only */}
      {selectedWidget && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <ContainerConfigEditor
            selectedWidget={selectedWidget}
            containerConfig={containerConfig}
            onContainerConfigChange={handleContainerConfigChange}
          />
        </div>
      )}
    </div>
  )

  const renderChartLayoutTab = () => (
    <div className="space-y-6">
      {/* Layout & Spacing */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📏 Layout & Spacing</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Margin</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <NumberInput
                  label="Top"
                  value={chartConfig.margin?.top || 60}
                  onChange={(value) => handleChartConfigChange('margin', { ...chartConfig.margin, top: value })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
              <div>
                <NumberInput
                  label="Right"
                  value={chartConfig.margin?.right || 80}
                  onChange={(value) => handleChartConfigChange('margin', { ...chartConfig.margin, right: value })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
              <div>
                <NumberInput
                  label="Bottom"
                  value={chartConfig.margin?.bottom || 60}
                  onChange={(value) => handleChartConfigChange('margin', { ...chartConfig.margin, bottom: value })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
              <div>
                <NumberInput
                  label="Left"
                  value={chartConfig.margin?.left || 60}
                  onChange={(value) => handleChartConfigChange('margin', { ...chartConfig.margin, left: value })}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
            </div>
          </div>
          <div>
            <NumberInput
              label="Padding"
              value={chartConfig.padding || 0}
              onChange={(value) => handleChartConfigChange('padding', value)}
              min={0}
              max={50}
              step={1}
              suffix="px"
            />
          </div>
        </div>
      </div>

      {/* Grid & Axes */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📐 Grid & Axes</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={chartConfig.enableGridX !== false}
                onChange={(e) => handleChartConfigChange('enableGridX', e.target.checked)}
                className="rounded"
              />
              Enable Grid X
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={chartConfig.enableGridY !== false}
                onChange={(e) => handleChartConfigChange('enableGridY', e.target.checked)}
                className="rounded"
              />
              Enable Grid Y
            </label>
          </div>
          
          {/* Bottom Axis */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Bottom Axis</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Legend</label>
                <input
                  type="text"
                  value={chartConfig.axisBottom?.legend || ''}
                  onChange={(e) => handleChartConfigChange('axisBottom', { ...chartConfig.axisBottom, legend: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="X-axis label"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <NumberInput
                    label="Rotation"
                    value={chartConfig.axisBottom?.tickRotation || 0}
                    onChange={(value) => handleChartConfigChange('axisBottom', { ...chartConfig.axisBottom, tickRotation: value })}
                    min={-90}
                    max={90}
                    step={15}
                    suffix="°"
                  />
                </div>
                <div>
                  <NumberInput
                    label="Tick Size"
                    value={chartConfig.axisBottom?.tickSize || 5}
                    onChange={(value) => handleChartConfigChange('axisBottom', { ...chartConfig.axisBottom, tickSize: value })}
                    min={0}
                    max={20}
                    step={1}
                    suffix="px"
                  />
                </div>
                <div>
                  <NumberInput
                    label="Padding"
                    value={chartConfig.axisBottom?.tickPadding || 5}
                    onChange={(value) => handleChartConfigChange('axisBottom', { ...chartConfig.axisBottom, tickPadding: value })}
                    min={0}
                    max={20}
                    step={1}
                    suffix="px"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Left Axis */}
          <div className="border border-gray-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Left Axis</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Legend</label>
                <input
                  type="text"
                  value={chartConfig.axisLeft?.legend || ''}
                  onChange={(e) => handleChartConfigChange('axisLeft', { ...chartConfig.axisLeft, legend: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Y-axis label"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <NumberInput
                    label="Rotation"
                    value={chartConfig.axisLeft?.tickRotation || 0}
                    onChange={(value) => handleChartConfigChange('axisLeft', { ...chartConfig.axisLeft, tickRotation: value })}
                    min={-90}
                    max={90}
                    step={15}
                    suffix="°"
                  />
                </div>
                <div>
                  <NumberInput
                    label="Tick Size"
                    value={chartConfig.axisLeft?.tickSize || 5}
                    onChange={(value) => handleChartConfigChange('axisLeft', { ...chartConfig.axisLeft, tickSize: value })}
                    min={0}
                    max={20}
                    step={1}
                    suffix="px"
                  />
                </div>
                <div>
                  <NumberInput
                    label="Padding"
                    value={chartConfig.axisLeft?.tickPadding || 5}
                    onChange={(value) => handleChartConfigChange('axisLeft', { ...chartConfig.axisLeft, tickPadding: value })}
                    min={0}
                    max={20}
                    step={1}
                    suffix="px"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderChartDataTab = () => (
    <div className="space-y-6">
      {/* Labels */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">🏷️ Labels</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={chartConfig.enableLabel !== false}
                onChange={(e) => handleChartConfigChange('enableLabel', e.target.checked)}
                className="rounded"
              />
              Enable Labels
            </label>
            <ColorInput
              label="Label Color"
              value={chartConfig.labelTextColor || '#374151'}
              onChange={(value) => handleChartConfigChange('labelTextColor', value)}
            />
          </div>
          {chartConfig.enableLabel !== false && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Position</label>
                <select
                  value={chartConfig.labelPosition || 'middle'}
                  onChange={(e) => handleChartConfigChange('labelPosition', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                >
                  <option value="start">Start</option>
                  <option value="middle">Middle</option>
                  <option value="end">End</option>
                </select>
              </div>
              <div>
                <NumberInput
                  label="Skip Width"
                  value={chartConfig.labelSkipWidth || 0}
                  onChange={(value) => handleChartConfigChange('labelSkipWidth', value)}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
              <div>
                <NumberInput
                  label="Skip Height"
                  value={chartConfig.labelSkipHeight || 0}
                  onChange={(value) => handleChartConfigChange('labelSkipHeight', value)}
                  min={0}
                  max={100}
                  step={5}
                  suffix="px"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Position & Size */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📍 Position & Size</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Position</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={selectedWidget?.x || 0}
                    onChange={(e) => {
                      const x = Math.max(0, Math.min(11, parseInt(e.target.value) || 0));
                      handleWidgetPositionChange('x', x);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">X</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="0"
                    value={selectedWidget?.y || 0}
                    onChange={(e) => {
                      const y = Math.max(0, parseInt(e.target.value) || 0);
                      handleWidgetPositionChange('y', y);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">Y</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Size</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={selectedWidget?.w || 4}
                    onChange={(e) => {
                      const w = Math.max(1, Math.min(12, parseInt(e.target.value) || 1));
                      handleWidgetPositionChange('w', w);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">W</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    value={selectedWidget?.h || 3}
                    onChange={(e) => {
                      const h = Math.max(1, parseInt(e.target.value) || 1);
                      handleWidgetPositionChange('h', h);
                    }}
                    className="flex-1 h-3 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500">H</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legends */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">🏷️ Legends</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Direction & Position</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center">
                  <select
                    value={chartConfig.legends?.direction || 'column'}
                    onChange={(e) => handleChartConfigChange('legends', { ...chartConfig.legends, enabled: true, direction: e.target.value as 'column' | 'row' })}
                    className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  >
                    <option value="column">Column</option>
                    <option value="row">Row</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.translateY || 0]}
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, enabled: true, translateY: value })}
                    max={100}
                    min={-100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.translateY || 0}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Item Settings</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.itemWidth || 60]}
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, enabled: true, itemWidth: value })}
                    max={200}
                    min={20}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.itemWidth || 60}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.itemHeight || 18]}
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, enabled: true, itemHeight: value })}
                    max={50}
                    min={10}
                    step={2}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.itemHeight || 18}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.itemsSpacing || 2]}
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, enabled: true, itemsSpacing: value })}
                    max={20}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.itemsSpacing || 2}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.legends?.symbolSize || 12]}
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, enabled: true, symbolSize: value })}
                    max={30}
                    min={6}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.legends?.symbolSize || 12}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Item Direction</h4>
            <div className="bg-gray-50 rounded px-2 py-1">
              <div className="flex items-center">
                <select
                  value={chartConfig.legends?.itemDirection || 'left-to-right'}
                  onChange={(e) => {
                    handleChartConfigChange('legends', { ...chartConfig.legends, enabled: true, itemDirection: e.target.value });
                  }}
                  className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                >
                  <option value="left-to-right">Left to Right</option>
                  <option value="right-to-left">Right to Left</option>
                  <option value="top-to-bottom">Top to Bottom</option>
                  <option value="bottom-to-top">Bottom to Top</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Renderização da view de widgets
  const renderWidgetsView = () => (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-[0.5px] border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700">Widget Editor</h2>
        <p className="text-sm text-gray-600 mt-2">
          {widgets.length} widget{widgets.length !== 1 ? 's' : ''} on canvas
        </p>
      </div>

      {/* Widget List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Widgets</h3>
          <div className="space-y-2 mb-6">
            
            {/* Canvas Settings Item */}
            <div
              onClick={handleSelectCanvas}
              className="p-3 rounded-lg border cursor-pointer transition-all border-[0.5px] border-gray-200 hover:border-gray-300 bg-white"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎨</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">Canvas Settings</div>
                  <div className="text-xs text-gray-600">
                    Configure canvas appearance and layout
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </div>

            {/* Widget Items */}
            {widgets.map((widget) => (
              <div
                key={widget.i}
                onClick={() => handleSelectWidget(widget.i)}
                className="p-3 rounded-lg border cursor-pointer transition-all border-[0.5px] border-gray-200 hover:border-gray-300 bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{widget.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{widget.name}</div>
                    <div className="text-xs text-gray-600">
                      Position: ({widget.x}, {widget.y}) • Size: {widget.w}×{widget.h}
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )

  // Renderização da view de edição
  const renderEditView = () => (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      {/* Header com botão voltar */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={handleBackToWidgets}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            ← Back to Widgets
          </button>
        </div>
        {canvasSelected && (
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            🎨 Canvas Settings
          </h2>
        )}
        
        {/* Tabs - só mostra para widgets que têm configuração (chart) */}
        {selectedWidget && isChartWidget(selectedWidget) && (
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveEditTab('design')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeEditTab === 'design'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Design
            </button>
            <button
              onClick={() => setActiveEditTab('layout')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeEditTab === 'layout'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Layout
            </button>
            <button
              onClick={() => setActiveEditTab('data')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeEditTab === 'data'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Data
            </button>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          {canvasSelected ? (
            <div>
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-gray-700 font-medium">Canvas Configuration</p>
                <p className="text-sm text-gray-600 mt-2">
                  Background: {canvasConfig.backgroundColor}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Canvas settings will be implemented here
                </p>
              </div>
            </div>
          ) : selectedWidget ? (
            <div>
              {/* Chart Configuration com Tabs */}
              {isChartWidget(selectedWidget) && (
                <div>
                  {activeEditTab === 'design' && renderChartDesignTab()}
                  {activeEditTab === 'layout' && renderChartLayoutTab()}
                  {activeEditTab === 'data' && renderChartDataTab()}
                </div>
              )}

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

              {/* Image Configuration */}
              {isImageWidget(selectedWidget) && (
                <ImageConfigEditor
                  selectedWidget={selectedWidget}
                  imageConfig={imageConfig}
                  editImageForm={editImageForm}
                  onImageConfigChange={handleImageConfigChange}
                  onImageUpload={handleImageUpload}
                  onImageRemove={handleImageRemove}
                />
              )}

              {/* Table Configuration */}
              {isTableWidget(selectedWidget) && (
                <TableConfigEditor
                  selectedWidget={selectedWidget}
                  tableConfig={tableConfig}
                  onTableConfigChange={handleTableConfigChange}
                />
              )}

              {/* Navigation Configuration */}
              {isNavigationWidget(selectedWidget) && (
                <NavigationConfigEditor
                  selectedWidget={selectedWidget}
                  navigationConfig={navigationConfig}
                  onNavigationConfigChange={handleNavigationConfigChange}
                />
              )}

              {/* Container Configuration - applies to non-chart widgets */}
              {selectedWidget && !isChartWidget(selectedWidget) && (
                <div className="mt-6 pt-6">
                  <ContainerConfigEditor
                    selectedWidget={selectedWidget}
                    containerConfig={containerConfig}
                    onContainerConfigChange={handleContainerConfigChange}
                  />
                </div>
              )}

              {/* Other widget types placeholder */}
              {!isKPIWidget(selectedWidget) && !isImageWidget(selectedWidget) && !isTableWidget(selectedWidget) && !isChartWidget(selectedWidget) && !isNavigationWidget(selectedWidget) && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-700 font-medium">Configuration for {selectedWidget.type} widgets</p>
                  <p className="text-sm text-gray-600 mt-2">
                    This widget type configuration is coming soon
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🎨</span>
              <p className="text-gray-700 font-medium mb-2">No selection</p>
              <p className="text-sm text-gray-600">
                Something went wrong. Please go back to widgets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Renderização principal baseada no viewMode
  return viewMode === 'widgets' ? renderWidgetsView() : renderEditView()
}