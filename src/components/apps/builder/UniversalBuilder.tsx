'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, PieChart, Activity, Trash2, Plus, ArrowRight, ArrowUp, Table, Gauge, Images, Kanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import DropZone from './DropZone'
import ChartPreview from './ChartPreview'
import TablePreview from './TablePreview'
import type { TableData } from './TablePreview'
import KPIPreview from './KPIPreview'
import type { KPIData } from './KPIPreview'
import type { BigQueryField } from './TablesExplorer'
import type { DroppedWidget } from '@/types/apps/widget'
import { widgetActions } from '@/stores/apps/widgetStore'

// Widget Types
type WidgetType = 'chart' | 'kpi' | 'table' | 'gauge' | 'gallery' | 'kanban'

interface UniversalBuilderData {
  selectedType: WidgetType
  selectedTable: string | null
  
  // Chart fields
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area'
  
  // Table fields  
  columns: BigQueryField[]
  
  // KPI field (simplified)
  kpiValue: BigQueryField[]
  
  // Shared fields for compatibility
  dimensions: BigQueryField[]
  measures: BigQueryField[]
  groupBy: BigQueryField[]
  
  // Common to all
  filters: BigQueryField[]
}

interface UniversalBuilderProps {
  data: UniversalBuilderData
  onTypeChange: (selectedType: 'chart' | 'kpi' | 'table' | 'gauge' | 'gallery' | 'kanban') => void
  onChartTypeChange: (chartType: 'bar' | 'line' | 'pie' | 'area') => void
  onClear: () => void
  onAggregationChange?: (fieldName: string, aggregation: BigQueryField['aggregation']) => void
  droppedWidgets?: DroppedWidget[]
  onEditWidget: (widgetId: string, changes: Partial<DroppedWidget>) => void
}

