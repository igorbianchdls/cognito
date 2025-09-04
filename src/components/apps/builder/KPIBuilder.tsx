'use client'

import { TrendingUp, Activity } from 'lucide-react'
import DropZone from './DropZone'
import type { BigQueryField } from './TablesExplorer'

interface KPIBuilderData {
  kpiValue: BigQueryField[]
  filters: BigQueryField[]
  selectedTable: string | null
}

interface KPIBuilderProps {
  data: KPIBuilderData
  onRemoveField: (dropZoneType: 'kpiValue' | 'filters', fieldName: string) => void
  onAggregationChange?: (fieldName: string, aggregation: BigQueryField['aggregation']) => void
}

export default function KPIBuilder({
  data,
  onRemoveField,
  onAggregationChange
}: KPIBuilderProps) {
  
  return (
    <div className="space-y-3">
      {/* KPI Value Drop Zone */}
      <DropZone
        id="kpi-value-drop-zone"
        label="Valor KPI"
        description="Campo numérico para calcular o KPI"
        icon={<TrendingUp className="w-4 h-4 text-purple-600" />}
        fields={data.kpiValue}
        acceptedTypes={['numeric']}
        onRemoveField={(fieldName) => onRemoveField('kpiValue', fieldName)}
        onAggregationChange={onAggregationChange}
      />

      {/* Filters Drop Zone */}
      <DropZone
        id="filters-drop-zone"
        label="Filtros"
        description="Campos para filtrar os dados do KPI"
        icon={<Activity className="w-4 h-4 text-orange-600" />}
        fields={data.filters}
        acceptedTypes={['string', 'date', 'numeric', 'boolean']}
        onRemoveField={(fieldName) => onRemoveField('filters', fieldName)}
      />
    </div>
  )
}