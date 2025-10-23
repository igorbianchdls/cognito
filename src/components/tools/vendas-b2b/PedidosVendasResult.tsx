'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { ShoppingCart } from 'lucide-react'
import { useMemo } from 'react'

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

export default function PedidosVendasResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'numero_pedido', header: 'Número' },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const cliente = row.original.cliente || 'Sem cliente';
        const cidade = row.original.cidade_uf || 'Sem localização';
        return <EntityDisplay name={String(cliente)} subtitle={String(cidade)} />;
      }
    },
    { accessorKey: 'canal_venda', header: 'Canal' },
    {
      accessorKey: 'vendedor',
      header: 'Vendedor',
      size: 200,
      minSize: 150,
      cell: ({ row }) => {
        const vendedor = row.original.vendedor;
        if (!vendedor) return '-';
        const equipe = row.original.vendedor_equipe || row.original.equipe || 'Vendedor';
        return <EntityDisplay name={String(vendedor)} subtitle={String(equipe)} />;
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
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

