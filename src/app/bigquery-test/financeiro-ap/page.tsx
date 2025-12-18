"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import CadastroContaAPagarSheet from '@/components/modulos/financeiro/CadastroContaAPagarSheet'
import CadastroContaAReceberSheet from '@/components/modulos/financeiro/CadastroContaAReceberSheet'

type Row = Record<string, unknown>

function formatDate(value?: unknown) {
  if (!value) return ''
  try {
    const d = new Date(String(value))
    if (isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString('pt-BR')
  } catch {
    return String(value ?? '')
  }
}

function formatBRL(value?: unknown) {
  const n = Number(value ?? 0)
  if (isNaN(n)) return String(value ?? '')
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function BigQueryTestFinanceiroAP() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [arRows, setArRows] = useState<Row[]>([])
  const [arLoading, setArLoading] = useState(false)
  const [arError, setArError] = useState<string | null>(null)
  const [arReloadKey, setArReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setError(null)
      try {
        const url = `/api/modulos/financeiro?view=contas-a-pagar&page=1&pageSize=50`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
        const list: Row[] = Array.isArray(json.rows) ? json.rows : []
        if (!cancelled) setRows(list)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Falha ao carregar dados')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [reloadKey])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setArLoading(true); setArError(null)
      try {
        const url = `/api/modulos/financeiro?view=contas-a-receber&page=1&pageSize=50`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
        const list: Row[] = Array.isArray(json.rows) ? json.rows : []
        if (!cancelled) setArRows(list)
      } catch (e) {
        if (!cancelled) setArError(e instanceof Error ? e.message : 'Falha ao carregar dados')
      } finally {
        if (!cancelled) setArLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [arReloadKey])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">bigquery-test / Financeiro — Contas a Pagar</h1>
        <div className="flex items-center gap-2">
          <CadastroContaAPagarSheet triggerLabel="Nova Conta a Pagar" onSaved={() => setReloadKey((k) => k + 1)} />
          <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>Recarregar</Button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading && <div className="text-sm text-gray-500">Carregando…</div>}

      {!loading && !error && (
        <div className="overflow-auto border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700">
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Fornecedor</th>
                <th className="text-left p-2">Doc</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Emissão</th>
                <th className="text-left p-2">Lançamento</th>
                <th className="text-left p-2">Vencimento</th>
                <th className="text-right p-2">Líquido</th>
                <th className="text-left p-2">Categoria</th>
                <th className="text-left p-2">Departamento</th>
                <th className="text-left p-2">Centro Custo</th>
                <th className="text-left p-2">Filial</th>
                <th className="text-left p-2">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={String(r['conta_pagar_id'] ?? i)} className="border-t border-gray-200">
                  <td className="p-2">{String(r['conta_pagar_id'] ?? '')}</td>
                  <td className="p-2">{String(r['fornecedor'] ?? '')}</td>
                  <td className="p-2">{String(r['numero_documento'] ?? '')}</td>
                  <td className="p-2">{String(r['status'] ?? '')}</td>
                  <td className="p-2">{formatDate(r['data_documento'])}</td>
                  <td className="p-2">{formatDate(r['data_lancamento'])}</td>
                  <td className="p-2">{formatDate(r['data_vencimento'])}</td>
                  <td className="p-2 text-right">{formatBRL(r['valor_liquido'])}</td>
                  <td className="p-2">{String(r['categoria_despesa'] ?? '')}</td>
                  <td className="p-2">{String(r['departamento'] ?? '')}</td>
                  <td className="p-2">{String(r['centro_custo'] ?? '')}</td>
                  <td className="p-2">{String(r['filial'] ?? '')}</td>
                  <td className="p-2">{String(r['descricao'] ?? '')}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={13} className="p-3 text-sm text-gray-500">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>

      {/* Contas a Receber */}
      <div className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Contas a Receber</h2>
          <div className="flex items-center gap-2">
            <CadastroContaAReceberSheet triggerLabel="Nova Conta a Receber" onSaved={() => setArReloadKey((k) => k + 1)} />
            <Button variant="outline" onClick={() => setArReloadKey((k) => k + 1)} disabled={arLoading}>Recarregar</Button>
          </div>
        </div>

        {arError && <div className="text-sm text-red-600">{arError}</div>}
        {arLoading && <div className="text-sm text-gray-500">Carregando…</div>}

        {!arLoading && !arError && (
          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Doc</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Emissão</th>
                  <th className="text-left p-2">Lançamento</th>
                  <th className="text-left p-2">Vencimento</th>
                  <th className="text-right p-2">Líquido</th>
                  <th className="text-left p-2">Categoria</th>
                  <th className="text-left p-2">Departamento</th>
                  <th className="text-left p-2">Centro Lucro</th>
                  <th className="text-left p-2">Filial</th>
                  <th className="text-left p-2">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {arRows.map((r, i) => (
                  <tr key={String(r['conta_receber_id'] ?? i)} className="border-t border-gray-200">
                    <td className="p-2">{String(r['conta_receber_id'] ?? '')}</td>
                    <td className="p-2">{String(r['cliente'] ?? '')}</td>
                    <td className="p-2">{String(r['numero_documento'] ?? '')}</td>
                    <td className="p-2">{String(r['status'] ?? '')}</td>
                    <td className="p-2">{formatDate(r['data_documento'])}</td>
                    <td className="p-2">{formatDate(r['data_lancamento'])}</td>
                    <td className="p-2">{formatDate(r['data_vencimento'])}</td>
                    <td className="p-2 text-right">{formatBRL(r['valor_liquido'])}</td>
                    <td className="p-2">{String(r['categoria_financeira'] ?? '')}</td>
                    <td className="p-2">{String(r['departamento'] ?? '')}</td>
                    <td className="p-2">{String(r['centro_lucro'] ?? '')}</td>
                    <td className="p-2">{String(r['filial'] ?? '')}</td>
                    <td className="p-2">{String(r['descricao'] ?? '')}</td>
                  </tr>
                ))}
                {!arRows.length && (
                  <tr><td colSpan={13} className="p-3 text-sm text-gray-500">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
  )
}
