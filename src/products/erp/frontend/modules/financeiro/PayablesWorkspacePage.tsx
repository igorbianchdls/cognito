'use client'

import { useErpAccess } from '@/products/erp/frontend/hooks/useErpAccess'

import { ErpMutation } from '@/products/erp/frontend/services/erpMutation'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, ChevronDown, FileSpreadsheet, History, Loader2, Plus, RotateCcw, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ErpPagination } from '@/products/erp/frontend/components/ErpPagination'
import { ErpAsyncCatalogSelect } from '@/products/erp/frontend/components/ErpAsyncCatalogSelect'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import { FinancialInstallmentActions } from './FinancialInstallmentActions'
import {
  ErpBulkActionBar,
  ErpFilterButton,
  ErpFinanceTabs,
  ErpPeriodControl,
  ErpPeriodSummary,
  ErpStatusBadge,
  ErpWorkspaceHeader,
} from '@/products/erp/frontend/components/ErpWorkspaceChrome'

type Option = { id: string; nome: string; documento?: string; padrao?: boolean }
type Catalogs = { suppliers: Option[]; categories: Option[]; costCenters: Option[]; financialAccounts: Option[]; paymentMethods: Option[] }
type Payable = {
  id: string; conta_id: string; parcela_id: string; entidade_id: string; descricao: string; fornecedor: string;
  parcela: number; vencimento: string; valor: number; valor_pago: number; credito: number; renegociado: number; saldo: number;
  origem: string; tipo_lancamento: string; categoria: string; conta_financeira: string; status: string;
}
type Payment = { id: string; data_pagamento: string; valor: number; juros: number; multa: number; desconto: number; taxa: number; valor_liquido: number; estornado_em: string; estorno_de_pagamento_id: string; numero_parcela: number; conta_financeira: string; metodo_pagamento: string }

const emptyCatalogs: Catalogs = { suppliers: [], categories: [], costCenters: [], financialAccounts: [], paymentMethods: [] }
const today = () => new Date().toISOString().slice(0, 10)
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const dateLabel = (value: string) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z')) : '—'
const monthRange = (value: Date) => {
  const year = value.getFullYear()
  const month = value.getMonth()
  const start = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10)
  return { start, end }
}

async function parseResponse<T>(response: Response): Promise<T> {
  return parseErpResponse<T>(response)
}

