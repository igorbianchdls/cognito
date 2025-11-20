"use client"

import { useMemo, useState } from 'react'
import { TrendingUp, ChevronDown, ChevronRight } from 'lucide-react'
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactDescription, ArtifactContent } from '@/components/ai-elements/artifact'
import type { GetDesempenhoOutput, DesempenhoRow } from '@/tools/analistaVendasTools'

export default function DesempenhoResult({ result }: { result: GetDesempenhoOutput }) {
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
      </ArtifactHeader>
      <ArtifactContent className="p-0">
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
      </ArtifactContent>
    </Artifact>
  )
}