export default function UniversalBuilder({
  data,
  onTypeChange,
  onChartTypeChange,
  onClear,
  onAggregationChange
}: UniversalBuilderProps) {
  const [previewData, setPreviewData] = useState<Array<{ x: string; y: number; label: string; value: number }> | TableData[] | KPIData[]>([])
  const [previewQuery, setPreviewQuery] = useState<string>('')

  // Handle field removal from drop zones
  const handleRemoveField = (dropZoneType: string, fieldName: string) => {
    console.log(`Remove ${fieldName} from ${dropZoneType}`)
  }

  // Handle aggregation change for numeric fields
  const handleAggregationChange = (fieldName: string, aggregation: BigQueryField['aggregation']) => {
    if (onAggregationChange) {
      onAggregationChange(fieldName, aggregation)
    }
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
        : data.dimensions.length > 0 || data.measures.length > 0

    if (!hasRequiredFields) {
      alert('Please configure the required fields first')
      return
    }

    // Generate widget configuration
    const widgetConfig = {
      id: `${data.selectedType}-${Date.now()}`,
      name: `${data.selectedTable} - ${data.selectedType}`,
      type: data.selectedType === 'chart' ? `chart-${data.chartType}` : data.selectedType,
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

    // Add widget to dashboard
    widgetActions.addWidget(widgetConfig as DroppedWidget)
    
    // Show success feedback
    alert(`${data.selectedType} added to dashboard! Switch to the canvas to see it.`)
    
    // Clear the builder
    onClear()
  }

  // Get widget icon based on type
  const getWidgetIcon = (widgetType: string) => {
    switch (widgetType) {
      case 'chart': return '📊'
      case 'kpi': return '📈'
      case 'table': return '📋'
      case 'gauge': return '⚡'
      case 'gallery': return '🖼️'
      case 'kanban': return '📌'
      default: return '📊'
    }
  }

  const getDefaultWidth = (widgetType: string) => {
    switch(widgetType) {
      case 'kpi': return 2
      case 'gauge': return 3
      case 'table': return 6
      case 'gallery': return 4
      case 'kanban': return 8
      default: return 4
    }
  }

  const getDefaultHeight = (widgetType: string) => {
    switch(widgetType) {
      case 'kpi': return 2
      case 'gauge': return 3
      case 'table': return 4
      case 'gallery': return 3
      case 'kanban': return 8
      default: return 3
    }
  }

  // Helper function to determine unit based on field type
  const getUnitFromFieldType = (fieldType: string | undefined): string => {
    if (!fieldType) return ''
    
    const lowerType = fieldType.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return 'items'
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
          chartType: 'table', // Default for non-chart widgets
          xColumn: data.dimensions[0]?.name || '',
          yColumn: data.measures[0]?.name || ''
        }
    }
  }

  // Widget type options (2x3 grid)
  const widgetTypes = [
    { id: 'chart' as const, label: 'Chart', icon: <BarChart3 className="w-6 h-6" />, description: 'Bar, line, pie charts' },
    { id: 'kpi' as const, label: 'KPI', icon: <TrendingUp className="w-6 h-6" />, description: 'Key performance indicators' },
    { id: 'table' as const, label: 'Table', icon: <Table className="w-6 h-6" />, description: 'Data tables' },
    { id: 'gauge' as const, label: 'Gauge', icon: <Gauge className="w-6 h-6" />, description: 'Progress gauges' },
    { id: 'gallery' as const, label: 'Gallery', icon: <Images className="w-6 h-6" />, description: 'Image galleries' },
    { id: 'kanban' as const, label: 'Kanban', icon: <Kanban className="w-6 h-6" />, description: 'Kanban boards' }
  ]

  // Chart type options (only for charts)
  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: <BarChart3 className="w-6 h-6" />, description: 'Compare categories' },
    { id: 'line', label: 'Line Chart', icon: <TrendingUp className="w-6 h-6" />, description: 'Show trends over time' },
    { id: 'pie', label: 'Pie Chart', icon: <PieChart className="w-6 h-6" />, description: 'Show proportions' },
    { id: 'area', label: 'Area Chart', icon: <Activity className="w-6 h-6" />, description: 'Filled line chart' }
  ] as const

  // Check if configuration is valid
  const isConfigValid = data.selectedTable && (
    (data.selectedType === 'chart' && data.xAxis.length > 0 && data.yAxis.length > 0) ||
    (data.selectedType === 'table' && data.columns.length > 0) ||
    (data.selectedType !== 'chart' && data.selectedType !== 'table' && (data.dimensions.length > 0 || data.measures.length > 0))
  )

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3 h-3 text-primary" />
          <h2 className="text-base font-semibold">Universal Builder</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={!isConfigValid}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 space-y-6">
          
          {/* Widget Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Widget Type</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 px-2">
              {widgetTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-2 rounded-lg cursor-pointer transition-all ${
                    data.selectedType === type.id
                      ? 'bg-accent border border-primary/30'
                      : 'bg-background hover:bg-muted/30 border border-transparent hover:border-primary/20'
                  }`}
                  onClick={() => onTypeChange(type.id)}
                >
                  <div className="flex flex-col items-center gap-2">
                    {type.icon}
                    <span className="font-medium text-sm text-center">{type.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Drop Zones based on Widget Type */}
          <div className="space-y-3 px-2 overflow-x-hidden">
            
            {/* Chart Drop Zones */}
            {data.selectedType === 'chart' && (
              <>
                <DropZone
                  id="x-axis-drop-zone"
                  label="Eixo X"
                  description="Categorias para eixo horizontal (strings, datas)"
                  icon={<ArrowRight className="w-4 h-4 text-green-600" />}
                  fields={data.xAxis}
                  acceptedTypes={['string', 'date', 'numeric']}
                  onRemoveField={(fieldName) => handleRemoveField('xAxis', fieldName)}
                />

                <DropZone
                  id="y-axis-drop-zone"
                  label="Eixo Y"
                  description="Valores numéricos para eixo vertical (agregação)"
                  icon={<ArrowUp className="w-4 h-4 text-blue-600" />}
                  fields={data.yAxis}
                  acceptedTypes={['numeric']}
                  onRemoveField={(fieldName) => handleRemoveField('yAxis', fieldName)}
                  onAggregationChange={handleAggregationChange}
                />

                {/* Chart Type Selection for Charts */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Chart Type</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {chartTypes.map((type) => (
                      <div
                        key={type.id}
                        className={`p-2 rounded-lg cursor-pointer transition-all ${
                          data.chartType === type.id
                            ? 'bg-accent border border-primary/30'
                            : 'bg-background hover:bg-muted/30 border border-transparent hover:border-primary/20'
                        }`}
                        onClick={() => onChartTypeChange(type.id)}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {type.icon}
                          <span className="font-medium text-sm text-center">{type.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Table Drop Zones */}
            {data.selectedType === 'table' && (
              <DropZone
                id="columns-drop-zone"
                label="Colunas"
                description="Arraste campos para criar colunas da tabela"
                icon={<Table className="w-4 h-4 text-blue-600" />}
                fields={data.columns}
                acceptedTypes={['string', 'date', 'numeric', 'boolean']}
                onRemoveField={(fieldName) => handleRemoveField('columns', fieldName)}
              />
            )}

            {/* KPI Drop Zone (specific) */}
            {data.selectedType === 'kpi' && (
              <DropZone
                id="kpi-value-drop-zone"
                label="Valor KPI"
                description="Campo numérico para calcular o KPI"
                icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
                fields={data.kpiValue}
                acceptedTypes={['numeric']}
                onRemoveField={(fieldName) => handleRemoveField('kpiValue', fieldName)}
                onAggregationChange={handleAggregationChange}
              />
            )}

            {/* Generic Drop Zones for Other Non-Chart/Table/KPI Types */}
            {data.selectedType !== 'chart' && data.selectedType !== 'table' && data.selectedType !== 'kpi' && (
              <>
                <DropZone
                  id="dimensions-drop-zone"
                  label="Dimensions"
                  description="Categorical fields for grouping"
                  icon={<ArrowRight className="w-4 h-4 text-green-600" />}
                  fields={data.dimensions}
                  acceptedTypes={['string', 'date']}
                  onRemoveField={(fieldName) => handleRemoveField('dimensions', fieldName)}
                />
                
                <DropZone
                  id="measures-drop-zone"
                  label="Measures"
                  description="Numeric fields for calculation"
                  icon={<ArrowUp className="w-4 h-4 text-blue-600" />}
                  fields={data.measures}
                  acceptedTypes={['numeric']}
                  onRemoveField={(fieldName) => handleRemoveField('measures', fieldName)}
                  onAggregationChange={handleAggregationChange}
                />
              </>
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

          {/* Chart Preview (only for charts) */}
          {data.selectedType === 'chart' && (
            <ChartPreview
              xAxis={data.xAxis}
              yAxis={data.yAxis}
              filters={data.filters}
              chartType={data.chartType}
              selectedTable={data.selectedTable}
              onDataReady={(chartData, query) => {
                setPreviewData(chartData as Array<{ x: string; y: number; label: string; value: number }>)
                setPreviewQuery(query)
              }}
            />
          )}

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

          {/* Actions Section */}
          <div className="space-y-4 px-2">
            <Button
              onClick={handleAddToDashboard}
              disabled={!isConfigValid}
              className="w-full gap-2"
              size="lg"
            >
              <Plus className="w-4 h-4" />
              Add to Dashboard
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}