'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { Wrench } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  numero_os?: string
  cliente?: string
  tecnico_responsavel?: string
  status?: string
  prioridade?: string
  descricao_problema?: string
  data_abertura?: string
  data_prevista?: string
  data_conclusao?: string
  valor_estimado?: number
  valor_final?: number
}

interface Props {
  success: boolean
  message: string
  rows?: Row[]
  count?: number
  sql_query?: string
}

const statusColor = (s?: string) => {
  const v = (s || '').toLowerCase()
  if (v === 'concluida') return 'bg-green-100 text-green-800 border-green-300'
  if (v === 'cancelada') return 'bg-red-100 text-red-800 border-red-300'
  if (v === 'em_andamento') return 'bg-blue-100 text-blue-800 border-blue-300'
  if (v === 'aguardando_pecas') return 'bg-amber-100 text-amber-800 border-amber-300'
  if (v === 'aberta') return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  return 'bg-gray-100 text-gray-800 border-gray-300'
}

export default function OrdensDeServicoResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'numero_os', header: 'Nº OS' },
    { accessorKey: 'cliente', header: 'Cliente' },
    { accessorKey: 'tecnico_responsavel', header: 'Técnico' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status as string | undefined
      return s ? <Badge className={statusColor(s)}>{s}</Badge> : '-'
    } },
    { accessorKey: 'prioridade', header: 'Prioridade', cell: ({ row }) => {
      const p = row.original.prioridade as string | undefined
      return p ? <Badge variant="outline">{p}</Badge> : '-'
    } },
    { accessorKey: 'data_abertura', header: 'Abertura', cell: ({ row }) => {
      const d = row.original.data_abertura as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
    { accessorKey: 'data_prevista', header: 'Prevista', cell: ({ row }) => {
      const d = row.original.data_prevista as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'data_conclusao', header: 'Conclusão', cell: ({ row }) => {
      const d = row.original.data_conclusao as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
    { accessorKey: 'valor_estimado', header: 'Estimado (R$)', cell: ({ row }) => {
      const v = row.original.valor_estimado as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'valor_final', header: 'Valor Final (R$)', cell: ({ row }) => {
      const v = row.original.valor_final as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Ordens de Serviço"
      icon={Wrench}
      iconColor="text-sky-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="ordens-de-servico"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

