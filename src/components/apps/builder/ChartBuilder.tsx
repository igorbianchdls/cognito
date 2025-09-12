'use client'

import { BarChart3, TrendingUp, PieChart, Activity, ArrowRight, ArrowUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DropZone from './DropZone'
import type { BigQueryField } from './TablesExplorer'

interface ChartBuilderData {
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  filters: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'
  selectedTable: string | null
}

interface ChartBuilderProps {
  data: ChartBuilderData
  onChartTypeChange: (chartType: ChartBuilderData['chartType']) => void
  onRemoveField: (dropZoneType: 'xAxis' | 'yAxis' | 'filters', fieldName: string) => void
  onAggregationChange?: (fieldName: string, aggregation: BigQueryField['aggregation']) => void
}

export default function ChartBuilder({
  data,
  onChartTypeChange,
  onRemoveField,
  onAggregationChange
}: ChartBuilderProps) {

  // Chart type options
  const chartTypes = [
    { id: 'bar', label: 'Bar Chart', icon: <BarChart3 className="w-6 h-6" />, description: 'Compare categories' },
    { id: 'horizontal-bar', label: 'Horizontal Bar', icon: <BarChart3 className="w-6 h-6 rotate-90" />, description: 'Horizontal comparison' },
    { id: 'line', label: 'Line Chart', icon: <TrendingUp className="w-6 h-6" />, description: 'Show trends over time' },
    { id: 'pie', label: 'Pie Chart', icon: <PieChart className="w-6 h-6" />, description: 'Show proportions' },
    { id: 'area', label: 'Area Chart', icon: <Activity className="w-6 h-6" />, description: 'Filled line chart' }
  ] as const

  return (
    <div className="space-y-4">
      {/* Drop Zones */}
      <div className="space-y-3">
        {/* X-Axis Drop Zone */}
        <DropZone
          id="x-axis-drop-zone"
          label="Eixo X"
          description="Categorias para eixo horizontal (strings, datas)"
          icon={<ArrowRight className="w-4 h-4 text-emerald-500" />}
          fields={data.xAxis}
          acceptedTypes={['string', 'date', 'numeric']}
          onRemoveField={(fieldName) => onRemoveField('xAxis', fieldName)}
        />

        {/* Y-Axis Drop Zone */}
        <DropZone
          id="y-axis-drop-zone"
          label="Eixo Y"
          description="Valores numéricos para eixo vertical (agregação)"
          icon={<ArrowUp className="w-4 h-4 text-primary" />}
          fields={data.yAxis}
          acceptedTypes={['numeric']}
          onRemoveField={(fieldName) => onRemoveField('yAxis', fieldName)}
          onAggregationChange={onAggregationChange}
        />

        {/* Filters Drop Zone */}
        <DropZone
          id="filters-drop-zone"
          label="Filters"
          description="Drag fields here to filter data"
          icon={<Activity className="w-4 h-4 text-orange-500" />}
          fields={data.filters}
          acceptedTypes={['string', 'date', 'numeric', 'boolean']}
          onRemoveField={(fieldName) => onRemoveField('filters', fieldName)}
        />
      </div>

      {/* Chart Type Selection */}
      <div>
        <div className="mb-3">
          <div className="text-sm font-medium flex items-center gap-2 mb-1" style={{ color: 'rgb(120, 120, 120)' }}>
            <PieChart className="w-4 h-4" style={{ color: 'rgb(120, 120, 120)' }} />
            Tipo de Gráfico
          </div>
          <p className="text-xs text-muted-foreground">
            Selecione o tipo de visualização
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {chartTypes.map((type) => (
            <div
              key={type.id}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                data.chartType === type.id
                  ? 'bg-accent border-primary/50 shadow-sm'
                  : 'bg-transparent hover:bg-muted/30 border border-gray-300 hover:border-primary/30'
              }`}
              onClick={() => onChartTypeChange(type.id)}
            >
              <div className="flex flex-col items-center gap-2">
                {type.icon}
                <div className="text-center">
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}