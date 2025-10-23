'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { LineChart } from 'lucide-react'
import { useMemo } from 'react'

type Row = Record<string, unknown> & {
  funcionario?: string
  salario_base?: number
  tipo_de_pagamento?: string
  inicio_vigencia?: string
  fim_vigencia?: string
}

interface Props { success: boolean; message: string; rows?: Row[]; count?: number; sql_query?: string }

export default function HistoricoSalarialResult({ success, message, rows = [], count, sql_query }: Props) {
  const columns: ColumnDef<Row>[] = useMemo(() => [
    { accessorKey: 'funcionario', header: 'Funcionário' },
    { accessorKey: 'salario_base', header: 'Salário Base', cell: ({ row }) => {
      const v = row.original.salario_base as number | undefined
      return typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'
    } },
    { accessorKey: 'tipo_de_pagamento', header: 'Tipo de Pagamento' },
    { accessorKey: 'inicio_vigencia', header: 'Início Vigência', cell: ({ row }) => {
      const d = row.original.inicio_vigencia as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
    { accessorKey: 'fim_vigencia', header: 'Fim Vigência', cell: ({ row }) => {
      const d = row.original.fim_vigencia as string | undefined
      return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="Histórico Salarial"
      icon={LineChart}
      iconColor="text-indigo-700"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : rows.length}
      exportFileName="historico-salarial"
      pageSize={20}
      sqlQuery={sql_query}
    />
  )
}

