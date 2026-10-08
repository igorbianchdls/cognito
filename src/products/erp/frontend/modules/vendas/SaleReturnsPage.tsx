'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Undo2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpModuleWorkspaceTabs, ErpPeriodSummary, ErpWorkspaceHeader } from '@/products/erp/frontend/components/ErpWorkspaceChrome'
import { erpClientToday } from '@/products/erp/frontend/services/erpTimeZone'
import { sumMoney } from '@/products/erp/shared/erpMoney'
import {
  CatalogPicker, DialogActions, DialogError, ErrorBanner, Field, currency, dateLabel, erpJson, errorMessage, inputClass,
  primaryButtonClass, toNumber, type Option,
} from './commercialUi'

type SaleReturn = { id: string; numero: string; venda_id: string; venda: string; cliente_id: string; cliente: string; data_devolucao: string; tratamento: Treatment; valor_total: string; credito_disponivel: string; motivo?: string }
type Treatment = 'abater' | 'credito' | 'reembolso'
type SaleOption = { id: string; numero: string; cliente: string; total: number; status: string }
type SaleItem = { id: string; descricao: string; quantidade: string; total: string; quantidade_atendida?: string | null }
type Receivable = { parcela_id: string; entidade_id: string; descricao: string; parcela: number; vencimento: string; saldo: number }

const treatments: Record<Treatment, { label: string; help: string }> = {
  abater: { label: 'Abater do que o cliente deve', help: 'Quita parcelas em aberto desta venda, sem entrada de dinheiro.' },
  credito: { label: 'Gerar crédito para o cliente', help: 'O valor fica disponível para abater parcelas futuras do cliente.' },
  reembolso: { label: 'Reembolsar o cliente', help: 'Gera uma conta a pagar ao cliente (pague em Contas a pagar).' },
}

