'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Loader2, Plus, RefreshCw, Trash2, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ErpPagination } from '@/products/erp/frontend/components/ErpPagination'

type CatalogItem = {
  id: string
  nome: string
  codigo?: string
  documento?: string
  unidade?: string
  valor_padrao?: string | number
  gera_financeiro_padrao?: boolean
}

type PurchaseCatalogs = {
  suppliers: CatalogItem[]
  products: CatalogItem[]
  services: CatalogItem[]
  categories: CatalogItem[]
  costCenters: CatalogItem[]
  financialAccounts: CatalogItem[]
  paymentMethods: CatalogItem[]
  operationNatures: CatalogItem[]
}

type PurchaseRecord = {
  id: string
  numero: string
  fornecedor: string
  data: string
  entrega: string
  total: number
  tipo_compra: string
  tipo_movimento: string
  financeiro: string
  status: string
}

type PurchaseItem = {
  rowId: string
  kind: 'produto' | 'servico'
  itemId: string
  descricao: string
  detalhes: string
  unidade: string
  quantidade: string
  valorUnitario: string
  percentualDesconto: string
}

type PlannedInstallment = {
  numero: number
  vencimento: string
  valor: string
  observacoes: string
}

const emptyCatalogs: PurchaseCatalogs = {
  suppliers: [], products: [], services: [], categories: [], costCenters: [],
  financialAccounts: [], paymentMethods: [], operationNatures: [],
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function money(value: string | number) {
  const parsed = Number(String(value || 0).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function newItem(): PurchaseItem {
  return {
    rowId: crypto.randomUUID(), kind: 'produto', itemId: '', descricao: '', detalhes: '',
    unidade: 'UN', quantidade: '1', valorUnitario: '0', percentualDesconto: '0',
  }
}

function datePlusMonths(dateText: string, months: number) {
  const [year, month, day] = dateText.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + months, 1, 12))
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).getUTCDate()
  date.setUTCDate(Math.min(day, lastDay))
  return date.toISOString().slice(0, 10)
}

function movementLabel(value: string) {
  return {
    cotacao: 'Cotacao', pedido_recorrente: 'Pedido recorrente', pedido_compra: 'Pedido de compra',
    compra: 'Compra', cancelada: 'Cancelada',
  }[value] || value
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(body.error || 'Nao foi possivel completar a operacao.')
  return body as T
}

