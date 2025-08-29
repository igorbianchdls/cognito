'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import TablesExplorer from './TablesExplorer'
import ChartBuilder from './ChartBuilder'
import WidgetsPanel from '../WidgetsPanel'
import ChatPanel from '../ChatPanel'
import WidgetEditor from '../WidgetEditorNew'
import CodeEditor from '../CodeEditor'
import AutomationsPanel from '../AutomationsPanel'
import SavedPanel from '../SavedPanel'
import type { DroppedWidget } from '@/types/widget'
import type { BigQueryField } from './TablesExplorer'

interface ChartBuilderData {
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  filters: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area'
  selectedTable: string | null
}

interface SplitSidebarPanelProps {
  activeTab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved' | 'datasets'
  collapsed?: boolean
  droppedWidgets?: DroppedWidget[]
  onEditWidget: (widgetId: string, changes: Partial<DroppedWidget>) => void
}

export default function SplitSidebarPanel({ 
  activeTab, 
  collapsed = false, 
  droppedWidgets = [],
  onEditWidget
}: SplitSidebarPanelProps) {
  const [chartBuilderData, setChartBuilderData] = useState<ChartBuilderData>({
    xAxis: [],
    yAxis: [],
    filters: [],
    chartType: 'bar',
    selectedTable: null
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !active.data.current) return

    const draggedColumn = active.data.current as BigQueryField & { sourceTable: string }
    const dropZoneId = over.id as string

    // Update chart builder data based on drop zone
    setChartBuilderData(prev => {
      const newData = { ...prev }
      
      // Remove from previous locations
      newData.xAxis = newData.xAxis.filter(col => col.name !== draggedColumn.name)
      newData.yAxis = newData.yAxis.filter(col => col.name !== draggedColumn.name)
      newData.filters = newData.filters.filter(col => col.name !== draggedColumn.name)
      
      // Add to new location
      switch (dropZoneId) {
        case 'x-axis-drop-zone':
          newData.xAxis.push(draggedColumn)
          break
        case 'y-axis-drop-zone':
          newData.yAxis.push(draggedColumn)
          break
        case 'filters-drop-zone':
          newData.filters.push(draggedColumn)
          break
      }
      
      // Update selected table
      newData.selectedTable = draggedColumn.sourceTable
      
      return newData
    })
  }

  const handleChartTypeChange = (chartType: ChartBuilderData['chartType']) => {
    setChartBuilderData(prev => ({ ...prev, chartType }))
  }

  const handleClearBuilder = () => {
    setChartBuilderData({
      xAxis: [],
      yAxis: [],
      filters: [],
      chartType: 'bar',
      selectedTable: null
    })
  }

  // Show datasets tab with split layout
  if (activeTab === 'datasets') {
    return (
      <div className={`${
        collapsed 
          ? 'w-0 overflow-hidden' 
          : 'w-[600px] bg-gray-50 flex-shrink-0 overflow-hidden h-[calc(100vh-4rem)] border-r border-gray-200'
      } transition-all duration-300 ease-in-out`}>
        <DndContext onDragEnd={handleDragEnd}>
          <div className="h-full flex">
            {/* Tables Explorer - Left Half */}
            <div className="w-1/2 border-r border-gray-200">
              <TablesExplorer />
            </div>
            
            {/* Chart Builder - Right Half */}
            <div className="w-1/2">
              <ChartBuilder
                data={chartBuilderData}
                onChartTypeChange={handleChartTypeChange}
                onClear={handleClearBuilder}
                droppedWidgets={droppedWidgets}
                onEditWidget={onEditWidget}
              />
            </div>
          </div>
        </DndContext>
      </div>
    )
  }

  // Original sidebar for other tabs
  return (
    <div className={`${
      collapsed 
        ? 'w-0 overflow-hidden' 
        : 'w-[480px] bg-gray-50 flex-shrink-0 overflow-hidden h-[calc(100vh-4rem)] border-r border-gray-200'
    } transition-all duration-300 ease-in-out`}>
      {activeTab === 'widgets' && <WidgetsPanel />}
      {activeTab === 'chat' && <ChatPanel droppedWidgets={droppedWidgets} onEditWidget={onEditWidget} />}
      {activeTab === 'editor' && <WidgetEditor />}
      {activeTab === 'code' && <CodeEditor />}
      {activeTab === 'automations' && <AutomationsPanel />}
      {activeTab === 'saved' && <SavedPanel />}
    </div>
  )
}