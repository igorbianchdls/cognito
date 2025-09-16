'use client'

import { Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@nanostores/react'
import { $selectedTable } from '@/stores/apps/tableStore'
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
  onCreateOrUpdate?: () => void
  showActionButton?: boolean
}

export default function TableBuilder({
  data,
  onRemoveField,
  onCreateOrUpdate,
  showActionButton = false
}: TableBuilderProps) {
  const selectedTable = useStore($selectedTable)

  return (
    <div className="space-y-3">
      {/* Columns Drop Zone */}
      <DropZone
        id="columns-drop-zone"
        label="Colunas"
        description="Arraste campos para criar colunas da tabela"
        icon={<Table className="w-4 h-4 text-primary" />}
        fields={data.columns}
        acceptedTypes={['string', 'date', 'numeric', 'boolean']}
        onRemoveField={(fieldName) => onRemoveField('columns', fieldName)}
      />

      {/* Filters Drop Zone */}
      <DropZone
        id="filters-drop-zone"
        label="Filtros"
        description="Campos para filtrar os dados da tabela"
        icon={<Table className="w-4 h-4 text-orange-500" />}
        fields={data.filters}
        acceptedTypes={['string', 'date', 'numeric', 'boolean']}
        onRemoveField={(fieldName) => onRemoveField('filters', fieldName)}
      />

      {/* Action Button */}
      {showActionButton && onCreateOrUpdate && (
        <Button
          onClick={onCreateOrUpdate}
          className="w-full"
        >
          {selectedTable ? 'Update Table' : 'Create Table'}
        </Button>
      )}
    </div>
  )
}