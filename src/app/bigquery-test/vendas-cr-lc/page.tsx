'use client'

import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type ApiResult = Record<string, unknown> | null
type DiagResult = Record<string, unknown> | null

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function plusDaysIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function buildTestNumeroPedido(): string {
  return `TEST-PV-${Date.now()}`
}

export default function VendasCrLcPage() {
  const [form, setForm] = useState({
    tenant_id: '1',
    cliente_id: '',
    canal_venda_id: '',
    categoria_receita_id: '',
    numero_pedido: '',
    data_pedido: todayIso(),
    data_documento: todayIso(),
    data_lancamento: todayIso(),
    data_vencimento: plusDaysIso(7),
    valor_total: '',
    descricao: 'Venda de teste CR/LC',
    observacoes: 'Teste automatizado via bigquery-test/vendas-cr-lc',
    status: 'aprovado',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pedidoId, setPedidoId] = useState<number | null>(null)
  const [apiResult, setApiResult] = useState<ApiResult>(null)
  const [diagResult, setDiagResult] = useState<DiagResult>(null)

  const stages = useMemo(() => {
    const raw = (diagResult?.['stages'] || {}) as Record<string, unknown>
    return {
      pedido: Boolean(raw['pedido']),
      conta_receber: Boolean(raw['conta_receber']),
      lancamento_contabil: Boolean(raw['lancamento_contabil']),
      linhas: Boolean(raw['linhas']),
      balance_ok: Boolean(raw['balance_ok']),
      linked_back: raw['linked_back'],
    }
  }, [diagResult])

  async function runDiagnostico(id: number) {
    const res = await fetch(`/bigquery-test/vendas-cr-lc/diagnostico?pedido_id=${id}`, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
    setDiagResult(json as Record<string, unknown>)
  }

  async function handleCriarVenda() {
    setLoading(true)
    setError(null)
    setApiResult(null)
    setDiagResult(null)

    try {
      const fd = new FormData()
      const numeroPedidoFinal = form.numero_pedido.trim() || buildTestNumeroPedido()

      const put = (k: keyof typeof form, required = false) => {
        const value = String(form[k] ?? '').trim()
        if (required && !value) throw new Error(`${k} é obrigatório`)
        if (value) fd.append(k, value)
      }

      put('tenant_id', true)
      put('cliente_id', true)
      put('canal_venda_id', true)
      put('data_pedido', true)
      put('valor_total', true)
      fd.append('numero_pedido', numeroPedidoFinal)
      put('categoria_receita_id')
      put('data_documento')
      put('data_lancamento')
      put('data_vencimento')
      put('descricao')
      put('observacoes')
      put('status')

      const res = await fetch('/api/modulos/vendas/pedidos', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
      setApiResult(json as Record<string, unknown>)

      const id = Number(json.id)
      if (!Number.isFinite(id) || id <= 0) throw new Error('API não retornou pedido_id válido')
      setPedidoId(id)

      await runDiagnostico(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar venda')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevalidar() {
    if (!pedidoId) return
    setLoading(true)
    setError(null)
    try {
      await runDiagnostico(pedidoId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao revalidar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Vendas CR/LC Tester</h1>
        <p className="text-sm text-gray-600">
          Cria um pedido em <code>/api/modulos/vendas/pedidos</code> e valida automaticamente pedido, CR e lançamento contábil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-600">Tenant ID</label>
          <Input value={form.tenant_id} onChange={(e) => setForm((p) => ({ ...p, tenant_id: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Cliente ID</label>
          <Input value={form.cliente_id} onChange={(e) => setForm((p) => ({ ...p, cliente_id: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Canal Venda ID</label>
          <Input value={form.canal_venda_id} onChange={(e) => setForm((p) => ({ ...p, canal_venda_id: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Categoria Receita ID</label>
          <Input value={form.categoria_receita_id} onChange={(e) => setForm((p) => ({ ...p, categoria_receita_id: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Número Pedido (opcional)</label>
          <Input value={form.numero_pedido} onChange={(e) => setForm((p) => ({ ...p, numero_pedido: e.target.value }))} placeholder="deixe vazio para auto TEST-PV-..." />
        </div>
        <div>
          <label className="text-xs text-gray-600">Valor Total</label>
          <Input value={form.valor_total} onChange={(e) => setForm((p) => ({ ...p, valor_total: e.target.value }))} placeholder="ex: 1500.00" />
        </div>
        <div>
          <label className="text-xs text-gray-600">Data Pedido</label>
          <Input type="date" value={form.data_pedido} onChange={(e) => setForm((p) => ({ ...p, data_pedido: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Data Documento</label>
          <Input type="date" value={form.data_documento} onChange={(e) => setForm((p) => ({ ...p, data_documento: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Data Lançamento</label>
          <Input type="date" value={form.data_lancamento} onChange={(e) => setForm((p) => ({ ...p, data_lancamento: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Data Vencimento</label>
          <Input type="date" value={form.data_vencimento} onChange={(e) => setForm((p) => ({ ...p, data_vencimento: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Status</label>
          <Input value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} />
        </div>
        <div className="md:col-span-3">
          <label className="text-xs text-gray-600">Descrição</label>
          <Input value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleCriarVenda} disabled={loading}>
          {loading ? 'Processando...' : 'Criar Venda de Teste'}
        </Button>
        <Button variant="outline" onClick={handleRevalidar} disabled={loading || !pedidoId}>
          Revalidar Diagnóstico
        </Button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
        <div className={`rounded border p-2 ${stages.pedido ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Pedido: {stages.pedido ? 'OK' : 'Pendente'}</div>
        <div className={`rounded border p-2 ${stages.conta_receber ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>CR: {stages.conta_receber ? 'OK' : 'Pendente'}</div>
        <div className={`rounded border p-2 ${stages.lancamento_contabil ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>LC: {stages.lancamento_contabil ? 'OK' : 'Pendente'}</div>
        <div className={`rounded border p-2 ${stages.linhas ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Linhas LC: {stages.linhas ? 'OK' : 'Pendente'}</div>
        <div className={`rounded border p-2 ${stages.balance_ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>Balanceamento: {stages.balance_ok ? 'OK' : 'Falhou'}</div>
        <div className={`rounded border p-2 ${stages.linked_back === true ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Vínculo CR.lancamento_contabil_id: {stages.linked_back === null ? 'N/A' : stages.linked_back ? 'OK' : 'Divergente'}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium mb-1">Resposta criação venda</div>
          <pre className="text-xs bg-slate-900 text-slate-100 rounded p-3 overflow-auto max-h-[340px]">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        </div>
        <div>
          <div className="text-sm font-medium mb-1">Diagnóstico CR/LC</div>
          <pre className="text-xs bg-slate-900 text-slate-100 rounded p-3 overflow-auto max-h-[340px]">
            {JSON.stringify(diagResult, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
