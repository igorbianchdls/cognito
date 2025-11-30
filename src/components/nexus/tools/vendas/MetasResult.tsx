"use client"

import { useMemo, useState } from 'react'
import { Target, ChevronDown, ChevronRight } from 'lucide-react'
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactDescription, ArtifactContent, ArtifactActions, ArtifactAction } from '@/components/ai-elements/artifact'
import { Table as TableIcon, BarChart3 } from 'lucide-react'
import { ChartSwitcher } from '@/components/charts/ChartSwitcher'
import type { GetMetasOutput, MetaRow } from '@/tools/analistaVendasTools'

export default function MetasResult({ result }: { result: GetMetasOutput }) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const groups = useMemo(() => {
    const map = new Map<string | number, { head: MetaRow; rows: MetaRow[] }>()
    for (const r of result.rows || []) {
      const key = r.meta_id
      if (!map.has(key)) map.set(key, { head: r, rows: [] })
      map.get(key)!.rows.push(r)
      // Atualiza head para garantir vendedor/periodo consistentes
      if (!map.get(key)!.head || r.meta_item_id == null) map.get(key)!.head = r
    }
    return Array.from(map.values())
  }, [result.rows])

  const [open, setOpen] = useState<Record<string | number, boolean>>({})
  const toggle = (k: string | number) => setOpen(prev => ({ ...prev, [k]: !prev[k] }))

  return (
    <Artifact className="w-full">
      <ArtifactHeader>
        <div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-500" />
            <ArtifactTitle>Metas x Realizado</ArtifactTitle>
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
              valueKeys: ['valor_meta'],
              title: 'Metas por Tipo',
              seriesLabel: 'Meta',
              transform: (rows: Array<Record<string, unknown>>) => {
                const acc = new Map<string, { tipo_meta: string; valor_meta: number }>()
                for (const r of rows) {
                  const k = String(r['tipo_meta'] ?? '')
                  const rawV = r['valor_meta']
                  const numV = typeof rawV === 'number' ? rawV : Number(rawV)
                  const cur = acc.get(k) || { tipo_meta: k, valor_meta: 0 }
                  cur.valor_meta += Number.isFinite(numV) ? numV : 0
                  acc.set(k, cur)
                }
                return Array.from(acc.values()) as Array<Record<string, unknown>>
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
                            <th className="text-left py-2 px-3">Tipo Valor</th>
                            <th className="text-right py-2 px-3">Valor Meta</th>
                            <th className="text-right py-2 px-3">% Meta</th>
                            <th className="text-left py-2 px-3">Criado</th>
                            <th className="text-left py-2 px-3">Atualizado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r, idx) => (
                            <tr key={`${r.meta_id}-${r.meta_item_id ?? idx}`} className="border-b last:border-0">
                              <td className="py-2 px-3">{String(r.tipo_meta || '')}</td>
                              <td className="py-2 px-3">{String(r.tipo_valor || '')}</td>
                              <td className="text-right py-2 px-3">{String(r.valor_meta ?? '')}</td>
                              <td className="text-right py-2 px-3">{String(r.meta_percentual ?? '')}</td>
                              <td className="py-2 px-3">{String(r.criado_em || '')}</td>
                              <td className="py-2 px-3">{String(r.atualizado_em || '')}</td>
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
