"use client"

import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export type RankingDimensaoRow = {
  dimensao?: string
  total?: number
  [key: string]: unknown
}

type RankingDimensaoOutput = {
  success: boolean
  count: number
  rows: RankingDimensaoRow[]
  message: string
  sql_query?: string
  error?: string
  title?: string
}

export default function RankingPorDimensaoFinanceiroResult({ result }: { result: RankingDimensaoOutput }) {
  const columns: ColumnDef<RankingDimensaoRow>[] = useMemo(() => [
    {
      accessorKey: 'dimensao',
      header: 'Dimensão',
      size: 260,
      cell: ({ row }) => {
        const v = row.original.dimensao ?? '—'
        return <span className="text-sm text-slate-700">{String(v)}</span>
      },
    },
    {
      accessorKey: 'total',
      header: 'Total (R$)',
      cell: ({ row }) => {
        const n = Number(row.original.total ?? 0)
        return (
          <span className="font-semibold text-slate-900">
            {n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        )
      },
    },
  ], [])

  const chartRenderer = (rows: RankingDimensaoRow[]) => {
    const data = [...rows]
      .map((r) => ({
        label: (r.dimensao ? String(r.dimensao) : '—').slice(0, 30),
        total: Number(r.total ?? 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 12)

    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="label" type="category" width={180} />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === 'total'
                ? Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : value
            }
          />
          <Legend />
          <Bar dataKey="total" fill="#7c3aed" name="Total" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ArtifactDataTable
      data={result.rows}
      columns={columns}
      title={result.title ?? 'Ranking por Dimensão Financeira'}
      icon={BarChart3}
      iconColor="text-purple-600"
      message={result.message}
      success={result.success}
      count={result.count}
      error={result.error}
      exportFileName="ranking_financeiro_dimensao"
      sqlQuery={result.sql_query}
      chartRenderer={chartRenderer}
    />
  )
}

