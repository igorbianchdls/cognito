'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { BarChart3 } from 'lucide-react'
import { useMemo } from 'react'

type Kpis = Record<string, number | string | null | undefined>

interface Props {
  success: boolean
  message: string
  kpis?: Kpis
  sql_query?: string
}

export default function KpisComprasResult({ success, message, kpis = {}, sql_query }: Props) {
  const rows = useMemo(() => {
    const entries = Object.entries(kpis || {})
    if (!entries.length) return [] as Array<Record<string, unknown>>
    return entries.map(([indicador, valor]) => ({ indicador, valor }))
  }, [kpis])

  const columns: ColumnDef<Record<string, unknown>>[] = useMemo(() => [
    { accessorKey: 'indicador', header: 'Indicador' },
    { accessorKey: 'valor', header: 'Valor', cell: ({ row }) => {
      const v = row.original['valor'] as unknown
      if (typeof v === 'number') return v.toLocaleString('pt-BR')
      return String(v ?? '-')
    } },
  ], [])

  return (
    <ArtifactDataTable
      data={rows}
      columns={columns}
      title="KPIs de Compras"
      icon={BarChart3}
      iconColor="text-indigo-700"
      message={message}
      success={success}
      count={rows.length}
      exportFileName="kpis-compras"
      pageSize={10}
      sqlQuery={sql_query}
    />
  )
}

