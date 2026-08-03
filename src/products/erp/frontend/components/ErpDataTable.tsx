import { IconBan, IconCheck, IconEdit, IconReceipt, IconX } from '@tabler/icons-react'

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
import type { ErpEntityAction, ErpEntityConfig, ErpEntityRecord, ErpTableColumn } from '@/products/erp/shared/types'
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

function ActionIcon({ action }: { action: ErpEntityAction }) {
  if (action.id === 'confirmar') return <IconCheck className="size-4" stroke={1.8} />
  if (action.id === 'cancelar') return <IconX className="size-4" stroke={1.8} />
  return <IconReceipt className="size-4" stroke={1.8} />
}

export function ErpDataTable({
  config,
  records,
  onAction,
  onEdit,
  onDeactivate,
}: {
  config: ErpEntityConfig
  records: ErpEntityRecord[]
  onAction?: (action: ErpEntityAction, record: ErpEntityRecord) => void
  onEdit?: (record: ErpEntityRecord) => void
  onDeactivate?: (record: ErpEntityRecord) => void
}) {
  const actions = config.actions || []

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
            <TableHead className="h-10 w-36 bg-gray-50 px-2 text-right" />
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
                {actions.length > 0 ? (
                  <div className="flex justify-end gap-1">
                    {actions.map((action) => (
                      <Button
                        key={action.id}
                        variant={action.tone === 'danger' ? 'destructive' : 'ghost'}
                        size="sm"
                        aria-label={`${action.label} ${record.id}`}
                        onClick={() => onAction?.(action, record)}
                      >
                        <ActionIcon action={action} />
                        <span className="hidden lg:inline">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Editar" aria-label={`Editar ${record.id}`} onClick={() => onEdit?.(record)}>
                      <IconEdit className="size-4" stroke={1.8} />
                    </Button>
                    {record.status !== 'inativo' && record.status !== 'pausado' ? (
                      <Button variant="ghost" size="icon" title="Desativar" aria-label={`Desativar ${record.id}`} onClick={() => onDeactivate?.(record)}>
                        <IconBan className="size-4" stroke={1.8} />
                      </Button>
                    ) : null}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
