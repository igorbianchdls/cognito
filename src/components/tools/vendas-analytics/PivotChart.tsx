"use client"

import { useMemo } from 'react'
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

type SummaryRow = {
  nivel: number
  nome: string
  detalhe1_nome: string | null
  detalhe2_nome: string | null
  detalhe3_nome: string | null
  detalhe4_nome: string | null
  valor: number
}

type ChartDatum = { categoria: string; valor: number }

interface AnalisTerritorioData {
  summary: SummaryRow[]
  topVendedores: unknown[]
  topProdutos: unknown[]
  meta?: {
    measure?: 'faturamento' | 'quantidade' | 'pedidos' | 'itens'
  }
}

interface Props {
  success: boolean
  message: string
  data?: AnalisTerritorioData
  level: 1 | 2 | 3 | 4 | 5
  path: string[]
  onDrill?: (category: string) => void
}

export default function PivotChart({ success, message, data, level, path, onDrill }: Props) {
  const rows = useMemo<SummaryRow[]>(() => data?.summary ?? [], [data])
  const measure = data?.meta?.measure || 'faturamento'

  const getProp = (lvl: number) => (lvl === 1 ? 'nome' : lvl === 2 ? 'detalhe1_nome' : lvl === 3 ? 'detalhe2_nome' : lvl === 4 ? 'detalhe3_nome' : 'detalhe4_nome') as keyof SummaryRow
  const chartRows = useMemo(() => rows.filter(r => {
    if (r.nivel !== level) return false
    for (let i = 1; i < level; i++) {
      const prop = getProp(i)
      if (String(r[prop] ?? '—') !== path[i-1]) return false
    }
    return true
  }), [rows, level, path])

  const chartData = useMemo<ChartDatum[]>(() => {
    const fmt = (n: unknown) => Number(n || 0)
    const prop = getProp(level)
    return chartRows.map(r => ({ categoria: String(r[prop] ?? '—'), valor: fmt(r.valor) })).sort((a, b) => b.valor - a.valor)
  }, [chartRows, level])

  const formatValue = (v: number) => {
    if (measure === 'faturamento') return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    return v.toLocaleString('pt-BR')
  }

  const colors = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#22c55e', '#a855f7', '#f97316', '#0ea5e9'
  ]

  if (!success || !data) {
    return <div className="text-sm text-red-600">{message}</div>
  }
  if (chartData.length === 0) {
    return <div className="text-sm text-muted-foreground">Sem dados para exibir.</div>
  }

  const chartConfig: ChartConfig = {
    valor: {
      label: measure === 'faturamento' ? 'Faturamento' : 'Valor',
      color: '#10b981',
    },
  }

  return (
    <ChartContainer config={chartConfig} style={{ height: 360 }}>
      <BarChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="categoria" tickLine={false} axisLine={false} tickMargin={6} />
        <YAxis tickFormatter={(v) => formatValue(Number(v))} tickLine={false} axisLine={false} tickMargin={6} />
        <ChartTooltip
          cursor={false}
          content={({ active, payload }) => {
            if (!active || !payload || !payload.length) return null
            const d = payload[0].payload as { categoria: string; valor: number }
            return (
              <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="font-semibold mb-1 max-w-[240px] truncate">{d.categoria}</div>
                <div className="text-sm">
                  {measure === 'faturamento'
                    ? formatValue(Number(d.valor))
                    : Number(d.valor).toLocaleString('pt-BR')}
                </div>
              </div>
            )
          }}
        />
        <Bar dataKey="valor" name={measure === 'faturamento' ? 'Faturamento' : 'Valor'}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              cursor={onDrill ? 'pointer' : 'default'}
              onClick={() => onDrill && onDrill(entry.categoria)}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
