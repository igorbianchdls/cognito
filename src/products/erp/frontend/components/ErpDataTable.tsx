import { IconDotsVertical } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { ErpEntityConfig, ErpEntityRecord, ErpTableColumn } from '@/products/erp/shared/types'
import { ErpStatusBadge } from '@/products/erp/frontend/components/ErpStatusBadge'

function formatCellValue(record: ErpEntityRecord, column: ErpTableColumn, config: ErpEntityConfig) {
  const value = record[column.key]

  if (column.kind === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))
  }

  if (column.kind === 'number') {
    return new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))
  }

  if (column.kind === 'status') {
    const statusValue = String(value ?? '')
    const status = config.statusMap?.[statusValue]
    return <ErpStatusBadge label={status?.label ?? statusValue} tone={status?.tone ?? 'default'} />
  }

  return String(value ?? '-')
}

export function ErpDataTable({
  config,
  records,
}: {
  config: ErpEntityConfig
  records: ErpEntityRecord[]
}) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-white">
            {config.columns.map((column) => (
              <TableHead key={column.key} className={cn('h-10 bg-gray-50 px-3 text-xs font-semibold uppercase tracking-normal text-gray-500', column.width)}>
                {column.label}
              </TableHead>
            ))}
            <TableHead className="h-10 w-12 bg-gray-50 px-2 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              {config.columns.map((column) => (
                <TableCell key={column.key} className="px-3 py-3 text-sm text-gray-700">
                  {formatCellValue(record, column, config)}
                </TableCell>
              ))}
              <TableCell className="px-2 py-2 text-right">
                <Button variant="ghost" size="icon" aria-label={`Acoes de ${record.id}`}>
                  <IconDotsVertical className="size-4" stroke={1.8} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

