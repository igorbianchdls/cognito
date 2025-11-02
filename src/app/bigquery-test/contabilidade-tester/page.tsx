
'use client'

import { useMemo, useState } from 'react'
import type React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import DataTable, { type TableData } from '@/components/widgets/Table'
import type { ColumnDef } from '@tanstack/react-table'

type Row = TableData
type Origem = 'conta_a_pagar' | 'pagamento_efetuado' | 'conta_a_receber' | 'pagamento_recebido'

export default function ContabilidadeTesterPage() {
  const [tenantId, setTenantId] = useState('1')
  const [categoriaId, setCategoriaId] = useState('')
  const [origem, setOrigem] = useState<Origem>('conta_a_pagar')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ regra?: Record<string, unknown>; rows?: Row[] } | null>(null)
  const [genLfId, setGenLfId] = useState('')
  const [genResult, setGenResult] = useState<{ lcId?: number; linhas?: Row[]; error?: string } | null>(null)
  const [cpForm, setCpForm] = useState({
    tenant_id: '1',
    categoria_id: '',
    entidade_id: '',
    valor: '',
    data_lancamento: '',
    data_vencimento: '',
    descricao: 'Conta a pagar de teste',
    conta_financeira_id: '',
  })
  const [tables, setTables] = useState<{ lf?: Row[]; lc?: Row[]; linhas?: Row[] }>({})

  const columns: ColumnDef<Row>[] = useMemo(() => ([
    { accessorKey: 'tipo', header: 'Tipo' },
    { accessorKey: 'conta_id', header: 'Conta ID' },
    { accessorKey: 'codigo', header: 'Código' },
    { accessorKey: 'nome', header: 'Nome' },
  ]), [])

  const consultar = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      if (!tenantId || !categoriaId) {
        throw new Error('Informe tenant e categoria')
      }
      const res = await fetch('/bigquery-test/contabilidade/regra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: Number(tenantId), categoria_id: Number(categoriaId), origem })
      })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
      const regra = json.regra as Record<string, unknown>
      const rows: Row[] = [
        {
          tipo: 'Débito',
          conta_id: regra['conta_debito_id'] !== undefined ? Number(regra['conta_debito_id']) : null,
          codigo: regra['debito_codigo'] !== undefined ? String(regra['debito_codigo']) : '',
          nome: regra['debito_nome'] !== undefined ? String(regra['debito_nome']) : '',
        },
        {
          tipo: 'Crédito',
          conta_id: regra['conta_credito_id'] !== undefined ? Number(regra['conta_credito_id']) : null,
          codigo: regra['credito_codigo'] !== undefined ? String(regra['credito_codigo']) : '',
          nome: regra['credito_nome'] !== undefined ? String(regra['credito_nome']) : '',
        },
      ]
      setResult({ regra, rows })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na consulta')
    } finally {
      setLoading(false)
    }
  }

  const genColumns: ColumnDef<Row>[] = useMemo(() => ([
    { accessorKey: 'id', header: 'Linha' },
    { accessorKey: 'conta_id', header: 'Conta' },
    { accessorKey: 'debito', header: 'Débito' },
    { accessorKey: 'credito', header: 'Crédito' },
    { accessorKey: 'historico', header: 'Histórico' },
  ]), [])

  const gerarFromFinanceiro = async () => {
    setLoading(true)
    setError(null)
    setGenResult(null)
    try {
      if (!genLfId) throw new Error('Informe o ID do lançamento financeiro (conta_a_pagar)')
      const res = await fetch('/bigquery-test/contabilidade/lancamentos/from-financeiro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lancamento_financeiro_id: Number(genLfId) })
      })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
      const linhas = (json.linhas || []) as Row[]
      setGenResult({ lcId: json.lancamento_contabil_id as number, linhas })
    } catch (e) {
      setGenResult({ error: e instanceof Error ? e.message : 'Falha na geração' })
    } finally {
      setLoading(false)
    }
  }

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
    { accessorKey: 'tipo', header: 'Tipo' },
    { accessorKey: 'conta_codigo', header: 'Conta (código)' },
    { accessorKey: 'conta_nome', header: 'Conta (nome)' },
    { accessorKey: 'valor', header: 'Valor' },
  ]), [])

  const loadTables = async () => {
    try {
      const [lfRes, lcRes, lnRes] = await Promise.all([
        fetch('/bigquery-test/financeiro/lancamentos', { cache: 'no-store' }),
        fetch('/bigquery-test/contabilidade/lancamentos', { cache: 'no-store' }),
        fetch('/bigquery-test/contabilidade/linhas', { cache: 'no-store' }),
      ])
      const lf = await lfRes.json()
      const lc = await lcRes.json()
      const ln = await lnRes.json()
      setTables({ lf: lf?.rows || [], lc: lc?.rows || [], linhas: ln?.rows || [] })
    } catch {}
  }

  const criarContaPagarEContabil = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload: Record<string, unknown> = {}
      const assign = (k: keyof typeof cpForm, parseNum = false) => {
        const v = cpForm[k]
        if (v !== '') payload[k] = parseNum ? Number(v) : v
      }
      assign('tenant_id', true)
      assign('categoria_id', true)
      assign('entidade_id', true)
      assign('valor', true)
      assign('data_lancamento')
      assign('data_vencimento')
      assign('descricao')
      assign('conta_financeira_id', true)

      const res = await fetch('/bigquery-test/financeiro/contas-a-pagar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || `HTTP ${res.status}`)
      await loadTables()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao criar conta a pagar + contábil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Tester Contábil</h1>
        <p className="text-sm text-gray-500">Resolva contas de débito e crédito a partir de uma categoria e origem.</p>
      </div>

      <div className="space-y-4">
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Tenant ID</label>
            <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="ex: 1" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Categoria ID</label>
            <Input value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} placeholder="ex: 12" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Origem</label>
            <select
              className="h-9 w-full rounded border border-gray-300 px-2 text-sm"
              value={origem}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOrigem(e.target.value as Origem)}
            >
              <option value="conta_a_pagar">conta_a_pagar</option>
              <option value="pagamento_efetuado">pagamento_efetuado</option>
              <option value="conta_a_receber">conta_a_receber</option>
              <option value="pagamento_recebido">pagamento_recebido</option>
            </select>
          </div>
        </div>
        <div>
          <Button onClick={consultar} disabled={loading}>{loading ? 'Consultando...' : 'Consultar regra'}</Button>
        </div>
      </div>

      {result?.rows && (
        <div className="space-y-2">
          <h2 className="text-base font-medium">Contas da regra</h2>
          <DataTable<Row> columns={columns} data={result.rows} pageSize={5} />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-base font-medium">Gerar contábil a partir do lançamento financeiro (conta_a_pagar)</h2>
        {genResult?.error && <div className="text-sm text-red-600">{genResult.error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Lançamento Financeiro ID</label>
            <Input value={genLfId} onChange={(e) => setGenLfId(e.target.value)} placeholder="ex: 123" />
          </div>
        </div>
        <div>
          <Button onClick={gerarFromFinanceiro} disabled={loading}>{loading ? 'Gerando...' : 'Gerar contábil'}</Button>
        </div>
        {genResult?.linhas && (
          <div className="space-y-2">
            <h3 className="text-sm text-gray-700">Lançamento Contábil #{genResult.lcId}</h3>
            <DataTable<Row> columns={genColumns} data={genResult.linhas} pageSize={10} />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-medium">Criar Conta a Pagar + contábil (automático)</h2>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Tenant ID</label>
            <Input value={cpForm.tenant_id} onChange={(e) => setCpForm(prev => ({ ...prev, tenant_id: e.target.value }))} placeholder="ex: 1" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Categoria ID</label>
            <Input value={cpForm.categoria_id} onChange={(e) => setCpForm(prev => ({ ...prev, categoria_id: e.target.value }))} placeholder="ex: 12" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Fornecedor (entidade_id)</label>
            <Input value={cpForm.entidade_id} onChange={(e) => setCpForm(prev => ({ ...prev, entidade_id: e.target.value }))} placeholder="opcional" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Valor</label>
            <Input value={cpForm.valor} onChange={(e) => setCpForm(prev => ({ ...prev, valor: e.target.value }))} placeholder="ex: 1000.00" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Lançamento</label>
            <Input value={cpForm.data_lancamento} onChange={(e) => setCpForm(prev => ({ ...prev, data_lancamento: e.target.value }))} type="date" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Data Vencimento</label>
            <Input value={cpForm.data_vencimento} onChange={(e) => setCpForm(prev => ({ ...prev, data_vencimento: e.target.value }))} type="date" />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs text-gray-600">Descrição</label>
            <Input value={cpForm.descricao} onChange={(e) => setCpForm(prev => ({ ...prev, descricao: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Conta Financeira ID</label>
            <Input value={cpForm.conta_financeira_id} onChange={(e) => setCpForm(prev => ({ ...prev, conta_financeira_id: e.target.value }))} placeholder="opcional" />
          </div>
        </div>
        <div>
          <Button onClick={criarContaPagarEContabil} disabled={loading}>{loading ? 'Criando...' : 'Criar e gerar contábil'}</Button>
          <Button variant="outline" className="ml-2" onClick={loadTables}>Recarregar Tabelas</Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Lançamentos Financeiros (últimos 50)</h2>
        <DataTable<Row> columns={colsLf} data={tables.lf || []} pageSize={10} />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Lançamentos Contábeis (últimos 50)</h2>
        <DataTable<Row> columns={colsLc} data={tables.lc || []} pageSize={10} />
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-medium">Linhas Contábeis (últimas 10)</h2>
        <DataTable<Row> columns={colsLinhas} data={tables.linhas || []} pageSize={10} />
      </div>
    </div>
  )
}