// Devoluções de venda: itens voltam ao estoque (produtos com controle) e o valor é abatido, vira crédito ou
// é reembolsado. Nenhuma opção simula entrada ou saída de dinheiro.
export function SaleReturnsPage() {
  const [records, setRecords] = useState<SaleReturn[]>([])
  const [onlyCredit, setOnlyCredit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState<{ saleId?: string } | null>(null)
  const [usingCredit, setUsingCredit] = useState<SaleReturn | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setRecords((await erpJson<{ records: SaleReturn[] }>(`/api/erp/devolucoes?pageSize=100${onlyCredit ? '&com_credito=1' : ''}`)).records) }
    catch (loadError) { setError(errorMessage(loadError, 'Não foi possível carregar as devoluções.')) }
    finally { setLoading(false) }
  }, [onlyCredit])
  useEffect(() => { void load() }, [load])
  // Atalho a partir da venda: /erp/vendas/devolucoes?venda=<id> abre o registro já com a venda.
  useEffect(() => { const sale = new URLSearchParams(window.location.search).get('venda'); if (sale) setCreating({ saleId: sale }) }, [])

  return <div className="flex min-h-full min-w-0 flex-col bg-white">
    <ErpWorkspaceHeader section="Vendas" title="Devoluções" menuItems={[{ label: 'Atualizar dados', onSelect: () => void load() }]}
      primaryAction={<Button className={primaryButtonClass} onClick={() => setCreating({})}><Undo2 className="size-4" />Registrar devolução</Button>} />
    <ErpModuleWorkspaceTabs sectionId="vendas" moduleId="devolucoes" />
    <ErpPeriodSummary title="Resumo das devoluções listadas" description="Crédito disponível pode ser usado em parcelas a receber do mesmo cliente." metrics={[
      { label: 'Devoluções', value: String(records.length) },
      { label: 'Valor devolvido', value: currency(sumMoney(records.map(record => Number(record.valor_total)))) },
      { label: 'Crédito disponível', value: currency(sumMoney(records.map(record => Number(record.credito_disponivel || 0)))), tone: 'success' },
    ]} />
    <div className="flex items-center gap-2 border-b border-[#e7e7e4] px-5 py-3 text-sm md:px-8 lg:px-10"><Switch checked={onlyCredit} onCheckedChange={setOnlyCredit} />Somente com crédito disponível</div>
    <ErrorBanner error={error} />
    <div className="min-h-[300px] min-w-0 flex-1 overflow-x-auto"><Table className="erp-workspace-table min-w-[960px] border-b border-[#e7e7e4]">
      <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]"><TableHead>Data</TableHead><TableHead>Devolução</TableHead><TableHead>Venda</TableHead><TableHead className="erp-table-identity-heading">Cliente</TableHead><TableHead>Tratamento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Crédito disponível</TableHead><TableHead className="w-32" /></TableRow></TableHeader>
      <TableBody>
        {loading ? <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>
          : records.length === 0 ? <TableRow><TableCell colSpan={8} className="h-32 text-center text-gray-500">{onlyCredit ? 'Nenhum crédito disponível.' : 'Nenhuma devolução registrada.'}</TableCell></TableRow>
          : records.map(record => <TableRow key={record.id}>
            <TableCell>{dateLabel(record.data_devolucao)}</TableCell><TableCell className="font-medium">{record.numero}</TableCell><TableCell>{record.venda}</TableCell><TableCell>{record.cliente}</TableCell>
            <TableCell>{record.tratamento === 'abater' ? 'Abatimento' : record.tratamento === 'credito' ? 'Crédito' : 'Reembolso'}</TableCell>
            <TableCell className="text-right tabular-nums">{currency(record.valor_total)}</TableCell>
            <TableCell className="text-right tabular-nums">{record.tratamento === 'credito' ? currency(record.credito_disponivel) : '—'}</TableCell>
            <TableCell className="text-right">{Number(record.credito_disponivel) > 0 ? <Button size="sm" variant="outline" onClick={() => setUsingCredit(record)}>Usar crédito</Button> : null}</TableCell>
          </TableRow>)}
      </TableBody></Table></div>
    {creating ? <ReturnDialog initialSaleId={creating.saleId} onClose={() => setCreating(null)} onSaved={() => { setCreating(null); void load() }} /> : null}
    {usingCredit ? <CreditDialog record={usingCredit} onClose={() => setUsingCredit(null)} onSaved={() => { setUsingCredit(null); void load() }} /> : null}
  </div>
}

