'use client'

import { useStore } from '@nanostores/react'
import { $widgets, $selectedWidget, widgetActions } from '@/stores/apps/widgetStore'
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
import { isChartWidget, isBarChart, isLineChart, isPieChart, isAreaChart } from '@/types/apps/chartWidgets'
import type { BaseChartConfig, BarChartConfig, LineChartConfig, PieChartConfig, AreaChartConfig } from '@/types/apps/chartWidgets'
import KPIConfigEditor from '../editors/KPIConfigEditor'
import ImageConfigEditor from '../editors/ImageConfigEditor'
import TableConfigEditor from '../editors/TableConfigEditor'
import NavigationConfigEditor from '../editors/NavigationConfigEditor'
import ContainerConfigEditor from '../editors/ContainerConfigEditor'
import { ColorInput, NumberInput } from '../editors/controls'
import { Slider } from '@/components/ui/slider'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Database, RefreshCw } from 'lucide-react'
import type { BigQueryField } from '../builder/TablesExplorer'
import DropZone from '../builder/DropZone'
import DraggableColumn from '../builder/DraggableColumn'

// BigQuery table type
interface BigQueryTable {
  datasetId: string
  tableId: string
  projectId?: string
  description?: string
  numRows?: number
  numBytes?: number
  creationTime?: Date
  lastModifiedTime?: Date
  // Support for different API response formats
  DATASETID?: string
  TABLEID?: string
  NUMROWS?: number
  NUMBYTES?: number
}

