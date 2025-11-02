
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
    </div>
  )
}
