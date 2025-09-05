'use client'

import { useMemo } from 'react'
import { useStore } from '@nanostores/react'
import { $selectedKPI, kpiActions } from '@/stores/apps/kpiStore'
import { isKPIWidget } from '@/types/apps/kpiWidgets'
import type { KPIConfig } from '@/types/apps/kpiWidgets'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import KPIConfigEditor from '../editors/KPIConfigEditor'

export default function WidgetEditorNew() {
  // Get selected KPI directly from kpiStore
  const selectedKPI = useStore($selectedKPI)

  // Adapt KPIWidget to DroppedWidget format
  const adaptedWidget = useMemo((): DroppedWidget | null => {
    if (!selectedKPI) return null
    
    return {
      ...selectedKPI,
      type: 'kpi' as const,
      kpiConfig: selectedKPI.config,  // Move config to kpiConfig property
      config: {
        kpiConfig: selectedKPI.config  // Also keep in config.kpiConfig for compatibility
      }
    } as DroppedWidget
  }, [selectedKPI])

  // Computed KPI config - acessar do selectedKPI.config
  const kpiConfig = useMemo((): KPIConfig => {
    if (!selectedKPI) return {} as KPIConfig
    
    const config = selectedKPI.config || {} as KPIConfig
    console.log('🎯 WidgetEditorNew computed kpiConfig:', config)
    return config
  }, [selectedKPI])

  // KPI Config Handler - usar apenas kpiStore
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
      
      // Log immediately after the store update to verify it was called
      console.log('⚙️ WidgetEditorNew store update completed for:', selectedKPI.i, field)
    } else {
      console.warn('⚠️ WidgetEditorNew: No KPI selected, cannot update config')
    }
  }

  // Early return if no KPI selected
  if (!selectedKPI || !adaptedWidget) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Selecione um KPI para editar suas configurações</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Configurações do KPI</h2>
        <p className="text-sm text-gray-600">
          KPI: {selectedKPI.name} (ID: {selectedKPI.i})
        </p>
      </div>

      {/* KPI Configuration */}
      <div>
        <h3 className="text-md font-medium mb-3">Editor de Configuração</h3>
        <KPIConfigEditor
          selectedWidget={adaptedWidget}
          kpiConfig={kpiConfig}
          onKPIConfigChange={handleKPIConfigChange}
        />
      </div>
    </div>
  )
}