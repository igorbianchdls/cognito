'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { LayoutGrid } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  canal_venda?: string
  qtd_pedidos?: number
  total_vendido?: number
  primeira_venda?: string
  ultima_venda?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function CanaisVendasResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'canal_venda', header: 'Canal' },
    { accessorKey: 'qtd_pedidos', header: 'Pedidos' },
    { accessorKey: 'total_vendido', header: 'Receita', cell: ({ row }) => {
      const v = row.original.total_vendido as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'primeira_venda', header: 'Primeira Venda', cell: ({ row }) => {
      const d = row.original.primeira_venda as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'ultima_venda', header: 'Última Venda', cell: ({ row }) => {
      const d = row.original.ultima_venda as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Canais"
      icon={LayoutGrid}
      iconColor="text-cyan-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="canais-vendas"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

