'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  produto?: string
  almoxarifado?: string
  quantidade_atual?: number
  custo_medio?: number
  valor_total?: number
  atualizado_em?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

const fmtBRL = (v?: unknown) => {
  const n = Number(v ?? 0)
  return isNaN(n) ? '-' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function EstoqueAtualResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'produto', header: 'Produto' },
    { accessorKey: 'almoxarifado', header: 'Almoxarifado' },
    { accessorKey: 'quantidade_atual', header: 'Quantidade Atual' },
    { accessorKey: 'custo_medio', header: 'Custo Médio (R$)', cell: ({ row }) => fmtBRL(row.original['custo_medio']) },
    { accessorKey: 'valor_total', header: 'Valor Total (R$)', cell: ({ row }) => fmtBRL(row.original['valor_total']) },
    { accessorKey: 'atualizado_em', header: 'Atualizado em', cell: ({ row }) => {
      const d = row.original.atualizado_em as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Estoque Atual"
      icon={Package}
      iconColor="text-amber-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="estoque-atual"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

