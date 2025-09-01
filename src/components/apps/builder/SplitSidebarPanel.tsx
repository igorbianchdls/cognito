'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import TablesExplorer from './TablesExplorer'
import ChartBuilder from './ChartBuilder'
import WidgetsPanel from '../widgets/WidgetsPanel'
import ChatPanel from '../chat/ChatPanel'
import WidgetEditor from '../editor/WidgetEditorNew'
import CodeEditor from '../code/CodeEditor'
import AutomationsPanel from '../automations/AutomationsPanel'
import SavedPanel from '../saved/SavedPanel'
import type { DroppedWidget } from '@/types/apps/widget'
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

  const handleAggregationChange = (fieldName: string, aggregation: BigQueryField['aggregation']) => {
    setChartBuilderData(prev => ({
      ...prev,
      yAxis: prev.yAxis.map(field => 
        field.name === fieldName 
          ? { ...field, aggregation }
          : field
      )
    }))
  }

  // Show datasets tab with split layout
  if (activeTab === 'datasets') {
    return (
      <div className={`${
        collapsed 
          ? 'w-0 overflow-hidden' 
          : 'w-[720px] min-w-[720px] max-w-[720px] flex-shrink-0 overflow-hidden h-[calc(100vh-4rem)] shadow-sm'
      } transition-all duration-300 ease-in-out relative`} style={{backgroundColor: 'hsl(0 0% 98%)'}}>
        <DndContext onDragEnd={handleDragEnd}>
          <div className="h-full flex overflow-hidden">
            {/* Tables Explorer - Left Third */}
            <div className="w-[240px] min-w-[240px] max-w-[240px] border-r border-border overflow-hidden flex-shrink-0" style={{width: '240px'}}>
              <div className="w-full h-full overflow-hidden max-w-[240px]">
                <TablesExplorer />
              </div>
            </div>
            
            {/* Chart Builder - Right Two-thirds */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <ChartBuilder
                data={chartBuilderData}
                onChartTypeChange={handleChartTypeChange}
                onClear={handleClearBuilder}
                onAggregationChange={handleAggregationChange}
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
        : 'w-[480px] flex-shrink-0 overflow-hidden h-[calc(100vh-4rem)] shadow-sm'
    } transition-all duration-300 ease-in-out`} style={{backgroundColor: 'hsl(0 0% 98%)'}}>
      {activeTab === 'widgets' && <WidgetsPanel />}
      {activeTab === 'chat' && <ChatPanel droppedWidgets={droppedWidgets} onEditWidget={onEditWidget} />}
      {activeTab === 'editor' && <WidgetEditor />}
      {activeTab === 'code' && <CodeEditor />}
      {activeTab === 'automations' && <AutomationsPanel />}
      {activeTab === 'saved' && <SavedPanel />}
    </div>
  )
}