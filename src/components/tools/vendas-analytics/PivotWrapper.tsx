"use client"

import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent,
} from '@/components/ai-elements/artifact'
import { BarChart3, ChevronLeft, Table as TableIcon, Globe } from 'lucide-react'
import { useMemo, useState } from 'react'
import PivotTableContent from './PivotTableContent'
import PivotChart from './PivotChart'

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
  title?: string
  defaultMode?: 'table' | 'chart'
}

export default function PivotWrapper({ success, message, data, title, defaultMode = 'table' }: Props) {
  const [mode, setMode] = useState<'table' | 'chart'>(defaultMode)
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(1)
  const [path, setPath] = useState<string[]>([])

  const rows = useMemo<SummaryRow[]>(() => data?.summary ?? [], [data])
  const maxNivel = useMemo(() => rows.reduce((m, r) => Math.max(m, r.nivel || 0), 0), [rows])

  const dimLabels = [
    data?.meta?.nivel1_dim || 'Dim 1',
    data?.meta?.nivel2_dim || 'Dim 2',
    data?.meta?.nivel3_dim || 'Dim 3',
    data?.meta?.nivel4_dim || 'Dim 4',
    data?.meta?.nivel5_dim || 'Dim 5',
  ]

  const computedTitle = title || `Pivot — ${dimLabels[0]}`
  const breadcrumb = useMemo(() => {
    if (mode !== 'chart') return null
    if (level === 1) return dimLabels[0]
    const parts: string[] = []
    for (let i = 0; i < level - 1; i++) {
      parts.push(`${dimLabels[i]}: ${path[i]}`)
    }
    return parts.join(' • ')
  }, [mode, level, path, dimLabels])

  const canGoBack = mode === 'chart' && level > 1

  return (
    <Artifact className="w-full">
      <ArtifactHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-purple-600" />
          <ArtifactTitle>{computedTitle}</ArtifactTitle>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ArtifactDescription className="text-right">
            {success ? message : 'Erro ao consultar dados'}
            {breadcrumb ? ` — ${breadcrumb}` : ''}
          </ArtifactDescription>
          <ArtifactActions>
            {canGoBack && (
              <ArtifactAction icon={ChevronLeft} tooltip="Voltar" onClick={() => {
                setLevel((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5)
                setPath(prev => prev.slice(0, -1))
              }} />
            )}
            {mode === 'chart' ? (
              <ArtifactAction icon={TableIcon} tooltip="Mostrar tabela" onClick={() => setMode('table')} />
            ) : (
              <ArtifactAction icon={BarChart3} tooltip="Mostrar gráfico" onClick={() => setMode('chart')} />
            )}
          </ArtifactActions>
        </div>
      </ArtifactHeader>

      <ArtifactContent>
        {mode === 'table' ? (
          <PivotTableContent success={success} message={message} data={data} />
        ) : (
          <div className="w-full p-3">
            <PivotChart
              success={success}
              message={message}
              data={data}
              level={level}
              path={path}
              onDrill={(cat) => {
                if (level < maxNivel) {
                  setPath(prev => [...prev, cat])
                  setLevel(prev => (prev + 1) as 1 | 2 | 3 | 4 | 5)
                }
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">Clique nas barras para detalhar; use Voltar para subir o nível.</p>
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  )
}
