'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, PieChart, Activity, Trash2, Plus, ArrowRight, ArrowUp, Table, Gauge, Images, Kanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import DropZone from './DropZone'
import ChartPreview from './ChartPreview'
import type { BigQueryField } from './TablesExplorer'
import type { DroppedWidget } from '@/types/apps/widget'
import { widgetActions } from '@/stores/apps/widgetStore'

// Widget Types
type WidgetType = 'chart' | 'kpi' | 'table' | 'gauge' | 'gallery' | 'kanban'

interface UniversalBuilderData {
  widgetType: WidgetType
  selectedTable: string | null
  
  // Chart fields
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area'
  
  // KPI fields  
  metric: BigQueryField[]
  dimension: BigQueryField[]
  
  // Table fields
  columns: BigQueryField[]
  
  // Gauge fields
  value: BigQueryField[]
  target: BigQueryField[]
  
  // Gallery fields
  imageField: BigQueryField[]
  titleField: BigQueryField[]
  descriptionField: BigQueryField[]
  
  // Kanban fields
  cardsField: BigQueryField[]
  statusField: BigQueryField[]
  cardTitleField: BigQueryField[]
  
  // Common to all
  filters: BigQueryField[]
}

interface UniversalBuilderProps {
  data: UniversalBuilderData
  onWidgetTypeChange: (widgetType: WidgetType) => void
  onChartTypeChange: (chartType: 'bar' | 'line' | 'pie' | 'area') => void
  onClear: () => void
  onAggregationChange?: (fieldName: string, aggregation: BigQueryField['aggregation']) => void
  droppedWidgets?: DroppedWidget[]
  onEditWidget: (widgetId: string, changes: Partial<DroppedWidget>) => void
}

