'use client'

import { Table } from 'lucide-react'
import DropZone from './DropZone'
import type { BigQueryField } from './TablesExplorer'

interface TableBuilderData {
  columns: BigQueryField[]
  filters: BigQueryField[]
  selectedTable: string | null
}

interface TableBuilderProps {
  data: TableBuilderData
  onRemoveField: (dropZoneType: 'columns' | 'filters', fieldName: string) => void
}

export default function TableBuilder({
  data,
  onRemoveField
}: TableBuilderProps) {
  
  return (
    <div className="space-y-3">
      {/* Columns Drop Zone */}
      <DropZone
        id="columns-drop-zone"
        label="Colunas"
        description="Arraste campos para criar colunas da tabela"
        icon={<Table className="w-4 h-4 text-blue-600" />}
        fields={data.columns}
        acceptedTypes={['string', 'date', 'numeric', 'boolean']}
        onRemoveField={(fieldName) => onRemoveField('columns', fieldName)}
      />

      {/* Filters Drop Zone */}
      <DropZone
        id="filters-drop-zone"
        label="Filtros"
        description="Campos para filtrar os dados da tabela"
        icon={<Table className="w-4 h-4 text-orange-600" />}
        fields={data.filters}
        acceptedTypes={['string', 'date', 'numeric', 'boolean']}
        onRemoveField={(fieldName) => onRemoveField('filters', fieldName)}
      />
    </div>
  )
}