export function PurchaseWorkspacePage() {
  const [records, setRecords] = useState<PurchaseRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [catalogs, setCatalogs] = useState<PurchaseCatalogs>(emptyCatalogs)
  const [query, setQuery] = useState('')
  const [movementFilter, setMovementFilter] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tipoCompra, setTipoCompra] = useState<'produto' | 'servico'>('produto')
  const [tipoMovimento, setTipoMovimento] = useState('cotacao')
  const [fornecedorId, setFornecedorId] = useState('')
  const [numero, setNumero] = useState('')
  const [dataCompra, setDataCompra] = useState(today())
  const [dataCompetencia, setDataCompetencia] = useState(today())
  const [dataEntrega, setDataEntrega] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [centroCustoId, setCentroCustoId] = useState('')
  const [naturezaId, setNaturezaId] = useState('')
  const [geraFinanceiro, setGeraFinanceiro] = useState(true)
  const [contaFinanceiraId, setContaFinanceiraId] = useState('')
  const [metodoPagamentoId, setMetodoPagamentoId] = useState('')
  const [items, setItems] = useState<PurchaseItem[]>([newItem()])
  const [desconto, setDesconto] = useState('0')
  const [frete, setFrete] = useState('0')
  const [seguro, setSeguro] = useState('0')
  const [outrasDespesas, setOutrasDespesas] = useState('0')
  const [impostosRetidos, setImpostosRetidos] = useState('0')
  const [installments, setInstallments] = useState<PlannedInstallment[]>([
    { numero: 1, vencimento: today(), valor: '0', observacoes: '' },
  ])
  const [observacoes, setObservacoes] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page)); params.set('pageSize', '50')
      if (query.trim()) params.set('query', query.trim())
      if (movementFilter) params.set('filter.tipo_movimento', movementFilter)
      const [recordsResponse, catalogsResponse] = await Promise.all([
        fetch(`/api/erp/compras${params.size ? `?${params}` : ''}`, { cache: 'no-store' }),
        fetch('/api/erp/compras/catalogos', { cache: 'no-store' }),
      ])
      const recordBody = await parseResponse<{ records: PurchaseRecord[]; total: number }>(recordsResponse)
      setRecords(recordBody.records); setTotalRecords(recordBody.total)
      setCatalogs(await parseResponse<PurchaseCatalogs>(catalogsResponse))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar compras.')
    } finally {
      setLoading(false)
    }
  }, [movementFilter, page, query])

  useEffect(() => { void loadData() }, [loadData])

  const subtotal = useMemo(() => items.reduce((sum, item) => {
    const gross = money(item.quantidade) * money(item.valorUnitario)
    return sum + (gross * (1 - (money(item.percentualDesconto) / 100)))
  }, 0), [items])
  const total = Math.max(0, subtotal - money(desconto) + money(frete) + money(seguro) + money(outrasDespesas) - money(impostosRetidos))

  useEffect(() => {
    setInstallments((current) => {
      const count = Math.max(1, current.length)
      const base = Math.floor((total * 100) / count) / 100
      let allocated = 0
      return current.map((installment, index) => {
        const value = index === count - 1 ? Number((total - allocated).toFixed(2)) : base
        allocated += value
        return { ...installment, valor: value.toFixed(2) }
      })
    })
  }, [total])

  function resetForm() {
    const date = today()
    setTipoCompra('produto'); setTipoMovimento('cotacao'); setFornecedorId(''); setNumero('')
    setDataCompra(date); setDataCompetencia(date); setDataEntrega(''); setCategoriaId(''); setCentroCustoId('')
    setNaturezaId(''); setGeraFinanceiro(true); setContaFinanceiraId(''); setMetodoPagamentoId('')
    setItems([newItem()]); setDesconto('0'); setFrete('0'); setSeguro('0'); setOutrasDespesas('0')
    setImpostosRetidos('0'); setInstallments([{ numero: 1, vencimento: date, valor: '0', observacoes: '' }])
    setObservacoes(''); setError(null)
  }

  function openEditor() { resetForm(); setEditorOpen(true) }

  function changeInstallmentCount(count: number) {
    const safeCount = Math.min(48, Math.max(1, count || 1))
    setInstallments(Array.from({ length: safeCount }, (_, index) => ({
      numero: index + 1,
      vencimento: datePlusMonths(dataCompra, index),
      valor: '0',
      observacoes: '',
    })))
  }

  function selectItem(rowId: string, itemId: string) {
    const catalog = tipoCompra === 'produto' ? catalogs.products : catalogs.services
    const selected = catalog.find((item) => item.id === itemId)
    setItems((current) => current.map((item) => item.rowId === rowId ? {
      ...item,
      kind: tipoCompra,
      itemId,
      descricao: selected?.nome || '',
      unidade: selected?.unidade || 'UN',
      valorUnitario: String(selected?.valor_padrao || 0),
    } : item))
  }

  async function savePurchase() {
    setSaving(true); setError(null)
    try {
      const response = await fetch('/api/erp/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ values: {
          tipo_compra: tipoCompra, tipo_movimento: tipoMovimento, fornecedor_id: fornecedorId,
          numero, data_compra: dataCompra, data_competencia: dataCompetencia,
          data_prevista_entrega: dataEntrega, categoria_id: categoriaId, centro_custo_id: centroCustoId,
          natureza_operacao_id: naturezaId, gera_financeiro: geraFinanceiro,
          conta_financeira_id: contaFinanceiraId, metodo_pagamento_id: metodoPagamentoId,
          desconto, frete, seguro, outras_despesas: outrasDespesas, impostos_retidos: impostosRetidos,
          observacoes,
          itens: items.map((item) => ({
            produto_id: item.kind === 'produto' ? item.itemId : null,
            servico_id: item.kind === 'servico' ? item.itemId : null,
            descricao: item.descricao, detalhes: item.detalhes, unidade: item.unidade,
            quantidade: item.quantidade, valor_unitario: item.valorUnitario,
            percentual_desconto: item.percentualDesconto,
          })),
          parcelas: total > 0 ? installments.map((installment) => ({
            numero_parcela: installment.numero, data_vencimento: installment.vencimento,
            valor: installment.valor, observacoes: installment.observacoes,
            conta_financeira_id: contaFinanceiraId, metodo_pagamento_id: metodoPagamentoId,
          })) : [],
        } }),
      })
      await parseResponse(response)
      setEditorOpen(false)
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar a compra.')
    } finally { setSaving(false) }
  }

  async function runAction(record: PurchaseRecord, action: 'confirmar' | 'cancelar') {
    const verb = action === 'confirmar' ? 'efetivar' : 'cancelar'
    if (!window.confirm(`Deseja ${verb} a compra ${record.numero || record.id}?`)) return
    setLoading(true); setError(null)
    try {
      await parseResponse(await fetch(`/api/erp/compras/${record.id}/${action}`, { method: 'POST' }))
      await loadData()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Nao foi possivel ${verb} a compra.`)
      setLoading(false)
    }
  }

  const summary = useMemo(() => ({
    total: records.reduce((sum, record) => sum + record.total, 0),
    pedidos: records.filter((record) => record.tipo_movimento.includes('pedido')).length,
    efetivas: records.filter((record) => record.tipo_movimento === 'compra').length,
  }), [records])

  const itemCatalog = tipoCompra === 'produto' ? catalogs.products : catalogs.services

  return (
    <div className="flex min-h-full flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-medium text-gray-500">ERP / Compras</p><h1 className="mt-1 text-2xl font-semibold text-gray-950">Compras</h1></div>
        <div className="flex gap-2"><Button variant="outline" size="icon" title="Atualizar" onClick={() => void loadData()}><RefreshCw className="size-4" /></Button><Button onClick={openEditor}><Plus className="size-4" />Nova compra</Button></div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-md border bg-gray-200 sm:grid-cols-3">
        <div className="bg-white p-4"><p className="text-xs text-gray-500">Valor listado</p><p className="mt-1 text-xl font-semibold">{formatCurrency(summary.total)}</p></div>
        <div className="bg-white p-4"><p className="text-xs text-gray-500">Pedidos em aberto</p><p className="mt-1 text-xl font-semibold">{summary.pedidos}</p></div>
        <div className="bg-white p-4"><p className="text-xs text-gray-500">Compras efetivas</p><p className="mt-1 text-xl font-semibold">{summary.efetivas}</p></div>
      </div>

      <div className="flex flex-col gap-2 border-y py-3 md:flex-row">
        <Input value={query} placeholder="Buscar por numero ou fornecedor" className="md:max-w-sm" onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
        <select value={movementFilter} className="h-10 rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => { setMovementFilter(event.target.value); setPage(1) }}>
          <option value="">Todos os movimentos</option><option value="cotacao">Cotacoes</option><option value="pedido_recorrente">Pedidos recorrentes</option><option value="pedido_compra">Pedidos de compra</option><option value="compra">Compras</option><option value="cancelada">Canceladas</option>
        </select>
      </div>

      {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="overflow-hidden rounded-md border bg-white">
        <Table><TableHeader><TableRow className="bg-gray-50"><TableHead>Numero</TableHead><TableHead>Fornecedor</TableHead><TableHead>Movimento</TableHead><TableHead>Data</TableHead><TableHead>Entrega</TableHead><TableHead>Financeiro</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-32" /></TableRow></TableHeader>
          <TableBody>{loading ? <TableRow><TableCell colSpan={8} className="h-32 text-center text-gray-500"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />Carregando</TableCell></TableRow> : records.length === 0 ? <TableRow><TableCell colSpan={8} className="h-32 text-center text-gray-500">Nenhuma compra encontrada.</TableCell></TableRow> : records.map((record) => <TableRow key={record.id}>
            <TableCell className="font-medium">{record.numero}</TableCell><TableCell>{record.fornecedor}</TableCell><TableCell><Badge variant="outline">{movementLabel(record.tipo_movimento)}</Badge></TableCell><TableCell>{record.data}</TableCell><TableCell>{record.entrega || '-'}</TableCell><TableCell>{record.financeiro}</TableCell><TableCell className="text-right font-medium">{formatCurrency(record.total)}</TableCell><TableCell><div className="flex justify-end gap-1">{!['compra', 'cancelada'].includes(record.tipo_movimento) ? <Button size="icon" variant="ghost" title="Efetivar compra" onClick={() => void runAction(record, 'confirmar')}><Check className="size-4" /></Button> : null}{record.tipo_movimento !== 'cancelada' ? <Button size="icon" variant="ghost" title="Cancelar" onClick={() => void runAction(record, 'cancelar')}><X className="size-4" /></Button> : null}</div></TableCell>
          </TableRow>)}</TableBody></Table>
        <ErpPagination page={page} pageSize={50} total={totalRecords} onPageChange={setPage} />
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}><DialogContent className="h-[94vh] max-w-[min(1180px,96vw)] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4"><DialogTitle>Nova compra</DialogTitle></DialogHeader>
        <div className="overflow-y-auto">
          <section className="grid gap-4 border-b px-6 py-5"><h2 className="text-sm font-semibold">Informacoes da compra</h2>
            <div className="grid gap-4 md:grid-cols-4"><div className="grid gap-2"><Label>Tipo de compra</Label><div className="flex h-10 overflow-hidden rounded-md border"><button className={`flex-1 text-sm ${tipoCompra === 'produto' ? 'bg-gray-950 text-white' : 'bg-white'}`} onClick={() => { setTipoCompra('produto'); setItems([newItem()]) }}>Produtos</button><button className={`flex-1 text-sm ${tipoCompra === 'servico' ? 'bg-gray-950 text-white' : 'bg-white'}`} onClick={() => { setTipoCompra('servico'); setItems([{ ...newItem(), kind: 'servico' }]) }}>Servicos</button></div></div>
              <FieldSelect label="Tipo de movimento" value={tipoMovimento} onChange={setTipoMovimento} options={[['cotacao','Cotacao de compra'],['pedido_recorrente','Pedido recorrente'],['pedido_compra','Pedido de compra'],['compra','Compra']]} />
              <FieldSelect label="Fornecedor *" value={fornecedorId} onChange={setFornecedorId} options={catalogs.suppliers.map((item) => [item.id, `${item.nome}${item.documento ? ` - ${item.documento}` : ''}`])} />
              <FieldInput label="Numero" value={numero} onChange={setNumero} placeholder="Automatico" />
              <FieldInput label="Data da compra" value={dataCompra} onChange={setDataCompra} type="date" />
              <FieldInput label="Competencia" value={dataCompetencia} onChange={setDataCompetencia} type="date" />
              <FieldInput label="Entrega prevista" value={dataEntrega} onChange={setDataEntrega} type="date" />
              <FieldSelect label="Natureza da operacao" value={naturezaId} onChange={setNaturezaId} options={catalogs.operationNatures.map((item) => [item.id, item.nome])} />
              <FieldSelect label="Categoria financeira" value={categoriaId} onChange={setCategoriaId} options={catalogs.categories.map((item) => [item.id, item.nome])} />
              <FieldSelect label="Centro de custo" value={centroCustoId} onChange={setCentroCustoId} options={catalogs.costCenters.map((item) => [item.id, item.nome])} />
            </div>
          </section>

          <section className="grid gap-4 border-b px-6 py-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Itens da compra</h2><Button variant="outline" size="sm" onClick={() => setItems((current) => [...current, { ...newItem(), kind: tipoCompra }])}><Plus className="size-4" />Adicionar linha</Button></div>
            <div className="grid gap-2">{items.map((item) => <div key={item.rowId} className="grid gap-2 rounded-md bg-gray-50 p-3 lg:grid-cols-[2fr_1.2fr_90px_110px_110px_40px]">
              <select value={item.itemId} className="h-10 rounded-md bg-white px-3 text-sm" onChange={(event) => selectItem(item.rowId, event.target.value)}><option value="">Selecione {tipoCompra === 'produto' ? 'o produto' : 'o servico'}</option>{itemCatalog.map((catalogItem) => <option key={catalogItem.id} value={catalogItem.id}>{catalogItem.codigo ? `${catalogItem.codigo} - ` : ''}{catalogItem.nome}</option>)}</select>
              <Input value={item.detalhes} placeholder="Detalhes do item" onChange={(event) => setItems((current) => current.map((row) => row.rowId === item.rowId ? { ...row, detalhes: event.target.value } : row))} />
              <Input value={item.quantidade} type="number" min="0.0001" step="0.0001" title="Quantidade" onChange={(event) => setItems((current) => current.map((row) => row.rowId === item.rowId ? { ...row, quantidade: event.target.value } : row))} />
              <Input value={item.valorUnitario} type="number" min="0" step="0.01" title="Valor unitario" onChange={(event) => setItems((current) => current.map((row) => row.rowId === item.rowId ? { ...row, valorUnitario: event.target.value } : row))} />
              <Input value={item.percentualDesconto} type="number" min="0" max="100" step="0.01" title="Desconto percentual" onChange={(event) => setItems((current) => current.map((row) => row.rowId === item.rowId ? { ...row, percentualDesconto: event.target.value } : row))} />
              <Button variant="ghost" size="icon" title="Remover linha" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((row) => row.rowId !== item.rowId))}><Trash2 className="size-4" /></Button>
            </div>)}</div>
            <div className="grid gap-3 md:grid-cols-6"><FieldInput label="Desconto" value={desconto} onChange={setDesconto} type="number" /><FieldInput label="Frete" value={frete} onChange={setFrete} type="number" /><FieldInput label="Seguro" value={seguro} onChange={setSeguro} type="number" /><FieldInput label="Outras despesas" value={outrasDespesas} onChange={setOutrasDespesas} type="number" /><FieldInput label="Impostos retidos" value={impostosRetidos} onChange={setImpostosRetidos} type="number" /><div className="grid content-end"><p className="text-xs text-gray-500">Total da compra</p><p className="mt-1 text-xl font-semibold">{formatCurrency(total)}</p></div></div>
          </section>

          <section className="grid gap-4 border-b px-6 py-5"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Informacoes de pagamento</h2><div className="flex items-center gap-2"><Label htmlFor="gera-financeiro">Gerar financeiro</Label><Switch id="gera-financeiro" checked={geraFinanceiro} onCheckedChange={setGeraFinanceiro} /></div></div>
            {geraFinanceiro && total > 0 ? <><div className="grid gap-4 md:grid-cols-3"><FieldSelect label="Forma de pagamento" value={metodoPagamentoId} onChange={setMetodoPagamentoId} options={catalogs.paymentMethods.map((item) => [item.id, item.nome])} /><FieldSelect label="Conta de pagamento" value={contaFinanceiraId} onChange={setContaFinanceiraId} options={catalogs.financialAccounts.map((item) => [item.id, item.nome])} /><div className="grid gap-2"><Label>Quantidade de parcelas</Label><Input type="number" min="1" max="48" value={installments.length} onChange={(event) => changeInstallmentCount(Number(event.target.value))} /></div></div>
              <div className="grid gap-2">{installments.map((installment, index) => <div key={installment.numero} className="grid gap-2 md:grid-cols-[90px_180px_180px_1fr]"><Input value={`${installment.numero}/${installments.length}`} disabled /><Input type="date" value={installment.vencimento} onChange={(event) => setInstallments((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, vencimento: event.target.value } : row))} /><Input type="number" step="0.01" value={installment.valor} onChange={(event) => setInstallments((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, valor: event.target.value } : row))} /><Input value={installment.observacoes} placeholder="Observacoes da parcela" onChange={(event) => setInstallments((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, observacoes: event.target.value } : row))} /></div>)}</div></> : <p className="text-sm text-gray-500">Esta compra nao criara lancamento financeiro.</p>}
          </section>
          <section className="grid gap-2 px-6 py-5"><Label>Observacoes complementares</Label><Textarea value={observacoes} className="min-h-24" onChange={(event) => setObservacoes(event.target.value)} /></section>
        </div>
        <div className="flex items-center justify-between border-t bg-white px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-500"><CalendarDays className="size-4" />{tipoMovimento === 'compra' ? 'Gera despesa efetiva' : tipoMovimento.includes('pedido') ? 'Gera previsao financeira' : 'Sem impacto financeiro'}</div><div className="flex gap-2"><Button variant="outline" onClick={() => setEditorOpen(false)}>Cancelar</Button><Button disabled={saving} onClick={() => void savePurchase()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar compra</Button></div></div>
      </DialogContent></Dialog>
    </div>
  )
}

function FieldInput({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input value={value} type={type} placeholder={placeholder} step={type === 'number' ? '0.01' : undefined} onChange={(event) => onChange(event.target.value)} /></div>
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <div className="grid gap-2"><Label>{label}</Label><select value={value} className="h-10 w-full rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => onChange(event.target.value)}><option value="">Selecione</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>
}
