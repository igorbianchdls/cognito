'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { List } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  produto?: string
  almoxarifado?: string
  tipo_movimento?: string
  descricao_movimento?: string
  natureza?: string
  quantidade?: number
  valor_unitario?: number
  valor_total?: number
  data_movimento?: string
  origem?: string
  observacoes?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

const fmtBRL = (v?: unknown) => {
  const n = Number(v ?? 0)
  return isNaN(n) ? '-' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function MovimentacoesEstoqueResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'produto', header: 'Produto' },
    { accessorKey: 'almoxarifado', header: 'Almoxarifado' },
    { accessorKey: 'tipo_movimento', header: 'Tipo Movimento' },
    { accessorKey: 'descricao_movimento', header: 'Descrição Movimento' },
    { accessorKey: 'natureza', header: 'Natureza' },
    { accessorKey: 'quantidade', header: 'Quantidade' },
    { accessorKey: 'valor_unitario', header: 'Valor Unitário (R$)', cell: ({ row }) => fmtBRL(row.original['valor_unitario']) },
    { accessorKey: 'valor_total', header: 'Valor Total (R$)', cell: ({ row }) => fmtBRL(row.original['valor_total']) },
    { accessorKey: 'data_movimento', header: 'Data Movimento', cell: ({ row }) => {
      const d = row.original.data_movimento as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'origem', header: 'Origem' },
    { accessorKey: 'observacoes', header: 'Observações' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Movimentações de Estoque"
      icon={List}
      iconColor="text-slate-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="movimentacoes-estoque"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

