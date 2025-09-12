'use client'

import { useState } from 'react'
import { useStore } from '@nanostores/react'
import { BarChart3, TrendingUp, PieChart, Activity, Trash2, Plus, Table, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import DropZone from './DropZone'
import ChartBuilder from './ChartBuilder'
import TableBuilder from './TableBuilder'
import KPIBuilder from './KPIBuilder'
import TablePreview from './TablePreview'
import type { TableData } from './TablePreview'
import KPIPreview from './KPIPreview'
import type { KPIData } from './KPIPreview'
import ChartPreview from './ChartPreview'
import type { ChartData } from './ChartPreview'
import type { BigQueryField } from './TablesExplorer'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
// import { widgetActions, kpiActions, tableActions } from '@/stores/apps/widgetStore' // REMOVED: Only KPIs supported now
import { kpiActions, $selectedKPI } from '@/stores/apps/kpiStore'
import { barChartActions, $selectedBarChart } from '@/stores/apps/barChartStore'
import { lineChartActions, $selectedLineChart } from '@/stores/apps/lineChartStore'
import { pieChartActions, $selectedPieChart } from '@/stores/apps/pieChartStore'
import { areaChartActions, $selectedAreaChart } from '@/stores/apps/areaChartStore'
import { horizontalBarChartActions, $selectedHorizontalBarChart } from '@/stores/apps/horizontalBarChartStore'
import { tableActions, $selectedTable } from '@/stores/apps/tableStore'

// Widget Types
type WidgetType = 'chart' | 'kpi' | 'table'

interface UniversalBuilderData {
  selectedType: WidgetType
  selectedTable: string | null
  
  // Chart fields
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'
  
  // Table fields  
  columns: BigQueryField[]
  
  // KPI field
  kpiValue: BigQueryField[]
  
  // Common to all
  filters: BigQueryField[]
}

interface UniversalBuilderProps {
  data: UniversalBuilderData
  onTypeChange: (selectedType: WidgetType) => void
  onChartTypeChange: (chartType: UniversalBuilderData['chartType']) => void
  onClear: () => void
  onRemoveField: (dropZoneType: 'xAxis' | 'yAxis' | 'filters' | 'columns' | 'kpiValue', fieldName: string) => void
  onAggregationChange?: (fieldName: string, aggregation: BigQueryField['aggregation']) => void
  droppedWidgets?: DroppedWidget[]
  onEditWidget: (widgetId: string, changes: Partial<DroppedWidget>) => void
}

export default function UniversalBuilder({
  data,
  onTypeChange,
  onChartTypeChange,
  onClear,
  onRemoveField,
  onAggregationChange,
  droppedWidgets,
  onEditWidget
}: UniversalBuilderProps) {
  const selectedKPI = useStore($selectedKPI)
  const selectedBarChart = useStore($selectedBarChart)
  const selectedLineChart = useStore($selectedLineChart)
  const selectedPieChart = useStore($selectedPieChart)
  const selectedAreaChart = useStore($selectedAreaChart)
  const selectedHorizontalBarChart = useStore($selectedHorizontalBarChart)
  const selectedTable = useStore($selectedTable)
  const [previewData, setPreviewData] = useState<Array<{ x: string; y: number; label: string; value: number }> | TableData[] | KPIData[] | ChartData[]>([])
  const [previewQuery, setPreviewQuery] = useState<string>('')

  // Handle field removal from drop zones
  const handleRemoveField = (dropZoneType: 'xAxis' | 'yAxis' | 'filters' | 'columns' | 'kpiValue', fieldName: string) => {
    console.log('🗑️ UniversalBuilder handleRemoveField called:', { 
      dropZoneType, 
      fieldName,
      hasOnRemoveField: !!onRemoveField,
      timestamp: Date.now()
    })
    onRemoveField(dropZoneType, fieldName)
    console.log('🗑️ UniversalBuilder onRemoveField called successfully')
  }

  // Handle aggregation change for numeric fields
  const handleAggregationChange = (fieldName: string, aggregation: BigQueryField['aggregation']) => {
    if (onAggregationChange) {
      onAggregationChange(fieldName, aggregation)
    }
  }

  // Get aggregation function for measure field (same logic as KPIPreview)
  const getAggregationFunction = (field: BigQueryField): string => {
    if (field.aggregation) return field.aggregation.toUpperCase()
    
    const lowerType = field.type.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return 'COUNT'
    }
    return 'SUM' // Default for numeric fields
  }

  // Helper to determine if there's a selected widget of current type
  const getSelectedWidget = () => {
    if (data.selectedType === 'kpi') return selectedKPI
    if (data.selectedType === 'table') return selectedTable
    if (data.selectedType === 'chart') {
      switch (data.chartType) {
        case 'bar': return selectedBarChart
        case 'horizontal-bar': return selectedHorizontalBarChart
        case 'line': return selectedLineChart
        case 'pie': return selectedPieChart
        case 'area': return selectedAreaChart
        default: return null
      }
    }
    return null
  }

  // Helper to get update button text based on widget type
  const getUpdateButtonText = () => {
    if (data.selectedType === 'kpi') return 'Update KPI'
    if (data.selectedType === 'table') return 'Update Table'
    if (data.selectedType === 'chart') {
      switch (data.chartType) {
        case 'bar': return 'Update Bar Chart'
        case 'horizontal-bar': return 'Update Horizontal Bar Chart'
        case 'line': return 'Update Line Chart'
        case 'pie': return 'Update Pie Chart'
        case 'area': return 'Update Area Chart'
        default: return 'Update Chart'
      }
    }
    return 'Update Widget'
  }

  // Handle adding widget to dashboard
  const handleAddToDashboard = () => {
    if (!data.selectedTable) {
      alert('Please select a table first')
      return
    }

    // Check if we have required fields based on widget type
    const hasRequiredFields = 
      data.selectedType === 'chart'
        ? data.xAxis.length > 0 && data.yAxis.length > 0
        : data.selectedType === 'table'
        ? data.columns.length > 0
        : data.selectedType === 'kpi'
        ? data.kpiValue.length > 0
        : false

    if (!hasRequiredFields) {
      alert('Please configure the required fields first')
      return
    }

    // Generate widget configuration
    const widgetConfig = {
      id: `${data.selectedType}-${Date.now()}`,
      name: `${data.selectedTable} - ${data.selectedType}`,
      type: data.selectedType,
      icon: getWidgetIcon(data.selectedType),
      description: `${data.selectedType} from ${data.selectedTable}`,
      defaultWidth: getDefaultWidth(data.selectedType),
      defaultHeight: getDefaultHeight(data.selectedType),
      i: `widget-${Date.now()}`,
      x: 0,
      y: 0,
      w: getDefaultWidth(data.selectedType),
      h: getDefaultHeight(data.selectedType),
      config: generateWidgetConfig(),
      bigqueryData: (() => {
        const relevantFields = getRelevantFields()
        return {
          chartType: relevantFields.chartType,
          data: previewData,
          xColumn: relevantFields.xColumn,
          yColumn: relevantFields.yColumn,
          query: previewQuery,
          source: 'bigquery',
          table: data.selectedTable,
          lastUpdated: new Date().toISOString()
        }
      })()
    }

    // Add widget to dashboard - route to appropriate store
    if (data.selectedType === 'kpi') {
      // Generate KPI query from dragged fields
      const query = data.selectedTable ? kpiActions.generateKPIQuery(
        data.kpiValue.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.filters.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.selectedTable
      ) : null

      if (selectedKPI) {
        // Update existing KPI
        console.log('📊 Updating existing KPI:', selectedKPI.i)
        
        // Get data from preview to apply to the real KPI
        const kpiPreviewData = previewData as KPIData[]
        const kpiField = data.kpiValue[0]
        
        console.log('📊 Applying preview data to existing KPI:', {
          kpiId: selectedKPI.i,
          hasPreviewData: kpiPreviewData.length > 0,
          newValue: kpiPreviewData.length > 0 ? kpiPreviewData[0].current_value : 'no data',
          newName: kpiField?.name,
          newCalculation: kpiField ? getAggregationFunction(kpiField) : 'no field'
        })
        
        kpiActions.updateKPIConfig(selectedKPI.i, {
          // Apply visual data from preview
          name: kpiField?.name || selectedKPI.config.name,
          value: kpiPreviewData.length > 0 ? kpiPreviewData[0].current_value : selectedKPI.config.value,
          metric: kpiField?.name,
          calculation: kpiField ? getAggregationFunction(kpiField) : selectedKPI.config.calculation,
          unit: getUnitFromFieldType(kpiField?.type),
          
          // Keep existing configuration but update data source
          dataSourceType: 'bigquery',
          bigqueryData: {
            selectedTable: data.selectedTable,
            kpiValueFields: data.kpiValue,
            filterFields: data.filters,
            query: query || undefined,
            lastExecuted: null,
            isLoading: false,
            error: null
          }
        })
      } else {
        // Create new KPI
        console.log('📊 Creating new KPI')
        const kpiConfig = widgetConfig.config?.kpiConfig || {}
        kpiActions.addKPI({
          name: widgetConfig.name,
          icon: widgetConfig.icon,
          description: widgetConfig.description,
          position: { x: widgetConfig.x, y: widgetConfig.y },
          size: { w: widgetConfig.w, h: widgetConfig.h },
          config: {
            ...kpiConfig,
            dataSourceType: 'bigquery',
            bigqueryData: {
              selectedTable: data.selectedTable,
              kpiValueFields: data.kpiValue,
              filterFields: data.filters,
              query: query || undefined,
              lastExecuted: null,
              isLoading: false,
              error: null
            }
          }
        })
      }
    } else if (data.selectedType === 'table') {
      if (selectedTable) {
        // Update existing table
        console.log('📊 Updating existing Table:', selectedTable.i)
        
        tableActions.editTable(selectedTable.i, {
          name: widgetConfig.name,
          config: {
            data: previewData,
            dataSource: 'BigQuery'
          }
        })
      } else {
        // Create new table
        console.log('📊 Creating new Table')
        
        const tableConfig = widgetConfig.config?.tableConfig || {}
        tableActions.addTable({
          name: widgetConfig.name,
          icon: widgetConfig.icon,
          description: widgetConfig.description,
          position: { x: widgetConfig.x, y: widgetConfig.y },
          size: { w: widgetConfig.w, h: widgetConfig.h },
          config: {
            ...tableConfig,
            // Add BigQuery data to table config
            ...(widgetConfig.bigqueryData ? {
              dataSource: 'BigQuery'
            } : {})
          }
        })
      }
    } else if (data.selectedType === 'chart' && data.chartType === 'bar') {
      // Convert to BarChart format and use barChartActions
      const query = barChartActions.generateBarChartQuery(
        data.xAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.yAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.filters.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.selectedTable
      )
      
      if (selectedBarChart) {
        // Update existing bar chart
        console.log('📊 Updating existing Bar Chart:', selectedBarChart.id)
        
        barChartActions.updateBarChart(selectedBarChart.id, {
          name: widgetConfig.name,
          bigqueryData: {
            query,
            selectedTable: data.selectedTable,
            columns: {
              xAxis: data.xAxis,
              yAxis: data.yAxis,
              filters: data.filters
            },
            data: previewData,
            lastExecuted: new Date(),
            isLoading: false,
            error: null
          }
        })
      } else {
        // Create new bar chart
        console.log('📊 Creating new Bar Chart')
        
        barChartActions.addBarChart({
        name: widgetConfig.name,
        bigqueryData: {
          query,
          selectedTable: data.selectedTable,
          columns: {
            xAxis: data.xAxis,
            yAxis: data.yAxis,
            filters: data.filters
          },
          data: previewData,
          lastExecuted: new Date(),
          isLoading: false,
          error: null
        },
        chartType: 'bar',
        styling: {
          colors: ['#2563eb'],
          showLegend: true,
          showGrid: true,
          title: `${data.xAxis[0]?.name} por ${data.yAxis[0]?.name}`
        },
        position: {
          x: widgetConfig.x,
          y: widgetConfig.y,
          w: widgetConfig.w,
          h: widgetConfig.h
        }
        })
      }
    } else if (data.selectedType === 'chart' && data.chartType === 'line') {
      // Convert to LineChart format and use lineChartActions
      const query = lineChartActions.generateLineChartQuery(
        data.xAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.yAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.filters.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.selectedTable
      )
      
      if (selectedLineChart) {
        // Update existing line chart
        console.log('📊 Updating existing Line Chart:', selectedLineChart.id)
        
        lineChartActions.updateLineChart(selectedLineChart.id, {
          name: widgetConfig.name,
          bigqueryData: {
            query,
            selectedTable: data.selectedTable,
            columns: {
              xAxis: data.xAxis,
              yAxis: data.yAxis,
              filters: data.filters
            },
            data: previewData,
            lastExecuted: new Date(),
            isLoading: false,
            error: null
          }
        })
      } else {
        // Create new line chart
        console.log('📊 Creating new Line Chart')
        
        lineChartActions.addLineChart({
        name: widgetConfig.name,
        bigqueryData: {
          query,
          selectedTable: data.selectedTable,
          columns: {
            xAxis: data.xAxis,
            yAxis: data.yAxis,
            filters: data.filters
          },
          data: previewData,
          lastExecuted: new Date(),
          isLoading: false,
          error: null
        },
        chartType: 'line',
        styling: {
          colors: ['#10b981'],
          showLegend: true,
          showGrid: true,
          title: `${data.xAxis[0]?.name} por ${data.yAxis[0]?.name}`
        },
        position: {
          x: widgetConfig.x,
          y: widgetConfig.y,
          w: widgetConfig.w,
          h: widgetConfig.h
        }
        })
      }
    } else if (data.selectedType === 'chart' && data.chartType === 'pie') {
      // Convert to PieChart format and use pieChartActions
      const query = pieChartActions.generatePieChartQuery(
        data.xAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.yAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.filters.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.selectedTable
      )
      
      if (selectedPieChart) {
        // Update existing pie chart
        console.log('📊 Updating existing Pie Chart:', selectedPieChart.id)
        
        pieChartActions.updatePieChart(selectedPieChart.id, {
          name: widgetConfig.name,
          bigqueryData: {
            query,
            selectedTable: data.selectedTable,
            columns: {
              xAxis: data.xAxis,
              yAxis: data.yAxis,
              filters: data.filters
            },
            data: previewData,
            lastExecuted: new Date(),
            isLoading: false,
            error: null
          }
        })
      } else {
        // Create new pie chart
        console.log('📊 Creating new Pie Chart')
        
        pieChartActions.addPieChart({
        name: widgetConfig.name,
        bigqueryData: {
          query,
          selectedTable: data.selectedTable,
          columns: {
            xAxis: data.xAxis,
            yAxis: data.yAxis,
            filters: data.filters
          },
          data: previewData,
          lastExecuted: new Date(),
          isLoading: false,
          error: null
        },
        chartType: 'pie',
        styling: {
          colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
          showLegend: true,
          showGrid: false, // Pie charts don't use grids
          title: `${data.xAxis[0]?.name} por ${data.yAxis[0]?.name}`
        },
        position: {
          x: widgetConfig.x,
          y: widgetConfig.y,
          w: widgetConfig.w,
          h: widgetConfig.h
        }
        })
      }
    } else if (data.selectedType === 'chart' && data.chartType === 'area') {
      // Convert to AreaChart format and use areaChartActions
      const query = areaChartActions.generateAreaChartQuery(
        data.xAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.yAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.filters.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.selectedTable
      )
      
      if (selectedAreaChart) {
        // Update existing area chart
        console.log('📊 Updating existing Area Chart:', selectedAreaChart.id)
        
        areaChartActions.updateAreaChart(selectedAreaChart.id, {
          name: widgetConfig.name,
          bigqueryData: {
            query,
            selectedTable: data.selectedTable,
            columns: {
              xAxis: data.xAxis,
              yAxis: data.yAxis,
              filters: data.filters
            },
            data: previewData,
            lastExecuted: new Date(),
            isLoading: false,
            error: null
          }
        })
      } else {
        // Create new area chart
        console.log('📊 Creating new Area Chart')
        
        areaChartActions.addAreaChart({
        name: widgetConfig.name,
        bigqueryData: {
          query,
          selectedTable: data.selectedTable,
          columns: {
            xAxis: data.xAxis,
            yAxis: data.yAxis,
            filters: data.filters
          },
          data: previewData,
          lastExecuted: new Date(),
          isLoading: false,
          error: null
        },
        chartType: 'area',
        styling: {
          colors: ['#8b5cf6'],
          showLegend: true,
          showGrid: true,
          title: `${data.xAxis[0]?.name} por ${data.yAxis[0]?.name}`,
          areaOpacity: 0.4
        },
        position: {
          x: widgetConfig.x,
          y: widgetConfig.y,
          w: widgetConfig.w,
          h: widgetConfig.h
        }
        })
      }
    } else if (data.selectedType === 'chart' && data.chartType === 'horizontal-bar') {
      // Convert to HorizontalBarChart format and use horizontalBarChartActions
      const query = horizontalBarChartActions.generateHorizontalBarChartQuery(
        data.xAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.yAxis.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.filters.map(field => ({ ...field, mode: field.mode || 'NULLABLE' })), 
        data.selectedTable
      )
      
      if (selectedHorizontalBarChart) {
        // Update existing horizontal bar chart
        console.log('📊 Updating existing Horizontal Bar Chart:', selectedHorizontalBarChart.id)
        
        horizontalBarChartActions.updateHorizontalBarChart(selectedHorizontalBarChart.id, {
          name: widgetConfig.name,
          bigqueryData: {
            query,
            selectedTable: data.selectedTable,
            columns: {
              xAxis: data.xAxis,
              yAxis: data.yAxis,
              filters: data.filters
            },
            data: previewData,
            lastExecuted: new Date(),
            isLoading: false,
            error: null
          }
        })
      } else {
        // Create new horizontal bar chart
        console.log('📊 Creating new Horizontal Bar Chart')
        
        horizontalBarChartActions.addHorizontalBarChart({
        name: widgetConfig.name,
        bigqueryData: {
          query,
          selectedTable: data.selectedTable,
          columns: {
            xAxis: data.xAxis,
            yAxis: data.yAxis,
            filters: data.filters
          },
          data: previewData,
          lastExecuted: new Date(),
          isLoading: false,
          error: null
        },
        chartType: 'horizontal-bar',
        styling: {
          colors: ['#10b981'],
          showLegend: true,
          showGrid: true,
          title: `${data.xAxis[0]?.name} por ${data.yAxis[0]?.name}`
        },
        position: {
          x: widgetConfig.x,
          y: widgetConfig.y,
          w: widgetConfig.w,
          h: widgetConfig.h
        }
        })
      }
    }
    // Note: Only chart, KPI, and table builders supported - other widget types removed
    
    // Show success feedback
    alert(`${data.selectedType} added to dashboard! Switch to the canvas to see it.`)
    
    // Clear the builder
    onClear()
  }

  // Get widget icon based on type
  const getWidgetIcon = (widgetType: string) => {
    switch (widgetType) {
      case 'kpi': return '📈'
      case 'table': return '📋'
      default: return '📊'
    }
  }

  const getDefaultWidth = (widgetType: string) => {
    switch(widgetType) {
      case 'kpi': return 48
      case 'table': return 72
      default: return 60
    }
  }

  const getDefaultHeight = (widgetType: string) => {
    switch(widgetType) {
      case 'kpi': return 100
      case 'table': return 200
      default: return 150
    }
  }

  // Helper function to determine unit based on field type
  const getUnitFromFieldType = (fieldType: string | undefined): string => {
    if (!fieldType) return ''
    
    const lowerType = fieldType.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return '' // Don't auto-assign items for string fields
    }
    if (lowerType.includes('price') || lowerType.includes('cost') || lowerType.includes('value')) {
      return '$'
    }
    if (lowerType.includes('percent') || lowerType.includes('%')) {
      return '%'
    }
    if (lowerType.includes('count') || lowerType.includes('qty') || lowerType.includes('quantity')) {
      return 'items'
    }
    return '' // Default: no unit
  }

  const generateWidgetConfig = () => {
    switch(data.selectedType) {
      case 'chart':
        return {
          chartConfig: {
            title: `${data.xAxis[0]?.name} por ${data.yAxis[0]?.name}`,
            colors: ['#2563eb'],
            enableGridX: false,
            enableGridY: true,
            margin: { top: 12, right: 12, bottom: 60, left: 50 }
          }
        }
      case 'table':
        return {
          tableConfig: {
            data: previewData, // BigQuery data for table
            columns: data.columns.map(col => ({
              id: col.name,
              header: col.name,
              accessorKey: col.name,
              sortable: true,
              type: getColumnType(col.type)
            })),
            showPagination: true,
            showColumnToggle: true,
            pageSize: 10,
            searchPlaceholder: 'Buscar...'
          }
        }
      case 'kpi':
        const kpiField = data.kpiValue[0]
        const kpiPreviewData = previewData as KPIData[]
        return {
          kpiConfig: {
            name: kpiField?.name || 'KPI',
            value: kpiPreviewData.length > 0 ? kpiPreviewData[0].current_value : undefined,
            metric: kpiField?.name,
            calculation: kpiField?.aggregation || 'SUM',
            unit: getUnitFromFieldType(kpiField?.type),
            showTarget: false, // No target for simple KPI
            showTrend: false, // No trend for simple KPI  
            visualizationType: 'card' as 'card' | 'display' | 'gauge',
            enableSimulation: false, // Never simulate
            dataSource: 'BigQuery'
          }
        }
      default:
        return {}
    }
  }

  // Helper function to map BigQuery types to table column types
  const getColumnType = (bigqueryType: string): 'text' | 'number' | 'boolean' | 'date' => {
    const lowerType = bigqueryType.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return 'text'
    }
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float') || lowerType.includes('decimal')) {
      return 'number'
    }
    if (lowerType.includes('bool')) {
      return 'boolean'
    }
    if (lowerType.includes('date') || lowerType.includes('timestamp')) {
      return 'date'
    }
    return 'text' // default fallback
  }

  const getRelevantFields = () => {
    switch(data.selectedType) {
      case 'chart':
        return {
          chartType: data.chartType,
          xColumn: data.xAxis[0]?.name || '',
          yColumn: data.yAxis[0]?.name || ''
        }
      case 'table':
        return {
          chartType: 'table',
          xColumn: data.columns[0]?.name || '', // First column as xColumn
          yColumn: data.columns[1]?.name || ''  // Second column as yColumn (if exists)
        }
      case 'kpi':
        return {
          chartType: 'kpi',
          xColumn: '', // No grouping for simple KPI
          yColumn: data.kpiValue[0]?.name || ''    // KPI value field
        }
      default:
        return {
          chartType: 'table',
          xColumn: data.columns[0]?.name || '',
          yColumn: ''
        }
    }
  }

  // Widget type options (2x3 grid)
  const widgetTypes = [
    { id: 'chart' as const, label: 'Chart', icon: <BarChart3 className="w-6 h-6" style={{ color: 'var(--cinzaDark)' }} />, description: 'Bar, line, pie charts' },
    { id: 'kpi' as const, label: 'KPI', icon: <TrendingUp className="w-6 h-6" style={{ color: 'var(--cinzaDark)' }} />, description: 'Key performance indicators' },
    { id: 'table' as const, label: 'Table', icon: <Table className="w-6 h-6" style={{ color: 'var(--cinzaDark)' }} />, description: 'Data tables' }
  ]


  // Check if configuration is valid
  const isConfigValid = data.selectedTable && (
    (data.selectedType === 'chart' && data.xAxis.length > 0 && data.yAxis.length > 0) ||
    (data.selectedType === 'table' && data.columns.length > 0) ||
    (data.selectedType === 'kpi' && data.kpiValue.length > 0)
  )

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-transparent flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3 h-3" style={{ color: 'var(--cinzaDark)' }} />
          <h2 className="text-base font-semibold" style={{ color: 'var(--cinzaDark)' }}>Universal Builder</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={!isConfigValid}
          className="gap-2"
          style={{ color: 'var(--cinzaDark)' }}
        >
          <Trash2 className="w-4 h-4" style={{ color: 'var(--cinzaDark)' }} />
          Clear
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 space-y-6">
          
          {/* Widget Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <Activity className="w-4 h-4" style={{ color: 'var(--cinzaDark)' }} />
              <h3 className="text-sm font-medium" style={{ color: 'var(--cinzaDark)' }}>Widget Type</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 px-2">
              {widgetTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-2 rounded-lg cursor-pointer transition-all ${
                    data.selectedType === type.id
                      ? 'bg-accent border border-primary/30'
                      : 'bg-transparent hover:bg-muted/30 border border-gray-300 hover:border-primary/20'
                  }`}
                  onClick={() => onTypeChange(type.id)}
                >
                  <div className="flex flex-col items-center gap-2">
                    {type.icon}
                    <span className="font-medium text-sm text-center" style={{ color: 'var(--cinzaDark)' }}>{type.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Drop Zones based on Widget Type */}
          <div className="space-y-3 px-2 overflow-x-hidden">
            
            {/* Chart Drop Zones */}
            {data.selectedType === 'chart' && (
              <ChartBuilder
                data={{
                  xAxis: data.xAxis,
                  yAxis: data.yAxis,
                  filters: data.filters,
                  chartType: data.chartType,
                  selectedTable: data.selectedTable
                }}
                onChartTypeChange={onChartTypeChange}
                onRemoveField={handleRemoveField}
                onAggregationChange={handleAggregationChange}
              />
            )}

            {/* Table Builder */}
            {data.selectedType === 'table' && (
              <TableBuilder
                data={{
                  columns: data.columns,
                  filters: data.filters,
                  selectedTable: data.selectedTable
                }}
                onRemoveField={handleRemoveField}
              />
            )}

            {/* KPI Builder */}
            {data.selectedType === 'kpi' && (
              <KPIBuilder
                data={{
                  kpiValue: data.kpiValue,
                  filters: data.filters,
                  selectedTable: data.selectedTable
                }}
                onRemoveField={handleRemoveField}
                onAggregationChange={handleAggregationChange}
              />
            )}



            {/* Common Filters for All Types */}
            <DropZone
              id="filters-drop-zone"
              label="Filters"
              description="Drag fields here to filter data"
              icon={<Activity className="w-4 h-4 text-orange-600" />}
              fields={data.filters}
              acceptedTypes={['string', 'date', 'numeric', 'boolean']}
              onRemoveField={(fieldName) => handleRemoveField('filters', fieldName)}
            />
          </div>

          {/* Actions Section */}
          <div className="space-y-4 px-2">
            {getSelectedWidget() ? (
              // Update existing widget
              <Button
                onClick={handleAddToDashboard}
                disabled={!isConfigValid}
                className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <RefreshCw className="w-4 h-4" />
                {getUpdateButtonText()}
              </Button>
            ) : (
              // Add new widget to dashboard
              <Button
                onClick={handleAddToDashboard}
                disabled={!isConfigValid}
                className="w-full gap-2"
                size="lg"
              >
                <Plus className="w-4 h-4" />
                Add to Dashboard
              </Button>
            )}
          </div>


          {/* Table Preview (only for tables) */}
          {data.selectedType === 'table' && (
            <TablePreview
              columns={data.columns}
              filters={data.filters}
              selectedTable={data.selectedTable}
              onDataReady={(tableData, query) => {
                setPreviewData(tableData as TableData[])
                setPreviewQuery(query)
              }}
            />
          )}

          {/* KPI Preview (only for kpis) */}
          {data.selectedType === 'kpi' && (
            <KPIPreview
              kpiValue={data.kpiValue}
              filters={data.filters}
              selectedTable={data.selectedTable}
              onDataReady={(kpiData, query) => {
                setPreviewData(kpiData as KPIData[])
                setPreviewQuery(query)
              }}
            />
          )}

          {/* Chart Preview (for all chart types) */}
          {data.selectedType === 'chart' && (
            <ChartPreview
              chartType={data.chartType}
              xAxis={data.xAxis}
              yAxis={data.yAxis}
              filters={data.filters}
              selectedTable={data.selectedTable}
              onDataReady={(chartData, query) => {
                setPreviewData(chartData as ChartData[])
                setPreviewQuery(query)
              }}
            />
          )}


        </div>
      </ScrollArea>
    </div>
  )
}