'use client'

import { useParams } from 'next/navigation'
import { useStore } from '@nanostores/react'
import { $kpisAsDropped } from '@/stores/apps/kpiStore'
import { $tablesAsDropped } from '@/stores/apps/tableStore'
import { $barChartsAsDropped } from '@/stores/apps/barChartStore'
import { $horizontalBarChartsAsDropped } from '@/stores/apps/horizontalBarChartStore'
import { $lineChartsAsDropped } from '@/stores/apps/lineChartStore'
import { $pieChartsAsDropped } from '@/stores/apps/pieChartStore'
import { $areaChartsAsDropped } from '@/stores/apps/areaChartStore'
import DroppedWidget from '@/components/apps/DroppedWidget'
import { useMemo } from 'react'

export default function EmbedWidgetPage() {
  const params = useParams()
  const widgetId = params.id as string

  // Get all widgets from stores
  const kpis = useStore($kpisAsDropped)
  const tables = useStore($tablesAsDropped)
  const barCharts = useStore($barChartsAsDropped)
  const horizontalBarCharts = useStore($horizontalBarChartsAsDropped)
  const lineCharts = useStore($lineChartsAsDropped)
  const pieCharts = useStore($pieChartsAsDropped)
  const areaCharts = useStore($areaChartsAsDropped)

  // Find widget by ID across all stores
  const widget = useMemo(() => {
    const allWidgets = [
      ...kpis,
      ...tables,
      ...barCharts,
      ...horizontalBarCharts,
      ...lineCharts,
      ...pieCharts,
      ...areaCharts
    ]
    return allWidgets.find(w => w.i === widgetId)
  }, [widgetId, kpis, tables, barCharts, horizontalBarCharts, lineCharts, pieCharts, areaCharts])

  if (!widget) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Widget não encontrado</h1>
          <p className="text-gray-600">O widget com ID "{widgetId}" não existe.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl"
        style={{
          width: `${widget.w * 100}px`,
          height: `${widget.h * 100}px`,
          minWidth: '300px',
          minHeight: '200px'
        }}
      >
        <DroppedWidget 
          widget={widget}
          onRemove={() => {}} 
          onEdit={undefined}
          isEmbedMode={true}
        />
      </div>
    </div>
  )
}