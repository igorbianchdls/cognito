'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
import { ColumnDef } from '@tanstack/react-table'
import { Users } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  nome?: string
  cargo?: string
  especialidade?: string
  custo_hora?: number
  status?: string
  admissao?: string
  ordens_servico?: number
  horas_trabalhadas?: number
}

interface Props {
  success: boolean
  message: string
  rows?: Row[]
  count?: number
  sql_query?: string
}

export default function TecnicosResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    {
      accessorKey: 'nome',
      header: 'Técnico',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const nome = row.original.nome || 'Sem nome';
        const subtitle = row.original.especialidade || row.original.cargo || 'Sem especialidade';
        return <EntityDisplay name={String(nome)} subtitle={String(subtitle)} />;
      }
    },
    { accessorKey: 'cargo', header: 'Cargo' },
    { accessorKey: 'custo_hora', header: 'Custo/Hora', cell: ({ row }) => {
      const v = row.original.custo_hora as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
    { accessorKey: 'admissao', header: 'Admissão', cell: ({ row }) => {
      const d = row.original.admissao as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'ordens_servico', header: 'OS' },
    { accessorKey: 'horas_trabalhadas', header: 'Horas' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Técnicos"
      icon={Users}
      iconColor="text-emerald-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="tecnicos"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

