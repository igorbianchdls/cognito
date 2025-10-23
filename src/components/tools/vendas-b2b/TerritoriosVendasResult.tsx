'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Map } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  territorio?: string
  qtd_clientes?: number
  qtd_vendedores?: number
  created_at?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function TerritoriosVendasResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'territorio', header: 'Território' },
    { accessorKey: 'qtd_clientes', header: 'Qtd Clientes' },
    { accessorKey: 'qtd_vendedores', header: 'Qtd Vendedores' },
    { accessorKey: 'created_at', header: 'Criado em', cell: ({ row }) => {
      const d = row.original.created_at as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Territórios"
      icon={Map}
      iconColor="text-emerald-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="territorios-vendas"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

