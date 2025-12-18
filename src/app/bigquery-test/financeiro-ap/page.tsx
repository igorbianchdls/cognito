"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import CadastroContaAPagarSheet from '@/components/modulos/financeiro/CadastroContaAPagarSheet'
import CadastroContaAReceberSheet from '@/components/modulos/financeiro/CadastroContaAReceberSheet'
import CadastroPagamentoEfetuadoSheet from '@/components/modulos/financeiro/CadastroPagamentoEfetuadoSheet'
import CadastroPagamentoRecebidoSheet from '@/components/modulos/financeiro/CadastroPagamentoRecebidoSheet'

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

  const [peRows, setPeRows] = useState<Row[]>([])
  const [peLoading, setPeLoading] = useState(false)
  const [peError, setPeError] = useState<string | null>(null)
  const [peReloadKey, setPeReloadKey] = useState(0)

  const [prRows, setPrRows] = useState<Row[]>([])
  const [prLoading, setPrLoading] = useState(false)
  const [prError, setPrError] = useState<string | null>(null)
  const [prReloadKey, setPrReloadKey] = useState(0)

  // Lançamentos Contábeis
  const [lcRows, setLcRows] = useState<Row[]>([])
  const [lcLoading, setLcLoading] = useState(false)
  const [lcError, setLcError] = useState<string | null>(null)
  const [lcReloadKey, setLcReloadKey] = useState(0)
  const [lcExpanded, setLcExpanded] = useState<Record<number, boolean>>({})

  // Expand/collapse and caches per seção
  const [apExpanded, setApExpanded] = useState<Record<number, boolean>>({})
  const [arExpanded, setArExpanded] = useState<Record<number, boolean>>({})
  const [peExpanded, setPeExpanded] = useState<Record<number, boolean>>({})
  const [prExpanded, setPrExpanded] = useState<Record<number, boolean>>({})

  const [apLines, setApLines] = useState<Record<number, Row[]>>({})
  const [arLines, setArLines] = useState<Record<number, Row[]>>({})
  const [peLines, setPeLines] = useState<Record<number, Row[]>>({})
  const [prLines, setPrLines] = useState<Record<number, Row[]>>({})

  async function loadLines(url: string): Promise<Row[]> {
    const res = await fetch(url, { cache: 'no-store' })
    const j = await res.json()
    return res.ok && j?.success && Array.isArray(j.rows) ? (j.rows as Row[]) : []
  }

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

  useEffect(() => {
    let cancelled = false
    async function load() {
      setPeLoading(true); setPeError(null)
      try {
        const url = `/api/modulos/financeiro?view=pagamentos-efetuados&page=1&pageSize=50`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
        const list: Row[] = Array.isArray(json.rows) ? json.rows : []
        if (!cancelled) setPeRows(list)
      } catch (e) {
        if (!cancelled) setPeError(e instanceof Error ? e.message : 'Falha ao carregar dados')
      } finally {
        if (!cancelled) setPeLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [peReloadKey])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setPrLoading(true); setPrError(null)
      try {
        const url = `/api/modulos/financeiro?view=pagamentos-recebidos&page=1&pageSize=50`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
        const list: Row[] = Array.isArray(json.rows) ? json.rows : []
        if (!cancelled) setPrRows(list)
      } catch (e) {
        if (!cancelled) setPrError(e instanceof Error ? e.message : 'Falha ao carregar dados')
      } finally {
        if (!cancelled) setPrLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [prReloadKey])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLcLoading(true); setLcError(null)
      try {
        const url = `/api/modulos/contabilidade?view=lancamentos&page=1&pageSize=50`
        const res = await fetch(url, { cache: 'no-store' })
        const json = await res.json()
        if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
        const list: Row[] = Array.isArray(json.rows) ? json.rows : []
        if (!cancelled) setLcRows(list)
      } catch (e) {
        if (!cancelled) setLcError(e instanceof Error ? e.message : 'Falha ao carregar dados')
      } finally {
        if (!cancelled) setLcLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [lcReloadKey])

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
                <th className="text-left p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <>
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
                  <td className="p-2 space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        const id = Number(r['conta_pagar_id'])
                        if (!Number.isFinite(id)) return
                        const expanded = !apExpanded[id]
                        setApExpanded(prev => ({ ...prev, [id]: expanded }))
                        if (expanded && !apLines[id]) {
                          const lines = await loadLines(`/api/modulos/financeiro/contas-a-pagar/${id}/linhas`)
                          setApLines(prev => ({ ...prev, [id]: lines }))
                        }
                      }}
                    >{apExpanded[Number(r['conta_pagar_id'])] ? 'Ocultar' : 'Ver Linhas'}</Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        const idRaw = r['conta_pagar_id']
                        const id = idRaw ? Number(idRaw) : NaN
                        if (!Number.isFinite(id)) return
                        if (!confirm('Excluir esta conta a pagar?')) return
                        const del = await fetch(`/api/modulos/financeiro/contas-a-pagar/${id}`, { method: 'DELETE' })
                        if (del.ok) setReloadKey(k => k + 1)
                      }}
                    >Excluir</Button>
                  </td>
                </tr>
                {Number.isFinite(Number(r['conta_pagar_id'])) && apExpanded[Number(r['conta_pagar_id'])] && (
                  <tr>
                    <td colSpan={14} className="p-2 bg-gray-50">
                      {Array.isArray(apLines[Number(r['conta_pagar_id'])]) && apLines[Number(r['conta_pagar_id'])]!.length > 0 ? (
                        <div className="overflow-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-600">
                                <th className="p-1 text-left">Linha</th>
                                <th className="p-1 text-left">Tipo</th>
                                <th className="p-1 text-left">Descrição</th>
                                <th className="p-1 text-right">Qtd</th>
                                <th className="p-1 text-right">Unit</th>
                                <th className="p-1 text-right">Bruto</th>
                                <th className="p-1 text-right">Desc</th>
                                <th className="p-1 text-right">Imp</th>
                                <th className="p-1 text-right">Líquido</th>
                                <th className="p-1 text-left">Categoria</th>
                                <th className="p-1 text-left">Departamento</th>
                                <th className="p-1 text-left">Centro Custo</th>
                                <th className="p-1 text-left">Unidade</th>
                              </tr>
                            </thead>
                            <tbody>
                              {apLines[Number(r['conta_pagar_id'])]!.map((ln, j) => (
                                <tr key={String(ln['conta_pagar_linha_id'] ?? j)} className="border-t">
                                  <td className="p-1">{String(ln['conta_pagar_linha_id'] ?? j + 1)}</td>
                                  <td className="p-1">{String(ln['tipo_linha'] ?? '')}</td>
                                  <td className="p-1">{String(ln['descricao'] ?? '')}</td>
                                  <td className="p-1 text-right">{String(ln['quantidade'] ?? '')}</td>
                                  <td className="p-1 text-right">{formatBRL(ln['valor_unitario'])}</td>
                                  <td className="p-1 text-right">{formatBRL(ln['valor_bruto'])}</td>
                                  <td className="p-1 text-right">{formatBRL(ln['valor_desconto'])}</td>
                                  <td className="p-1 text-right">{formatBRL(ln['valor_impostos'])}</td>
                                  <td className="p-1 text-right">{formatBRL(ln['valor_liquido'])}</td>
                                  <td className="p-1">{String(ln['categoria_despesa'] ?? '')}</td>
                                  <td className="p-1">{String(ln['departamento'] ?? '')}</td>
                                  <td className="p-1">{String(ln['centro_custo'] ?? '')}</td>
                                  <td className="p-1">{String(ln['unidade_negocio'] ?? '')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">Sem linhas.</div>
                      )}
                    </td>
                  </tr>
                )}
                </>
              ))}
              {!rows.length && (
                <tr><td colSpan={13} className="p-3 text-sm text-gray-500">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
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
                <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
              {arRows.map((r, i) => (
                <>
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
                    <td className="p-2 space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          const id = Number(r['conta_receber_id'])
                          if (!Number.isFinite(id)) return
                          const expanded = !arExpanded[id]
                          setArExpanded(prev => ({ ...prev, [id]: expanded }))
                          if (expanded && !arLines[id]) {
                            const lines = await loadLines(`/api/modulos/financeiro/contas-a-receber/${id}/linhas`)
                            setArLines(prev => ({ ...prev, [id]: lines }))
                          }
                        }}
                      >{arExpanded[Number(r['conta_receber_id'])] ? 'Ocultar' : 'Ver Linhas'}</Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          const idRaw = r['conta_receber_id']
                          const id = idRaw ? Number(idRaw) : NaN
                          if (!Number.isFinite(id)) return
                          if (!confirm('Excluir esta conta a receber?')) return
                          const del = await fetch(`/api/modulos/financeiro/contas-a-receber/${id}`, { method: 'DELETE' })
                          if (del.ok) setArReloadKey(k => k + 1)
                        }}
                      >Excluir</Button>
                    </td>
                  </tr>
                  {Number.isFinite(Number(r['conta_receber_id'])) && arExpanded[Number(r['conta_receber_id'])] && (
                    <tr>
                      <td colSpan={14} className="p-2 bg-gray-50">
                        {Array.isArray(arLines[Number(r['conta_receber_id'])]) && arLines[Number(r['conta_receber_id'])]!.length > 0 ? (
                          <div className="overflow-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-600">
                                  <th className="p-1 text-left">Linha</th>
                                  <th className="p-1 text-left">Tipo</th>
                                  <th className="p-1 text-left">Descrição</th>
                                  <th className="p-1 text-right">Qtd</th>
                                  <th className="p-1 text-right">Unit</th>
                                  <th className="p-1 text-right">Bruto</th>
                                  <th className="p-1 text-right">Desc</th>
                                  <th className="p-1 text-right">Imp</th>
                                  <th className="p-1 text-right">Líquido</th>
                                  <th className="p-1 text-left">Categoria</th>
                                  <th className="p-1 text-left">Departamento</th>
                                  <th className="p-1 text-left">Centro Custo</th>
                                  <th className="p-1 text-left">Unidade</th>
                                </tr>
                              </thead>
                              <tbody>
                                {arLines[Number(r['conta_receber_id'])]!.map((ln, j) => (
                                  <tr key={String(ln['conta_receber_linha_id'] ?? j)} className="border-t">
                                    <td className="p-1">{String(ln['conta_receber_linha_id'] ?? j + 1)}</td>
                                    <td className="p-1">{String(ln['tipo_linha'] ?? '')}</td>
                                    <td className="p-1">{String(ln['descricao'] ?? '')}</td>
                                    <td className="p-1 text-right">{String(ln['quantidade'] ?? '')}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['valor_unitario'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['valor_bruto'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['valor_desconto'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['valor_impostos'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['valor_liquido'])}</td>
                                    <td className="p-1">{String(ln['categoria_financeira'] ?? '')}</td>
                                    <td className="p-1">{String(ln['departamento'] ?? '')}</td>
                                    <td className="p-1">{String(ln['centro_custo'] ?? '')}</td>
                                    <td className="p-1">{String(ln['unidade_negocio'] ?? '')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Sem linhas.</div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
                {!arRows.length && (
                  <tr><td colSpan={13} className="p-3 text-sm text-gray-500">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagamentos Efetuados */}
      <div className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pagamentos Efetuados</h2>
          <div className="flex items-center gap-2">
            <CadastroPagamentoEfetuadoSheet triggerLabel="Novo Pagamento Efetuado" onSaved={() => setPeReloadKey((k) => k + 1)} />
            <Button variant="outline" onClick={() => setPeReloadKey((k) => k + 1)} disabled={peLoading}>Recarregar</Button>
          </div>
        </div>

        {peError && <div className="text-sm text-red-600">{peError}</div>}
        {peLoading && <div className="text-sm text-gray-500">Carregando…</div>}

        {!peLoading && !peError && (
          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Nº Pagamento</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Pago em</th>
                  <th className="text-left p-2">Lançamento</th>
                  <th className="text-left p-2">Fornecedor</th>
                  <th className="text-left p-2">Conta</th>
                  <th className="text-left p-2">Método</th>
                  <th className="text-right p-2">Valor</th>
                  <th className="text-left p-2">Observação</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {peRows.map((r, i) => (
                  <>
                  <tr key={String(r['pagamento_id'] ?? i)} className="border-t border-gray-200">
                    <td className="p-2">{String(r['pagamento_id'] ?? '')}</td>
                    <td className="p-2">{String(r['numero_pagamento'] ?? '')}</td>
                    <td className="p-2">{String(r['status'] ?? '')}</td>
                    <td className="p-2">{formatDate(r['data_pagamento'])}</td>
                    <td className="p-2">{formatDate(r['data_lancamento'])}</td>
                    <td className="p-2">{String(r['fornecedor'] ?? '')}</td>
                    <td className="p-2">{String(r['conta_financeira'] ?? '')}</td>
                    <td className="p-2">{String(r['metodo_pagamento'] ?? '')}</td>
                    <td className="p-2 text-right">{formatBRL(r['valor_total_pagamento'])}</td>
                    <td className="p-2">{String(r['observacao'] ?? '')}</td>
                    <td className="p-2 space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          const id = Number(r['pagamento_id'])
                          if (!Number.isFinite(id)) return
                          const expanded = !peExpanded[id]
                          setPeExpanded(prev => ({ ...prev, [id]: expanded }))
                          if (expanded && !peLines[id]) {
                            const lines = await loadLines(`/api/modulos/financeiro/pagamentos-efetuados/${id}/linhas`)
                            setPeLines(prev => ({ ...prev, [id]: lines }))
                          }
                        }}
                      >{peExpanded[Number(r['pagamento_id'])] ? 'Ocultar' : 'Ver Linhas'}</Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          const idRaw = r['pagamento_id']
                          const id = idRaw ? Number(idRaw) : NaN
                          if (!Number.isFinite(id)) return
                          if (!confirm('Excluir este pagamento efetuado?')) return
                          const del = await fetch(`/api/modulos/financeiro/pagamentos-efetuados/${id}`, { method: 'DELETE' })
                          if (del.ok) setPeReloadKey(k => k + 1)
                        }}
                      >Excluir</Button>
                    </td>
                  </tr>
                  {Number.isFinite(Number(r['pagamento_id'])) && peExpanded[Number(r['pagamento_id'])] && (
                    <tr>
                      <td colSpan={11} className="p-2 bg-gray-50">
                        {Array.isArray(peLines[Number(r['pagamento_id'])]) && peLines[Number(r['pagamento_id'])]!.length > 0 ? (
                          <div className="overflow-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-600">
                                  <th className="p-1 text-left">Linha</th>
                                  <th className="p-1 text-left">Documento</th>
                                  <th className="p-1 text-left">Fornecedor</th>
                                  <th className="p-1 text-right">Valor Documento</th>
                                  <th className="p-1 text-right">Valor Pago</th>
                                  <th className="p-1 text-right">Saldo Após</th>
                                  <th className="p-1 text-right">Desc</th>
                                  <th className="p-1 text-right">Juros</th>
                                  <th className="p-1 text-right">Multa</th>
                                </tr>
                              </thead>
                              <tbody>
                                {peLines[Number(r['pagamento_id'])]!.map((ln, j) => (
                                  <tr key={String(ln['pagamento_linha_id'] ?? j)} className="border-t">
                                    <td className="p-1">{String(ln['pagamento_linha_id'] ?? j + 1)}</td>
                                    <td className="p-1">{String(ln['documento_origem'] ?? '')}</td>
                                    <td className="p-1">{String(ln['fornecedor'] ?? '')}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['valor_original_documento'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['valor_pago'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['saldo_apos_pagamento'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['desconto_financeiro'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['juros'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['multa'])}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Sem linhas.</div>
                        )}
                      </td>
                    </tr>
                  )}
                  </>
                ))}
                {!peRows.length && (
                  <tr><td colSpan={10} className="p-3 text-sm text-gray-500">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagamentos Recebidos */}
      <div className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pagamentos Recebidos</h2>
          <div className="flex items-center gap-2">
            <CadastroPagamentoRecebidoSheet triggerLabel="Novo Pagamento Recebido" onSaved={() => setPrReloadKey((k) => k + 1)} />
            <Button variant="outline" onClick={() => setPrReloadKey((k) => k + 1)} disabled={prLoading}>Recarregar</Button>
          </div>
        </div>

        {prError && <div className="text-sm text-red-600">{prError}</div>}
        {prLoading && <div className="text-sm text-gray-500">Carregando…</div>}

        {!prLoading && !prError && (
          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Nº Pagamento</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Recebido em</th>
                  <th className="text-left p-2">Lançamento</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Conta</th>
                  <th className="text-left p-2">Método</th>
                  <th className="text-right p-2">Valor</th>
                  <th className="text-left p-2">Observação</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {prRows.map((r, i) => (
                  <>
                  <tr key={String(r['pagamento_recebido_id'] ?? i)} className="border-t border-gray-200">
                    <td className="p-2">{String(r['pagamento_recebido_id'] ?? '')}</td>
                    <td className="p-2">{String(r['numero_pagamento'] ?? '')}</td>
                    <td className="p-2">{String(r['status'] ?? '')}</td>
                    <td className="p-2">{formatDate(r['data_recebimento'])}</td>
                    <td className="p-2">{formatDate(r['data_lancamento'])}</td>
                    <td className="p-2">{String(r['cliente'] ?? '')}</td>
                    <td className="p-2">{String(r['conta_financeira'] ?? '')}</td>
                    <td className="p-2">{String(r['metodo_pagamento'] ?? '')}</td>
                    <td className="p-2 text-right">{formatBRL(r['valor_total_recebido'])}</td>
                    <td className="p-2">{String(r['observacao'] ?? '')}</td>
                    <td className="p-2 space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          const id = Number(r['pagamento_recebido_id'])
                          if (!Number.isFinite(id)) return
                          const expanded = !prExpanded[id]
                          setPrExpanded(prev => ({ ...prev, [id]: expanded }))
                          if (expanded && !prLines[id]) {
                            const lines = await loadLines(`/api/modulos/financeiro/pagamentos-recebidos/${id}/linhas`)
                            setPrLines(prev => ({ ...prev, [id]: lines }))
                          }
                        }}
                      >{prExpanded[Number(r['pagamento_recebido_id'])] ? 'Ocultar' : 'Ver Linhas'}</Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          const idRaw = r['pagamento_recebido_id']
                          const id = idRaw ? Number(idRaw) : NaN
                          if (!Number.isFinite(id)) return
                          if (!confirm('Excluir este pagamento recebido?')) return
                          const del = await fetch(`/api/modulos/financeiro/pagamentos-recebidos/${id}`, { method: 'DELETE' })
                          if (del.ok) setPrReloadKey(k => k + 1)
                        }}
                      >Excluir</Button>
                    </td>
                  </tr>
                  {Number.isFinite(Number(r['pagamento_recebido_id'])) && prExpanded[Number(r['pagamento_recebido_id'])] && (
                    <tr>
                      <td colSpan={11} className="p-2 bg-gray-50">
                        {Array.isArray(prLines[Number(r['pagamento_recebido_id'])]) && prLines[Number(r['pagamento_recebido_id'])]!.length > 0 ? (
                          <div className="overflow-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-gray-600">
                                  <th className="p-1 text-left">Linha</th>
                                  <th className="p-1 text-left">Documento</th>
                                  <th className="p-1 text-left">Cliente</th>
                                  <th className="p-1 text-right">Valor Documento</th>
                                  <th className="p-1 text-right">Valor Recebido</th>
                                  <th className="p-1 text-right">Saldo Após</th>
                                  <th className="p-1 text-right">Desc</th>
                                  <th className="p-1 text-right">Juros</th>
                                  <th className="p-1 text-right">Multa</th>
                                </tr>
                              </thead>
                              <tbody>
                                {prLines[Number(r['pagamento_recebido_id'])]!.map((ln, j) => (
                                  <tr key={String(ln['pagamento_recebido_linha_id'] ?? j)} className="border-t">
                                    <td className="p-1">{String(ln['pagamento_recebido_linha_id'] ?? j + 1)}</td>
                                    <td className="p-1">{String(ln['documento_origem'] ?? '')}</td>
                                    <td className="p-1">{String(ln['cliente'] ?? '')}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['valor_original_documento'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['valor_recebido'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['saldo_apos_recebimento'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['desconto_financeiro'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['juros'])}</td>
                                    <td className="p-1 text-right">{formatBRL(ln['multa'])}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">Sem linhas.</div>
                        )}
                      </td>
                    </tr>
                  )}
                  </>
                ))}
                {!prRows.length && (
                  <tr><td colSpan={10} className="p-3 text-sm text-gray-500">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Lançamentos Contábeis */}
      <div className="pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Lançamentos Contábeis</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setLcReloadKey((k) => k + 1)} disabled={lcLoading}>Recarregar</Button>
          </div>
        </div>

        {lcError && <div className="text-sm text-red-600">{lcError}</div>}
        {lcLoading && <div className="text-sm text-gray-500">Carregando…</div>}

        {!lcLoading && !lcError && (
          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="text-left p-2">Lançamento</th>
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Histórico</th>
                  <th className="text-right p-2">Débitos</th>
                  <th className="text-right p-2">Créditos</th>
                  <th className="text-left p-2">Origem</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const groups = new Map<number, Row[]>()
                  for (const r of lcRows) {
                    const id = Number(r['lancamento_id'])
                    if (!Number.isFinite(id)) continue
                    const cur = groups.get(id) || []
                    cur.push(r)
                    groups.set(id, cur)
                  }
                  const entries = Array.from(groups.entries()).slice(0, 10)
                  return entries.map(([id, list]) => {
                    const h = list[0] || {}
                    return (
                      <>
                        <tr key={`lc-${id}`} className="border-t border-gray-200">
                          <td className="p-2">{String(id)}</td>
                          <td className="p-2">{formatDate(h['data_lancamento'])}</td>
                          <td className="p-2">{String(h['historico'] ?? '')}</td>
                          <td className="p-2 text-right">{formatBRL(h['total_debitos'])}</td>
                          <td className="p-2 text-right">{formatBRL(h['total_creditos'])}</td>
                          <td className="p-2">{String(h['origem_tabela'] ?? '')}{h['origem_id'] ? ` #${String(h['origem_id'])}` : ''}</td>
                          <td className="p-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setLcExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
                            >{lcExpanded[id] ? 'Ocultar' : 'Ver Linhas'}</Button>
                          </td>
                        </tr>
                        {lcExpanded[id] && (
                          <tr>
                            <td colSpan={7} className="p-2 bg-gray-50">
                              {list && list.length > 0 ? (
                                <div className="overflow-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="text-gray-600">
                                        <th className="p-1 text-left">Linha</th>
                                        <th className="p-1 text-left">Conta ID</th>
                                        <th className="p-1 text-right">Débito</th>
                                        <th className="p-1 text-right">Crédito</th>
                                        <th className="p-1 text-left">Histórico Linha</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {list.map((ln, j) => (
                                        <tr key={`lcl-${String(ln['linha_id'] ?? j)}`} className="border-t">
                                          <td className="p-1">{String(ln['linha_id'] ?? j + 1)}</td>
                                          <td className="p-1">{String(ln['conta_id'] ?? '')}</td>
                                          <td className="p-1 text-right">{formatBRL(ln['debito'])}</td>
                                          <td className="p-1 text-right">{formatBRL(ln['credito'])}</td>
                                          <td className="p-1">{String(ln['historico_linha'] ?? '')}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">Sem linhas.</div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })
                })()}
                {!lcRows.length && (
                  <tr><td colSpan={7} className="p-3 text-sm text-gray-500">Nenhum lançamento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
