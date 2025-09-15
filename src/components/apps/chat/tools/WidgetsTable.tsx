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
import { useStore } from '@nanostores/react'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import { $kpisAsDropped } from '@/stores/apps/kpiStore'
import { $tablesAsDropped } from '@/stores/apps/tableStore'
import { $barChartsAsDropped } from '@/stores/apps/barChartStore'
import { $horizontalBarChartsAsDropped } from '@/stores/apps/horizontalBarChartStore'
import { $lineChartsAsDropped } from '@/stores/apps/lineChartStore'
import { $pieChartsAsDropped } from '@/stores/apps/pieChartStore'
import { $areaChartsAsDropped } from '@/stores/apps/areaChartStore'

interface WidgetsTableProps {
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

const renderBigQueryInfo = (widget: DroppedWidget) => {
  // Handle KPI widgets
  if (widget.type === 'kpi' && widget.kpiConfig?.bigqueryData) {
    const { selectedTable, query } = widget.kpiConfig.bigqueryData
    if (selectedTable) {
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">{selectedTable}</div>
          <div className="text-xs text-gray-600">KPI Query</div>
        </div>
      )
    }
  }

  // Handle Chart widgets
  if (widget.type.startsWith('chart-')) {
    let bigqueryData = null
    if (widget.barChartConfig?.bigqueryData) bigqueryData = widget.barChartConfig.bigqueryData
    else if (widget.horizontalBarChartConfig?.bigqueryData) bigqueryData = widget.horizontalBarChartConfig.bigqueryData
    else if (widget.lineChartConfig?.bigqueryData) bigqueryData = widget.lineChartConfig.bigqueryData
    else if (widget.pieChartConfig?.bigqueryData) bigqueryData = widget.pieChartConfig.bigqueryData
    else if (widget.areaChartConfig?.bigqueryData) bigqueryData = widget.areaChartConfig.bigqueryData

    if (bigqueryData?.selectedTable) {
      const xField = bigqueryData.columns?.xAxis?.[0]?.name
      const yField = bigqueryData.columns?.yAxis?.[0]?.name
      const aggregation = bigqueryData.columns?.yAxis?.[0]?.aggregation

      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">{bigqueryData.selectedTable}</div>
          {xField && yField && (
            <div className="text-xs text-gray-600">
              {xField} × {aggregation}({yField})
            </div>
          )}
        </div>
      )
    }
  }

  // Handle Table widgets
  if (widget.type === 'table' && widget.tableConfig?.bigqueryData) {
    const { selectedTable, selectedColumns } = widget.tableConfig.bigqueryData
    if (selectedTable) {
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">{selectedTable}</div>
          <div className="text-xs text-gray-600">
            {selectedColumns?.length || 0} columns
          </div>
        </div>
      )
    }
  }

  return <span className="text-gray-400">No data source</span>
}

export default function WidgetsTable({ summary, success }: WidgetsTableProps) {
  // Get current widget data from stores
  const kpis = useStore($kpisAsDropped)
  const tables = useStore($tablesAsDropped)
  const barCharts = useStore($barChartsAsDropped)
  const horizontalBarCharts = useStore($horizontalBarChartsAsDropped)
  const lineCharts = useStore($lineChartsAsDropped)
  const pieCharts = useStore($pieChartsAsDropped)
  const areaCharts = useStore($areaChartsAsDropped)

  // Combine all widgets
  const allWidgets = [
    ...kpis,
    ...tables,
    ...barCharts,
    ...horizontalBarCharts,
    ...lineCharts,
    ...pieCharts,
    ...areaCharts
  ]

  const totalWidgets = allWidgets.length

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
            {allWidgets.map((widget) => (
              <TableRow key={widget.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{widget.icon}</span>
                    <div>
                      <div className="font-medium">{widget.name}</div>
                      <div className="text-xs text-gray-500">ID: {widget.i}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(widget.type)}>
                    {getTypeName(widget.type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {renderBigQueryInfo(widget)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-3 h-3" />
                    ({widget.x}, {widget.y})
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Maximize2 className="w-3 h-3" />
                    {widget.w}×{widget.h}
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