'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { 
  chartActions, 
  $stagedXAxis,
  $stagedYAxis, 
  $stagedFilters,
  type BigQueryField
} from '@/stores/apps/chartStore'
import { isChartWidget } from '@/types/apps/chartWidgets'
import type { BaseChartConfig } from '@/types/apps/chartWidgets'
import type { BaseWidget } from '@/types/apps/baseWidget'
import { DragEndEvent } from '@dnd-kit/core'
import ChartEditorTabs from './ChartEditorTabs'
import type { ContainerConfig } from '@/types/apps/widget'

interface ChartEditorProps {
  selectedWidget: BaseWidget
  chartConfig: BaseChartConfig
  containerConfig: ContainerConfig
  onChartConfigChange: (field: string, value: unknown) => void
  onContainerConfigChange: (field: string, value: unknown) => void
  onWidgetPositionChange: (field: string, value: number) => void
}

export default function ChartEditor({
  selectedWidget,
  chartConfig,
  containerConfig,
  onChartConfigChange,
  onContainerConfigChange,
  onWidgetPositionChange
}: ChartEditorProps) {
  // Chart staging data from store
  const stagedXAxis = useStore($stagedXAxis)
  const stagedYAxis = useStore($stagedYAxis)
  const stagedFilters = useStore($stagedFilters)
  
  // State para controlar a tab ativa no edit view
  const [activeEditTab, setActiveEditTab] = useState<'design' | 'layout' | 'data'>('design')

  // Load tables when data tab is active
  useEffect(() => {
    if (activeEditTab === 'data') {
      chartActions.loadTables()
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

    // Add to appropriate staging area using store actions
    switch (dropZoneId) {
      case 'chart-x-axis-drop-zone':
        chartActions.addToStagingArea(draggedColumn, 'xAxis')
        break
      case 'chart-y-axis-drop-zone':
        chartActions.addToStagingArea(draggedColumn, 'yAxis')
        break
      case 'chart-filters-drop-zone':
        chartActions.addToStagingArea(draggedColumn, 'filters')
        break
    }
  }

  // Handle remove field from staging areas
  const handleRemoveChartField = (dropZoneType: string, fieldName: string) => {
    chartActions.removeFromStagingArea(fieldName, dropZoneType as 'xAxis' | 'yAxis' | 'filters')
  }

  // Update chart data with staged fields
  const updateChartData = async () => {
    if (!selectedWidget || !isChartWidget(selectedWidget)) return
    
    await chartActions.updateChartWithStagedData(selectedWidget.i)
  }

  // Get tab render functions from ChartEditorTabs
  const { renderChartDesignTab, renderChartLayoutTab, renderChartDataTab } = ChartEditorTabs({
    selectedWidget,
    chartConfig,
    containerConfig,
    onChartConfigChange,
    onContainerConfigChange,
    onWidgetPositionChange,
    onChartDragEnd: handleChartDragEnd,
    onRemoveChartField: handleRemoveChartField,
    onUpdateChartData: updateChartData,
    hasChartChanged: hasChartChanged()
  })

  return (
    <div className="space-y-4">
      {/* Tabs */}
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

      {/* Tab Content */}
      <div className="bg-white rounded-lg">
        {activeEditTab === 'design' && renderChartDesignTab()}
        {activeEditTab === 'layout' && renderChartLayoutTab()}
        {activeEditTab === 'data' && renderChartDataTab()}
      </div>
    </div>
  )
}