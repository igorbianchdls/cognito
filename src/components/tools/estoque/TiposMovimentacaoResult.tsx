'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Settings } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  codigo?: string
  descricao?: string
  natureza?: string
  gera_financeiro?: string
  status?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function TiposMovimentacaoResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'descricao', header: 'Descrição' },
    { accessorKey: 'natureza', header: 'Natureza' },
    { accessorKey: 'gera_financeiro', header: 'Gera Financeiro' },
    { accessorKey: 'status', header: 'Status' },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Tipos de Movimentação"
      icon={Settings}
      iconColor="text-slate-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="tipos-movimentacao"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

