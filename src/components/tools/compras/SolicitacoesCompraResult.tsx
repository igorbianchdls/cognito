'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { FilePlus2 } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  data_solicitacao?: string
  status?: string
  itens_solicitados?: number
  observacoes?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function SolicitacoesCompraResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'data_solicitacao', header: 'Data', cell: ({ row }) => {
      const d = row.original.data_solicitacao as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
    { accessorKey: 'itens_solicitados', header: 'Itens Solicitados' },
    { accessorKey: 'observacoes', header: 'Observações' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Solicitações de Compra"
      icon={FilePlus2}
      iconColor="text-sky-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="solicitacoes-compra"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

