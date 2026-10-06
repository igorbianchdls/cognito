import { IconBan, IconCheck, IconEdit, IconPackageExport, IconReceipt, IconX } from '@tabler/icons-react'

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
import { ErpStatusBadge } from '@/products/erp/frontend/components/ErpWorkspaceChrome'
import { ErpRecordIdentity } from './ErpRecordIdentity'

function formatCellValue(record: ErpEntityRecord, column: ErpTableColumn, config: ErpEntityConfig) {
  const value = record[column.key]

  if (column.key === 'nome') {
    const typeLabel = config.fields.find(field => field.key === 'tipo')?.options?.find(option => option.value === record.tipo)?.label
    const category = record.categoria || (['categorias', 'contas-financeiras'].includes(config.id) ? typeLabel || record.tipo : '')
    return <ErpRecordIdentity name={String(value ?? '')} category={String(category || '')} identityKey={`${config.id}:${record.id}`} />
  }

  if (column.kind === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))
  }

  if (column.kind === 'number') {
    return new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))
  }

  if (column.kind === 'status') {
    const statusValue = String(value ?? '')
    const status = config.statusMap?.[statusValue]
    return <ErpStatusBadge status={statusValue} label={status?.label} tone={status?.tone} />
  }

  return String(value ?? '-')
}

function ActionIcon({ action }: { action: ErpEntityAction }) {
  if (action.id === 'confirmar') return <IconCheck className="size-4" stroke={1.8} />
  if (action.id === 'atender') return <IconPackageExport className="size-4" stroke={1.8} />
  if (action.id === 'cancelar') return <IconX className="size-4" stroke={1.8} />
  return <IconReceipt className="size-4" stroke={1.8} />
}

export function ErpDataTable({
  config,
  records,
  onAction,
  onEdit,
  onDeactivate,
  columnVisibility,
}: {
  config: ErpEntityConfig
  records: ErpEntityRecord[]
  onAction?: (action: ErpEntityAction, record: ErpEntityRecord) => void
  onEdit?: (record: ErpEntityRecord) => void
  onDeactivate?: (record: ErpEntityRecord) => void
  columnVisibility?: Record<string, boolean>
}) {
  const actions = config.actions || []
  const columns = config.columns.filter(column => column.key !== 'categoria' && columnVisibility?.[column.key] !== false)

  return (
    <div className="min-w-0 overflow-x-auto bg-white">
      <Table className="erp-workspace-table min-w-[1000px] border-b border-[#e7e7e4]">
        <TableHeader>
          <TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]">
            {columns.map((column) => (
              <TableHead key={column.key} className={cn(column.width, ['currency', 'number'].includes(column.kind ?? '') && 'text-right')}>
                {column.label}
              </TableHead>
            ))}
            <TableHead className="w-36 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              {columns.map((column) => (
                <TableCell key={column.key} className={cn(['currency', 'number'].includes(column.kind ?? '') && 'text-right tabular-nums')}>
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
                    {onEdit ? <Button variant="ghost" size="icon" title="Editar" aria-label={`Editar ${record.id}`} onClick={() => onEdit(record)}>
                      <IconEdit className="size-4" stroke={1.8} />
                    </Button> : null}
                    {onDeactivate && record.status !== 'inativo' && record.status !== 'pausado' ? (
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
