'use client'

import { useEffect, useState } from 'react'
import { formatBRL } from '@/products/erp/frontend/features/financeiro/utils/formatting'

const cache = new Map<number, Array<Record<string, unknown>>>()

export default function LinhasPagamentoRecebido({ pagamentoId }: { pagamentoId: number }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        if (!pagamentoId || !Number.isFinite(pagamentoId)) throw new Error('ID de pagamento inválido')
        if (cache.has(pagamentoId)) { setRows(cache.get(pagamentoId) || []); return }
        const res = await fetch(`/api/modulos/financeiro/pagamentos-recebidos/${pagamentoId}/linhas`, { cache: 'no-store' })
        const j = await res.json()
        if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
        const list: Array<Record<string, unknown>> = Array.isArray(j.rows) ? j.rows : []
        if (!cancelled) { setRows(list); cache.set(pagamentoId, list) }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar linhas')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [pagamentoId])

  if (loading) return <div className="text-xs text-gray-500 p-3">Carregando linhas…</div>
  if (error) return <div className="text-xs text-red-600 p-3">{error}</div>
  if (!rows.length) return <div className="text-xs text-gray-500 p-3">Sem linhas para este pagamento.</div>

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-600">
            <th className="text-left p-2">Linha</th>
            <th className="text-left p-2">Documento</th>
            <th className="text-left p-2">Cliente</th>
            <th className="text-right p-2">Valor Original</th>
            <th className="text-right p-2">Valor Recebido</th>
            <th className="text-right p-2">Saldo Após Rec.</th>
            <th className="text-right p-2">Desc. Fin.</th>
            <th className="text-right p-2">Juros</th>
            <th className="text-right p-2">Multa</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={String(r['pagamento_recebido_linha_id'] ?? i)} className="border-t border-gray-200">
              <td className="p-2">{String(r['pagamento_recebido_linha_id'] ?? i + 1)}</td>
              <td className="p-2">{String(r['documento_origem'] ?? '')}</td>
              <td className="p-2">{String(r['cliente'] ?? '')}</td>
              <td className="p-2 text-right">{formatBRL(r['valor_original_documento'])}</td>
              <td className="p-2 text-right">{formatBRL(r['valor_recebido'])}</td>
              <td className="p-2 text-right">{formatBRL(r['saldo_apos_recebimento'])}</td>
              <td className="p-2 text-right">{formatBRL(r['desconto_financeiro'])}</td>
              <td className="p-2 text-right">{formatBRL(r['juros'])}</td>
              <td className="p-2 text-right">{formatBRL(r['multa'])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