function ReturnDialog({ initialSaleId, onClose, onSaved }: { initialSaleId?: string; onClose: () => void; onSaved: () => void }) {
  const [search, setSearch] = useState('')
  const [sales, setSales] = useState<SaleOption[]>([])
  const [saleId, setSaleId] = useState(initialSaleId || '')
  const [sale, setSale] = useState<{ numero: string; cliente_nome: string; total: string } | null>(null)
  const [items, setItems] = useState<SaleItem[]>([])
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [treatment, setTreatment] = useState<Treatment>('abater')
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(erpClientToday())
  const [category, setCategory] = useState<Option | null>(null)
  const [due, setDue] = useState(erpClientToday())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ pageSize: '20', 'filter.tipo_documento': 'venda' })
      if (search.trim()) params.set('query', search.trim())
      erpJson<{ records: SaleOption[] }>(`/api/erp/vendas?${params}`)
        .then(result => { if (active) setSales(result.records.filter(record => !['rascunho', 'cancelada', 'cancelado'].includes(record.status))) })
        .catch(() => { if (active) setSales([]) })
    }, 250)
    return () => { active = false; clearTimeout(timer) }
  }, [search])

  useEffect(() => {
    if (!saleId) { setSale(null); setItems([]); return }
    let active = true
    setError(null)
    erpJson<{ sale: { numero: string; cliente_nome: string; total: string }; items: SaleItem[] }>(`/api/erp/vendas/${saleId}`)
      .then(detail => { if (active) { setSale(detail.sale); setItems(detail.items); setQuantities({}) } })
      .catch(loadError => { if (active) setError(errorMessage(loadError, 'Não foi possível abrir a venda.')) })
    return () => { active = false }
  }, [saleId])

  const selected = items.map(item => ({ item, quantidade: toNumber(quantities[item.id] || '') || 0 })).filter(entry => entry.quantidade > 0)
  const estimate = sumMoney(selected.map(({ item, quantidade }) => Number(item.total) / Number(item.quantidade) * quantidade))

  async function save() {
    setSaving(true); setError(null)
    try {
      await erpJson(`/api/erp/vendas/${saleId}/devolucoes`, { method: 'POST', idempotent: true, body: { values: {
        tratamento: treatment, motivo: reason, data_devolucao: date,
        itens: selected.map(({ item, quantidade }) => ({ venda_item_id: Number(item.id), quantidade })),
        ...(treatment === 'reembolso' ? { categoria_id: category ? Number(category.id) : undefined, data_vencimento: due } : {}),
      } } })
      onSaved()
    } catch (saveError) { setError(errorMessage(saveError, 'Não foi possível registrar a devolução.')) }
    finally { setSaving(false) }
  }

  return <Dialog open onOpenChange={value => { if (!value) onClose() }}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
    <DialogHeader><DialogTitle>Registrar devolução</DialogTitle></DialogHeader>
    <div className="grid gap-4 py-2">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Pesquisar venda"><input className={inputClass} placeholder="Número ou cliente" value={search} onChange={event => setSearch(event.target.value)} /></Field>
        <Field label="Venda"><select aria-label="Venda" className={inputClass} value={saleId} onChange={event => setSaleId(event.target.value)}>
          <option value="">Selecione</option>
          {saleId && !sales.some(option => option.id === saleId) && sale ? <option value={saleId}>{sale.numero} — {sale.cliente_nome}</option> : null}
          {sales.map(option => <option key={option.id} value={option.id}>{option.numero} — {option.cliente} — {currency(option.total)}</option>)}
        </select></Field>
      </div>
      {sale ? <div className="overflow-x-auto rounded-md border"><Table className="min-w-[600px]">
        <TableHeader><TableRow><TableHead>Item</TableHead><TableHead className="text-right">Vendido</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-32">Devolver</TableHead></TableRow></TableHeader>
        <TableBody>{items.map(item => <TableRow key={item.id}>
          <TableCell>{item.descricao}</TableCell><TableCell className="text-right tabular-nums">{Number(item.quantidade).toLocaleString('pt-BR')}</TableCell>
          <TableCell className="text-right tabular-nums">{currency(item.total)}</TableCell>
          <TableCell><input aria-label={`Quantidade a devolver de ${item.descricao}`} className={inputClass} inputMode="decimal" placeholder="0" value={quantities[item.id] || ''} onChange={event => setQuantities(current => ({ ...current, [item.id]: event.target.value }))} /></TableCell>
        </TableRow>)}</TableBody></Table></div> : null}
      <fieldset className="grid gap-2"><legend className="mb-1 text-xs font-medium text-gray-600">O que fazer com o valor</legend>
        {(Object.keys(treatments) as Treatment[]).map(id => <label key={id} className={`flex cursor-pointer gap-3 rounded-md border p-3 ${treatment === id ? 'border-[#111] bg-[#fafaf8]' : ''}`}>
          <input type="radio" name="tratamento" checked={treatment === id} onChange={() => setTreatment(id)} />
          <span><span className="block text-sm font-medium">{treatments[id].label}</span><span className="text-xs text-gray-500">{treatments[id].help}</span></span>
        </label>)}
      </fieldset>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Motivo" className="md:col-span-2"><input className={inputClass} value={reason} onChange={event => setReason(event.target.value)} placeholder="Ex.: produto com defeito" /></Field>
        <Field label="Data da devolução"><input type="date" className={inputClass} value={date} onChange={event => setDate(event.target.value)} /></Field>
        {treatment === 'reembolso' ? <>
          <Field label="Vencimento do reembolso"><input type="date" className={inputClass} value={due} onChange={event => setDue(event.target.value)} /></Field>
          <Field label="Categoria de despesa" className="md:col-span-2"><CatalogPicker type="categoria" categoryType="despesa" label="categoria de despesa" value={category} onChange={setCategory} /></Field>
        </> : null}
      </div>
      {selected.length ? <p className="text-sm">Valor estimado: <strong>{currency(estimate)}</strong> <span className="text-gray-500">(o ERP aplica o desconto da venda proporcionalmente; frete não é devolvido)</span></p> : null}
      <DialogError error={error} />
    </div>
    <DialogActions onCancel={onClose} onConfirm={() => void save()} saving={saving} label="Registrar devolução"
      disabled={!saleId || !selected.length || reason.trim().length < 3 || (treatment === 'reembolso' && (!category || !due))} />
  </DialogContent></Dialog>
}

