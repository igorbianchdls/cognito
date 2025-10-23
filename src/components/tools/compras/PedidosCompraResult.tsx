'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ShoppingBag } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

type Row = Record<string, unknown> & {
  numero_pedido?: string
  fornecedor?: string
  condicao_pagamento?: string
  data_pedido?: string
  status?: string
  valor_total?: number
  observacoes?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

const statusColor = (s?: string) => {
  const v = (s || '').toLowerCase();
  if (v.includes('aprov')) return 'bg-green-100 text-green-800 border-green-300'
  if (v.includes('receb')) return 'bg-emerald-100 text-emerald-800 border-emerald-300'
  if (v.includes('envi')) return 'bg-blue-100 text-blue-800 border-blue-300'
  if (v.includes('rascun')) return 'bg-gray-100 text-gray-800 border-gray-300'
  if (v.includes('cancel')) return 'bg-red-100 text-red-800 border-red-300'
  return 'bg-amber-100 text-amber-800 border-amber-300'
}

export default function PedidosCompraResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'numero_pedido', header: 'Número' },
    { accessorKey: 'fornecedor', header: 'Fornecedor' },
    { accessorKey: 'condicao_pagamento', header: 'Condição de Pagamento' },
    { accessorKey: 'data_pedido', header: 'Data', cell: ({ row }) => {
      const d = row.original.data_pedido as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status as string | undefined
      return s ? <Badge className={statusColor(s)}>{s}</Badge> : '-'
    } },
    { accessorKey: 'valor_total', header: 'Valor Total', cell: ({ row }) => {
      const v = row.original.valor_total as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'observacoes', header: 'Observações' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Pedidos de Compra"
      icon={ShoppingBag}
      iconColor="text-amber-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="pedidos-compra"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

