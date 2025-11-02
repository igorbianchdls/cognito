'use client'

import { useEffect, useMemo, useState } from 'react'
import DataTable, { type TableData } from '@/components/widgets/Table'
import type { ColumnDef } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Row = TableData

export default function FinanceiroTesterPage() {
  const [despesas, setDespesas] = useState<Row[]>([])
  const [compras, setCompras] = useState<Row[]>([])
  const [lancamentos, setLancamentos] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    tenant_id: '',
    fornecedor_id: '',
    categoria_id: '',
    descricao: 'Despesa de teste',
    valor_total: '',
    data_vencimento: '',
    criado_por: '',
    conta_financeira_id: '',
    parcelas: '1',
    primeiro_vencimento: '',
  })

  const load = async () => {
    setError(null)
    try {
      const [dRes, cRes, lRes] = await Promise.all([
        fetch('/bigquery-test/administrativo/despesas', { cache: 'no-store' }),
        fetch('/bigquery-test/administrativo/compras', { cache: 'no-store' }),
        fetch('/bigquery-test/financeiro/lancamentos', { cache: 'no-store' })
      ])
      const d = await dRes.json()
      const c = await cRes.json()
      const l = await lRes.json()
      setDespesas(d?.rows || [])
      setCompras(c?.rows || [])
      setLancamentos(l?.rows || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar dados')
    }
  }

  useEffect(() => { load() }, [])

  const criar = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      const assign = (k: keyof typeof form, parseNum = false) => {
        const v = form[k]
        if (v !== '') payload[k] = parseNum ? Number(v) : v
      }
      assign('tenant_id', true)
      assign('fornecedor_id', true)
      assign('categoria_id', true)
      assign('descricao')
      assign('valor_total', true)
      assign('data_vencimento')
      assign('criado_por', true)
      assign('conta_financeira_id', true)
      assign('parcelas', true)
      payload['primeiro_vencimento'] = form.primeiro_vencimento || form.data_vencimento

      const res = await fetch('/bigquery-test/administrativo/despesas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar')
    } finally {
      setLoading(false)
    }
  }

  const [formCompra, setFormCompra] = useState({
    tenant_id: '',
    fornecedor_id: '',
    categoria_id: '',
    valor_total: '',
    data_pedido: '',
    data_prevista_entrega: '',
    observacao: 'Compra de teste',
    criado_por: '',
    conta_financeira_id: '',
    parcelas: '1',
    primeiro_vencimento: '',
    data_vencimento: '',
  })

  const onChangeCompra = (k: keyof typeof formCompra, v: string) => setFormCompra(prev => ({ ...prev, [k]: v }))

  const criarCompra = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      const assign = (k: keyof typeof formCompra, parseNum = false) => {
        const v = formCompra[k]
        if (v !== '') payload[k] = parseNum ? Number(v) : v
      }
      assign('tenant_id', true)
      assign('fornecedor_id', true)
      assign('categoria_id', true)
      assign('valor_total', true)
      assign('data_pedido')
      assign('data_prevista_entrega')
      assign('observacao')
      assign('criado_por', true)
      assign('conta_financeira_id', true)
      assign('parcelas', true)
      payload['primeiro_vencimento'] = formCompra.primeiro_vencimento || formCompra.data_vencimento || formCompra.data_prevista_entrega || formCompra.data_pedido
      if (formCompra.data_vencimento) payload['data_vencimento'] = formCompra.data_vencimento

      const res = await fetch('/bigquery-test/administrativo/compras', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar')
    } finally {
      setLoading(false)
    }
  }

  const colsDespesas: ColumnDef<Row>[] = useMemo(() => ([
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'descricao', header: 'Descrição' },
    { accessorKey: 'valor_total', header: 'Valor' },
    { accessorKey: 'data_vencimento', header: 'Vencimento' },
    { accessorKey: 'criado_em', header: 'Criado em' },
  ]), [])

  const colsLanc: ColumnDef<Row>[] = useMemo(() => ([
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'tipo', header: 'Tipo' },
    { accessorKey: 'descricao', header: 'Descrição' },
    { accessorKey: 'valor', header: 'Valor' },
    { accessorKey: 'data_vencimento', header: 'Vencimento' },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'despesa_id', header: 'Despesa ID' },
    { accessorKey: 'criado_em', header: 'Criado em' },
  ]), [])

  const onChange = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Financeiro Tester</h1>
        <p className="text-sm text-gray-500">Crie uma despesa e veja o lançamento &quot;conta a pagar&quot; criado automaticamente.</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-medium">Criar Despesa de Teste</h2>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Tenant ID</label>
            <Input value={form.tenant_id} onChange={(e) => onChange('tenant_id', e.target.value)} placeholder="ex: 1" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Fornecedor ID</label>
            <Input value={form.fornecedor_id} onChange={(e) => onChange('fornecedor_id', e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Categoria ID</label>
            <Input value={form.categoria_id} onChange={(e) => onChange('categoria_id', e.target.value)} placeholder="opcional" />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-gray-600">Descrição</label>
            <Input value={form.descricao} onChange={(e) => onChange('descricao', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Valor Total</label>
            <Input value={form.valor_total} onChange={(e) => onChange('valor_total', e.target.value)} placeholder="ex: 1000.00" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Vencimento</label>
            <Input value={form.data_vencimento} onChange={(e) => onChange('data_vencimento', e.target.value)} type="date" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Criado por</label>
            <Input value={form.criado_por} onChange={(e) => onChange('criado_por', e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Conta Financeira ID</label>
            <Input value={form.conta_financeira_id} onChange={(e) => onChange('conta_financeira_id', e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Parcelas</label>
            <Input value={form.parcelas} onChange={(e) => onChange('parcelas', e.target.value)} placeholder="1" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Primeiro Vencimento</label>
            <Input value={form.primeiro_vencimento} onChange={(e) => onChange('primeiro_vencimento', e.target.value)} type="date" placeholder="opcional" />
          </div>
        </div>
        <div>
          <Button onClick={criar} disabled={loading}>{loading ? 'Criando...' : 'Criar Despesa + Conta a Pagar'}</Button>
          <Button variant="outline" className="ml-2" onClick={load}>Recarregar Listas</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-medium">Criar Compra de Teste</h2>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Tenant ID</label>
            <Input value={formCompra.tenant_id} onChange={(e) => onChangeCompra('tenant_id', e.target.value)} placeholder="ex: 1" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Fornecedor ID</label>
            <Input value={formCompra.fornecedor_id} onChange={(e) => onChangeCompra('fornecedor_id', e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Categoria ID</label>
            <Input value={formCompra.categoria_id} onChange={(e) => onChangeCompra('categoria_id', e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Valor Total</label>
            <Input value={formCompra.valor_total} onChange={(e) => onChangeCompra('valor_total', e.target.value)} placeholder="ex: 1000.00" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Pedido</label>
            <Input value={formCompra.data_pedido} onChange={(e) => onChangeCompra('data_pedido', e.target.value)} type="date" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Prevista Entrega</label>
            <Input value={formCompra.data_prevista_entrega} onChange={(e) => onChangeCompra('data_prevista_entrega', e.target.value)} type="date" placeholder="opcional" />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-gray-600">Observação</label>
            <Input value={formCompra.observacao} onChange={(e) => onChangeCompra('observacao', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Criado por</label>
            <Input value={formCompra.criado_por} onChange={(e) => onChangeCompra('criado_por', e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Conta Financeira ID</label>
            <Input value={formCompra.conta_financeira_id} onChange={(e) => onChangeCompra('conta_financeira_id', e.target.value)} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Parcelas</label>
            <Input value={formCompra.parcelas} onChange={(e) => onChangeCompra('parcelas', e.target.value)} placeholder="1" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Primeiro Vencimento</label>
            <Input value={formCompra.primeiro_vencimento} onChange={(e) => onChangeCompra('primeiro_vencimento', e.target.value)} type="date" placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Vencimento (se única)</label>
            <Input value={formCompra.data_vencimento} onChange={(e) => onChangeCompra('data_vencimento', e.target.value)} type="date" placeholder="opcional" />
          </div>
        </div>
        <div>
          <Button onClick={criarCompra} disabled={loading}>{loading ? 'Criando...' : 'Criar Compra + Conta a Pagar'}</Button>
          <Button variant="outline" className="ml-2" onClick={load}>Recarregar Listas</Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Despesas (últimas 50)</h2>
        <DataTable<Row> columns={colsDespesas} data={despesas} pageSize={10} />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Compras (últimas 50)</h2>
        <DataTable<Row> columns={useMemo(() => ([
          { accessorKey: 'id', header: 'ID' },
          { accessorKey: 'fornecedor_id', header: 'Fornecedor ID' },
          { accessorKey: 'categoria_id', header: 'Categoria ID' },
          { accessorKey: 'valor_total', header: 'Valor' },
          { accessorKey: 'data_pedido', header: 'Pedido' },
          { accessorKey: 'data_prevista_entrega', header: 'Prevista Entrega' },
          { accessorKey: 'status', header: 'Status' },
          { accessorKey: 'criado_em', header: 'Criado em' },
        ]), [])} data={compras} pageSize={10} />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Lançamentos Financeiros (últimos 50)</h2>
        <DataTable<Row> columns={colsLanc} data={lancamentos} pageSize={10} />
      </div>
    </div>
  )
}
