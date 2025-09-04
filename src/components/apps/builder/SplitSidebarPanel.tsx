'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import TablesExplorer from './TablesExplorer'
import UniversalBuilder from './UniversalBuilder'
import WidgetsPanel from '../widgets/WidgetsPanel'
import ChatPanel from '../chat/ChatPanel'
import WidgetEditor from '../editor/WidgetEditorNew'
import CodeEditor from '../code/CodeEditor'
import AutomationsPanel from '../automations/AutomationsPanel'
import SavedPanel from '../saved/SavedPanel'
import type { DroppedWidget } from '@/types/apps/widget'
import type { BigQueryField } from './TablesExplorer'

interface UniversalBuilderData {
  selectedType: 'kpi' | 'table' | 'gauge' | 'gallery' | 'kanban'
  filters: BigQueryField[]
  columns: BigQueryField[]
  kpiValue: BigQueryField[]
  galleryImageUrl: BigQueryField[]
  galleryTitle: BigQueryField[]
  galleryDescription: BigQueryField[]
  dimensions: BigQueryField[]
  measures: BigQueryField[]
  groupBy: BigQueryField[]
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
    selectedType: 'kpi',
    filters: [],
    columns: [],
    kpiValue: [],
    galleryImageUrl: [],
    galleryTitle: [],
    galleryDescription: [],
    dimensions: [],
    measures: [],
    groupBy: [],
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
      newData.filters = newData.filters.filter(col => col.name !== draggedColumn.name)
      newData.columns = newData.columns.filter(col => col.name !== draggedColumn.name)
      newData.kpiValue = newData.kpiValue.filter(col => col.name !== draggedColumn.name)
      newData.galleryImageUrl = newData.galleryImageUrl.filter(col => col.name !== draggedColumn.name)
      newData.galleryTitle = newData.galleryTitle.filter(col => col.name !== draggedColumn.name)
      newData.galleryDescription = newData.galleryDescription.filter(col => col.name !== draggedColumn.name)
      newData.dimensions = newData.dimensions.filter(col => col.name !== draggedColumn.name)
      newData.measures = newData.measures.filter(col => col.name !== draggedColumn.name)
      newData.groupBy = newData.groupBy.filter(col => col.name !== draggedColumn.name)
      
      // Add to new location
      switch (dropZoneId) {
        case 'filters-drop-zone':
          newData.filters.push(draggedColumn)
          break
        case 'columns-drop-zone':
          newData.columns.push(draggedColumn)
          break
        case 'kpi-value-drop-zone':
          newData.kpiValue.push(draggedColumn)
          break
        case 'gallery-image-url-drop-zone':
          newData.galleryImageUrl.push(draggedColumn)
          break
        case 'gallery-title-drop-zone':
          newData.galleryTitle.push(draggedColumn)
          break
        case 'gallery-description-drop-zone':
          newData.galleryDescription.push(draggedColumn)
          break
        case 'dimensions-drop-zone':
          newData.dimensions.push(draggedColumn)
          break
        case 'measures-drop-zone':
          newData.measures.push(draggedColumn)
          break
        case 'group-by-drop-zone':
          newData.groupBy.push(draggedColumn)
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


  const handleClearBuilder = () => {
    setUniversalBuilderData({
      selectedType: 'kpi',
      filters: [],
      columns: [],
      kpiValue: [],
      galleryImageUrl: [],
      galleryTitle: [],
      galleryDescription: [],
      dimensions: [],
      measures: [],
      groupBy: [],
      selectedTable: null
    })
  }

  const handleAggregationChange = (fieldName: string, aggregation: BigQueryField['aggregation']) => {
    setUniversalBuilderData(prev => ({
      ...prev,
      measures: prev.measures.map(field => 
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
            
            {/* Universal Builder - Right Two-thirds */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <UniversalBuilder
                data={universalBuilderData}
                onTypeChange={handleTypeChange}
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