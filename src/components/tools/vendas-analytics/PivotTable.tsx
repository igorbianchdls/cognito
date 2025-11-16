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
  detalhe3_nome: string | null
  detalhe4_nome: string | null
  valor: number
}

interface AnalisTerritorioData {
  summary: SummaryRow[]
  topVendedores: unknown[]
  topProdutos: unknown[]
  meta?: {
    nivel1_dim?: string
    nivel1_time_grain?: 'month' | 'year'
    nivel2_dim?: string
    nivel2_time_grain?: 'month' | 'year'
    nivel3_dim?: string
    nivel3_time_grain?: 'month' | 'year'
    nivel4_dim?: string
    nivel4_time_grain?: 'month' | 'year'
    nivel5_dim?: string
    nivel5_time_grain?: 'month' | 'year'
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
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [path, setPath] = useState<string[]>([])

  type Node = { total: number; children: Map<string, Node> }
  const { level1Values, tree } = useMemo(() => {
    const level1Values: string[] = []
    const tree = new Map<string, Node>()
    const rows = data?.summary || []

    for (const row of rows) {
      const keys = [row.nome, row.detalhe1_nome, row.detalhe2_nome, row.detalhe3_nome, row.detalhe4_nome]
        .map(v => String(v ?? '—'))
      if (!level1Values.includes(keys[0])) level1Values.push(keys[0])

      // Navegar/Construir árvore até o nível do row
      let currentMap = tree
      for (let i = 0; i < row.nivel; i++) {
        const key = keys[i]
        if (!currentMap.has(key)) {
          currentMap.set(key, { total: 0, children: new Map() })
        }
        const node = currentMap.get(key)!
        if (i === row.nivel - 1) {
          node.total = Number(row.valor || 0)
        }
        currentMap = node.children
      }
    }

    return { level1Values, tree }
  }, [data])

  // ----- Chart data (drill-down) -----
  type ChartDatum = { categoria: string; valor: number }
  const rows = useMemo<SummaryRow[]>(() => data?.summary ?? [], [data])
  const measure = data?.meta?.measure || 'faturamento'
  const rowsL1 = useMemo(() => rows.filter(r => r.nivel === 1), [rows])
  const maxNivel = useMemo(() => rows.reduce((m, r) => Math.max(m, r.nivel || 0), 0), [rows])
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
  const handleCategoryClick = (cat: string) => {
    if (level < maxNivel) {
      setPath(prev => [...prev, cat])
      setLevel((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5)
    }
  }
  const canGoBack = showChart && level > 1
  const goBack = () => {
    if (level > 1) {
      setLevel((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5)
      setPath(prev => prev.slice(0, -1))
    }
  }
  const breadcrumb = useMemo(() => {
    if (!showChart) return null
    const labels = [
      data?.meta?.nivel1_dim || 'Dim 1',
      data?.meta?.nivel2_dim || 'Dim 2',
      data?.meta?.nivel3_dim || 'Dim 3',
      data?.meta?.nivel4_dim || 'Dim 4',
      data?.meta?.nivel5_dim || 'Dim 5',
    ]
    if (level === 1) return labels[0]
    const parts = [] as string[]
    for (let i = 0; i < level - 1; i++) {
      parts.push(`${labels[i]}: ${path[i]}`)
    }
    return parts.join(' • ')
  }, [showChart, level, path, data?.meta?.nivel1_dim, data?.meta?.nivel2_dim, data?.meta?.nivel3_dim, data?.meta?.nivel4_dim, data?.meta?.nivel5_dim])
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
                  const info = tree.get(dim1)
                  if (!info) return null
                  const isOpen = expanded.has(dim1)
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
                         Array.from(info.children.entries())
                           .sort((a, b) => b[1].total - a[1].total)
                           .map(([dim2Key, dim2Node]) => {
                             const keyL2 = `${dim1}||${dim2Key}`
                             const openL2 = expanded.has(keyL2)
                             const hasChildrenL3 = dim2Node.children.size > 0
                             return (
                               <Fragment key={`l2-${keyL2}`}>
                                 <TableRow className="bg-gray-50/60">
                                   <TableCell style={{ paddingLeft: '2rem' }}>
                                     {hasChildrenL3 ? (
                                       <button
                                         type="button"
                                         onClick={() => {
                                           const next = new Set(expanded)
                                           if (next.has(keyL2)) next.delete(keyL2); else next.add(keyL2)
                                           setExpanded(next)
                                         }}
                                         className="inline-flex items-center gap-2 hover:opacity-80"
                                       >
                                         {openL2 ? (
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
                                       ? Number(dim2Node.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                       : Number(dim2Node.total || 0).toLocaleString('pt-BR')}
                                   </TableCell>
                                 </TableRow>
                                 {openL2 && Array.from(dim2Node.children.entries()).sort((a,b)=> b[1].total-a[1].total).map(([dim3Key, dim3Node]) => {
                                   const keyL3 = `${keyL2}||${dim3Key}`
                                   const openL3 = expanded.has(keyL3)
                                   const hasChildrenL4 = dim3Node.children.size > 0
                                   return (
                                     <Fragment key={`l3-${keyL3}`}>
                                       <TableRow className="bg-gray-50/80">
                                         <TableCell style={{ paddingLeft: '3rem' }}>
                                           {hasChildrenL4 ? (
                                             <button
                                               type="button"
                                               onClick={() => {
                                                 const next = new Set(expanded)
                                                 if (next.has(keyL3)) next.delete(keyL3); else next.add(keyL3)
                                                 setExpanded(next)
                                               }}
                                               className="inline-flex items-center gap-2 hover:opacity-80"
                                             >
                                               {openL3 ? (
                                                 <ChevronDown className="h-4 w-4" />
                                               ) : (
                                                 <ChevronRight className="h-4 w-4" />
                                               )}
                                               <span>{dim3Key}</span>
                                             </button>
                                           ) : (
                                             <span className="pl-6 inline-block">{dim3Key}</span>
                                           )}
                                         </TableCell>
                                         <TableCell className="text-right">
                                           {data?.meta?.measure === 'faturamento' || !data?.meta?.measure
                                             ? Number(dim3Node.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                             : Number(dim3Node.total || 0).toLocaleString('pt-BR')}
                                         </TableCell>
                                       </TableRow>
                                       {openL3 && Array.from(dim3Node.children.entries()).sort((a,b)=> b[1].total-a[1].total).map(([dim4Key, dim4Node]) => {
                                         const keyL4 = `${keyL3}||${dim4Key}`
                                         const openL4 = expanded.has(keyL4)
                                         const hasChildrenL5 = dim4Node.children.size > 0
                                         return (
                                           <Fragment key={`l4-${keyL4}`}>
                                             <TableRow className="bg-gray-50">
                                               <TableCell style={{ paddingLeft: '4rem' }}>
                                                 {hasChildrenL5 ? (
                                                   <button
                                                     type="button"
                                                     onClick={() => {
                                                       const next = new Set(expanded)
                                                       if (next.has(keyL4)) next.delete(keyL4); else next.add(keyL4)
                                                       setExpanded(next)
                                                     }}
                                                     className="inline-flex items-center gap-2 hover:opacity-80"
                                                   >
                                                     {openL4 ? (
                                                       <ChevronDown className="h-4 w-4" />
                                                     ) : (
                                                       <ChevronRight className="h-4 w-4" />
                                                     )}
                                                     <span>{dim4Key}</span>
                                                   </button>
                                                 ) : (
                                                   <span className="pl-6 inline-block">{dim4Key}</span>
                                                 )}
                                               </TableCell>
                                               <TableCell className="text-right">
                                                 {data?.meta?.measure === 'faturamento' || !data?.meta?.measure
                                                   ? Number(dim4Node.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                   : Number(dim4Node.total || 0).toLocaleString('pt-BR')}
                                               </TableCell>
                                             </TableRow>
                                             {openL4 && Array.from(dim4Node.children.entries()).sort((a,b)=> b[1].total-a[1].total).map(([dim5Key, dim5Node]) => (
                                               <TableRow key={`l5-${keyL4}||${dim5Key}`} className="bg-gray-50">
                                                 <TableCell style={{ paddingLeft: '5rem' }}>{dim5Key}</TableCell>
                                                 <TableCell className="text-right">
                                                   {data?.meta?.measure === 'faturamento' || !data?.meta?.measure
                                                     ? Number(dim5Node.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                                     : Number(dim5Node.total || 0).toLocaleString('pt-BR')}
                                                 </TableCell>
                                               </TableRow>
                                             ))}
                                           </Fragment>
                                         )
                                       })}
                                     </Fragment>
                                   )
                                 })}
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
