'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { Calendar } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  numero_os?: string
  tecnico?: string
  data_agendada?: string
  data_inicio?: string
  data_fim?: string
  status?: string
  observacoes?: string
}

interface Props {
  success: boolean
  message: string
  rows?: Row[]
  count?: number
  sql_query?: string
}

export default function AgendamentosResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'numero_os', header: 'Nº OS' },
    {
      accessorKey: 'tecnico',
      header: 'Técnico',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const tecnico = row.original.tecnico || 'Sem técnico';
        const especialidade = row.original.tecnico_especialidade || row.original.especialidade || 'Sem especialidade';
        return <EntityDisplay name={String(tecnico)} subtitle={String(especialidade)} />;
      }
    },
    { accessorKey: 'data_agendada', header: 'Agendado', cell: ({ row }) => {
      const d = row.original.data_agendada as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
    { accessorKey: 'data_inicio', header: 'Início', cell: ({ row }) => {
      const d = row.original.data_inicio as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
    { accessorKey: 'data_fim', header: 'Fim', cell: ({ row }) => {
      const d = row.original.data_fim as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
    { accessorKey: 'observacoes', header: 'Observações' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Agendamentos"
      icon={Calendar}
      iconColor="text-purple-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="agendamentos"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

