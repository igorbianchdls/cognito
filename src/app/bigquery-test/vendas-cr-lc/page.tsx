'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type ApiResult = Record<string, unknown> | null
type DiagResult = Record<string, unknown> | null
type OptionRow = { id: number; nome: string }

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

function buildTestNumeroOc(): string {
  return `TEST-OC-${Date.now()}`
}

export default function VendasCrLcPage() {
  const [vendaForm, setVendaForm] = useState({
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

  const [compraForm, setCompraForm] = useState({
    tenant_id: '1',
    fornecedor_id: '',
    categoria_despesa_id: '',
    numero_oc: '',
    data_pedido: todayIso(),
    data_documento: todayIso(),
    data_lancamento: todayIso(),
    data_vencimento: plusDaysIso(7),
    valor_total: '',
    observacoes: 'Teste automatizado via bigquery-test/vendas-cr-lc (compra)',
    status: 'aprovado',
  })

  const [loadingVenda, setLoadingVenda] = useState(false)
  const [loadingCompra, setLoadingCompra] = useState(false)
  const [errorVenda, setErrorVenda] = useState<string | null>(null)
  const [errorCompra, setErrorCompra] = useState<string | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [fornecedores, setFornecedores] = useState<OptionRow[]>([])
  const [categoriasDespesa, setCategoriasDespesa] = useState<OptionRow[]>([])

  const [pedidoId, setPedidoId] = useState<number | null>(null)
  const [compraId, setCompraId] = useState<number | null>(null)
  const [apiResultVenda, setApiResultVenda] = useState<ApiResult>(null)
  const [diagResultVenda, setDiagResultVenda] = useState<DiagResult>(null)
  const [apiResultCompra, setApiResultCompra] = useState<ApiResult>(null)
  const [diagResultCompra, setDiagResultCompra] = useState<DiagResult>(null)

  useEffect(() => {
    let cancelled = false

    const parseRows = (rows: unknown): OptionRow[] => {
      if (!Array.isArray(rows)) return []
      return rows
        .map((r) => {
          const row = (r || {}) as Record<string, unknown>
          const id = Number(row.id)
          const nome = String(row.nome || '').trim()
          if (!Number.isFinite(id) || id <= 0 || !nome) return null
          return { id, nome }
        })
        .filter((v): v is OptionRow => Boolean(v))
    }

    async function loadOptions() {
      setOptionsLoading(true)
      setOptionsError(null)
      try {
        const [fornRes, catRes] = await Promise.all([
          fetch('/api/modulos/financeiro/fornecedores/list', { cache: 'no-store' }),
          fetch('/api/modulos/financeiro/categorias-despesa/list', { cache: 'no-store' }),
        ])
        const fornJson = await fornRes.json()
        const catJson = await catRes.json()

        if (!fornRes.ok || !fornJson?.success) throw new Error(fornJson?.message || 'Falha ao listar fornecedores')
        if (!catRes.ok || !catJson?.success) throw new Error(catJson?.message || 'Falha ao listar categorias de despesa')

        if (!cancelled) {
          setFornecedores(parseRows(fornJson.rows))
          setCategoriasDespesa(parseRows(catJson.rows))
        }
      } catch (e) {
        if (!cancelled) {
          setOptionsError(e instanceof Error ? e.message : 'Falha ao carregar dropdowns')
        }
      } finally {
        if (!cancelled) setOptionsLoading(false)
      }
    }

    loadOptions()
    return () => {
      cancelled = true
    }
  }, [])

  const vendaStages = useMemo(() => {
    const raw = (diagResultVenda?.['stages'] || {}) as Record<string, unknown>
    return {
      pedido: Boolean(raw['pedido']),
      conta_receber: Boolean(raw['conta_receber']),
      lancamento_contabil: Boolean(raw['lancamento_contabil']),
      linhas: Boolean(raw['linhas']),
      balance_ok: Boolean(raw['balance_ok']),
      linked_back: raw['linked_back'],
    }
  }, [diagResultVenda])

  const compraStages = useMemo(() => {
    const raw = (diagResultCompra?.['stages'] || {}) as Record<string, unknown>
    return {
      compra: Boolean(raw['compra']),
      conta_pagar: Boolean(raw['conta_pagar']),
      lancamento_contabil: Boolean(raw['lancamento_contabil']),
      linhas: Boolean(raw['linhas']),
      balance_ok: Boolean(raw['balance_ok']),
      linked_back: raw['linked_back'],
    }
  }, [diagResultCompra])

  async function runDiagnosticoVenda(id: number) {
    const res = await fetch(`/bigquery-test/vendas-cr-lc/diagnostico?pedido_id=${id}`, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
    setDiagResultVenda(json as Record<string, unknown>)
  }

  async function runDiagnosticoCompra(id: number) {
    const res = await fetch(`/bigquery-test/vendas-cr-lc/diagnostico-compra?compra_id=${id}`, { cache: 'no-store' })
    const json = await res.json()
    if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
    setDiagResultCompra(json as Record<string, unknown>)
  }

  async function handleCriarVenda() {
    setLoadingVenda(true)
    setErrorVenda(null)
    setApiResultVenda(null)
    setDiagResultVenda(null)

    try {
      const fd = new FormData()
      const numeroPedidoFinal = vendaForm.numero_pedido.trim() || buildTestNumeroPedido()

      const put = (k: keyof typeof vendaForm, required = false) => {
        const value = String(vendaForm[k] ?? '').trim()
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
      setApiResultVenda(json as Record<string, unknown>)

      const id = Number(json.id)
      if (!Number.isFinite(id) || id <= 0) throw new Error('API não retornou pedido_id válido')
      setPedidoId(id)

      await runDiagnosticoVenda(id)
    } catch (e) {
      setErrorVenda(e instanceof Error ? e.message : 'Falha ao criar venda')
    } finally {
      setLoadingVenda(false)
    }
  }

  async function handleRevalidarVenda() {
    if (!pedidoId) return
    setLoadingVenda(true)
    setErrorVenda(null)
    try {
      await runDiagnosticoVenda(pedidoId)
    } catch (e) {
      setErrorVenda(e instanceof Error ? e.message : 'Falha ao revalidar')
    } finally {
      setLoadingVenda(false)
    }
  }

  async function handleCriarCompra() {
    setLoadingCompra(true)
    setErrorCompra(null)
    setApiResultCompra(null)
    setDiagResultCompra(null)

    try {
      const fornecedor = String(compraForm.fornecedor_id || '').trim()
      if (!fornecedor) throw new Error('fornecedor_id é obrigatório')
      const tenant = String(compraForm.tenant_id || '').trim() || '1'
      const numeroOcFinal = compraForm.numero_oc.trim() || buildTestNumeroOc()
      const categoria = String(compraForm.categoria_despesa_id || '').trim()

      const payload: Record<string, unknown> = {
        tenant_id: tenant,
        fornecedor_id: fornecedor,
        categoria_despesa_id: categoria || null,
        numero_oc: numeroOcFinal,
        data_pedido: compraForm.data_pedido,
        data_documento: compraForm.data_documento,
        data_lancamento: compraForm.data_lancamento,
        data_vencimento: compraForm.data_vencimento,
        valor_total: compraForm.valor_total,
        observacoes: compraForm.observacoes,
        status: compraForm.status,
      }

      const res = await fetch('/api/modulos/compras', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
      setApiResultCompra(json as Record<string, unknown>)

      const id = Number(json.id)
      if (!Number.isFinite(id) || id <= 0) throw new Error('API não retornou compra_id válido')
      setCompraId(id)

      await runDiagnosticoCompra(id)
    } catch (e) {
      setErrorCompra(e instanceof Error ? e.message : 'Falha ao criar compra')
    } finally {
      setLoadingCompra(false)
    }
  }

  async function handleRevalidarCompra() {
    if (!compraId) return
    setLoadingCompra(true)
    setErrorCompra(null)
    try {
      await runDiagnosticoCompra(compraId)
    } catch (e) {
      setErrorCompra(e instanceof Error ? e.message : 'Falha ao revalidar compra')
    } finally {
      setLoadingCompra(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Vendas e Compras CR/CP/LC Tester</h1>
        <p className="text-sm text-gray-600">
          Bloco 1 cria pedido e valida CR/LC. Bloco 2 cria compra e valida CP/LC.
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Teste de Venda (Pedido -&gt; CR -&gt; LC)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Tenant ID</label>
            <Input value={vendaForm.tenant_id} onChange={(e) => setVendaForm((p) => ({ ...p, tenant_id: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Cliente ID</label>
            <Input value={vendaForm.cliente_id} onChange={(e) => setVendaForm((p) => ({ ...p, cliente_id: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Canal Venda ID</label>
            <Input value={vendaForm.canal_venda_id} onChange={(e) => setVendaForm((p) => ({ ...p, canal_venda_id: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Categoria Receita ID</label>
            <Input value={vendaForm.categoria_receita_id} onChange={(e) => setVendaForm((p) => ({ ...p, categoria_receita_id: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Número Pedido (opcional)</label>
            <Input value={vendaForm.numero_pedido} onChange={(e) => setVendaForm((p) => ({ ...p, numero_pedido: e.target.value }))} placeholder="deixe vazio para auto TEST-PV-..." />
          </div>
          <div>
            <label className="text-xs text-gray-600">Valor Total</label>
            <Input value={vendaForm.valor_total} onChange={(e) => setVendaForm((p) => ({ ...p, valor_total: e.target.value }))} placeholder="ex: 1500.00" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Pedido</label>
            <Input type="date" value={vendaForm.data_pedido} onChange={(e) => setVendaForm((p) => ({ ...p, data_pedido: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Documento</label>
            <Input type="date" value={vendaForm.data_documento} onChange={(e) => setVendaForm((p) => ({ ...p, data_documento: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Lancamento</label>
            <Input type="date" value={vendaForm.data_lancamento} onChange={(e) => setVendaForm((p) => ({ ...p, data_lancamento: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Vencimento</label>
            <Input type="date" value={vendaForm.data_vencimento} onChange={(e) => setVendaForm((p) => ({ ...p, data_vencimento: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Status</label>
            <Input value={vendaForm.status} onChange={(e) => setVendaForm((p) => ({ ...p, status: e.target.value }))} />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-gray-600">Descricao</label>
            <Input value={vendaForm.descricao} onChange={(e) => setVendaForm((p) => ({ ...p, descricao: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleCriarVenda} disabled={loadingVenda}>
            {loadingVenda ? 'Processando...' : 'Criar Venda de Teste'}
          </Button>
          <Button variant="outline" onClick={handleRevalidarVenda} disabled={loadingVenda || !pedidoId}>
            Revalidar Diagnostico
          </Button>
        </div>

        {errorVenda && <div className="text-sm text-red-600">{errorVenda}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className={`rounded border p-2 ${vendaStages.pedido ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Pedido: {vendaStages.pedido ? 'OK' : 'Pendente'}</div>
          <div className={`rounded border p-2 ${vendaStages.conta_receber ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>CR: {vendaStages.conta_receber ? 'OK' : 'Pendente'}</div>
          <div className={`rounded border p-2 ${vendaStages.lancamento_contabil ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>LC: {vendaStages.lancamento_contabil ? 'OK' : 'Pendente'}</div>
          <div className={`rounded border p-2 ${vendaStages.linhas ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Linhas LC: {vendaStages.linhas ? 'OK' : 'Pendente'}</div>
          <div className={`rounded border p-2 ${vendaStages.balance_ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>Balanceamento: {vendaStages.balance_ok ? 'OK' : 'Falhou'}</div>
          <div className={`rounded border p-2 ${vendaStages.linked_back === true ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Vinculo CR.lancamento_contabil_id: {vendaStages.linked_back === null ? 'N/A' : vendaStages.linked_back ? 'OK' : 'Divergente'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-1">Resposta criacao venda</div>
            <pre className="text-xs bg-slate-900 text-slate-100 rounded p-3 overflow-auto max-h-[340px]">
              {JSON.stringify(apiResultVenda, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Diagnostico CR/LC</div>
            <pre className="text-xs bg-slate-900 text-slate-100 rounded p-3 overflow-auto max-h-[340px]">
              {JSON.stringify(diagResultVenda, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold">Teste de Compra (Compra -&gt; CP -&gt; LC)</h2>
          <p className="text-xs text-gray-600">
            Fornecedor e categoria de despesa sao carregados dos cadastros existentes.
          </p>
        </div>
        {optionsLoading && <div className="text-xs text-gray-500">Carregando dropdowns...</div>}
        {optionsError && <div className="text-xs text-red-600">{optionsError}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Tenant ID</label>
            <Input value={compraForm.tenant_id} onChange={(e) => setCompraForm((p) => ({ ...p, tenant_id: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Fornecedor</label>
            <select
              value={compraForm.fornecedor_id}
              onChange={(e) => setCompraForm((p) => ({ ...p, fornecedor_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Selecione...</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.nome} ({f.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Categoria Despesa</label>
            <select
              value={compraForm.categoria_despesa_id}
              onChange={(e) => setCompraForm((p) => ({ ...p, categoria_despesa_id: e.target.value }))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">Sem categoria</option>
              {categoriasDespesa.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nome} ({c.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Numero OC (opcional)</label>
            <Input value={compraForm.numero_oc} onChange={(e) => setCompraForm((p) => ({ ...p, numero_oc: e.target.value }))} placeholder="deixe vazio para auto TEST-OC-..." />
          </div>
          <div>
            <label className="text-xs text-gray-600">Valor Total</label>
            <Input value={compraForm.valor_total} onChange={(e) => setCompraForm((p) => ({ ...p, valor_total: e.target.value }))} placeholder="ex: 1500.00" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Status</label>
            <Input value={compraForm.status} onChange={(e) => setCompraForm((p) => ({ ...p, status: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Pedido</label>
            <Input type="date" value={compraForm.data_pedido} onChange={(e) => setCompraForm((p) => ({ ...p, data_pedido: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Documento</label>
            <Input type="date" value={compraForm.data_documento} onChange={(e) => setCompraForm((p) => ({ ...p, data_documento: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Lancamento</label>
            <Input type="date" value={compraForm.data_lancamento} onChange={(e) => setCompraForm((p) => ({ ...p, data_lancamento: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Vencimento</label>
            <Input type="date" value={compraForm.data_vencimento} onChange={(e) => setCompraForm((p) => ({ ...p, data_vencimento: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Observacoes</label>
            <Input value={compraForm.observacoes} onChange={(e) => setCompraForm((p) => ({ ...p, observacoes: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleCriarCompra} disabled={loadingCompra}>
            {loadingCompra ? 'Processando...' : 'Criar Compra de Teste'}
          </Button>
          <Button variant="outline" onClick={handleRevalidarCompra} disabled={loadingCompra || !compraId}>
            Revalidar Diagnostico
          </Button>
        </div>

        {errorCompra && <div className="text-sm text-red-600">{errorCompra}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className={`rounded border p-2 ${compraStages.compra ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Compra: {compraStages.compra ? 'OK' : 'Pendente'}</div>
          <div className={`rounded border p-2 ${compraStages.conta_pagar ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>CP: {compraStages.conta_pagar ? 'OK' : 'Pendente'}</div>
          <div className={`rounded border p-2 ${compraStages.lancamento_contabil ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>LC: {compraStages.lancamento_contabil ? 'OK' : 'Pendente'}</div>
          <div className={`rounded border p-2 ${compraStages.linhas ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Linhas LC: {compraStages.linhas ? 'OK' : 'Pendente'}</div>
          <div className={`rounded border p-2 ${compraStages.balance_ok ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>Balanceamento: {compraStages.balance_ok ? 'OK' : 'Falhou'}</div>
          <div className={`rounded border p-2 ${compraStages.linked_back === true ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>Vinculo CP.lancamento_contabil_id: {compraStages.linked_back === null ? 'N/A' : compraStages.linked_back ? 'OK' : 'Divergente'}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-1">Resposta criacao compra</div>
            <pre className="text-xs bg-slate-900 text-slate-100 rounded p-3 overflow-auto max-h-[340px]">
              {JSON.stringify(apiResultCompra, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Diagnostico CP/LC</div>
            <pre className="text-xs bg-slate-900 text-slate-100 rounded p-3 overflow-auto max-h-[340px]">
              {JSON.stringify(diagResultCompra, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
