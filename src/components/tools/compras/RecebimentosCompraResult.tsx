'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { PackageCheck } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  pedido?: string
  fornecedor?: string
  data_recebimento?: string
  nota_fiscal?: string
  status?: string
  observacoes?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string; title?: string }

export default function RecebimentosCompraResult({ success, message, rows = [], count, sql_query, title }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'pedido', header: 'Pedido' },
    { accessorKey: 'fornecedor', header: 'Fornecedor' },
    { accessorKey: 'data_recebimento', header: 'Data', cell: ({ row }) => {
      const d = row.original.data_recebimento as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'nota_fiscal', header: 'Nota Fiscal' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'observacoes', header: 'Observações' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title={title ?? "Recebimentos de Compra"}
      icon={PackageCheck}
      iconColor="text-emerald-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="recebimentos-compra"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}
