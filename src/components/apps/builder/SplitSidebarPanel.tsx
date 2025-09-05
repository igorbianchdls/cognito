'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import TablesExplorer from './TablesExplorer'
import UniversalBuilder from './UniversalBuilder'
import WidgetsPanel from '../widgets/WidgetsPanel'
import ChatPanel from '../chat/ChatPanel'
import WidgetEditor from '../editor/WidgetEditorNew'
// import CodeEditor from '../code/CodeEditor' // REMOVED: CodeEditor deleted
import AutomationsPanel from '../automations/AutomationsPanel'
import SavedPanel from '../saved/SavedPanel'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { BigQueryField } from './TablesExplorer'

interface UniversalBuilderData {
  selectedType: 'chart' | 'kpi' | 'table'
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area'
  filters: BigQueryField[]
  columns: BigQueryField[]
  kpiValue: BigQueryField[]
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
  const [universalBuilderData, setUniversalBuilderData] = useState<UniversalBuilderData>({
    selectedType: 'chart',
    xAxis: [],
    yAxis: [],
    chartType: 'bar',
    filters: [],
    columns: [],
    kpiValue: [],
    selectedTable: null
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !active.data.current) return

    const draggedColumn = active.data.current as BigQueryField & { sourceTable: string }
    const dropZoneId = over.id as string

    // Update universal builder data based on drop zone
    setUniversalBuilderData(prev => {
      const newData = { ...prev }
      
      // Remove from all previous locations
      newData.xAxis = newData.xAxis.filter(col => col.name !== draggedColumn.name)
      newData.yAxis = newData.yAxis.filter(col => col.name !== draggedColumn.name)
      newData.filters = newData.filters.filter(col => col.name !== draggedColumn.name)
      newData.columns = newData.columns.filter(col => col.name !== draggedColumn.name)
      newData.kpiValue = newData.kpiValue.filter(col => col.name !== draggedColumn.name)
      
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
        case 'columns-drop-zone':
          newData.columns.push(draggedColumn)
          break
        case 'kpi-value-drop-zone':
          newData.kpiValue.push(draggedColumn)
          break
      }
      
      // Update selected table
      newData.selectedTable = draggedColumn.sourceTable
      
      return newData
    })
  }

  const handleTypeChange = (selectedType: UniversalBuilderData['selectedType']) => {
    setUniversalBuilderData(prev => ({ ...prev, selectedType }))
  }

  const handleChartTypeChange = (chartType: UniversalBuilderData['chartType']) => {
    setUniversalBuilderData(prev => ({ ...prev, chartType }))
  }


  const handleClearBuilder = () => {
    setUniversalBuilderData({
      selectedType: 'chart',
      xAxis: [],
      yAxis: [],
      chartType: 'bar',
      filters: [],
      columns: [],
      kpiValue: [],
      selectedTable: null
    })
  }

  const handleAggregationChange = (fieldName: string, aggregation: BigQueryField['aggregation']) => {
    setUniversalBuilderData(prev => ({
      ...prev,
      yAxis: prev.yAxis.map(field => 
        field.name === fieldName 
          ? { ...field, aggregation }
          : field
      ),
      kpiValue: prev.kpiValue.map(field => 
        field.name === fieldName 
          ? { ...field, aggregation }
          : field
      )
    }))
  }

  const handleRemoveField = (dropZoneType: 'xAxis' | 'yAxis' | 'filters' | 'columns' | 'kpiValue', fieldName: string) => {
    setUniversalBuilderData(prev => {
      switch (dropZoneType) {
        case 'xAxis':
          return { ...prev, xAxis: prev.xAxis.filter(field => field.name !== fieldName) }
        case 'yAxis':
          return { ...prev, yAxis: prev.yAxis.filter(field => field.name !== fieldName) }
        case 'filters':
          return { ...prev, filters: prev.filters.filter(field => field.name !== fieldName) }
        case 'columns':
          return { ...prev, columns: prev.columns.filter(field => field.name !== fieldName) }
        case 'kpiValue':
          return { ...prev, kpiValue: prev.kpiValue.filter(field => field.name !== fieldName) }
        default:
          return prev
      }
    })
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
            
            {/* Universal Builder - Right Two-thirds */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <UniversalBuilder
                data={universalBuilderData}
                onTypeChange={handleTypeChange}
                onChartTypeChange={handleChartTypeChange}
                onClear={handleClearBuilder}
                onRemoveField={handleRemoveField}
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
      {activeTab === 'code' && (
        <div className="p-4 text-center text-gray-500">
          <p>Code Editor was removed</p>
        </div>
      )}
      {activeTab === 'automations' && <AutomationsPanel />}
      {activeTab === 'saved' && <SavedPanel />}
    </div>
  )
}