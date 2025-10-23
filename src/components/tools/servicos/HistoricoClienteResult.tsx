'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { User } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  numero_os?: string
  status?: string
  prioridade?: string
  data_abertura?: string
  data_conclusao?: string
  valor_final?: number
}

interface Props {
  success: boolean
  message: string
  rows?: Row[]
  count?: number
  sql_query?: string
}

export default function HistoricoClienteResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'numero_os', header: 'Nº OS' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'prioridade', header: 'Prioridade' },
    { accessorKey: 'data_abertura', header: 'Abertura', cell: ({ row }) => {
      const d = row.original.data_abertura as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
    { accessorKey: 'data_conclusao', header: 'Conclusão', cell: ({ row }) => {
      const d = row.original.data_conclusao as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
    { accessorKey: 'valor_final', header: 'Valor Final', cell: ({ row }) => {
      const v = row.original.valor_final as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Histórico do Cliente"
      icon={User}
      iconColor="text-gray-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="historico-cliente"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

