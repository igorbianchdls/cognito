'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { ShoppingCart } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

type Row = Record<string, unknown> & {
  numero_pedido?: string
  cliente?: string
  canal_venda?: string
  vendedor?: string
  status?: string
  data_pedido?: string
  valor_produtos?: number
  valor_frete?: number
  valor_desconto?: number
  valor_total_pedido?: number
  cidade_uf?: string
  created_at?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

const statusColor = (s?: string) => {
  const v = (s || '').toLowerCase();
  if (v.includes('complet') || v.includes('pago')) return 'bg-green-100 text-green-800 border-green-300'
  if (v.includes('cancel')) return 'bg-red-100 text-red-800 border-red-300'
  if (v.includes('pend') || v.includes('em')) return 'bg-blue-100 text-blue-800 border-blue-300'
  return 'bg-gray-100 text-gray-800 border-gray-300'
}

export default function PedidosVendasResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'numero_pedido', header: 'Número' },
    { accessorKey: 'cliente', header: 'Cliente' },
    { accessorKey: 'canal_venda', header: 'Canal' },
    { accessorKey: 'vendedor', header: 'Vendedor' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status as string | undefined
      return s ? <Badge className={statusColor(s)}>{s}</Badge> : '-'
    } },
    { accessorKey: 'data_pedido', header: 'Data', cell: ({ row }) => {
      const d = row.original.data_pedido as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'valor_produtos', header: 'Produtos (R$)', cell: ({ row }) => {
      const v = row.original.valor_produtos as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'valor_frete', header: 'Frete (R$)', cell: ({ row }) => {
      const v = row.original.valor_frete as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'valor_desconto', header: 'Desconto (R$)', cell: ({ row }) => {
      const v = row.original.valor_desconto as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'valor_total_pedido', header: 'Total (R$)', cell: ({ row }) => {
      const v = row.original.valor_total_pedido as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'cidade_uf', header: 'Cidade/UF' },
    { accessorKey: 'created_at', header: 'Criado em', cell: ({ row }) => {
      const d = row.original.created_at as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Pedidos de Vendas"
      icon={ShoppingCart}
      iconColor="text-indigo-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="pedidos-vendas"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

