'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ErpAsyncCatalogSelect } from './ErpAsyncCatalogSelect'
import { parseErpResponse } from '../services/erpProfessionalClient'

type CountRow = { key: string; produto_id: string; nome: string; quantidade_contada: string }
type Snapshot = { produto_id: string; produto: string; unidade: string | null; quantidade_sistema: string; quantidade_reservada: string }
const display = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 4 })

export function ErpStockCountEditor({ localId, reason, saving, onSave }: {
  localId: string; reason: string; saving: boolean
  onSave: (values: Record<string, unknown>) => Promise<void>
}) {
  const [rows, setRows] = useState<CountRow[]>([{ key: 'initial', produto_id: '', nome: '', quantidade_contada: '' }])
  const [snapshot, setSnapshot] = useState<{ signature: string; records: Snapshot[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const revision = useRef(0)
  const signature = JSON.stringify([localId, reason, rows])
  const currentSnapshot = snapshot?.signature === signature ? snapshot.records : null

  function update(key: string, change: Partial<CountRow>) {
    ++revision.current
    setRows(current => current.map(row => row.key === key ? { ...row, ...change } : row))
  }
  async function review() {
    setError('')
    if (!localId || !reason.trim() || rows.some(row => !row.produto_id || !row.quantidade_contada.trim() || !Number.isFinite(Number(row.quantidade_contada)) || Number(row.quantidade_contada) < 0)) {
      setError('Selecione o local e os produtos, informe o motivo e preencha todas as quantidades.'); return
    }
    if (new Set(rows.map(row => row.produto_id)).size !== rows.length) { setError('Cada produto deve aparecer uma vez.'); return }
    const attempt = ++revision.current
    setLoading(true)
    try {
      const params = new URLSearchParams({ local: localId, produtos: rows.map(row => row.produto_id).join(',') })
      const result = await parseErpResponse<{ records: Snapshot[] }>(await fetch(`/api/erp/estoque/contagem?${params}`, { cache: 'no-store' }))
      if (!Array.isArray(result.records) || result.records.length !== rows.length || new Set(result.records.map(item => item.produto_id)).size !== rows.length || rows.some(row => !result.records.some(item => String(item.produto_id) === row.produto_id && Number.isFinite(Number(item.quantidade_sistema)) && Number.isFinite(Number(item.quantidade_reservada))))) {
        throw new Error('O saldo recebido está incompleto. Revise novamente antes de confirmar.')
      }
      if (attempt === revision.current) setSnapshot({ signature, records: result.records.map(item => ({ ...item, produto_id: String(item.produto_id) })) })
    } catch (failure) { if (attempt === revision.current) setError(failure instanceof Error ? failure.message : 'Não foi possível conferir o saldo.') }
    finally { if (attempt === revision.current) setLoading(false) }
  }
  return <section className="space-y-4" aria-label="Produtos da contagem">
    <h2 className="font-semibold">Produtos da contagem</h2>
    <div className="space-y-3">{rows.map((row, index) => <fieldset key={row.key} disabled={saving || loading} className="grid gap-3 rounded border p-3 sm:grid-cols-[1fr_9rem_auto]">
      <legend className="px-1 text-sm">Produto {index + 1}</legend>
      <ErpAsyncCatalogSelect label="Produto" type="produto" value={row.produto_id} selectedLabel={row.nome} onChange={(value, record) => update(row.key, { produto_id: value, nome: record.nome })} />
      <label className="space-y-2 text-sm">Quantidade contada<Input aria-label={`Quantidade contada de ${row.nome || `produto ${index + 1}`}`} type="number" min="0" step="0.0001" required value={row.quantidade_contada} onChange={event => update(row.key, { quantidade_contada: event.target.value })} /></label>
      <Button variant="ghost" type="button" disabled={rows.length === 1} aria-label={`Remover ${row.nome || `produto ${index + 1}`}`} onClick={() => { ++revision.current; setRows(current => current.filter(item => item.key !== row.key)) }}>Remover</Button>
    </fieldset>)}</div>
    <Button variant="outline" disabled={saving || loading || rows.length >= 200} onClick={() => { ++revision.current; setRows(current => [...current, { key: crypto.randomUUID(), produto_id: '', nome: '', quantidade_contada: '' }]) }}>Adicionar produto</Button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {currentSnapshot && <div className="overflow-x-auto rounded border p-3">
      <h3 className="font-semibold">Revise as diferenças</h3>
      <table className="mt-3 w-full text-left text-sm"><caption className="sr-only">Saldo registrado e quantidade contada</caption><thead><tr>{['Produto', 'No sistema', 'Contado', 'Diferença', 'Reservado'].map(label => <th key={label} scope="col" className="p-2">{label}</th>)}</tr></thead><tbody>{rows.map(row => {
        const balance = currentSnapshot.find(item => item.produto_id === row.produto_id)!
        const count = Number(Number(row.quantidade_contada).toFixed(4))
        return <tr key={row.key} className="border-t"><th scope="row" className="p-2">{balance.produto} {balance.unidade && `(${balance.unidade})`}</th><td className="p-2">{display(Number(balance.quantidade_sistema))}</td><td className="p-2">{display(count)}</td><td className="p-2">{display(count - Number(balance.quantidade_sistema))}</td><td className="p-2">{display(Number(balance.quantidade_reservada))}</td></tr>
      })}</tbody></table>
      <p className="mt-3 text-sm text-gray-600">Ao confirmar, as diferenças serão registradas como ajustes. Se o saldo mudar, será necessário revisar novamente.</p>
    </div>}
    <div className="flex flex-wrap gap-2"><Button variant={currentSnapshot ? 'outline' : 'default'} disabled={saving || loading} onClick={() => void review()}>{loading ? 'Conferindo…' : currentSnapshot ? 'Revisar novamente' : 'Revisar diferenças'}</Button>
    {currentSnapshot && <Button disabled={saving || loading} onClick={() => void onSave({ itens: rows.map(row => ({ produto_id: Number(row.produto_id), quantidade_contada: Number(row.quantidade_contada), quantidade_sistema: Number(currentSnapshot.find(item => item.produto_id === row.produto_id)!.quantidade_sistema) })) })}>{saving ? 'Salvando…' : 'Confirmar contagem'}</Button>}</div>
  </section>
}
