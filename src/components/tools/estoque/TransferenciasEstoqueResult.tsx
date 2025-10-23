'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Shuffle } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  origem?: string
  destino?: string
  responsavel?: string
  status?: string
  data?: string
  produto?: string
  quantidade?: number
  observacoes?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function TransferenciasEstoqueResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'origem', header: 'Origem' },
    { accessorKey: 'destino', header: 'Destino' },
    { accessorKey: 'responsavel', header: 'Responsável' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'data', header: 'Data', cell: ({ row }) => {
      const d = row.original.data as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'produto', header: 'Produto' },
    { accessorKey: 'quantidade', header: 'Quantidade' },
    { accessorKey: 'observacoes', header: 'Observações' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Transferências de Estoque"
      icon={Shuffle}
      iconColor="text-emerald-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="transferencias-estoque"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

