'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, PieChart, Activity, Trash2, Plus, ArrowRight, ArrowUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import DropZone from './DropZone'
import ChartPreview from './ChartPreview'
import type { BigQueryField } from './TablesExplorer'
import type { DroppedWidget } from '@/types/apps/widget'
import { widgetActions } from '@/stores/apps/widgetStore'

interface ChartData {
  x: string
  y: number
  label: string
  value: number
}

interface ChartBuilderData {
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  filters: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area'
  selectedTable: string | null
}

interface ChartBuilderProps {
  data: ChartBuilderData
  onChartTypeChange: (chartType: ChartBuilderData['chartType']) => void
  onClear: () => void
  onAggregationChange?: (fieldName: string, aggregation: BigQueryField['aggregation']) => void
  droppedWidgets?: DroppedWidget[]
  onEditWidget: (widgetId: string, changes: Partial<DroppedWidget>) => void
}

export default function ChartBuilder({
  data,
  onChartTypeChange,
  onClear,
  onAggregationChange,
  droppedWidgets = [],
  onEditWidget
}: ChartBuilderProps) {
  const [previewData, setPreviewData] = useState<ChartData[]>([])
  const [previewQuery, setPreviewQuery] = useState<string>('')

  // Handle field removal from drop zones
  const handleRemoveField = (dropZoneType: 'xAxis' | 'yAxis' | 'filters', fieldName: string) => {
    // This would be handled by the parent component through drag events
    // For now, we'll just log it
    console.log(`Remove ${fieldName} from ${dropZoneType}`)
  }

  // Handle aggregation change for Y-axis fields
  const handleAggregationChange = (fieldName: string, aggregation: BigQueryField['aggregation']) => {
    if (onAggregationChange) {
      onAggregationChange(fieldName, aggregation)
    }
  }

  // Handle adding chart to dashboard
  const handleAddToDashboard = () => {
    if (previewData.length === 0 || !data.selectedTable) {
      alert('Please configure the chart first')
      return
    }

    // Generate widget configuration
    const widgetConfig = {
      id: `chart-${Date.now()}`,
      name: `${data.selectedTable} - ${data.chartType} Chart`,
      type: `chart-${data.chartType}` as const,
      icon: getChartIcon(data.chartType),
      description: `Chart from ${data.selectedTable}`,
      defaultWidth: 4,
      defaultHeight: 3,
      i: `widget-${Date.now()}`,
      x: 0,
      y: 0,
      w: 4,
      h: 3,
      // Use config.chartConfig structure per WidgetConfig interface
      config: {
        chartConfig: {
          title: `${data.xAxis[0]?.name} por ${data.yAxis[0]?.name}`,
          colors: ['#2563eb'],
          enableGridX: false,
          enableGridY: true,
          margin: { top: 12, right: 12, bottom: 60, left: 50 }
        }
      },
      // Store BigQuery data separately for ChartWidget to access
      bigqueryData: {
        chartType: data.chartType,
        data: previewData,
        xColumn: data.xAxis[0]?.name,
        yColumn: data.yAxis[0]?.name,
        query: previewQuery,
        source: 'bigquery',
        table: data.selectedTable,
        lastUpdated: new Date().toISOString()
      }
    }

    // Add widget to dashboard
    widgetActions.addWidget(widgetConfig)
    
    // Show success feedback
    alert(`Chart added to dashboard! Switch to the canvas to see it.`)
    
    // Clear the builder
    onClear()
  }

  // Get chart icon based on type
  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case 'bar': return '📊'
      case 'line': return '📈'
      case 'pie': return '🥧'
      case 'area': return '📊'
      default: return '📊'
    }
  }

  // Chart type options
  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: <BarChart3 className="w-4 h-4" />, description: 'Compare categories' },
    { id: 'line', label: 'Line Chart', icon: <TrendingUp className="w-4 h-4" />, description: 'Show trends over time' },
    { id: 'pie', label: 'Pie Chart', icon: <PieChart className="w-4 h-4" />, description: 'Show proportions' },
    { id: 'area', label: 'Area Chart', icon: <Activity className="w-4 h-4" />, description: 'Filled line chart' }
  ] as const

  // Check if configuration is valid
  const isConfigValid = data.selectedTable && data.xAxis.length > 0 && data.yAxis.length > 0

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-300/50">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3 h-3 text-primary" />
          <h2 className="text-base font-semibold">Chart Builder</h2>
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
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="px-3 py-2 space-y-6">
          {/* Drop Zones Section */}
          <div className="space-y-3 px-2">
            {/* Eixo X (Dimensions) */}
            <DropZone
              id="x-axis-drop-zone"
              label="Eixo X"
              description="Categorias para eixo horizontal (strings, datas)"
              icon={<ArrowRight className="w-4 h-4 text-green-600" />}
              fields={data.xAxis}
              acceptedTypes={['string', 'date', 'numeric']}
              onRemoveField={(fieldName) => handleRemoveField('xAxis', fieldName)}
            />

            {/* Eixo Y (Measures) */}
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

            {/* Filters */}
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

          {/* Chart Type Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2">
              <PieChart className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Tipo de Gráfico</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 px-2">
              {chartTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    data.chartType === type.id
                      ? 'bg-accent border border-primary/30'
                      : 'bg-background hover:bg-muted/30 border border-transparent hover:border-primary/20'
                  }`}
                  onClick={() => onChartTypeChange(type.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {type.icon}
                    <span className="font-medium text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

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

          {/* Actions Section */}
          <div className="space-y-4 px-2">
            <Button
              onClick={handleAddToDashboard}
              disabled={!isConfigValid || previewData.length === 0}
              className="w-full gap-2"
              size="lg"
            >
              <Plus className="w-4 h-4" />
              Add to Dashboard
            </Button>

            {/* Configuration Summary */}
            {isConfigValid && (
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-sm">
                  <h4 className="text-sm font-medium mb-2">Configuração</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Table</Badge>
                      <code className="bg-background px-1 rounded text-xs">{data.selectedTable}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Eixo X</Badge>
                      <code className="bg-background px-1 rounded text-xs">{data.xAxis.map(r => r.name).join(', ')}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Eixo Y</Badge>
                      <code className="bg-background px-1 rounded text-xs">{data.yAxis.map(c => c.name).join(', ')}</code>
                    </div>
                    {data.filters.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Filters</Badge>
                        <code className="bg-background px-1 rounded text-xs">{data.filters.map(f => f.name).join(', ')}</code>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Chart</Badge>
                      <code className="bg-background px-1 rounded text-xs">{data.chartType}</code>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}