function CreditDialog({ record, onClose, onSaved }: { record: SaleReturn; onClose: () => void; onSaved: () => void }) {
  const [parcels, setParcels] = useState<Receivable[] | null>(null)
  const [parcelId, setParcelId] = useState('')
  const [value, setValue] = useState(String(Number(record.credito_disponivel)))
  const [date, setDate] = useState(erpClientToday())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    erpJson<{ records: Receivable[] }>(`/api/erp/contas-a-receber?pageSize=100&query=${encodeURIComponent(record.cliente)}`)
      .then(result => { if (active) setParcels(result.records.filter(row => String(row.entidade_id) === String(record.cliente_id) && Number(row.saldo) > 0)) })
      .catch(loadError => { if (active) { setParcels([]); setError(errorMessage(loadError, 'Não foi possível carregar as parcelas do cliente.')) } })
    return () => { active = false }
  }, [record])

  const parcel = parcels?.find(row => row.parcela_id === parcelId)
  async function save() {
    setSaving(true); setError(null)
    try {
      await erpJson(`/api/erp/devolucoes/${record.id}/usar-credito`, { method: 'POST', idempotent: true, body: { values: { parcela_id: Number(parcelId), valor: toNumber(value), data: date } } })
      onSaved()
    } catch (saveError) { setError(errorMessage(saveError, 'Não foi possível usar o crédito.')) }
    finally { setSaving(false) }
  }

  return <Dialog open onOpenChange={open => { if (!open) onClose() }}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>Usar crédito — {record.cliente}</DialogTitle></DialogHeader>
    <div className="grid gap-4 py-2">
      <p className="text-sm text-gray-600">Crédito da devolução {record.numero}: <strong>{currency(record.credito_disponivel)}</strong>. A parcela é baixada sem entrada de dinheiro.</p>
      <Field label="Parcela a receber">{parcels === null ? <Loader2 className="size-4 animate-spin" /> : <select aria-label="Parcela a receber" className={inputClass} value={parcelId} onChange={event => {
        setParcelId(event.target.value)
        const chosen = parcels.find(row => row.parcela_id === event.target.value)
        if (chosen) setValue(String(Math.min(Number(record.credito_disponivel), Number(chosen.saldo))))
      }}>
        <option value="">{parcels.length ? 'Selecione' : 'Nenhuma parcela em aberto deste cliente'}</option>
        {parcels.map(row => <option key={row.parcela_id} value={row.parcela_id}>{dateLabel(row.vencimento)} — {row.descricao} (parcela {row.parcela}) — saldo {currency(row.saldo)}</option>)}
      </select>}</Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Valor"><input className={inputClass} inputMode="decimal" value={value} onChange={event => setValue(event.target.value)} /></Field>
        <Field label="Data"><input type="date" className={inputClass} value={date} onChange={event => setDate(event.target.value)} /></Field>
      </div>
      <DialogError error={error} />
    </div>
    <DialogActions onCancel={onClose} onConfirm={() => void save()} saving={saving} label="Usar crédito"
      disabled={!parcel || !(Number(toNumber(value)) > 0) || Number(toNumber(value)) > Math.min(Number(record.credito_disponivel), Number(parcel?.saldo || 0))} />
  </DialogContent></Dialog>
}