export default function WidgetEditorNew() {
  const widgets = useStore($widgets)
  const selectedWidget = useStore($selectedWidget)
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

  // Chart data management states
  const [availableTables, setAvailableTables] = useState<BigQueryTable[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableColumns, setTableColumns] = useState<BigQueryField[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [loadingColumns, setLoadingColumns] = useState<string | null>(null)
  const [loadingChartUpdate, setLoadingChartUpdate] = useState(false)
  
  // Staging states for chart fields
  const [stagedXAxis, setStagedXAxis] = useState<BigQueryField[]>([])
  const [stagedYAxis, setStagedYAxis] = useState<BigQueryField[]>([])
  const [stagedFilters, setStagedFilters] = useState<BigQueryField[]>([])

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
  }, [selectedWidget])

  // Computed Chart config - acesso via selectedWidget
  const chartConfig = useMemo((): BaseChartConfig => {
    if (!selectedWidget || !isChartWidget(selectedWidget)) return {} as BaseChartConfig
    
    // Primeiro tenta o novo formato (config.chartConfig), depois o formato deprecated (chartConfig direto)
    const config = selectedWidget.config?.chartConfig || selectedWidget.chartConfig || {} as BaseChartConfig
    console.log('🎯 WidgetEditorNew computed chartConfig:', config)
    return config
  }, [selectedWidget])

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
    console.log('⚙️ WidgetEditorNew handleTableConfigChange:', { field, value, valueLength: Array.isArray(value) ? value.length : 'not array' })
    
    if (selectedWidget && isTableWidget(selectedWidget)) {
      console.log('⚙️ WidgetEditorNew calling tableActions.updateTableConfig:', selectedWidget.i, { [field]: value })
      tableActions.updateTableConfig(selectedWidget.i, { [field]: value })
    } else {
      console.warn('❌ WidgetEditorNew handleTableConfigChange: No selected widget or not a table widget')
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

  // Chart Data Management Functions
  const loadTables = async () => {
    setLoadingTables(true)
    try {
      const response = await fetch('/api/bigquery?action=tables&dataset=biquery_data')
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setAvailableTables(result.data)
      } else {
        throw new Error(result.error || 'Failed to load tables')
      }
    } catch (err) {
      console.error('Error loading tables:', err)
    } finally {
      setLoadingTables(false)
    }
  }

  const loadTableColumns = async (tableId: string) => {
    setLoadingColumns(tableId)
    try {
      const response = await fetch(`/api/bigquery?action=schema&dataset=biquery_data&table=${tableId}`)
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setTableColumns(result.data)
      } else {
        throw new Error(result.error || 'Failed to load table columns')
      }
    } catch (err) {
      console.error('Error loading table columns:', err)
      setTableColumns([])
    } finally {
      setLoadingColumns(null)
    }
  }

  const handleTableClick = async (tableId: string) => {
    setSelectedTable(tableId)
    await loadTableColumns(tableId)
  }

  // Load tables when component mounts
  useEffect(() => {
    if (activeEditTab === 'data') {
      loadTables()
    }
  }, [activeEditTab])

  // Check if chart fields have changed
  const hasChartChanged = () => {
    if (!selectedWidget || !isChartWidget(selectedWidget)) return false
    
    // For now, simplify to just check if there are any staged fields
    // This will show the button when user drags fields to staging areas
    return stagedXAxis.length > 0 || stagedYAxis.length > 0 || stagedFilters.length > 0
  }

  // Handle drag end for chart fields
  const handleChartDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !active.data.current) return

    const draggedColumn = active.data.current as BigQueryField & { sourceTable: string }
    const dropZoneId = over.id as string

    // Remove from all staging areas first
    setStagedXAxis(prev => prev.filter(col => col.name !== draggedColumn.name))
    setStagedYAxis(prev => prev.filter(col => col.name !== draggedColumn.name))
    setStagedFilters(prev => prev.filter(col => col.name !== draggedColumn.name))

    // Add to appropriate staging area
    switch (dropZoneId) {
      case 'chart-x-axis-drop-zone':
        setStagedXAxis(prev => [...prev, draggedColumn])
        break
      case 'chart-y-axis-drop-zone':
        setStagedYAxis(prev => [...prev, draggedColumn])
        break
      case 'chart-filters-drop-zone':
        setStagedFilters(prev => [...prev, draggedColumn])
        break
    }
  }

  // Handle remove field from staging areas
  const handleRemoveChartField = (dropZoneType: string, fieldName: string) => {
    switch (dropZoneType) {
      case 'xAxis':
        setStagedXAxis(prev => prev.filter(col => col.name !== fieldName))
        break
      case 'yAxis':
        setStagedYAxis(prev => prev.filter(col => col.name !== fieldName))
        break
      case 'filters':
        setStagedFilters(prev => prev.filter(col => col.name !== fieldName))
        break
    }
  }

  // Update chart data with staged fields
  const updateChartData = async () => {
    if (!selectedWidget || !isChartWidget(selectedWidget)) return
    
    setLoadingChartUpdate(true)
    try {
      // Prepare update payload
      const updatePayload: Record<string, unknown> = {}
      
      // Update X-Axis
      if (stagedXAxis.length > 0) {
        updatePayload.xColumn = stagedXAxis[0].name
      } else {
        updatePayload.xColumn = ''
      }
      
      // Update Y-Axis  
      if (stagedYAxis.length > 0) {
        updatePayload.yColumn = stagedYAxis[0].name
      } else {
        updatePayload.yColumn = ''
      }
      
      // Update Filters
      updatePayload.filters = stagedFilters.map(field => ({
        name: field.name,
        type: field.type,
        value: '' // Default empty value
      }))
      
      console.log('🔄 Updating chart data:', updatePayload)
      
      // Apply changes to widget
      widgetActions.editWidget(selectedWidget.i, updatePayload)
      
      // Clear staging areas after successful update
      setStagedXAxis([])
      setStagedYAxis([])
      setStagedFilters([])
      
    } catch (err) {
      console.error('Error updating chart data:', err)
    } finally {
      setLoadingChartUpdate(false)
    }
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

      {/* Chart Settings */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">⚙️ Chart Settings</h3>
        <div className="space-y-4">
          {/* Color Scheme - Common to all charts */}
          {selectedWidget && isChartWidget(selectedWidget) && (
            <div className="bg-gray-50 rounded px-3 py-2">
              <label className="block text-xs text-gray-600 mb-2">🎨 Color Scheme</label>
              <select
                value={chartConfig.colorScheme?.scheme || 'nivo'}
                onChange={(e) => handleChartConfigChange('colorScheme', { scheme: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="nivo">Nivo (Default)</option>
                <option value="category10">Category 10</option>
                <option value="accent">Accent</option>
                <option value="dark2">Dark 2</option>
                <option value="paired">Paired</option>
                <option value="pastel1">Pastel 1</option>
                <option value="pastel2">Pastel 2</option>
                <option value="set1">Set 1</option>
                <option value="set2">Set 2</option>
                <option value="set3">Set 3</option>
              </select>
            </div>
          )}

          {/* Bar Chart Settings */}
          {selectedWidget && isChartWidget(selectedWidget) && isBarChart(selectedWidget) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Display Mode</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded px-2 py-1">
                  <div className="flex items-center">
                    <select
                      value={(chartConfig as BarChartConfig).groupMode || 'stacked'}
                      onChange={(e) => handleChartConfigChange('groupMode', e.target.value as 'grouped' | 'stacked')}
                      className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                    >
                      <option value="grouped">Grouped</option>
                      <option value="stacked">Stacked</option>
                    </select>
                  </div>
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <div className="flex items-center">
                    <select
                      value={(chartConfig as BarChartConfig).layout || 'vertical'}
                      onChange={(e) => handleChartConfigChange('layout', e.target.value as 'horizontal' | 'vertical')}
                      className="flex-1 bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                    >
                      <option value="horizontal">Horizontal</option>
                      <option value="vertical">Vertical</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Additional Bar Chart Style Props */}
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-600 mb-2">Style Options</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Bar Spacing</label>
                    <Slider
                      value={[(chartConfig as BarChartConfig).padding || 0.3]}
                      onValueChange={([value]) => handleChartConfigChange('padding', value)}
                      max={0.8}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Inner Padding</label>
                    <Slider
                      value={[(chartConfig as BarChartConfig).innerPadding || 0]}
                      onValueChange={([value]) => handleChartConfigChange('innerPadding', value)}
                      max={10}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Line Chart Settings */}
          {selectedWidget && isChartWidget(selectedWidget) && isLineChart(selectedWidget) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Line Configuration</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Curve</label>
                  <select
                    value={(chartConfig as LineChartConfig).curve || 'cardinal'}
                    onChange={(e) => handleChartConfigChange('curve', e.target.value)}
                    className="w-full bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  >
                    <option value="linear">Linear</option>
                    <option value="cardinal">Cardinal</option>
                    <option value="catmullRom">Catmull Rom</option>
                    <option value="monotoneX">Monotone X</option>
                  </select>
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Line Width</label>
                  <Slider
                    value={[(chartConfig as LineChartConfig).lineWidth || 2]}
                    onValueChange={([value]) => handleChartConfigChange('lineWidth', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={(chartConfig as LineChartConfig).enablePoints !== false}
                    onChange={(e) => handleChartConfigChange('enablePoints', e.target.checked)}
                    className="rounded"
                  />
                  Points
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={(chartConfig as LineChartConfig).enableArea || false}
                    onChange={(e) => handleChartConfigChange('enableArea', e.target.checked)}
                    className="rounded"
                  />
                  Fill Area
                </label>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Point Size</label>
                  <Slider
                    value={[(chartConfig as LineChartConfig).pointSize || 4]}
                    onValueChange={([value]) => handleChartConfigChange('pointSize', value)}
                    max={15}
                    min={2}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Additional Line Chart Style Props */}
              {(chartConfig as LineChartConfig).enableArea && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-600 mb-2">Area Style</h5>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Area Opacity</label>
                    <Slider
                      value={[(chartConfig as LineChartConfig).areaOpacity || 0.2]}
                      onValueChange={([value]) => handleChartConfigChange('areaOpacity', value)}
                      max={1}
                      min={0.1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pie Chart Settings */}
          {selectedWidget && isChartWidget(selectedWidget) && isPieChart(selectedWidget) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Pie Configuration</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Inner Radius</label>
                  <Slider
                    value={[(chartConfig as PieChartConfig).innerRadius || 0]}
                    onValueChange={([value]) => handleChartConfigChange('innerRadius', value)}
                    max={0.9}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Corner Radius</label>
                  <Slider
                    value={[(chartConfig as PieChartConfig).cornerRadius || 2]}
                    onValueChange={([value]) => handleChartConfigChange('cornerRadius', value)}
                    max={10}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={(chartConfig as PieChartConfig).enableArcLinkLabels !== false}
                    onChange={(e) => handleChartConfigChange('enableArcLinkLabels', e.target.checked)}
                    className="rounded"
                  />
                  Arc Labels
                </label>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Pad Angle</label>
                  <Slider
                    value={[(chartConfig as PieChartConfig).padAngle || 0.7]}
                    onValueChange={([value]) => handleChartConfigChange('padAngle', value)}
                    max={5}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Additional Pie Chart Style Props */}
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-600 mb-2">Advanced Style</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Active Offset</label>
                    <Slider
                      value={[(chartConfig as PieChartConfig).activeOuterRadiusOffset || 8]}
                      onValueChange={([value]) => handleChartConfigChange('activeOuterRadiusOffset', value)}
                      max={20}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Arc Skip Angle</label>
                    <Slider
                      value={[(chartConfig as PieChartConfig).arcLabelsSkipAngle || 10]}
                      onValueChange={([value]) => handleChartConfigChange('arcLabelsSkipAngle', value)}
                      max={45}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Area Chart Settings */}
          {selectedWidget && isChartWidget(selectedWidget) && isAreaChart(selectedWidget) && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">Area Configuration</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Curve</label>
                  <select
                    value={(chartConfig as AreaChartConfig).curve || 'cardinal'}
                    onChange={(e) => handleChartConfigChange('curve', e.target.value)}
                    className="w-full bg-transparent border-0 text-xs font-medium text-gray-900 focus:outline-none"
                  >
                    <option value="linear">Linear</option>
                    <option value="cardinal">Cardinal</option>
                    <option value="catmullRom">Catmull Rom</option>
                    <option value="monotoneX">Monotone X</option>
                  </select>
                </div>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Area Opacity</label>
                  <Slider
                    value={[(chartConfig as AreaChartConfig).areaOpacity || 0.15]}
                    onValueChange={([value]) => handleChartConfigChange('areaOpacity', value)}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={(chartConfig as AreaChartConfig).enablePoints || false}
                    onChange={(e) => handleChartConfigChange('enablePoints', e.target.checked)}
                    className="rounded"
                  />
                  Show Points
                </label>
                <div className="bg-gray-50 rounded px-2 py-1">
                  <label className="block text-xs text-gray-600 mb-1">Line Width</label>
                  <Slider
                    value={[(chartConfig as AreaChartConfig).lineWidth || 2]}
                    onValueChange={([value]) => handleChartConfigChange('lineWidth', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Additional Area Chart Style Props */}
              {(chartConfig as AreaChartConfig).enablePoints && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-600 mb-2">Point Style</h5>
                  <div className="bg-gray-50 rounded px-2 py-1">
                    <label className="block text-xs text-gray-600 mb-1">Point Size</label>
                    <Slider
                      value={[(chartConfig as AreaChartConfig).pointSize || 6]}
                      onValueChange={([value]) => handleChartConfigChange('pointSize', value)}
                      max={15}
                      min={2}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Spacing</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.padding || 0.1]}
                    onValueChange={([value]) => handleChartConfigChange('padding', value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.padding || 0.1}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded px-2 py-1">
                <div className="flex items-center gap-2">
                  <Slider
                    value={[chartConfig.innerPadding || 0]}
                    onValueChange={([value]) => handleChartConfigChange('innerPadding', value)}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 min-w-[30px] text-right">{chartConfig.innerPadding || 0}</span>
                </div>
              </div>
            </div>
          </div>
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
      {/* Chart Data Fields */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📊 Chart Data Fields</h3>
        <DndContext onDragEnd={handleChartDragEnd}>
          <div className="space-y-4">
            {/* Tables & Columns Section */}
            <div className="grid grid-cols-2 gap-4">
              {/* Available Tables */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-700">Available Tables</h4>
                  <button
                    onClick={loadTables}
                    disabled={loadingTables}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingTables ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg h-32 overflow-y-auto">
                  {loadingTables ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {availableTables.map((table) => {
                        const tableId = table.TABLEID || table.tableId || ''
                        return (
                          <div
                            key={tableId}
                            onClick={() => handleTableClick(tableId)}
                            className={`text-xs p-2 rounded cursor-pointer transition-colors ${
                              selectedTable === tableId
                                ? 'bg-blue-100 text-blue-800'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {tableId}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Table Columns */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-700">Columns</h4>
                  {loadingColumns && (
                    <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg h-32 overflow-y-auto">
                  {selectedTable ? (
                    <div className="p-2 space-y-1">
                      {tableColumns.map((column) => (
                        <DraggableColumn
                          key={column.name}
                          field={column}
                          sourceTable={selectedTable}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-500">
                      Select a table to view columns
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drop Zones */}
            <div className="space-y-3">
              <DropZone
                id="chart-x-axis-drop-zone"
                label="X-Axis"
                description="Drag categorical fields (strings, dates)"
                icon={<Database className="w-4 h-4 text-green-600" />}
                fields={stagedXAxis}
                onRemoveField={(fieldName) => handleRemoveChartField('xAxis', fieldName)}
                acceptedTypes={['string', 'date', 'numeric']}
              />
              
              <DropZone
                id="chart-y-axis-drop-zone"
                label="Y-Axis"
                description="Drag numeric fields for aggregation"
                icon={<Database className="w-4 h-4 text-blue-600" />}
                fields={stagedYAxis}
                onRemoveField={(fieldName) => handleRemoveChartField('yAxis', fieldName)}
                acceptedTypes={['numeric']}
              />
              
              <DropZone
                id="chart-filters-drop-zone"
                label="Filters"
                description="Drag any fields to create filters"
                icon={<Database className="w-4 h-4 text-orange-600" />}
                fields={stagedFilters}
                onRemoveField={(fieldName) => handleRemoveChartField('filters', fieldName)}
                acceptedTypes={['string', 'date', 'numeric', 'boolean']}
              />
            </div>

            {/* Update Chart Button */}
            {hasChartChanged() && (
              <div className="mt-4">
                <button
                  onClick={updateChartData}
                  disabled={loadingChartUpdate}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loadingChartUpdate ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Updating Chart...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Update Chart
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </DndContext>
      </div>

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
                    onChange={(e) => handleChartConfigChange('legends', { ...chartConfig.legends, direction: e.target.value as 'column' | 'row' })}
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
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, translateY: value })}
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
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, itemWidth: value })}
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
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, itemHeight: value })}
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
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, itemsSpacing: value })}
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
                    onValueChange={([value]) => handleChartConfigChange('legends', { ...chartConfig.legends, symbolSize: value })}
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
                    handleChartConfigChange('legends', { ...chartConfig.legends, itemDirection: e.target.value });
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