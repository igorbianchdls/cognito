'use client'

import { useEffect, useState } from 'react'
import { formatBRL } from '@/products/erp/frontend/features/financeiro/utils/formatting'

const cache = new Map<number, Array<Record<string, unknown>>>()

export default function LinhasContaPagar({ contaPagarId }: { contaPagarId: number }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        if (!contaPagarId || !Number.isFinite(contaPagarId)) throw new Error('ID de conta inválido')
        if (cache.has(contaPagarId)) {
          setRows(cache.get(contaPagarId) || [])
          return
        }
        const res = await fetch(`/api/modulos/financeiro/contas-a-pagar/${contaPagarId}/linhas`, { cache: 'no-store' })
        const j = await res.json()
        if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
        const list: Array<Record<string, unknown>> = Array.isArray(j.rows) ? j.rows : []
        if (!cancelled) {
          setRows(list)
          cache.set(contaPagarId, list)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar linhas')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [contaPagarId])

  if (loading) return <div className="text-xs text-gray-500 p-3">Carregando itens…</div>
  if (error) return <div className="text-xs text-red-600 p-3">{error}</div>
  if (!rows.length) return <div className="text-xs text-gray-500 p-3">Sem itens para este lançamento.</div>

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-600">
            <th className="text-left p-2">Linha</th>
            <th className="text-left p-2">Tipo</th>
            <th className="text-left p-2">Descrição</th>
            <th className="text-right p-2">Qtd</th>
            <th className="text-right p-2">Valor Unit.</th>
            <th className="text-right p-2">Bruto</th>
            <th className="text-right p-2">Desconto</th>
            <th className="text-right p-2">Impostos</th>
            <th className="text-right p-2">Líquido</th>
            <th className="text-left p-2">Categoria</th>
            <th className="text-left p-2">Departamento</th>
            <th className="text-left p-2">Centro Custo</th>
            <th className="text-left p-2">Unidade</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={String(r['conta_pagar_linha_id'] ?? i)} className="border-t border-gray-200">
              <td className="p-2">{String(r['conta_pagar_linha_id'] ?? i + 1)}</td>
              <td className="p-2">{String(r['tipo_linha'] ?? '—')}</td>
              <td className="p-2">{String(r['descricao'] ?? '—')}</td>
              <td className="p-2 text-right">{String(r['quantidade'] ?? '0')}</td>
              <td className="p-2 text-right">{formatBRL(r['valor_unitario'])}</td>
              <td className="p-2 text-right">{formatBRL(r['valor_bruto'])}</td>
              <td className="p-2 text-right">{formatBRL(r['valor_desconto'])}</td>
              <td className="p-2 text-right">{formatBRL(r['valor_impostos'])}</td>
              <td className="p-2 text-right">{formatBRL(r['valor_liquido'])}</td>
              <td className="p-2">{String(r['categoria_despesa'] ?? '')}</td>
              <td className="p-2">{String(r['departamento'] ?? '')}</td>
              <td className="p-2">{String(r['centro_custo'] ?? '')}</td>
              <td className="p-2">{String(r['unidade_negocio'] ?? '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
