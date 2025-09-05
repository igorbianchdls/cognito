'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { KPIConfig } from '@/types/apps/kpiWidgets'

interface KPIDataSourceEditorProps {
  selectedWidget: DroppedWidget
  kpiConfig: KPIConfig
  onKPIConfigChange: (field: string, value: unknown) => void
}

export default function KPIDataSourceEditor({ 
  selectedWidget, 
  kpiConfig, 
  onKPIConfigChange 
}: KPIDataSourceEditorProps) {
  return (
    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
      📝 Manual Values Only: Use the "Data & Values" section to set KPI values manually.
    </div>
  )
}