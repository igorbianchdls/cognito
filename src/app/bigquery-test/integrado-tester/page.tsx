'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import DataTable, { type TableData } from '@/components/widgets/Table'
import type { ColumnDef } from '@tanstack/react-table'

type Row = TableData

type Categoria = { id: number; nome: string; tipo?: string; conta_contabil_id?: number }

export default function IntegradoTesterPage() {
  const [cats, setCats] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    tenant_id: '1',
    fornecedor_id: '',
    categoria_id: '',
    valor_total: '',
    data_vencimento: '',
    parcelas: '1',
    primeiro_vencimento: '',
    descricao: 'Despesa integrada de teste',
    conta_financeira_id: '',
  })
  const [tables, setTables] = useState<{ despesas?: Row[]; lf?: Row[]; lc?: Row[]; linhas?: Row[] }>({})

  const colsDespesas: ColumnDef<Row>[] = useMemo(() => ([
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'descricao', header: 'Descrição' },
    { accessorKey: 'valor_total', header: 'Valor' },
    { accessorKey: 'data_vencimento', header: 'Vencimento' },
    { accessorKey: 'categoria_id', header: 'Categoria' },
    { accessorKey: 'fornecedor_id', header: 'Fornecedor' },
    { accessorKey: 'criado_em', header: 'Criado em' },
  ]), [])

  const colsLf: ColumnDef<Row>[] = useMemo(() => ([
    { accessorKey: 'id', header: 'ID' },
    { accessorKey: 'tipo', header: 'Tipo' },
    { accessorKey: 'descricao', header: 'Descrição' },
    { accessorKey: 'valor', header: 'Valor' },
    { accessorKey: 'data_vencimento', header: 'Vencimento' },
    { accessorKey: 'categoria_id', header: 'Categoria' },
    { accessorKey: 'entidade_id', header: 'Fornecedor' },
    { accessorKey: 'criado_em', header: 'Criado em' },
  ]), [])

  const colsLc: ColumnDef<Row>[] = useMemo(() => ([
    { accessorKey: 'lancamento_id', header: 'ID' },
    { accessorKey: 'data_lancamento', header: 'Data' },
    { accessorKey: 'historico', header: 'Histórico' },
    { accessorKey: 'total_debitos', header: 'Débitos' },
    { accessorKey: 'total_creditos', header: 'Créditos' },
  ]), [])

  const colsLinhas: ColumnDef<Row>[] = useMemo(() => ([
    { accessorKey: 'linha_id', header: 'Linha' },
    { accessorKey: 'lancamento_id', header: 'Lançamento' },
    { accessorKey: 'conta_codigo', header: 'Conta (código)' },
    { accessorKey: 'conta_nome', header: 'Conta (nome)' },
    { accessorKey: 'debito', header: 'Débito' },
    { accessorKey: 'credito', header: 'Crédito' },
  ]), [])

  const loadCats = async () => {
    try {
      const res = await fetch('/bigquery-test/administrativo/categorias', { cache: 'no-store' })
      const json = await res.json()
      const rows = (json?.rows || []) as Array<Record<string, unknown>>
      setCats(rows.map((r) => ({
        id: Number(r['id']),
        nome: String(r['nome']),
        tipo: r['tipo'] !== undefined && r['tipo'] !== null ? String(r['tipo']) : undefined,
        conta_contabil_id: r['conta_contabil_id'] !== undefined && r['conta_contabil_id'] !== null ? Number(r['conta_contabil_id']) : undefined,
      })))
    } catch {}
  }

  const loadTables = async () => {
    try {
      const [dRes, lfRes, lcRes, lnRes] = await Promise.all([
        fetch('/bigquery-test/administrativo/despesas', { cache: 'no-store' }),
        fetch('/bigquery-test/financeiro/lancamentos', { cache: 'no-store' }),
        fetch('/bigquery-test/contabilidade/lancamentos', { cache: 'no-store' }),
        fetch('/bigquery-test/contabilidade/linhas', { cache: 'no-store' }),
      ])
      const d = await dRes.json(); const lf = await lfRes.json(); const lc = await lcRes.json(); const ln = await lnRes.json()
      setTables({ despesas: d?.rows || [], lf: lf?.rows || [], lc: lc?.rows || [], linhas: ln?.rows || [] })
    } catch {}
  }

  useEffect(() => { loadCats(); loadTables() }, [])

  const criar = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      const assign = (k: keyof typeof form, parseNum = false) => { const v = form[k]; if (v !== '') payload[k] = parseNum ? Number(v) : v }
      assign('tenant_id', true)
      assign('fornecedor_id', true)
      assign('categoria_id', true)
      assign('valor_total', true)
      assign('data_vencimento')
      assign('parcelas', true)
      payload['primeiro_vencimento'] = form.primeiro_vencimento || form.data_vencimento
      assign('descricao')
      assign('conta_financeira_id', true)

      const res = await fetch('/bigquery-test/administrativo/despesas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
      await loadTables()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Tester Integrado</h1>
        <p className="text-sm text-gray-500">Cria Despesa → Conta a Pagar → Contábil e mostra tudo.</p>
      </div>

      <div className="space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Tenant ID</label>
            <Input value={form.tenant_id} onChange={(e) => setForm(prev => ({ ...prev, tenant_id: e.target.value }))} placeholder="ex: 1" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Fornecedor (entidade_id)</label>
            <Input value={form.fornecedor_id} onChange={(e) => setForm(prev => ({ ...prev, fornecedor_id: e.target.value }))} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Categoria</label>
            <select className="h-9 w-full rounded border border-gray-300 px-2 text-sm" value={form.categoria_id} onChange={(e) => setForm(prev => ({ ...prev, categoria_id: e.target.value }))}>
              <option value="">Selecione…</option>
              {cats.map(c => (
                <option key={c.id} value={c.id}>{c.nome}{c.tipo ? ` (${c.tipo})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Valor Total</label>
            <Input value={form.valor_total} onChange={(e) => setForm(prev => ({ ...prev, valor_total: e.target.value }))} placeholder="ex: 1000.00" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Vencimento</label>
            <Input value={form.data_vencimento} onChange={(e) => setForm(prev => ({ ...prev, data_vencimento: e.target.value }))} type="date" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Parcelas</label>
            <Input value={form.parcelas} onChange={(e) => setForm(prev => ({ ...prev, parcelas: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Primeiro Vencimento</label>
            <Input value={form.primeiro_vencimento} onChange={(e) => setForm(prev => ({ ...prev, primeiro_vencimento: e.target.value }))} type="date" />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-gray-600">Descrição</label>
            <Input value={form.descricao} onChange={(e) => setForm(prev => ({ ...prev, descricao: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Conta Financeira ID</label>
            <Input value={form.conta_financeira_id} onChange={(e) => setForm(prev => ({ ...prev, conta_financeira_id: e.target.value }))} placeholder="opcional" />
          </div>
        </div>
        <div>
          <Button onClick={criar} disabled={loading}>{loading ? 'Criando...' : 'Criar Despesa Completa'}</Button>
          <Button variant="outline" className="ml-2" onClick={loadTables}>Recarregar Tabelas</Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Despesas (últimas 10)</h2>
        <DataTable<Row> columns={colsDespesas} data={tables.despesas || []} pageSize={10} />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Lançamentos Financeiros (últimos 10)</h2>
        <DataTable<Row> columns={colsLf} data={tables.lf || []} pageSize={10} />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Lançamentos Contábeis (últimos 10)</h2>
        <DataTable<Row> columns={colsLc} data={tables.lc || []} pageSize={10} />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Linhas Contábeis (últimas 10)</h2>
        <DataTable<Row> columns={colsLinhas} data={tables.linhas || []} pageSize={10} />
      </div>
    </div>
  )
}
