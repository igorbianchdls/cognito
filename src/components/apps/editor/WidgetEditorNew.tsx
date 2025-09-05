'use client'

import { useMemo } from 'react'
import { useStore } from '@nanostores/react'
import { $selectedKPI, kpiActions } from '@/stores/apps/kpiStore'
import { $selectedTable, tableActions } from '@/stores/apps/tableStore'
import { $selectedBarChart, barChartActions } from '@/stores/apps/barChartStore'
import { $selectedLineChart, lineChartActions } from '@/stores/apps/lineChartStore'
import { $selectedPieChart, pieChartActions } from '@/stores/apps/pieChartStore'
import type { KPIConfig } from '@/types/apps/kpiWidgets'
import type { TableConfig } from '@/types/apps/tableWidgets'
import type { BarChartConfig } from '@/stores/apps/barChartStore'
import type { LineChartConfig } from '@/stores/apps/lineChartStore'
import type { PieChartConfig } from '@/stores/apps/pieChartStore'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import KPIConfigEditor from '../editors/KPIConfigEditor'
import TableConfigEditor from '../editors/TableConfigEditor'
import BarChartEditor from '../editors/BarChartEditor'
import LineChartEditor from '../editors/LineChartEditor'
import PieChartEditor from '../editors/PieChartEditor'

