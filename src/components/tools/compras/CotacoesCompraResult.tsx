'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { FileSpreadsheet } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  fornecedor?: string
  data_envio?: string
  data_retorno?: string
  status?: string
  valor_cotado?: number
  observacoes?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function CotacoesCompraResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'fornecedor', header: 'Fornecedor' },
    { accessorKey: 'data_envio', header: 'Envio', cell: ({ row }) => {
      const d = row.original.data_envio as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'data_retorno', header: 'Retorno', cell: ({ row }) => {
      const d = row.original.data_retorno as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'valor_cotado', header: 'Valor Cotado', cell: ({ row }) => {
      const v = row.original.valor_cotado as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'observacoes', header: 'Observações' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Cotações de Compra"
      icon={FileSpreadsheet}
      iconColor="text-violet-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="cotacoes-compra"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

