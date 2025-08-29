'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, PieChart, Activity, Trash2, Plus } from 'lucide-react'
import DropZone from './DropZone'
import ChartPreview from './ChartPreview'
import type { BigQueryField } from './TablesExplorer'
import type { DroppedWidget } from '@/types/widget'
import { widgetActions } from '@/stores/widgetStore'

interface ChartData {
  x: string
  y: number
  label: string
  value: number
}

interface ChartBuilderData {
  rows: BigQueryField[]
  columns: BigQueryField[]
  filters: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area'
  selectedTable: string | null
}

interface ChartBuilderProps {
  data: ChartBuilderData
  onChartTypeChange: (chartType: ChartBuilderData['chartType']) => void
  onClear: () => void
  droppedWidgets?: DroppedWidget[]
  onEditWidget: (widgetId: string, changes: Partial<DroppedWidget>) => void
}

export default function ChartBuilder({
  data,
  onChartTypeChange,
  onClear,
  droppedWidgets = [],
  onEditWidget
}: ChartBuilderProps) {
  const [previewData, setPreviewData] = useState<ChartData[]>([])
  const [previewQuery, setPreviewQuery] = useState<string>('')

  // Handle field removal from drop zones
  const handleRemoveField = (dropZoneType: 'rows' | 'columns' | 'filters', fieldName: string) => {
    // This would be handled by the parent component through drag events
    // For now, we'll just log it
    console.log(`Remove ${fieldName} from ${dropZoneType}`)
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
          title: `${data.rows[0]?.name} by ${data.columns[0]?.name}`,
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
        xColumn: data.rows[0]?.name,
        yColumn: data.columns[0]?.name,
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
  const isConfigValid = data.selectedTable && data.rows.length > 0 && data.columns.length > 0

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Chart Builder</h2>
          </div>
          <button
            onClick={onClear}
            disabled={!isConfigValid}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Drop Zones */}
        <div className="space-y-4">
          {/* Rows (Dimensions) */}
          <DropZone
            id="rows-drop-zone"
            label="Rows"
            description="Drag dimensions here (categories, groups)"
            icon={<BarChart3 className="w-4 h-4 text-green-600" />}
            fields={data.rows}
            acceptedTypes={['string', 'date', 'numeric']}
            onRemoveField={(fieldName) => handleRemoveField('rows', fieldName)}
          />

          {/* Columns (Measures) */}
          <DropZone
            id="columns-drop-zone"
            label="Columns"
            description="Drag measures here (numeric values to aggregate)"
            icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
            fields={data.columns}
            acceptedTypes={['numeric']}
            onRemoveField={(fieldName) => handleRemoveField('columns', fieldName)}
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
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-900">Chart Type</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {chartTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => onChartTypeChange(type.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  data.chartType === type.id
                    ? 'border-blue-300 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {type.icon}
                  <span className="font-medium text-sm">{type.label}</span>
                </div>
                <p className="text-xs text-gray-600">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Chart Preview */}
        <ChartPreview
          rows={data.rows}
          columns={data.columns}
          filters={data.filters}
          chartType={data.chartType}
          selectedTable={data.selectedTable}
          onDataReady={(chartData, query) => {
            setPreviewData(chartData)
            setPreviewQuery(query)
          }}
        />

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleAddToDashboard}
            disabled={!isConfigValid || previewData.length === 0}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isConfigValid && previewData.length > 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add to Dashboard
          </button>

          {/* Configuration Summary */}
          {isConfigValid && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-1">Configuration:</div>
                <div className="space-y-1 text-xs">
                  <div>• Table: <code className="bg-white px-1 rounded">{data.selectedTable}</code></div>
                  <div>• Rows: <code className="bg-white px-1 rounded">{data.rows.map(r => r.name).join(', ')}</code></div>
                  <div>• Columns: <code className="bg-white px-1 rounded">{data.columns.map(c => c.name).join(', ')}</code></div>
                  {data.filters.length > 0 && (
                    <div>• Filters: <code className="bg-white px-1 rounded">{data.filters.map(f => f.name).join(', ')}</code></div>
                  )}
                  <div>• Chart: <code className="bg-white px-1 rounded">{data.chartType}</code></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}