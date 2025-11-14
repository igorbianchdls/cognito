'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Globe } from 'lucide-react'
import { useMemo } from 'react'

type SummaryRow = {
  territorio_nome: string
  faturamento_total: number
  total_pedidos: number
  total_itens: number
  ticket_medio: number
  participacao_faturamento: number
}

interface AnalisTerritorioData {
  summary: SummaryRow[]
  topVendedores: unknown[]
  topProdutos: unknown[]
}

interface Props {
  success: boolean
  message: string
  data?: AnalisTerritorioData
}

export default function AnalisTerritorioResult({ success, message, data }: Props) {
  const columns: ColumnDef<SummaryRow>[] = useMemo(() => [
    { accessorKey: 'territorio_nome', header: 'Território' },
    {
      accessorKey: 'faturamento_total',
      header: 'Faturamento',
      cell: ({ row }) => Number(row.original.faturamento_total || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    },
    {
      accessorKey: 'total_pedidos',
      header: 'Pedidos',
      cell: ({ row }) => Number(row.original.total_pedidos || 0).toLocaleString('pt-BR'),
    },
    {
      accessorKey: 'total_itens',
      header: 'Itens',
      cell: ({ row }) => Number(row.original.total_itens || 0).toLocaleString('pt-BR'),
    },
    {
      accessorKey: 'ticket_medio',
      header: 'Ticket Médio',
      cell: ({ row }) => Number(row.original.ticket_medio || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    },
    {
      accessorKey: 'participacao_faturamento',
      header: 'Participação %',
      cell: ({ row }) => `${Number(row.original.participacao_faturamento || 0).toFixed(2)}%`,
    },
  ], [])

  return (
    <ArtifactDataTable
      data={data?.summary || []}
      columns={columns}
      title="Análise de Territórios"
      icon={Globe}
      iconColor="text-purple-600"
      message={message}
      success={success}
      count={data?.summary?.length || 0}
      exportFileName="analise-territorios"
      pageSize={20}
    />
  )
}
