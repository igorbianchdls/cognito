'use client'

import { useMemo } from 'react'
import { useStore } from '@nanostores/react'
import { $selectedKPI, kpiActions } from '@/stores/apps/kpiStore'
import { $selectedTable, tableActions } from '@/stores/apps/tableStore'
import { isKPIWidget } from '@/types/apps/kpiWidgets'
import { isTableWidget } from '@/types/apps/tableWidgets'
import type { KPIConfig } from '@/types/apps/kpiWidgets'
import type { TableConfig } from '@/types/apps/tableWidgets'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import KPIConfigEditor from '../editors/KPIConfigEditor'
import TableConfigEditor from '../editors/TableConfigEditor'

export default function WidgetEditorNew() {
  // Get selected widgets from stores
  const selectedKPI = useStore($selectedKPI)
  const selectedTable = useStore($selectedTable)
  
  // Determine which widget is currently selected
  const selectedWidget = selectedKPI || selectedTable
  const widgetType = selectedKPI ? 'kpi' : selectedTable ? 'table' : null

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
    
    return null
  }, [selectedKPI, selectedTable])

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

  // Early return if no widget selected
  if (!selectedWidget || !adaptedWidget) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Selecione um widget para editar suas configurações</p>
        <p className="text-xs text-gray-400 mt-2">KPI ou Table</p>
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
      
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Tipo de widget não suportado</p>
          </div>
        )
    }
  }

  return (
    <div className="p-4 space-y-6">
      {renderWidgetEditor()}
    </div>
  )
}