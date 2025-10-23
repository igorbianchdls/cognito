'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { DollarSign } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  produto?: string
  metodo?: string
  fonte?: string
  custo?: number
  data_referencia?: string
  registrado_em?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

const fmtBRL = (v?: unknown) => {
  const n = Number(v ?? 0)
  return isNaN(n) ? '-' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CustosEstoqueResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'produto', header: 'Produto' },
    { accessorKey: 'metodo', header: 'Método de Custo' },
    { accessorKey: 'fonte', header: 'Fonte' },
    { accessorKey: 'custo', header: 'Custo (R$)', cell: ({ row }) => fmtBRL(row.original['custo']) },
    { accessorKey: 'data_referencia', header: 'Data Referência', cell: ({ row }) => {
      const d = row.original.data_referencia as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'registrado_em', header: 'Registrado em', cell: ({ row }) => {
      const d = row.original.registrado_em as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Custos de Estoque"
      icon={DollarSign}
      iconColor="text-emerald-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="custos-estoque"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

