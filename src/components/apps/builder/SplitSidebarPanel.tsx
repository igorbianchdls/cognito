'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { useStore } from '@nanostores/react'
import { $selectedKPI } from '@/stores/apps/kpiStore'
import { $selectedBarChart } from '@/stores/apps/barChartStore'
import { $selectedLineChart } from '@/stores/apps/lineChartStore'
import { $selectedPieChart } from '@/stores/apps/pieChartStore'
import { $selectedAreaChart } from '@/stores/apps/areaChartStore'
import { $selectedHorizontalBarChart } from '@/stores/apps/horizontalBarChartStore'
import { $selectedTable } from '@/stores/apps/tableStore'
import TablesExplorer from './TablesExplorer'
import UniversalBuilder from './UniversalBuilder'
import WidgetsPanel from '../widgets/WidgetsPanel'
import ChatPanel from '../chat/ChatPanel'
import WidgetEditor from '../editor/WidgetEditorNew'
import CodeEditor from '../code/CodeEditor'
import AutomationsPanel from '../automations/AutomationsPanel'
import SavedPanel from '../saved/SavedPanel'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { BigQueryField } from './TablesExplorer'

interface UniversalBuilderData {
  selectedType: 'chart' | 'kpi' | 'table'
  xAxis: BigQueryField[]
  yAxis: BigQueryField[]
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'
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
  const selectedKPI = useStore($selectedKPI)
  const selectedBarChart = useStore($selectedBarChart)
  const selectedLineChart = useStore($selectedLineChart)
  const selectedPieChart = useStore($selectedPieChart)
  const selectedAreaChart = useStore($selectedAreaChart)
  const selectedHorizontalBarChart = useStore($selectedHorizontalBarChart)
  const selectedTable = useStore($selectedTable)
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

  // Load selected widget data into builder when switching to datasets tab
  useEffect(() => {
    if (activeTab === 'datasets') {
      // Load KPI data
      if (selectedKPI) {
        console.log('📊 Loading selected KPI into builder:', selectedKPI.i)
        setUniversalBuilderData({
          selectedType: 'kpi',
          xAxis: [],
          yAxis: [],
          chartType: 'bar',
          filters: selectedKPI.config.bigqueryData?.filterFields || [],
          columns: [],
          kpiValue: selectedKPI.config.bigqueryData?.kpiValueFields || [],
          selectedTable: selectedKPI.config.bigqueryData?.selectedTable || null
        })
      }
      // Load Bar Chart data
      else if (selectedBarChart) {
        console.log('📊 Loading selected Bar Chart into builder:', selectedBarChart.id)
        setUniversalBuilderData({
          selectedType: 'chart',
          chartType: 'bar',
          xAxis: selectedBarChart.bigqueryData.columns.xAxis || [],
          yAxis: selectedBarChart.bigqueryData.columns.yAxis || [],
          filters: selectedBarChart.bigqueryData.columns.filters || [],
          columns: [],
          kpiValue: [],
          selectedTable: selectedBarChart.bigqueryData.selectedTable || null
        })
      }
      // Load Line Chart data
      else if (selectedLineChart) {
        console.log('📊 Loading selected Line Chart into builder:', selectedLineChart.id)
        setUniversalBuilderData({
          selectedType: 'chart',
          chartType: 'line',
          xAxis: selectedLineChart.bigqueryData.columns.xAxis || [],
          yAxis: selectedLineChart.bigqueryData.columns.yAxis || [],
          filters: selectedLineChart.bigqueryData.columns.filters || [],
          columns: [],
          kpiValue: [],
          selectedTable: selectedLineChart.bigqueryData.selectedTable || null
        })
      }
      // Load Pie Chart data
      else if (selectedPieChart) {
        console.log('📊 Loading selected Pie Chart into builder:', selectedPieChart.id)
        setUniversalBuilderData({
          selectedType: 'chart',
          chartType: 'pie',
          xAxis: selectedPieChart.bigqueryData.columns.xAxis || [],
          yAxis: selectedPieChart.bigqueryData.columns.yAxis || [],
          filters: selectedPieChart.bigqueryData.columns.filters || [],
          columns: [],
          kpiValue: [],
          selectedTable: selectedPieChart.bigqueryData.selectedTable || null
        })
      }
      // Load Area Chart data
      else if (selectedAreaChart) {
        console.log('📊 Loading selected Area Chart into builder:', selectedAreaChart.id)
        setUniversalBuilderData({
          selectedType: 'chart',
          chartType: 'area',
          xAxis: selectedAreaChart.bigqueryData.columns.xAxis || [],
          yAxis: selectedAreaChart.bigqueryData.columns.yAxis || [],
          filters: selectedAreaChart.bigqueryData.columns.filters || [],
          columns: [],
          kpiValue: [],
          selectedTable: selectedAreaChart.bigqueryData.selectedTable || null
        })
      }
      // Load Horizontal Bar Chart data
      else if (selectedHorizontalBarChart) {
        console.log('📊 Loading selected Horizontal Bar Chart into builder:', selectedHorizontalBarChart.id)
        setUniversalBuilderData({
          selectedType: 'chart',
          chartType: 'horizontal-bar',
          xAxis: selectedHorizontalBarChart.bigqueryData.columns.xAxis || [],
          yAxis: selectedHorizontalBarChart.bigqueryData.columns.yAxis || [],
          filters: selectedHorizontalBarChart.bigqueryData.columns.filters || [],
          columns: [],
          kpiValue: [],
          selectedTable: selectedHorizontalBarChart.bigqueryData.selectedTable || null
        })
      }
      // Load Table data
      else if (selectedTable && selectedTable.config.dataSource === 'BigQuery') {
        console.log('📊 Loading selected Table into builder:', selectedTable.i)
        setUniversalBuilderData({
          selectedType: 'table',
          xAxis: [],
          yAxis: [],
          chartType: 'bar',
          filters: selectedTable.config.bigqueryData?.filters || [],
          columns: selectedTable.config.bigqueryData?.selectedColumns ||
                   selectedTable.config.columns?.map(col => ({
                     name: col.accessorKey,
                     type: col.type || 'string',
                     mode: 'NULLABLE'
                   })) || [],
          kpiValue: [],
          selectedTable: selectedTable.config.bigqueryData?.selectedTable || null
        })
      }
    }
  }, [selectedKPI, selectedBarChart, selectedLineChart, selectedPieChart, selectedAreaChart, selectedHorizontalBarChart, selectedTable, activeTab])

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
        : 'w-[480px] flex-shrink-0 overflow-hidden h-[calc(100vh-4rem)]'
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