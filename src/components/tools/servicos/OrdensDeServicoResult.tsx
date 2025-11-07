'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import EntityDisplay from '@/components/modulos/EntityDisplay'
import StatusBadge from '@/components/modulos/StatusBadge'
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
  title?: string
}

export default function OrdensDeServicoResult({ success, message, rows = [], count, sql_query, title }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'numero_os', header: 'Nº OS' },
    {
      accessorKey: 'cliente',
      header: 'Cliente',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const cliente = row.original.cliente || 'Sem cliente';
        const segmento = row.original.cliente_segmento || row.original.segmento || 'Sem segmento';
        return <EntityDisplay name={String(cliente)} subtitle={String(segmento)} />;
      }
    },
    {
      accessorKey: 'tecnico_responsavel',
      header: 'Técnico',
      size: 250,
      minSize: 200,
      cell: ({ row }) => {
        const tecnico = row.original.tecnico_responsavel || 'Sem técnico';
        const especialidade = row.original.tecnico_especialidade || row.original.especialidade || 'Sem especialidade';
        return <EntityDisplay name={String(tecnico)} subtitle={String(especialidade)} />;
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge value={row.original.status} type="status" />
    },
    {
      accessorKey: 'prioridade',
      header: 'Prioridade',
      cell: ({ row }) => <StatusBadge value={row.original.prioridade} type="prioridade" />
    },
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
      title={title ?? "Ordens de Serviço"}
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
