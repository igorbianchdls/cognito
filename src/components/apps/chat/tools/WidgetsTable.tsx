'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Edit, MapPin, Maximize2 } from 'lucide-react'

interface WidgetData {
  id: string
  widgetId: string
  name: string
  type: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  description: string
  icon: string
  bigqueryInfo?: {
    table?: string
    field?: string
    calculation?: string
    xField?: string
    yField?: string
    aggregation?: string
    chartType?: string
    columns?: string[]
  }
}

interface WidgetsTableProps {
  widgets: WidgetData[]
  totalWidgets: number
  summary: string
  success: boolean
}

const getTypeColor = (type: string) => {
  if (type === 'kpi') return 'bg-blue-100 text-blue-800'
  if (type.startsWith('chart-')) return 'bg-green-100 text-green-800'
  if (type === 'table') return 'bg-purple-100 text-purple-800'
  return 'bg-gray-100 text-gray-800'
}

const getTypeName = (type: string) => {
  if (type === 'kpi') return 'KPI'
  if (type.startsWith('chart-')) {
    const chartType = type.replace('chart-', '')
    return `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`
  }
  if (type === 'table') return 'Table'
  return type
}

const renderBigQueryInfo = (bigqueryInfo?: WidgetData['bigqueryInfo']) => {
  if (!bigqueryInfo) return <span className="text-gray-400">No data source</span>

  const { table, field, calculation, xField, yField, aggregation, columns } = bigqueryInfo

  if (field && calculation) {
    // KPI format
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">{table}</div>
        <div className="text-xs text-gray-600">
          {calculation}({field})
        </div>
      </div>
    )
  }

  if (xField && yField) {
    // Chart format
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">{table}</div>
        <div className="text-xs text-gray-600">
          {xField} × {aggregation}({yField})
        </div>
      </div>
    )
  }

  if (columns && columns.length > 0) {
    // Table format
    return (
      <div className="space-y-1">
        <div className="text-sm font-medium">{table}</div>
        <div className="text-xs text-gray-600">
          {columns.length} columns
        </div>
      </div>
    )
  }

  return (
    <div className="text-sm font-medium">{table || 'Unknown source'}</div>
  )
}

export default function WidgetsTable({ widgets, totalWidgets, summary, success }: WidgetsTableProps) {
  if (!success) {
    return (
      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-red-500">❌</span>
          <span className="text-red-700 font-medium">Failed to get canvas widgets</span>
        </div>
      </div>
    )
  }

  if (totalWidgets === 0) {
    return (
      <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📊</span>
          <span className="font-medium text-gray-700">Canvas Status</span>
        </div>
        <p className="text-gray-600">No widgets on the canvas. Drag widgets from the left panel to get started!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-blue-200 overflow-hidden">
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Widget</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="w-[200px]">BigQuery Data</TableHead>
              <TableHead className="w-[100px]">Position</TableHead>
              <TableHead className="w-[100px]">Size</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {widgets.map((widget) => (
              <TableRow key={widget.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{widget.icon}</span>
                    <div>
                      <div className="font-medium">{widget.name}</div>
                      <div className="text-xs text-gray-500">ID: {widget.widgetId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(widget.type)}>
                    {getTypeName(widget.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {renderBigQueryInfo(widget.bigqueryInfo)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-3 h-3" />
                    ({widget.position.x}, {widget.position.y})
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Maximize2 className="w-3 h-3" />
                    {widget.size.width}×{widget.size.height}
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  )
}