export default function WidgetEditorNew() {
  // Get selected widgets from stores
  const selectedKPI = useStore($selectedKPI)
  const selectedTable = useStore($selectedTable)
  const selectedBarChart = useStore($selectedBarChart)
  const selectedLineChart = useStore($selectedLineChart)
  const selectedPieChart = useStore($selectedPieChart)
  
  // Determine which widget is currently selected
  const selectedWidget = selectedKPI || selectedTable || selectedBarChart || selectedLineChart || selectedPieChart
  const widgetType = selectedKPI ? 'kpi' : selectedTable ? 'table' : selectedBarChart ? 'chart-bar' : selectedLineChart ? 'chart-line' : selectedPieChart ? 'chart-pie' : null

  // Adapt Widget to DroppedWidget format  
  const adaptedWidget = useMemo((): DroppedWidget | null => {
    if (selectedKPI) {
      return {
        ...selectedKPI,
        type: 'kpi' as const,
        kpiConfig: selectedKPI.config,
        config: {
          kpiConfig: selectedKPI.config
        }
      } as DroppedWidget
    }
    
    if (selectedTable) {
      return {
        ...selectedTable,
        type: 'table' as const,
        tableConfig: selectedTable.config,
        config: {
          tableConfig: selectedTable.config
        }
      } as DroppedWidget
    }
    
    if (selectedBarChart) {
      return {
        i: selectedBarChart.id,
        id: selectedBarChart.id,
        type: 'chart-bar' as const,
        name: selectedBarChart.name,
        icon: '📊',
        description: `Bar chart from ${selectedBarChart.bigqueryData.selectedTable}`,
        defaultWidth: 4,
        defaultHeight: 3,
        x: selectedBarChart.position.x,
        y: selectedBarChart.position.y,
        w: selectedBarChart.position.w,
        h: selectedBarChart.position.h,
        barChartConfig: selectedBarChart,
        config: {
          barChartConfig: selectedBarChart
        }
      } as DroppedWidget
    }
    
    if (selectedLineChart) {
      return {
        i: selectedLineChart.id,
        id: selectedLineChart.id,
        type: 'chart-line' as const,
        name: selectedLineChart.name,
        icon: '📈',
        description: `Line chart from ${selectedLineChart.bigqueryData.selectedTable}`,
        defaultWidth: 4,
        defaultHeight: 3,
        x: selectedLineChart.position.x,
        y: selectedLineChart.position.y,
        w: selectedLineChart.position.w,
        h: selectedLineChart.position.h,
        lineChartConfig: selectedLineChart,
        config: {
          lineChartConfig: selectedLineChart
        }
      } as DroppedWidget
    }
    
    if (selectedPieChart) {
      return {
        i: selectedPieChart.id,
        id: selectedPieChart.id,
        type: 'chart-pie' as const,
        name: selectedPieChart.name,
        icon: '🥧',
        description: `Pie chart from ${selectedPieChart.bigqueryData.selectedTable}`,
        defaultWidth: 4,
        defaultHeight: 3,
        x: selectedPieChart.position.x,
        y: selectedPieChart.position.y,
        w: selectedPieChart.position.w,
        h: selectedPieChart.position.h,
        pieChartConfig: selectedPieChart,
        config: {
          pieChartConfig: selectedPieChart
        }
      } as DroppedWidget
    }
    
    return null
  }, [selectedKPI, selectedTable, selectedBarChart, selectedLineChart, selectedPieChart])

  // Computed configs for each widget type
  const kpiConfig = useMemo((): KPIConfig => {
    if (!selectedKPI) return {} as KPIConfig
    
    const config = selectedKPI.config || {} as KPIConfig
    console.log('🎯 WidgetEditorNew computed kpiConfig:', config)
    return config
  }, [selectedKPI])

  const tableConfig = useMemo((): TableConfig => {
    if (!selectedTable) return {} as TableConfig
    
    const config = selectedTable.config || {} as TableConfig
    console.log('📋 WidgetEditorNew computed tableConfig:', config)
    return config
  }, [selectedTable])

  const chartConfig = useMemo((): BarChartConfig => {
    if (!selectedBarChart) return {} as BarChartConfig
    
    const config = selectedBarChart
    console.log('📊 WidgetEditorNew computed chartConfig:', config)
    return config
  }, [selectedBarChart])

  const lineChartConfig = useMemo((): LineChartConfig => {
    if (!selectedLineChart) return {} as LineChartConfig
    
    const config = selectedLineChart
    console.log('📈 WidgetEditorNew computed lineChartConfig:', config)
    return config
  }, [selectedLineChart])

  const pieChartConfig = useMemo((): PieChartConfig => {
    if (!selectedPieChart) return {} as PieChartConfig
    
    const config = selectedPieChart
    console.log('🥧 WidgetEditorNew computed pieChartConfig:', config)
    return config
  }, [selectedPieChart])

  // Config Handlers for each widget type
  const handleKPIConfigChange = (field: string, value: unknown) => {
    console.log('⚙️ WidgetEditorNew handleKPIConfigChange:', { 
      field, 
      value, 
      selectedKPIId: selectedKPI?.i,
      timestamp: Date.now()
    })
    
    if (selectedKPI) {
      console.log('⚙️ WidgetEditorNew calling kpiActions.updateKPIConfig:', {
        kpiId: selectedKPI.i,
        configUpdate: { [field]: value },
        timestamp: Date.now()
      })
      kpiActions.updateKPIConfig(selectedKPI.i, { [field]: value })
      console.log('⚙️ WidgetEditorNew KPI store update completed for:', selectedKPI.i, field)
    } else {
      console.warn('⚠️ WidgetEditorNew: No KPI selected, cannot update config')
    }
  }

  const handleTableConfigChange = (field: string, value: unknown) => {
    console.log('📋 WidgetEditorNew handleTableConfigChange:', { 
      field, 
      value, 
      selectedTableId: selectedTable?.i,
      timestamp: Date.now()
    })
    
    if (selectedTable) {
      console.log('📋 WidgetEditorNew calling tableActions.updateTableConfig:', {
        tableId: selectedTable.i,
        configUpdate: { [field]: value },
        timestamp: Date.now()
      })
      tableActions.updateTableConfig(selectedTable.i, { [field]: value })
      console.log('📋 WidgetEditorNew Table store update completed for:', selectedTable.i, field)
    } else {
      console.warn('⚠️ WidgetEditorNew: No Table selected, cannot update config')
    }
  }

  const handleChartConfigChange = (field: string, value: unknown) => {
    console.log('📊 WidgetEditorNew handleChartConfigChange:', { 
      field, 
      value, 
      selectedBarChartId: selectedBarChart?.id,
      timestamp: Date.now()
    })
    
    if (selectedBarChart) {
      let configUpdate: Partial<BarChartConfig>
      
      // Handle nested fields (e.g., 'styling.title' -> { styling: { title: value } })
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        console.log('📊 WidgetEditorNew processing nested field:', { parent, child, value })
        
        // Get current parent object to merge with new value
        const currentParent = (selectedBarChart as unknown as Record<string, unknown>)[parent] || {}
        configUpdate = {
          [parent]: {
            ...currentParent,
            [child]: value
          }
        } as Partial<BarChartConfig>
      } else {
        // Handle flat fields
        configUpdate = { [field]: value } as Partial<BarChartConfig>
      }
      
      console.log('📊 WidgetEditorNew calling barChartActions.updateBarChart:', {
        chartId: selectedBarChart.id,
        configUpdate,
        timestamp: Date.now()
      })
      barChartActions.updateBarChart(selectedBarChart.id, configUpdate)
      console.log('📊 WidgetEditorNew Chart store update completed for:', selectedBarChart.id, field)
    } else {
      console.warn('⚠️ WidgetEditorNew: No Chart selected, cannot update config')
    }
  }

  const handleLineChartConfigChange = (field: string, value: unknown) => {
    console.log('📈 WidgetEditorNew handleLineChartConfigChange:', { 
      field, 
      value, 
      selectedLineChartId: selectedLineChart?.id,
      timestamp: Date.now()
    })
    
    if (selectedLineChart) {
      let configUpdate: Partial<LineChartConfig>
      
      // Handle nested fields (e.g., 'styling.title' -> { styling: { title: value } })
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        console.log('📈 WidgetEditorNew processing nested field:', { parent, child, value })
        
        // Get current parent object to merge with new value
        const currentParent = (selectedLineChart as unknown as Record<string, unknown>)[parent] || {}
        configUpdate = {
          [parent]: {
            ...currentParent,
            [child]: value
          }
        } as Partial<LineChartConfig>
      } else {
        // Handle flat fields
        configUpdate = { [field]: value } as Partial<LineChartConfig>
      }
      
      console.log('📈 WidgetEditorNew calling lineChartActions.updateLineChart:', {
        chartId: selectedLineChart.id,
        configUpdate,
        timestamp: Date.now()
      })
      lineChartActions.updateLineChart(selectedLineChart.id, configUpdate)
      console.log('📈 WidgetEditorNew LineChart store update completed for:', selectedLineChart.id, field)
    } else {
      console.warn('⚠️ WidgetEditorNew: No LineChart selected, cannot update config')
    }
  }

  const handlePieChartConfigChange = (field: string, value: unknown) => {
    console.log('🥧 WidgetEditorNew handlePieChartConfigChange:', { 
      field, 
      value, 
      selectedPieChartId: selectedPieChart?.id,
      timestamp: Date.now()
    })
    
    if (selectedPieChart) {
      let configUpdate: Partial<PieChartConfig>
      
      // Handle nested fields (e.g., 'styling.title' -> { styling: { title: value } })
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        console.log('🥧 WidgetEditorNew processing nested field:', { parent, child, value })
        
        // Get current parent object to merge with new value
        const currentParent = (selectedPieChart as unknown as Record<string, unknown>)[parent] || {}
        configUpdate = {
          [parent]: {
            ...currentParent,
            [child]: value
          }
        } as Partial<PieChartConfig>
      } else {
        // Handle flat fields
        configUpdate = { [field]: value } as Partial<PieChartConfig>
      }
      
      console.log('🥧 WidgetEditorNew calling pieChartActions.updatePieChart:', {
        chartId: selectedPieChart.id,
        configUpdate,
        timestamp: Date.now()
      })
      pieChartActions.updatePieChart(selectedPieChart.id, configUpdate)
      console.log('🥧 WidgetEditorNew PieChart store update completed for:', selectedPieChart.id, field)
    } else {
      console.warn('⚠️ WidgetEditorNew: No PieChart selected, cannot update config')
    }
  }

  // Early return if no widget selected
  if (!selectedWidget || !adaptedWidget) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Selecione um widget para editar suas configurações</p>
        <p className="text-xs text-gray-400 mt-2">KPI, Table ou Chart</p>
      </div>
    )
  }

  // Render widget-specific editor
  const renderWidgetEditor = () => {
    switch (widgetType) {
      case 'kpi':
        return (
          <div>
            <h2 className="text-lg font-semibold mb-2">Configurações do KPI</h2>
            <p className="text-sm text-gray-600">
              KPI: {selectedKPI!.name} (ID: {selectedKPI!.i})
            </p>
            <div className="mt-4">
              <h3 className="text-md font-medium mb-3">Editor de Configuração</h3>
              <KPIConfigEditor
                selectedWidget={adaptedWidget}
                kpiConfig={kpiConfig}
                onKPIConfigChange={handleKPIConfigChange}
              />
            </div>
          </div>
        )
      
      case 'table':
        return (
          <div>
            <h2 className="text-lg font-semibold mb-2">Configurações da Tabela</h2>
            <p className="text-sm text-gray-600">
              Tabela: {selectedTable!.name} (ID: {selectedTable!.i})
            </p>
            <div className="mt-4">
              <h3 className="text-md font-medium mb-3">Editor de Configuração</h3>
              <TableConfigEditor
                selectedWidget={adaptedWidget}
                tableConfig={tableConfig}
                onTableConfigChange={handleTableConfigChange}
              />
            </div>
          </div>
        )
      
      case 'chart-bar':
        return (
          <div>
            <h2 className="text-lg font-semibold mb-2">📊 Configurações do Gráfico de Barras</h2>
            <p className="text-sm text-gray-600">
              Chart: {selectedBarChart!.name} (ID: {selectedBarChart!.id})
            </p>
            <div className="mt-4">
              <h3 className="text-md font-medium mb-3">Editor de Configuração</h3>
              <BarChartEditor
                selectedWidget={adaptedWidget}
                chartConfig={chartConfig}
                onChartConfigChange={handleChartConfigChange}
              />
            </div>
          </div>
        )
      
      case 'chart-line':
        return (
          <div>
            <h2 className="text-lg font-semibold mb-2">📈 Configurações do Gráfico de Linhas</h2>
            <p className="text-sm text-gray-600">
              LineChart: {selectedLineChart!.name} (ID: {selectedLineChart!.id})
            </p>
            <div className="mt-4">
              <h3 className="text-md font-medium mb-3">Editor de Configuração</h3>
              <LineChartEditor
                selectedWidget={adaptedWidget}
                chartConfig={lineChartConfig}
                onChartConfigChange={handleLineChartConfigChange}
              />
            </div>
          </div>
        )
      
      case 'chart-pie':
        return (
          <div>
            <h2 className="text-lg font-semibold mb-2">🥧 Configurações do Gráfico de Pizza</h2>
            <p className="text-sm text-gray-600">
              PieChart: {selectedPieChart!.name} (ID: {selectedPieChart!.id})
            </p>
            <div className="mt-4">
              <h3 className="text-md font-medium mb-3">Editor de Configuração</h3>
              <PieChartEditor
                selectedWidget={adaptedWidget}
                chartConfig={pieChartConfig}
                onChartConfigChange={handlePieChartConfigChange}
              />
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Tipo de widget não suportado</p>
          </div>
        )
    }
  }

  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto">
      {renderWidgetEditor()}
    </div>
  )
}