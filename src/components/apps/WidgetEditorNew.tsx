'use client'

import { useStore } from '@nanostores/react'
import { $widgets, $selectedWidget, $selectedWidgetId, widgetActions } from '@/stores/widgetStore'
import { $canvasConfig } from '@/stores/canvasStore'
import { kpiActions } from '@/stores/kpiStore'
import { tableActions } from '@/stores/tableStore'
import { chartActions } from '@/stores/chartStore'
import { useState, useEffect, useMemo } from 'react'
import { isKPIWidget } from '@/types/kpiWidgets'
import type { KPIConfig } from '@/types/kpiWidgets'
import { isImageWidget, isNavigationWidget } from '@/types/widget'
import type { ImageConfig, NavigationConfig } from '@/types/widget'
import { isTableWidget } from '@/types/tableWidgets'
import type { TableConfig } from '@/types/tableWidgets'
import { isChartWidget } from '@/types/chartWidgets'
import type { BaseChartConfig } from '@/types/chartWidgets'
import KPIConfigEditor from './editors/KPIConfigEditor'
import ImageConfigEditor from './editors/ImageConfigEditor'
import TableConfigEditor from './editors/TableConfigEditor'
import ChartConfigEditor from './editors/ChartConfigEditor'
import NavigationConfigEditor from './editors/NavigationConfigEditor'

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

  return (
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
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                canvasSelected
                  ? 'border-blue-500 bg-blue-900'
                  : 'border-[0.5px] border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🎨</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">Canvas Settings</div>
                  <div className="text-xs text-gray-600">
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
                    ? 'border-blue-500 bg-blue-900'
                    : 'border-[0.5px] border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{widget.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{widget.name}</div>
                    <div className="text-xs text-gray-600">
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
                <div className="p-4 bg-[#333333] rounded-lg text-center">
                  <p className="text-gray-600">Canvas configuration will be here</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Background: {canvasConfig.backgroundColor}
                  </p>
                </div>
              </div>
            ) : selectedWidget ? (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Edit &quot;{selectedWidget.name}&quot;
                </h3>
                
                {/* General Info */}
                <div className="p-3 bg-[#333333] rounded-lg mb-4">
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

                {/* Chart Configuration */}
                {isChartWidget(selectedWidget) && (
                  <ChartConfigEditor
                    selectedWidget={selectedWidget}
                    chartConfig={chartConfig}
                    onChartConfigChange={handleChartConfigChange}
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

                {/* Other widget types placeholder */}
                {!isKPIWidget(selectedWidget) && !isImageWidget(selectedWidget) && !isTableWidget(selectedWidget) && !isChartWidget(selectedWidget) && !isNavigationWidget(selectedWidget) && (
                  <div className="p-4 bg-[#333333] rounded-lg text-center">
                    <p className="text-gray-600">Configuration for {selectedWidget.type} widgets will be here</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🎨</span>
                <p className="text-gray-600 mb-2">No selection</p>
                <p className="text-sm text-gray-600">
                  Click on &quot;Canvas Settings&quot; or a widget to start editing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}