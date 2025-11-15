'use client'

import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactContent,
  ArtifactActions,
  ArtifactAction,
} from '@/components/ai-elements/artifact'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronDown, ChevronRight, Globe, BarChart3, ChevronLeft } from 'lucide-react'
import { useMemo, useState, Fragment } from 'react'
import { BarChart, CartesianGrid, XAxis, YAxis, Bar, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

type SummaryRow = {
  nivel: number
  nome: string
  detalhe1_nome: string | null
  detalhe2_nome: string | null
  valor: number
}

interface AnalisTerritorioData {
  summary: SummaryRow[]
  topVendedores: unknown[]
  topProdutos: unknown[]
  meta?: {
    nivel2_dim?: string
    nivel2_time_grain?: 'month' | 'year'
    nivel3_dim?: string
    nivel3_time_grain?: 'month' | 'year'
    measure?: 'faturamento' | 'quantidade' | 'pedidos' | 'itens'
  }
}

interface Props {
  success: boolean
  message: string
  data?: AnalisTerritorioData
}

export default function PivotTable({ success, message, data }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showChart, setShowChart] = useState(false)
  const [level, setLevel] = useState<1 | 2 | 3>(1)
  const [path, setPath] = useState<{ level1?: string; level2?: string }>({})

  const { level1Values, mapa } = useMemo(() => {
    const level1Values: string[] = []
    const mapa = new Map<string, { total: number; dim2: Map<string, { total: number; filhos: SummaryRow[] }> }>()
    const rows = data?.summary || []

    for (const row of rows) {
      if (row.nivel === 1) {
        if (!level1Values.includes(row.nome)) level1Values.push(row.nome)
        if (!mapa.has(row.nome)) mapa.set(row.nome, { total: 0, dim2: new Map() })
        const agg = mapa.get(row.nome)!
        agg.total = Number(row.valor || 0)
      } else if (row.nivel === 2) {
        if (!mapa.has(row.nome)) mapa.set(row.nome, { total: 0, dim2: new Map() })
        const agg = mapa.get(row.nome)!
        const key = String(row.detalhe1_nome || '—')
        if (!agg.dim2.has(key)) agg.dim2.set(key, { total: Number(row.valor || 0), filhos: [] })
        else {
          const d = agg.dim2.get(key)!
          d.total = Number(row.valor || 0) // usa o valor do nível 2
        }
      }
      else if (row.nivel === 3) {
        if (!mapa.has(row.nome)) mapa.set(row.nome, { total: 0, dim2: new Map() })
        const agg = mapa.get(row.nome)!
        const key = String(row.detalhe1_nome || '—')
        if (!agg.dim2.has(key)) agg.dim2.set(key, { total: 0, filhos: [] })
        agg.dim2.get(key)!.filhos.push(row)
      }
    }

    return { level1Values, mapa }
  }, [data])

  // ----- Chart data (drill-down) -----
  type ChartDatum = { categoria: string; valor: number }
  const rows = useMemo<SummaryRow[]>(() => data?.summary ?? [], [data])
  const measure = data?.meta?.measure || 'faturamento'
  const rowsL1 = useMemo(() => rows.filter(r => r.nivel === 1), [rows])
  const rowsL2 = useMemo(() => (path.level1 ? rows.filter(r => r.nivel === 2 && r.nome === path.level1) : []), [rows, path.level1])
  const rowsL3 = useMemo(() => (path.level1 && path.level2
      ? rows.filter(r => r.nivel === 3 && r.nome === path.level1 && String(r.detalhe1_nome || '—') === path.level2)
      : []
    ), [rows, path.level1, path.level2])
  const chartData = useMemo<ChartDatum[]>(() => {
    const fmt = (n: unknown) => Number(n || 0)
    if (level === 1) return rowsL1.map(r => ({ categoria: r.nome, valor: fmt(r.valor) })).sort((a, b) => b.valor - a.valor)
    if (level === 2) return rowsL2.map(r => ({ categoria: String(r.detalhe1_nome || '—'), valor: fmt(r.valor) })).sort((a, b) => b.valor - a.valor)
    return rowsL3.map(r => ({ categoria: String(r.detalhe2_nome || '—'), valor: fmt(r.valor) })).sort((a, b) => b.valor - a.valor)
  }, [level, rowsL1, rowsL2, rowsL3])
  const formatValue = (v: number) => {
    if (measure === 'faturamento') return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    return v.toLocaleString('pt-BR')
  }
  const handleCategoryClick = (cat: string) => {
    if (level === 1) {
      setPath({ level1: cat })
      setLevel(2)
    } else if (level === 2) {
      setPath(prev => ({ ...prev, level2: cat }))
      setLevel(3)
    }
  }
  const canGoBack = showChart && level > 1
  const goBack = () => {
    if (level === 3) {
      setLevel(2)
      setPath(prev => ({ level1: prev.level1 }))
    } else if (level === 2) {
      setLevel(1)
      setPath({})
    }
  }
  const breadcrumb = useMemo(() => {
    if (!showChart) return null
    const dim1Label = data?.meta?.nivel1_dim || 'Dim 1'
    if (level === 1) return dim1Label
    if (level === 2) return `${dim1Label}: ${path.level1}`
    return `${dim1Label}: ${path.level1} • ${data?.meta?.nivel2_dim || 'Dim 2'}: ${path.level2}`
  }, [showChart, level, path, data?.meta?.nivel1_dim, data?.meta?.nivel2_dim])
  const colors = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#22c55e', '#a855f7', '#f97316', '#0ea5e9'
  ]

  const toggle = (nome: string) => {
    const next = new Set(expanded)
    if (next.has(nome)) next.delete(nome)
    else next.add(nome)
    setExpanded(next)
  }

  return (
    <Artifact className="w-full">
      <ArtifactHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-purple-600" />
          <ArtifactTitle>Análise de Territórios</ArtifactTitle>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ArtifactDescription className="text-right">
            {success ? message : 'Erro ao consultar dados'}
            {breadcrumb ? ` — ${breadcrumb}` : ''}
          </ArtifactDescription>
          <ArtifactActions>
            {canGoBack && (
              <ArtifactAction icon={ChevronLeft} tooltip="Voltar" onClick={goBack} />
            )}
            <ArtifactAction
              icon={BarChart3}
              tooltip={showChart ? 'Mostrar tabela' : 'Mostrar gráfico'}
              onClick={() => setShowChart(v => !v)}
            />
          </ArtifactActions>
        </div>
      </ArtifactHeader>

      <ArtifactContent className="p-0">
        {!success || !data ? (
          <div className="p-4 text-sm text-red-600">{message}</div>
        ) : !showChart ? (
          <div className="w-full">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-[75%]">Dimensão</TableHead>
                  <TableHead className="text-right w-[25%]">{data?.meta?.measure === 'faturamento' || !data?.meta?.measure ? 'Faturamento' : 'Valor'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {level1Values.map((dim1) => {
                  const info = mapa.get(dim1)
                  if (!info) return null
                  const isOpen = expanded.has(t)
                  return (
                    <Fragment key={`group-${dim1}`}>
                      <TableRow className="bg-white">
                        <TableCell className="align-middle">
                          <button
                            type="button"
                            onClick={() => toggle(dim1)}
                            className="inline-flex items-center gap-2 hover:opacity-80"
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-semibold">{dim1}</span>
                          </button>
                        </TableCell>
                        <TableCell className={
                          `text-right font-bold ${data?.meta?.measure === 'faturamento' || !data?.meta?.measure ? 'text-green-600' : 'text-slate-700'}`
                        }>
                          {data?.meta?.measure === 'faturamento' || !data?.meta?.measure
                            ? Number(info.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : Number(info.total || 0).toLocaleString('pt-BR')}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        Array.from(info.dim2.entries())
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([dim2Key, dim2Info]) => {
                            const hasChildren = dim2Info.filhos.length > 0
                            const key = `${dim1}||${dim2Key}`
                             const isOpenL2 = expanded.has(key)
                             return (
                               <Fragment key={`l2-${key}`}>
                                 <TableRow className="bg-gray-50/60">
                                   <TableCell className="pl-8">
                                     {hasChildren ? (
                                       <button
                                         type="button"
                                         onClick={() => {
                                           const next = new Set(expanded)
                                           if (next.has(key)) next.delete(key); else next.add(key)
                                           setExpanded(next)
                                         }}
                                         className="inline-flex items-center gap-2 hover:opacity-80"
                                       >
                                         {isOpenL2 ? (
                                           <ChevronDown className="h-4 w-4" />
                                         ) : (
                                           <ChevronRight className="h-4 w-4" />
                                         )}
                                         <span>{dim2Key}</span>
                                       </button>
                                     ) : (
                                       <span className="pl-6 inline-block">{dim2Key}</span>
                                     )}
                                   </TableCell>
                                   <TableCell className="text-right">
                                     {data?.meta?.measure === 'faturamento' || !data?.meta?.measure
                                       ? Number(dim2Info.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                       : Number(dim2Info.total || 0).toLocaleString('pt-BR')}
                                   </TableCell>
                                 </TableRow>
                                 {isOpenL2 && dim2Info.filhos.map((v, idx) => (
                                    <TableRow key={`l3-${key}-${idx}`} className="bg-gray-50/80">
                                      <TableCell className="pl-14">{v.detalhe2_nome || '—'}</TableCell>
                                      <TableCell className="text-right">
                                        {data?.meta?.measure === 'faturamento' || !data?.meta?.measure
                                          ? Number(v.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                          : Number(v.valor || 0).toLocaleString('pt-BR')}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </Fragment>
                              )
                            })
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
            {level1Values.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">Nenhum dado encontrado.</div>
            )}
          </div>
        ) : (
          <div className="w-full p-3">
            {(() => {
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
                          cursor={level < 3 ? 'pointer' : 'default'}
                          onClick={() => level < 3 && handleCategoryClick(entry.categoria)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )
            })()}
            <p className="mt-2 text-xs text-muted-foreground">Clique nas barras para detalhar; use Voltar para subir o nível.</p>
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  )
}
