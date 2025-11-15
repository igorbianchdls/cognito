'use client'

import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
} from '@/components/ai-elements/artifact'
import { BarChart3, ChevronLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Cell,
} from 'recharts'

type SummaryRow = {
  nivel: number
  nome: string
  detalhe1_nome: string | null
  detalhe2_nome: string | null
  valor: number
}

type ChartDatum = { categoria: string; valor: number }

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
  title?: string
}

const CATEGORY_KEY = 'categoria' as const

export default function PivotChart({ success, message, data, title = 'Análise de Territórios (Gráfico)' }: Props) {
  const [showChart, setShowChart] = useState(false)
  const [level, setLevel] = useState<1 | 2 | 3>(1)
  const [path, setPath] = useState<{ territorio?: string; dim2?: string }>({})

  const rows = useMemo<SummaryRow[]>(() => data?.summary ?? [], [data])
  const measure = data?.meta?.measure || 'faturamento'

  const rowsL1 = useMemo(() => rows.filter(r => r.nivel === 1), [rows])
  const rowsL2 = useMemo(() => (path.territorio ? rows.filter(r => r.nivel === 2 && r.nome === path.territorio) : []), [rows, path.territorio])
  const rowsL3 = useMemo(() => (path.territorio && path.dim2
      ? rows.filter(r => r.nivel === 3 && r.nome === path.territorio && String(r.detalhe1_nome || '—') === path.dim2)
      : []
    ), [rows, path.territorio, path.dim2])

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
      setPath({ territorio: cat })
      setLevel(2)
    } else if (level === 2) {
      setPath(prev => ({ ...prev, dim2: cat }))
      setLevel(3)
    }
  }

  const canGoBack = level > 1
  const goBack = () => {
    if (level === 3) {
      setLevel(2)
      setPath(prev => ({ territorio: prev.territorio }))
    } else if (level === 2) {
      setLevel(1)
      setPath({})
    }
  }

  const breadcrumb = useMemo(() => {
    if (level === 1) return 'Territórios'
    if (level === 2) return `Território: ${path.territorio}`
    return `Território: ${path.territorio} • ${data?.meta?.nivel2_dim || 'Dim 2'}: ${path.dim2}`
  }, [level, path, data?.meta?.nivel2_dim])

  const colors = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899', '#22c55e', '#a855f7', '#f97316', '#0ea5e9'
  ]

  return (
    <Artifact className="w-full">
      <ArtifactHeader>
        <div>
          <ArtifactTitle>{title}</ArtifactTitle>
          <ArtifactDescription>{success ? message : 'Erro ao consultar dados'} — {breadcrumb}</ArtifactDescription>
        </div>
        <ArtifactActions>
          {canGoBack && (
            <ArtifactAction icon={ChevronLeft} tooltip="Voltar" onClick={goBack} />
          )}
          <ArtifactAction
            icon={BarChart3}
            tooltip={showChart ? 'Ocultar gráfico' : 'Mostrar gráfico'}
            onClick={() => setShowChart(v => !v)}
          />
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent>
        {!success || !data ? (
          <div className="text-sm text-red-600">{message}</div>
        ) : !showChart ? (
          <div className="text-sm text-muted-foreground">Clique no ícone de gráfico para visualizar.</div>
        ) : chartData.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem dados para exibir.</div>
        ) : (
          <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={CATEGORY_KEY} />
                <YAxis tickFormatter={(v) => formatValue(Number(v))} />
                <Tooltip formatter={(value: number) => formatValue(Number(value))} />
                <Legend />
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
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-muted-foreground">Clique nas barras para detalhar; use Voltar para subir o nível.</p>
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  )
}
