'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { FileText } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  servico?: string
  descricao?: string
  categoria?: string
  unidade_medida?: string
  preco_base?: number
  status?: string
  criado_em?: string
  atualizado_em?: string
}

interface Props {
  success: boolean
  message: string
  rows?: Row[]
  count?: number
  sql_query?: string
  title?: string
}

export default function CatalogoServicosResult({ success, message, rows = [], count, sql_query, title }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'servico', header: 'Serviço' },
    { accessorKey: 'categoria', header: 'Categoria' },
    { accessorKey: 'unidade_medida', header: 'Unidade' },
    { accessorKey: 'preco_base', header: 'Preço Base', cell: ({ row }) => {
      const v = row.original.preco_base as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'criado_em', header: 'Criado em', cell: ({ row }) => {
      const d = row.original.criado_em as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
    { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => {
      const d = row.original.atualizado_em as string | undefined
      return d ? new Date(d).toLocaleString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title={title ?? "Catálogo de Serviços"}
      icon={FileText}
      iconColor="text-amber-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="catalogo-servicos"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}