export function PayablesWorkspacePage({ purchaseOnly = false }: { purchaseOnly?: boolean }) {
  const access = useErpAccess()
  const canSettle = access.can('erp.financeiro.baixar')
  const canReverse = access.can('erp.financeiro.estornar')
  const canManage = access.can('erp.financeiro.gerenciar')
  const [records, setRecords] = useState<Payable[]>([])
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [origin, setOrigin] = useState(purchaseOnly ? 'compra' : '')
  const [launchType, setLaunchType] = useState('')
  const [period, setPeriod] = useState(() => new Date())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [periodSummary, setPeriodSummary] = useState({ overdue: 0, dueToday: 0, upcoming: 0, paid: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentOperation] = useState(() => new ErpMutation(undefined, true))
  const [error, setError] = useState<string | null>(null)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [selected, setSelected] = useState<Payable | null>(null)

  const [supplierId, setSupplierId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [competence, setCompetence] = useState(today())
  const [dueDate, setDueDate] = useState(today())
  const [categoryId, setCategoryId] = useState('')
  const [costCenterId, setCostCenterId] = useState('')
  const [financialAccountId, setFinancialAccountId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [installmentCount, setInstallmentCount] = useState(1)
  const [repeat, setRepeat] = useState(false)
  const [frequency, setFrequency] = useState('mes')
  const [occurrences, setOccurrences] = useState(12)
  const [endType,setEndType]=useState('ocorrencias')
  const [endDate,setEndDate]=useState('')
  const [recurrenceInterval,setRecurrenceInterval]=useState(1)
  const [notes, setNotes] = useState('')

  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(today())
  const [interest, setInterest] = useState('0')
  const [fine, setFine] = useState('0')
  const [discount, setDiscount] = useState('0')
  const [fee, setFee] = useState('0')

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page)); params.set('pageSize', '50')
      if (query.trim()) params.set('query', query.trim())
      if (status) params.set('filter.status', status)
      if (origin) params.set('filter.origem', origin)
      if (launchType) params.set('filter.tipo_lancamento', launchType)
      const range = monthRange(period)
      params.set('filter.vencimento_inicio', range.start)
      params.set('filter.vencimento_fim', range.end)
      const [payablesResponse, catalogsResponse] = await Promise.all([
        fetch(`/api/erp/contas-a-pagar${params.toString() ? `?${params}` : ''}`, { cache: 'no-store' }),
        fetch('/api/erp/compras/catalogos', { cache: 'no-store' }),
      ])
      const payablesPage = await parseResponse<{ records: Payable[]; total: number; summary?: typeof periodSummary }>(payablesResponse)
      setRecords(payablesPage.records); setTotalRecords(payablesPage.total)
      setPeriodSummary(payablesPage.summary ?? { overdue: 0, dueToday: 0, upcoming: 0, paid: 0, total: 0 })
      setCatalogs(await parseResponse<Catalogs>(catalogsResponse))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar as contas a pagar.')
    } finally { setLoading(false) }
  }, [launchType, origin, page, period, query, status])

  useEffect(() => { void loadData() }, [loadData])

  const allSelected = records.length > 0 && records.every((record) => selectedIds.has(record.parcela_id))
  const selectedTotal = useMemo(() => records.filter((record) => selectedIds.has(record.parcela_id)).reduce((sum, record) => sum + record.saldo, 0), [records, selectedIds])
  const changeMonth = (offset: number) => {
    setPeriod((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
    setPage(1)
    setSelectedIds(new Set())
  }

  function openExpense() {
    setSupplierId(''); setDescription(''); setAmount(''); setCompetence(today()); setDueDate(today())
    setCategoryId(''); setCostCenterId(''); setFinancialAccountId(catalogs.financialAccounts.find((item) => item.padrao)?.id || '')
    setPaymentMethodId(''); setInstallmentCount(1); setRepeat(false); setFrequency('mes'); setOccurrences(12); setNotes(''); setError(null); setExpenseOpen(true)
  }

  function buildInstallments() {
    const total = Number(String(amount).replace(',', '.')) || 0
    const count = Math.min(48, Math.max(1, installmentCount))
    const base = Math.floor((total * 100) / count) / 100
    let allocated = 0
    return Array.from({ length: count }, (_, index) => {
      const value = index === count - 1 ? Number((total - allocated).toFixed(2)) : base
      allocated += value
      const [year, month, day] = dueDate.split('-').map(Number)
      const date = new Date(Date.UTC(year, month - 1 + index, 1, 12))
      const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12)).getUTCDate()
      date.setUTCDate(Math.min(day, lastDay))
      return { numero_parcela: index + 1, descricao: `Parcela ${index + 1}`, data_vencimento: date.toISOString().slice(0, 10), valor: value }
    })
  }

  async function saveExpense() {
    if (!canManage) return
    setSaving(true); setError(null)
    try {
      await parseResponse(await fetch('/api/erp/contas-a-pagar', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ values: {
          fornecedor_id: supplierId, descricao: description, valor_total: amount,
          data_competencia: competence, data_emissao: competence, data_vencimento: dueDate,
          categoria_id: categoryId, centro_custo_id: costCenterId,
          conta_financeira_id: financialAccountId, metodo_pagamento_id: paymentMethodId,
          observacoes: notes, parcelas: buildInstallments(), repetir: repeat,
          recorrencia: repeat ? { frequencia: frequency, intervalo: recurrenceInterval, termino_tipo:endType, quantidade_ocorrencias:endType==='ocorrencias'?occurrences:undefined,termino_em:endType==='data'?endDate:undefined } : undefined,
        } }),
      }))
      setExpenseOpen(false); await loadData()
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar a despesa.') }
    finally { setSaving(false) }
  }

  function openPayment(record: Payable) {
    setSelected(record); setPaymentAmount(String(record.saldo)); setPaymentDate(today()); setInterest('0'); setFine('0'); setDiscount('0'); setFee('0')
    setFinancialAccountId(catalogs.financialAccounts.find((item) => item.padrao)?.id || ''); setPaymentMethodId(''); setError(null); setPaymentOpen(true)
  }

  async function savePayment() {
    if (!canSettle) return
    if (!selected) return
    setSaving(true); setError(null)
    try {
      await paymentOperation.submit(`/api/erp/contas-pagar-parcelas/${selected.parcela_id}/baixar`, { values: {
          valor: paymentAmount, data_pagamento: paymentDate, conta_financeira_id: financialAccountId,
          metodo_pagamento_id: paymentMethodId, juros: interest, multa: fine, desconto: discount, taxa: fee,
        } })
      setPaymentOpen(false); await loadData()
    } catch (paymentError) { setError(paymentError instanceof Error ? paymentError.message : 'Nao foi possivel registrar o pagamento.') }
    finally { setSaving(false) }
  }

  async function makeEffective(record: Payable) {
    setSaving(true); setError(null)
    try {
      await parseResponse(await fetch('/api/erp/financeiro/efetivar-previsao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: { conta_id: record.conta_id } }),
      }))
      await loadData()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Nao foi possivel efetivar a previsao.') }
    finally { setSaving(false) }
  }

  async function openHistory(record: Payable) {
    setSelected(record); setError(null)
    try {
      const body = await parseResponse<{ records: Payment[] }>(await fetch(`/api/erp/pagamentos?tipo=pagar&conta_id=${record.conta_id}`, { cache: 'no-store' }))
      setPayments(body.records); setHistoryOpen(true)
    } catch (historyError) { setError(historyError instanceof Error ? historyError.message : 'Nao foi possivel carregar o historico.') }
  }

  async function reversePayment(payment: Payment) {
    if (!canReverse) return
    if (!window.confirm('Estornar este pagamento?')) return
    setSaving(true); setError(null)
    try {
      await parseResponse(await fetch(`/api/erp/pagamentos/${payment.id}/estornar`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ motivo: 'Estorno solicitado no ERP' }) }))
      if (selected) await openHistory(selected)
      await loadData()
    } catch (reverseError) { setError(reverseError instanceof Error ? reverseError.message : 'Nao foi possivel estornar.') }
    finally { setSaving(false) }
  }

  const cashOut = Math.max(0, Number(paymentAmount || 0) + Number(interest || 0) + Number(fine || 0) - Number(discount || 0) + Number(fee || 0))

  return <div className="flex min-h-full flex-col bg-white">
    <ErpWorkspaceHeader
      section={purchaseOnly ? 'Compras' : 'Financeiro'}
      title={purchaseOnly ? 'Parcelas a pagar' : 'Contas a pagar'}
      menuItems={[{ label: 'Atualizar dados', onSelect: () => void loadData() }]}
      secondaryAction={!purchaseOnly ? <Button variant="outline" className="h-11 rounded-md border-[#d9d9d5] px-4 font-normal" onClick={() => { window.location.href = '/erp/cadastros/importacoes' }}><FileSpreadsheet className="size-4" />Importar planilha<ChevronDown className="size-4" /></Button> : null}
      primaryAction={!purchaseOnly && canManage ? <Button className="h-11 rounded-md bg-[#c9f20a] px-5 font-medium text-[#142000] shadow-none hover:bg-[#b9df09]" onClick={openExpense}><Plus className="size-4" />Adicionar</Button> : undefined}
    />
    {!purchaseOnly ? <ErpFinanceTabs activeHref="/erp/financeiro/contas-a-pagar" /> : null}
    <ErpPeriodSummary
      title="Resumo do período"
      description={new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(period)}
      metrics={[
        { label: 'Vencidos', value: currency(periodSummary.overdue), tone: 'danger' },
        { label: 'Vencem hoje', value: currency(periodSummary.dueToday) },
        { label: 'A vencer', value: currency(periodSummary.upcoming) },
        { label: 'Pagos', value: currency(periodSummary.paid), tone: 'success' },
        { label: 'Total do período', value: currency(periodSummary.total) },
      ]}
    />
    <div className="flex flex-col gap-3 border-b border-[#e7e7e4] px-5 py-3 md:px-8 lg:flex-row lg:items-center lg:px-10">
      <div className="relative w-full lg:max-w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#777]" />
        <Input value={query} placeholder="Pesquisar lançamentos…" className="h-10 rounded-full border-[#dfdfdc] pl-9 shadow-none" onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
      </div>
      <ErpPeriodControl month={period} onPrevious={() => changeMonth(-1)} onNext={() => changeMonth(1)} />
      <ErpFilterButton active={Boolean(status || origin || launchType)} onClick={() => setFiltersOpen((current) => !current)} />
      <div className="ml-auto flex items-center gap-3 text-[13px] text-[#696969]">
        <span>{totalRecords ? (page - 1) * 50 + 1 : 0}–{Math.min(page * 50, totalRecords)} de {totalRecords}</span>
      </div>
    </div>
    {filtersOpen ? <div className="flex flex-wrap gap-2 border-b border-[#e7e7e4] bg-[#fafaf8] px-5 py-3 md:px-8 lg:px-10"><Filter value={status} onChange={(value) => { setStatus(value); setPage(1) }} label="Todas as situações" options={[['aberto','Em aberto'],['parcial','Pago parcial'],['vencido','Vencido'],['pago','Pago'],['cancelado','Cancelado']]} />{!purchaseOnly ? <Filter value={origin} onChange={(value) => { setOrigin(value); setPage(1) }} label="Todas as origens" options={[['manual','Manual'],['compra','Compra'],['recorrencia','Recorrência'],['xml','XML'],['integracao','Integração']]} /> : null}<Filter value={launchType} onChange={(value) => { setLaunchType(value); setPage(1) }} label="Previsão e efetivo" options={[['previsao','Previsão'],['efetivo','Obrigação efetiva']]} /></div> : null}
    {error ? <div role="alert" className="mx-5 mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700 md:mx-8 lg:mx-10">{error}</div> : null}
    <div className="min-h-[300px] flex-1 overflow-x-auto">
      <Table className="erp-workspace-table min-w-[1120px] border-b border-[#e7e7e4]">
        <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]">
          <TableHead className="w-12 px-4"><Checkbox checked={allSelected} onCheckedChange={(checked) => setSelectedIds(checked ? new Set(records.map((record) => record.parcela_id)) : new Set())} aria-label="Selecionar todos os lançamentos desta página" /></TableHead>
          <TableHead>Vencimento</TableHead><TableHead>Descrição / fornecedor</TableHead><TableHead>Natureza</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Dinheiro</TableHead><TableHead className="text-right">Crédito</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Situação</TableHead><TableHead className="w-44" />
        </TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={10} className="h-40 text-center text-[#777]"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />Carregando lançamentos</TableCell></TableRow> : records.length === 0 ? <TableRow><TableCell colSpan={10} className="h-40 text-center text-[#777]">Nenhum lançamento encontrado neste período.</TableCell></TableRow> : records.map((record) => {
            const checked = selectedIds.has(record.parcela_id)
            return <TableRow key={record.parcela_id} data-state={checked ? 'selected' : undefined} className="hover:bg-[#fafaf8] data-[state=selected]:bg-[#f5f6ec]">
              <TableCell className="px-4"><Checkbox checked={checked} onCheckedChange={(next) => setSelectedIds((current) => { const copy = new Set(current); if (next) copy.add(record.parcela_id); else copy.delete(record.parcela_id); return copy })} aria-label={'Selecionar ' + record.descricao} /></TableCell>
              <TableCell className="whitespace-nowrap">{dateLabel(record.vencimento)}</TableCell>
              <TableCell><p className="font-medium text-[#252525]">{record.descricao}</p><p className="mt-0.5 text-[12px] text-[#7a7a7a]">{record.fornecedor} · Parcela {record.parcela}</p></TableCell>
              <TableCell><span className="text-[13px] text-[#5f5f5f]">{record.tipo_lancamento === 'previsao' ? 'Previsão' : 'Obrigação efetiva'}</span></TableCell>
              <TableCell className="text-right tabular-nums">{currency(record.valor)}</TableCell><TableCell className="text-right tabular-nums">{currency(record.valor_pago)}</TableCell><TableCell className="text-right tabular-nums">{currency(record.credito)}</TableCell><TableCell className="text-right font-medium tabular-nums">{currency(record.saldo)}</TableCell>
              <TableCell><ErpStatusBadge status={record.status} /></TableCell>
              <TableCell><div className="flex justify-end"><FinancialInstallmentActions record={record} side="pagar" entityName={record.fornecedor} accounts={catalogs.financialAccounts} methods={catalogs.paymentMethods} categories={catalogs.categories} costCenters={catalogs.costCenters} canManage={canManage} canReverse={canReverse} onChanged={loadData} /><Button variant="ghost" size="icon" title="Histórico" onClick={() => void openHistory(record)}><History className="size-4" /></Button>{canManage && record.tipo_lancamento === 'previsao' ? <Button variant="ghost" size="sm" disabled={saving} onClick={() => void makeEffective(record)}>Efetivar</Button> : null}{canSettle && record.tipo_lancamento === 'efetivo' && record.saldo > 0 && !['pago','cancelado','renegociado'].includes(record.status) ? <Button variant="ghost" size="icon" title="Registrar pagamento" onClick={() => openPayment(record)}><Banknote className="size-4" /></Button> : null}</div></TableCell>
            </TableRow>
          })}
        </TableBody>
      </Table>
      <div className="px-5 py-3 md:px-8 lg:px-10"><ErpPagination page={page} pageSize={50} total={totalRecords} onPageChange={setPage} /></div>
    </div>
    <ErpBulkActionBar count={selectedIds.size} totalLabel={<><span>Total do período</span><strong className="ml-3 text-[#222]">{currency(periodSummary.total)}</strong></>}>
      <Button variant="outline" className="h-9" disabled={selectedIds.size === 0} onClick={() => setSelectedIds(new Set())}>{selectedIds.size ? 'Limpar seleção' : 'Ações em lote'}<ChevronDown className="size-4" /></Button>
      {selectedIds.size > 0 ? <span className="hidden text-[#333] sm:inline">Saldo selecionado: {currency(selectedTotal)}</span> : null}
    </ErpBulkActionBar>

    <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Nova despesa</DialogTitle></DialogHeader><div className="grid gap-4 py-2 md:grid-cols-2">
      <ErpAsyncCatalogSelect label="Fornecedor *" type="fornecedor" value={supplierId} selectedLabel={catalogs.suppliers.find((item) => item.id === supplierId)?.nome} onChange={(value, record) => { setSupplierId(value); setCatalogs((current) => ({ ...current, suppliers: [record, ...current.suppliers.filter((item) => item.id !== record.id)] })) }} /><FormInput label="Descricao *" value={description} onChange={setDescription} />
      <FormInput label="Valor *" value={amount} onChange={setAmount} type="number" /><FormSelect label="Categoria *" value={categoryId} onChange={setCategoryId} options={catalogs.categories.map((item) => [item.id, item.nome])} />
      <FormInput label="Competencia" value={competence} onChange={setCompetence} type="date" /><FormInput label="Primeiro vencimento" value={dueDate} onChange={setDueDate} type="date" />
      <FormSelect label="Centro de custo" value={costCenterId} onChange={setCostCenterId} options={catalogs.costCenters.map((item) => [item.id, item.nome])} /><FormInput label="Parcelas" value={String(installmentCount)} onChange={(value) => setInstallmentCount(Math.min(48, Math.max(1, Number(value))))} type="number" />
      <FormSelect label="Forma de pagamento" value={paymentMethodId} onChange={setPaymentMethodId} options={catalogs.paymentMethods.map((item) => [item.id, item.nome])} /><FormSelect label="Conta de pagamento" value={financialAccountId} onChange={setFinancialAccountId} options={catalogs.financialAccounts.map((item) => [item.id, item.nome])} />
      <div className="flex items-center gap-3"><Switch checked={repeat} onCheckedChange={setRepeat} /><Label>Repetir lançamento</Label></div>{repeat ? <div className="grid gap-3"><FormSelect label="Frequência" value={frequency} onChange={setFrequency} options={ [['dia','Dia'],['semana','Semana'],['mes','Mês'],['ano','Ano']] }/><label className="grid gap-1 text-sm">Intervalo<Input type="number" min="1" value={recurrenceInterval} onChange={e=>setRecurrenceInterval(Number(e.target.value))}/></label><FormSelect label="Término" value={endType} onChange={setEndType} options={ [['ocorrencias','Por quantidade'],['data','Por data'],['indeterminado','Sem término']] }/>{endType==='ocorrencias'?<label className="grid gap-1 text-sm">Ocorrências (inclui a primeira)<Input type="number" min="1" max="366" value={occurrences} onChange={e=>setOccurrences(Number(e.target.value))}/></label>:endType==='data'?<label className="grid gap-1 text-sm">Última data de geração<Input type="date" min={competence} value={endDate} onChange={e=>setEndDate(e.target.value)}/></label>:null}</div>:<div/>}
      <div className="grid gap-2 md:col-span-2"><Label>Observacoes</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
    </div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setExpenseOpen(false)}>Cancelar</Button><Button disabled={saving || !canManage} onClick={() => void saveExpense()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar despesa</Button></div></DialogContent></Dialog>

    <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Registrar pagamento</DialogTitle></DialogHeader><div className="grid gap-4 py-2 md:grid-cols-2"><FormInput label="Valor principal" value={paymentAmount} onChange={setPaymentAmount} type="number" /><FormInput label="Data do pagamento" value={paymentDate} onChange={setPaymentDate} type="date" /><FormSelect label="Conta de pagamento" value={financialAccountId} onChange={setFinancialAccountId} options={catalogs.financialAccounts.map((item) => [item.id, item.nome])} /><FormSelect label="Forma de pagamento" value={paymentMethodId} onChange={setPaymentMethodId} options={catalogs.paymentMethods.map((item) => [item.id, item.nome])} /><FormInput label="Juros" value={interest} onChange={setInterest} type="number" /><FormInput label="Multa" value={fine} onChange={setFine} type="number" /><FormInput label="Desconto" value={discount} onChange={setDiscount} type="number" /><FormInput label="Tarifa" value={fee} onChange={setFee} type="number" /><div className="md:col-span-2 rounded-md bg-gray-50 p-4"><p className="text-xs text-gray-500">Saida da conta financeira</p><p className="mt-1 text-xl font-semibold">{currency(cashOut)}</p></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancelar</Button><Button disabled={saving || !canSettle} onClick={() => void savePayment()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Confirmar pagamento</Button></div></DialogContent></Dialog>

    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="max-w-5xl"><DialogHeader><DialogTitle>Historico de pagamentos</DialogTitle></DialogHeader><div className="max-h-[60vh] overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Parcela</TableHead><TableHead>Conta / metodo</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Encargos</TableHead><TableHead className="text-right">Desconto</TableHead><TableHead className="text-right">Taxa</TableHead><TableHead className="text-right">Dinheiro</TableHead><TableHead>Situacao</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>{payments.length === 0 ? <TableRow><TableCell colSpan={10} className="h-24 text-center text-gray-500">Nenhum pagamento registrado.</TableCell></TableRow> : payments.map((payment) => { const reversed = Boolean(payment.estornado_em || payment.estorno_de_pagamento_id); return <TableRow key={payment.id}><TableCell>{payment.data_pagamento}</TableCell><TableCell>{payment.numero_parcela}</TableCell><TableCell><p>{payment.conta_financeira || '-'}</p><p className="text-xs text-gray-500">{payment.metodo_pagamento || '-'}</p></TableCell><TableCell className="text-right">{currency(payment.valor)}</TableCell><TableCell className="text-right">{currency(payment.juros + payment.multa)}</TableCell><TableCell className="text-right">{currency(payment.desconto)}</TableCell><TableCell className="text-right">{currency(payment.taxa)}</TableCell><TableCell className="text-right font-medium">{currency(payment.valor_liquido)}</TableCell><TableCell><Badge variant="outline">{payment.estorno_de_pagamento_id ? 'Estorno' : payment.estornado_em ? 'Estornado' : 'Confirmado'}</Badge></TableCell><TableCell>{canReverse && !reversed ? <Button variant="ghost" size="icon" title="Estornar" disabled={saving} onClick={() => void reversePayment(payment)}><RotateCcw className="size-4" /></Button> : null}</TableCell></TableRow> })}</TableBody></Table></div></DialogContent></Dialog>
  </div>
}

function Filter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[][] }) { return <select value={value} className="h-10 rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => onChange(event.target.value)}><option value="">{label}</option>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select> }
function FormInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div className="grid gap-2"><Label>{label}</Label><Input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></div> }
function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <div className="grid gap-2"><Label>{label}</Label><Filter value={value} onChange={onChange} label="Selecione" options={options} /></div> }
