"use client"

import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { Clock4 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export type AgingRow = {
  bucket?: string
  qtd?: number
  total?: number
  [key: string]: unknown
}

type AgingOutput = {
  success: boolean
  count: number
  rows: AgingRow[]
  message: string
  sql_query?: string
  error?: string
  title?: string
}

export default function AgingFinanceiroResult({ result }: { result: AgingOutput }) {
  const columns: ColumnDef<AgingRow>[] = useMemo(() => [
    {
      accessorKey: 'bucket',
      header: 'Faixa (dias)',
      size: 180,
      cell: ({ row }) => <span className="text-sm text-slate-700">{String(row.original.bucket ?? '—')}</span>,
    },
    {
      accessorKey: 'qtd',
      header: 'Quantidade',
      cell: ({ row }) => <span className="text-sm font-medium">{Number(row.original.qtd ?? 0).toLocaleString('pt-BR')}</span>,
    },
    {
      accessorKey: 'total',
      header: 'Total (R$)',
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">
          {Number(row.original.total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
  ], [])

  const chartRenderer = (rows: AgingRow[]) => {
    const data = rows.map(r => ({
      faixa: String(r.bucket ?? '—'),
      total: Number(r.total ?? 0),
      qtd: Number(r.qtd ?? 0),
    }))

    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="faixa" type="category" width={160} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'total'
                ? Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : Number(value).toLocaleString('pt-BR')
            }
          />
          <Legend />
          <Bar dataKey="total" fill="#0ea5e9" name="Total (R$)" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={columns}
      title={result.title ?? 'Aging Financeiro'}
      icon={Clock4}
      iconColor="text-sky-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="aging_financeiro"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  )
}