export default function UniversalBuilder({
  data,
  onWidgetTypeChange,
  onChartTypeChange,
  onClear,
  onAggregationChange,
  droppedWidgets = [],
  onEditWidget
}: UniversalBuilderProps) {
  const [previewData, setPreviewData] = useState<any[]>([])
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

  // Widget types configuration
  const widgetTypes = [
    { id: 'chart' as WidgetType, label: 'Chart', icon: <BarChart3 className="w-6 h-6" /> },
    { id: 'kpi' as WidgetType, label: 'KPI', icon: <TrendingUp className="w-6 h-6" /> },
    { id: 'table' as WidgetType, label: 'Table', icon: <Table className="w-6 h-6" /> },
    { id: 'gauge' as WidgetType, label: 'Gauge', icon: <Gauge className="w-6 h-6" /> },
    { id: 'gallery' as WidgetType, label: 'Gallery', icon: <Images className="w-6 h-6" /> },
    { id: 'kanban' as WidgetType, label: 'Kanban', icon: <Kanban className="w-6 h-6" /> }
  ] as const

  // Chart type options (only for chart widget)
  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: <BarChart3 className="w-6 h-6" /> },
    { id: 'line', label: 'Line Chart', icon: <TrendingUp className="w-6 h-6" /> },
    { id: 'pie', label: 'Pie Chart', icon: <PieChart className="w-6 h-6" /> },
    { id: 'area', label: 'Area Chart', icon: <Activity className="w-6 h-6" /> }
  ] as const

  // Handle adding widget to dashboard
  const handleAddToDashboard = () => {
    // Check if configuration is valid based on widget type
    let isConfigValid = false
    
    switch(data.widgetType) {
      case 'chart':
        isConfigValid = data.selectedTable && data.xAxis.length > 0 && data.yAxis.length > 0
        break
      case 'kpi':
        isConfigValid = data.selectedTable && data.metric.length > 0
        break
      case 'table':
        isConfigValid = data.selectedTable && data.columns.length > 0
        break
      case 'gauge':
        isConfigValid = data.selectedTable && data.value.length > 0
        break
      case 'gallery':
        isConfigValid = data.selectedTable && data.imageField.length > 0 && data.titleField.length > 0
        break
      case 'kanban':
        isConfigValid = data.selectedTable && data.cardsField.length > 0 && data.statusField.length > 0
        break
    }

    if (!isConfigValid) {
      alert('Please configure the widget first')
      return
    }

    // Generate widget configuration based on type
    const widgetConfig = {
      id: `${data.widgetType}-${Date.now()}`,
      name: `${data.selectedTable} - ${data.widgetType}`,
      type: data.widgetType === 'chart' ? `chart-${data.chartType}` : data.widgetType,
      icon: getWidgetIcon(data.widgetType),
      description: `${data.widgetType} from ${data.selectedTable}`,
      defaultWidth: getDefaultWidth(data.widgetType),
      defaultHeight: getDefaultHeight(data.widgetType),
      i: `widget-${Date.now()}`,
      x: 0,
      y: 0,
      w: getDefaultWidth(data.widgetType),
      h: getDefaultHeight(data.widgetType),
      config: generateWidgetConfig(),
      // Store data source info
      bigqueryData: {
        widgetType: data.widgetType,
        data: previewData,
        query: previewQuery,
        source: 'bigquery',
        table: data.selectedTable,
        lastUpdated: new Date().toISOString(),
        fields: getRelevantFields()
      }
    }

    // Add widget to dashboard
    widgetActions.addWidget(widgetConfig)
    
    // Show success feedback
    alert(`${data.widgetType} added to dashboard! Switch to the canvas to see it.`)
    
    // Clear the builder
    onClear()
  }

  // Helper functions
  const getWidgetIcon = (type: WidgetType) => {
    switch (type) {
      case 'chart': return '📊'
      case 'kpi': return '📈'
      case 'table': return '📋'
      case 'gauge': return '📏'
      case 'gallery': return '🖼️'
      case 'kanban': return '📋'
      default: return '📊'
    }
  }

  const getDefaultWidth = (type: WidgetType) => {
    switch (type) {
      case 'chart': return 4
      case 'kpi': return 2
      case 'table': return 6
      case 'gauge': return 3
      case 'gallery': return 8
      case 'kanban': return 12
      default: return 4
    }
  }

  const getDefaultHeight = (type: WidgetType) => {
    switch (type) {
      case 'chart': return 3
      case 'kpi': return 2
      case 'table': return 4
      case 'gauge': return 3
      case 'gallery': return 6
      case 'kanban': return 8
      default: return 3
    }
  }

  const generateWidgetConfig = () => {
    switch(data.widgetType) {
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
      default:
        return {}
    }
  }

  const getRelevantFields = () => {
    switch(data.widgetType) {
      case 'chart':
        return {
          xAxis: data.xAxis,
          yAxis: data.yAxis,
          chartType: data.chartType,
          filters: data.filters
        }
      case 'kpi':
        return {
          metric: data.metric,
          dimension: data.dimension,
          filters: data.filters
        }
      case 'table':
        return {
          columns: data.columns,
          filters: data.filters
        }
      case 'gauge':
        return {
          value: data.value,
          target: data.target,
          filters: data.filters
        }
      case 'gallery':
        return {
          imageField: data.imageField,
          titleField: data.titleField,
          descriptionField: data.descriptionField,
          filters: data.filters
        }
      case 'kanban':
        return {
          cardsField: data.cardsField,
          statusField: data.statusField,
          cardTitleField: data.cardTitleField,
          filters: data.filters
        }
      default:
        return {}
    }
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3 h-3 text-primary" />
          <h2 className="text-base font-semibold">Widget Builder</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
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
              <PieChart className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Widget Type</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 px-2">
              {widgetTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-2 rounded-lg cursor-pointer transition-all ${
                    data.widgetType === type.id
                      ? 'bg-accent border border-primary/30'
                      : 'bg-background hover:bg-muted/30 border border-transparent hover:border-primary/20'
                  }`}
                  onClick={() => onWidgetTypeChange(type.id)}
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
            {data.widgetType === 'chart' && (
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
                        onClick={() => onChartTypeChange(type.id as 'bar' | 'line' | 'pie' | 'area')}
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

            {/* KPI Drop Zones */}
            {data.widgetType === 'kpi' && (
              <>
                <DropZone
                  id="metric-drop-zone"
                  label="Metric"
                  description="Valor numérico principal do KPI"
                  icon={<TrendingUp className="w-4 h-4 text-green-600" />}
                  fields={data.metric}
                  acceptedTypes={['numeric']}
                  onRemoveField={(fieldName) => handleRemoveField('metric', fieldName)}
                />

                <DropZone
                  id="dimension-drop-zone"
                  label="Dimension"
                  description="Agrupamento opcional para o KPI"
                  icon={<ArrowRight className="w-4 h-4 text-blue-600" />}
                  fields={data.dimension}
                  acceptedTypes={['string', 'date']}
                  onRemoveField={(fieldName) => handleRemoveField('dimension', fieldName)}
                />
              </>
            )}

            {/* Table Drop Zones */}
            {data.widgetType === 'table' && (
              <DropZone
                id="columns-drop-zone"
                label="Columns"
                description="Colunas da tabela (dimensões e medidas)"
                icon={<Table className="w-4 h-4 text-green-600" />}
                fields={data.columns}
                acceptedTypes={['string', 'date', 'numeric', 'boolean']}
                onRemoveField={(fieldName) => handleRemoveField('columns', fieldName)}
              />
            )}

            {/* Gauge Drop Zones */}
            {data.widgetType === 'gauge' && (
              <>
                <DropZone
                  id="value-drop-zone"
                  label="Value"
                  description="Valor atual do medidor"
                  icon={<Gauge className="w-4 h-4 text-green-600" />}
                  fields={data.value}
                  acceptedTypes={['numeric']}
                  onRemoveField={(fieldName) => handleRemoveField('value', fieldName)}
                />

                <DropZone
                  id="target-drop-zone"
                  label="Target"
                  description="Meta ou valor alvo"
                  icon={<ArrowUp className="w-4 h-4 text-blue-600" />}
                  fields={data.target}
                  acceptedTypes={['numeric']}
                  onRemoveField={(fieldName) => handleRemoveField('target', fieldName)}
                />
              </>
            )}

            {/* Gallery Drop Zones */}
            {data.widgetType === 'gallery' && (
              <>
                <DropZone
                  id="image-field-drop-zone"
                  label="Image Field"
                  description="Campo com URLs das imagens"
                  icon={<Images className="w-4 h-4 text-green-600" />}
                  fields={data.imageField}
                  acceptedTypes={['string']}
                  onRemoveField={(fieldName) => handleRemoveField('imageField', fieldName)}
                />

                <DropZone
                  id="title-field-drop-zone"
                  label="Title Field"
                  description="Campo para títulos das imagens"
                  icon={<ArrowRight className="w-4 h-4 text-blue-600" />}
                  fields={data.titleField}
                  acceptedTypes={['string']}
                  onRemoveField={(fieldName) => handleRemoveField('titleField', fieldName)}
                />

                <DropZone
                  id="description-field-drop-zone"
                  label="Description Field"
                  description="Campo opcional para descrições"
                  icon={<ArrowRight className="w-4 h-4 text-orange-600" />}
                  fields={data.descriptionField}
                  acceptedTypes={['string']}
                  onRemoveField={(fieldName) => handleRemoveField('descriptionField', fieldName)}
                />
              </>
            )}

            {/* Kanban Drop Zones */}
            {data.widgetType === 'kanban' && (
              <>
                <DropZone
                  id="cards-field-drop-zone"
                  label="Cards"
                  description="Campo que define cada card/item"
                  icon={<Kanban className="w-4 h-4 text-green-600" />}
                  fields={data.cardsField}
                  acceptedTypes={['string']}
                  onRemoveField={(fieldName) => handleRemoveField('cardsField', fieldName)}
                />

                <DropZone
                  id="status-field-drop-zone"
                  label="Status Column"
                  description="Campo que define as colunas/estágios"
                  icon={<ArrowRight className="w-4 h-4 text-blue-600" />}
                  fields={data.statusField}
                  acceptedTypes={['string']}
                  onRemoveField={(fieldName) => handleRemoveField('statusField', fieldName)}
                />

                <DropZone
                  id="card-title-drop-zone"
                  label="Card Title"
                  description="Campo para títulos dos cards"
                  icon={<ArrowRight className="w-4 h-4 text-orange-600" />}
                  fields={data.cardTitleField}
                  acceptedTypes={['string']}
                  onRemoveField={(fieldName) => handleRemoveField('cardTitleField', fieldName)}
                />
              </>
            )}

            {/* Filters Drop Zone - Common to all widgets */}
            <DropZone
              id="filters-drop-zone"
              label="Filters"
              description="Filtros para dados"
              icon={<Activity className="w-4 h-4 text-orange-600" />}
              fields={data.filters}
              acceptedTypes={['string', 'date', 'numeric', 'boolean']}
              onRemoveField={(fieldName) => handleRemoveField('filters', fieldName)}
            />
          </div>

          {/* Preview Section - Only for Chart for now */}
          {data.widgetType === 'chart' && (
            <ChartPreview
              xAxis={data.xAxis}
              yAxis={data.yAxis}
              filters={data.filters}
              chartType={data.chartType}
              selectedTable={data.selectedTable}
              onDataReady={(chartData, query) => {
                setPreviewData(chartData)
                setPreviewQuery(query)
              }}
            />
          )}

          {/* Actions Section */}
          <div className="space-y-4 px-2">
            <Button
              onClick={handleAddToDashboard}
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

// Export types for parent components
export type { WidgetType, UniversalBuilderData }