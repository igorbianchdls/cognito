"use client"

import { useMemo, useState } from 'react'
import { TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactDescription, ArtifactContent, ArtifactActions, ArtifactAction } from '@/components/ai-elements/artifact'
import { Table as TableIcon, BarChart3 } from 'lucide-react'
import { ChartSwitcher } from '@/components/charts/ChartSwitcher'
import type { GetDesempenhoOutput, DesempenhoRow } from '@/tools/analistaVendasTools'

export default function DesempenhoResult({ result }: { result: GetDesempenhoOutput }) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const groups = useMemo(() => {
    const map = new Map<string | number, { head: DesempenhoRow; rows: DesempenhoRow[] }>()
    for (const r of result.rows || []) {
      const key = r.meta_id
      if (!map.has(key)) map.set(key, { head: r, rows: [] })
      map.get(key)!.rows.push(r)
      // Mantém head com vendedor/periodo
      if (!map.get(key)!.head) map.get(key)!.head = r
    }
    return Array.from(map.values())
  }, [result.rows])

  const [open, setOpen] = useState<Record<string | number, boolean>>({})
  const toggle = (k: string | number) => setOpen(prev => ({ ...prev, [k]: !prev[k] }))

  const fmtPercent = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) ? `${n.toFixed(2)}%` : String(v ?? '')
  }

  return (
    <Artifact className="w-full">
      <ArtifactHeader>
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-500" />
            <ArtifactTitle>Desempenho Comercial</ArtifactTitle>
          </div>
          <ArtifactDescription className="mt-1">{result.message} — {result.count} metas</ArtifactDescription>
        </div>
        <ArtifactActions>
          <ArtifactAction
            icon={TableIcon}
            tooltip="Ver tabela"
            variant="ghost"
            size="icon"
            className={viewMode === 'table' ? 'bg-slate-200/80 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'}
            onClick={() => setViewMode('table')}
          />
          <ArtifactAction
            icon={BarChart3}
            tooltip="Ver gráfico"
            variant="ghost"
            size="icon"
            className={viewMode === 'chart' ? 'bg-slate-200/80 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'}
            onClick={() => setViewMode('chart')}
          />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent className={viewMode === 'chart' ? 'p-4' : 'p-0'}>
        {viewMode === 'chart' ? (
          <ChartSwitcher
            rows={(result.rows || []) as Array<Record<string, unknown>>}
            options={{
              xKey: 'tipo_meta',
              valueKeys: ['realizado', 'valor_meta', 'diferenca'],
              title: 'Desempenho por Tipo de Meta',
              seriesLabel: 'Valor',
              transform: (rows) => {
                const acc = new Map<string, { tipo_meta: string; realizado: number; valor_meta: number; diferenca: number }>()
                for (const r of rows) {
                  const k = String((r as any).tipo_meta || '')
                  const cur = acc.get(k) || { tipo_meta: k, realizado: 0, valor_meta: 0, diferenca: 0 }
                  const real = Number((r as any).realizado ?? 0)
                  const meta = Number((r as any).valor_meta ?? 0)
                  const dif = Number((r as any).diferenca ?? (real - meta))
                  cur.realizado += Number.isFinite(real) ? real : 0
                  cur.valor_meta += Number.isFinite(meta) ? meta : 0
                  cur.diferenca += Number.isFinite(dif) ? dif : 0
                  acc.set(k, cur)
                }
                return Array.from(acc.values()) as any
              },
            }}
          />
        ) : (
        <div className="divide-y">
          {groups.map(({ head, rows }) => {
            const key = head.meta_id
            const isOpen = !!open[key]
            return (
              <div key={key}>
                <button onClick={() => toggle(key)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">{head.vendedor}</span>
                    <span className="text-gray-500">• Meta #{String(head.meta_id)}</span>
                    <span className="text-gray-500">• {String(head.mes).padStart(2,'0')}/{head.ano}</span>
                  </div>
                  <div className="text-xs text-gray-500">{rows.length} item(s)</div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-y bg-gray-50">
                            <th className="text-left py-2 px-3">Tipo Meta</th>
                            <th className="text-right py-2 px-3">Meta</th>
                            <th className="text-right py-2 px-3">Realizado</th>
                            <th className="text-right py-2 px-3">Diferença</th>
                            <th className="text-right py-2 px-3">Atingimento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r, idx) => (
                            <tr key={`${r.meta_id}-${r.tipo_meta}-${idx}`} className="border-b last:border-0">
                              <td className="py-2 px-3">{String(r.tipo_meta || '')}</td>
                              <td className="text-right py-2 px-3">{String(r.valor_meta ?? '')}</td>
                              <td className="text-right py-2 px-3">{String(r.realizado ?? '')}</td>
                              <td className="text-right py-2 px-3">{String(r.diferenca ?? '')}</td>
                              <td className="text-right py-2 px-3">{fmtPercent(r.atingimento_percentual)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {groups.length === 0 && (
            <div className="p-4 text-sm text-gray-500">Nenhum resultado.</div>
          )}
        </div>
        )}
      </ArtifactContent>
    </Artifact>
  )
}
