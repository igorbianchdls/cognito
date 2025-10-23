'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { ShoppingBag } from 'lucide-react'
import { useMemo } from 'react'

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

export default function PedidosCompraResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'numero_pedido', header: 'Número' },
    {
      accessorKey: 'fornecedor',
      header: 'Fornecedor',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const fornecedor = row.original.fornecedor || 'Sem fornecedor';
        const categoria = row.original.fornecedor_categoria || row.original.categoria || 'Sem categoria';
        return <EntityDisplay name={String(fornecedor)} subtitle={String(categoria)} />;
      }
    },
    { accessorKey: 'condicao_pagamento', header: 'Condição de Pagamento' },
    { accessorKey: 'data_pedido', header: 'Data', cell: ({ row }) => {
      const d = row.original.data_pedido as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
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

