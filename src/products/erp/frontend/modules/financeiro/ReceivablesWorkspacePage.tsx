'use client'

import { useErpAccess } from '@/products/erp/frontend/hooks/useErpAccess'

import { ErpMutation } from '@/products/erp/frontend/services/erpMutation'

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Banknote, ChevronDown, FileSpreadsheet, History, Loader2, RotateCcw, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpPagination } from '@/products/erp/frontend/components/ErpPagination'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import { FinancialInstallmentActions } from './FinancialInstallmentActions'
import {
  ErpBulkActionBar, ErpFilterButton, ErpFinanceTabs, ErpPeriodControl,
  ErpPeriodSummary, ErpStatusBadge, ErpWorkspaceHeader,
} from '@/products/erp/frontend/components/ErpWorkspaceChrome'

type Option = { id: string; nome: string; padrao?: boolean }
type Catalogs = { financialAccounts: Option[]; paymentMethods: Option[]; categories?: Option[]; costCenters?: Option[] }
type Receivable = { id: string; conta_id: string; parcela_id: string; entidade_id: string; descricao: string; documento: string; cliente: string; parcela: number; vencimento: string; valor: number; valor_pago: number; credito: number; renegociado: number; saldo: number; status: string }
type Payment = { id: string; data_pagamento: string; valor: number; juros: number; multa: number; desconto: number; taxa: number; valor_liquido: number; estornado_em: string; estorno_de_pagamento_id: string; numero_parcela: number; conta_financeira: string; metodo_pagamento: string }

const today = () => new Date().toISOString().slice(0, 10)
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const dateLabel = (value: string) => value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z')) : '—'
const monthRange = (value: Date) => {
  const start = new Date(Date.UTC(value.getFullYear(), value.getMonth(), 1)).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(value.getFullYear(), value.getMonth() + 1, 0)).toISOString().slice(0, 10)
  return { start, end }
}

async function parseResponse<T>(response: Response): Promise<T> {
  return parseErpResponse<T>(response)
}

export function ReceivablesWorkspacePage() {
  const access = useErpAccess()
  const canSettle = access.can('erp.financeiro.baixar')
  const canReverse = access.can('erp.financeiro.estornar')
  const [records, setRecords] = useState<Receivable[]>([])
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [catalogs, setCatalogs] = useState<Catalogs>({ financialAccounts: [], paymentMethods: [] })
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [status, setStatus] = useState('')
  const [period, setPeriod] = useState(() => new Date())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [periodSummary, setPeriodSummary] = useState({ overdue: 0, dueToday: 0, upcoming: 0, paid: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [paymentOperation] = useState(() => new ErpMutation(undefined, true))
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Receivable | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(today())
  const [financialAccountId, setFinancialAccountId] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [interest, setInterest] = useState('0')
  const [fine, setFine] = useState('0')
  const [discount, setDiscount] = useState('0')
  const [fee, setFee] = useState('0')

  const loadData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page)); params.set('pageSize', '50')
      if (deferredQuery.trim()) params.set('query', deferredQuery.trim())
      if (status) params.set('filter.status', status)
      const range = monthRange(period)
      params.set('filter.vencimento_inicio', range.start)
      params.set('filter.vencimento_fim', range.end)
      const [recordsResponse, catalogsResponse] = await Promise.all([
        fetch(`/api/erp/contas-a-receber${params.size ? `?${params}` : ''}`, { cache: 'no-store' }),
        fetch('/api/erp/vendas/catalogos', { cache: 'no-store' }),
      ])
      const recordsPage = await parseResponse<{ records: Receivable[]; total: number; summary?: typeof periodSummary }>(recordsResponse)
      setRecords(recordsPage.records); setTotalRecords(recordsPage.total)
      setPeriodSummary(recordsPage.summary ?? { overdue: 0, dueToday: 0, upcoming: 0, paid: 0, total: 0 })
      setCatalogs(await parseResponse<Catalogs>(catalogsResponse))
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar contas a receber.') }
    finally { setLoading(false) }
  }, [deferredQuery, page, period, status])

  useEffect(() => { void loadData() }, [loadData])

  const allSelected = records.length > 0 && records.every((record) => selectedIds.has(record.parcela_id))
  const selectedTotal = useMemo(() => records.filter((record) => selectedIds.has(record.parcela_id)).reduce((sum, record) => sum + record.saldo, 0), [records, selectedIds])
  const changeMonth = (offset: number) => {
    setPeriod((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
    setPage(1)
    setSelectedIds(new Set())
  }

  function openPayment(record: Receivable) {
    setSelected(record); setPaymentAmount(String(record.saldo)); setPaymentDate(today())
    setFinancialAccountId(catalogs.financialAccounts.find((item) => item.padrao)?.id || ''); setPaymentMethodId('')
    setInterest('0'); setFine('0'); setDiscount('0'); setFee('0'); setError(null); setPaymentOpen(true)
  }

  async function savePayment() {
    if (!canSettle) return
    if (!selected?.parcela_id) return
    setSaving(true); setError(null)
    try {
      await paymentOperation.submit(`/api/erp/contas-receber-parcelas/${selected.parcela_id}/baixar`, { values: { valor: paymentAmount, data_pagamento: paymentDate, conta_financeira_id: financialAccountId, metodo_pagamento_id: paymentMethodId, juros: interest, multa: fine, desconto: discount, taxa: fee } })
      setPaymentOpen(false); await loadData()
    } catch (paymentError) { setError(paymentError instanceof Error ? paymentError.message : 'Nao foi possivel registrar o recebimento.') }
    finally { setSaving(false) }
  }

  async function openHistory(record: Receivable) {
    setSelected(record); setError(null)
    try {
      const body = await parseResponse<{ records: Payment[] }>(await fetch(`/api/erp/pagamentos?tipo=receber&conta_id=${record.id}`, { cache: 'no-store' }))
      setPayments(body.records); setHistoryOpen(true)
    } catch (historyError) { setError(historyError instanceof Error ? historyError.message : 'Nao foi possivel carregar o historico.') }
  }

  async function reversePayment(payment: Payment) {
    if (!canReverse) return
    if (!window.confirm('Estornar este recebimento?')) return
    setSaving(true); setError(null)
    try {
      await parseResponse(await fetch(`/api/erp/pagamentos/${payment.id}/estornar`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ motivo: 'Estorno solicitado no ERP' }) }))
      if (selected) await openHistory(selected)
      await loadData()
    } catch (reverseError) { setError(reverseError instanceof Error ? reverseError.message : 'Nao foi possivel estornar.') }
    finally { setSaving(false) }
  }

  const cashIn = Math.max(0, Number(paymentAmount || 0) + Number(interest || 0) + Number(fine || 0) - Number(discount || 0) - Number(fee || 0))

  return <div className="flex min-h-full flex-col bg-white">
    <ErpWorkspaceHeader
      section="Financeiro"
      title="Contas a receber"
      menuItems={[{ label: 'Atualizar dados', onSelect: () => void loadData() }]}
      secondaryAction={<Button variant="outline" className="h-11 rounded-md border-[#d9d9d5] px-4 font-normal" onClick={() => { window.location.href = '/erp/cadastros/importacoes' }}><FileSpreadsheet className="size-4" />Importar planilha<ChevronDown className="size-4" /></Button>}
    />
    <ErpFinanceTabs activeHref="/erp/financeiro/contas-a-receber" />
    <ErpPeriodSummary
      title="Resumo do período"
      description={new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(period)}
      metrics={[
        { label: 'Vencidos', value: currency(periodSummary.overdue), tone: 'danger' },
        { label: 'Vencem hoje', value: currency(periodSummary.dueToday) },
        { label: 'A receber', value: currency(periodSummary.upcoming) },
        { label: 'Recebidos', value: currency(periodSummary.paid), tone: 'success' },
        { label: 'Total do período', value: currency(periodSummary.total) },
      ]}
    />
    <div className="flex flex-col gap-3 border-b border-[#e7e7e4] px-5 py-3 md:px-8 lg:flex-row lg:items-center lg:px-10">
      <div className="relative w-full lg:max-w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#777]" />
        <Input value={query} placeholder="Pesquisar lançamentos…" className="h-10 rounded-full border-[#dfdfdc] pl-9 shadow-none" onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
      </div>
      <ErpPeriodControl month={period} onPrevious={() => changeMonth(-1)} onNext={() => changeMonth(1)} />
      <ErpFilterButton active={Boolean(status)} onClick={() => setFiltersOpen((current) => !current)} />
      <div className="ml-auto text-[13px] text-[#696969]">{totalRecords ? (page - 1) * 50 + 1 : 0}–{Math.min(page * 50, totalRecords)} de {totalRecords}</div>
    </div>
    {filtersOpen ? <div className="border-b border-[#e7e7e4] bg-[#fafaf8] px-5 py-3 md:px-8 lg:px-10"><select value={status} className="h-10 rounded-lg border border-[#dfdfdc] bg-white px-3 text-[14px]" onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">Todas as situações</option><option value="aberto">Em aberto</option><option value="parcial">Recebido parcial</option><option value="vencido">Vencido</option><option value="pago">Recebido</option><option value="cancelado">Cancelado</option></select></div> : null}
    {error ? <div role="alert" className="mx-5 mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700 md:mx-8 lg:mx-10">{error}</div> : null}
    <div className="min-h-[300px] flex-1 overflow-x-auto">
      <Table className="erp-workspace-table min-w-[1050px] border-b border-[#e7e7e4]">
        <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]"><TableHead className="w-12 px-4"><Checkbox checked={allSelected} onCheckedChange={(checked) => setSelectedIds(checked ? new Set(records.map((record) => record.parcela_id)) : new Set())} aria-label="Selecionar todos os lançamentos desta página" /></TableHead><TableHead>Vencimento</TableHead><TableHead>Descrição / cliente</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Dinheiro</TableHead><TableHead className="text-right">Crédito</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Situação</TableHead><TableHead className="w-36" /></TableRow></TableHeader>
        <TableBody>{loading ? <TableRow><TableCell colSpan={9} className="h-40 text-center text-[#777]"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />Carregando lançamentos</TableCell></TableRow> : records.length === 0 ? <TableRow><TableCell colSpan={9} className="h-40 text-center text-[#777]">Nenhum lançamento encontrado neste período.</TableCell></TableRow> : records.map((record) => {
          const checked = selectedIds.has(record.parcela_id)
          return <TableRow key={record.parcela_id} data-state={checked ? 'selected' : undefined} className="hover:bg-[#fafaf8] data-[state=selected]:bg-[#f5f6ec]"><TableCell className="px-4"><Checkbox checked={checked} onCheckedChange={(next) => setSelectedIds((current) => { const copy = new Set(current); if (next) copy.add(record.parcela_id); else copy.delete(record.parcela_id); return copy })} aria-label={'Selecionar ' + record.descricao} /></TableCell><TableCell className="whitespace-nowrap">{dateLabel(record.vencimento)}</TableCell><TableCell><p className="font-medium text-[#252525]">{record.descricao}</p><p className="mt-0.5 text-[12px] text-[#7a7a7a]">{record.cliente}{record.documento ? ' · ' + record.documento : ''} · Parcela {record.parcela}</p></TableCell><TableCell className="text-right tabular-nums">{currency(record.valor)}</TableCell><TableCell className="text-right tabular-nums">{currency(record.valor_pago)}</TableCell><TableCell className="text-right tabular-nums">{currency(record.credito)}</TableCell><TableCell className="text-right font-medium tabular-nums">{currency(record.saldo)}</TableCell><TableCell><ErpStatusBadge status={record.status} /></TableCell><TableCell><div className="flex justify-end"><FinancialInstallmentActions record={record} side="receber" entityName={record.cliente} accounts={catalogs.financialAccounts} methods={catalogs.paymentMethods} categories={catalogs.categories} costCenters={catalogs.costCenters} canManage={access.can('erp.financeiro.gerenciar')} canReverse={canReverse} onChanged={loadData} /><Button variant="ghost" size="icon" title="Histórico" onClick={() => void openHistory(record)}><History className="size-4" /></Button>{canSettle && record.saldo > 0 && !['cancelado','renegociado'].includes(record.status) ? <Button variant="ghost" size="icon" title="Registrar recebimento" onClick={() => openPayment(record)}><Banknote className="size-4" /></Button> : null}</div></TableCell></TableRow>
        })}</TableBody>
      </Table>
      <div className="px-5 py-3 md:px-8 lg:px-10"><ErpPagination page={page} pageSize={50} total={totalRecords} onPageChange={setPage} /></div>
    </div>
    <ErpBulkActionBar count={selectedIds.size} totalLabel={<><span>Total do período</span><strong className="ml-3 text-[#222]">{currency(periodSummary.total)}</strong></>}>
      <Button variant="outline" className="h-9" disabled={selectedIds.size === 0} onClick={() => setSelectedIds(new Set())}>{selectedIds.size ? 'Limpar seleção' : 'Ações em lote'}<ChevronDown className="size-4" /></Button>
      {selectedIds.size > 0 ? <span className="hidden text-[#333] sm:inline">Saldo selecionado: {currency(selectedTotal)}</span> : null}
    </ErpBulkActionBar>

    <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Registrar recebimento</DialogTitle></DialogHeader><div className="grid gap-4 py-2 md:grid-cols-2"><FormInput label="Valor principal" value={paymentAmount} onChange={setPaymentAmount} type="number" /><FormInput label="Data do recebimento" value={paymentDate} onChange={setPaymentDate} type="date" /><FormSelect label="Conta de recebimento" value={financialAccountId} onChange={setFinancialAccountId} options={catalogs.financialAccounts} /><FormSelect label="Forma de recebimento" value={paymentMethodId} onChange={setPaymentMethodId} options={catalogs.paymentMethods} /><FormInput label="Juros" value={interest} onChange={setInterest} type="number" /><FormInput label="Multa" value={fine} onChange={setFine} type="number" /><FormInput label="Desconto" value={discount} onChange={setDiscount} type="number" /><FormInput label="Tarifa" value={fee} onChange={setFee} type="number" /><div className="md:col-span-2 rounded-md bg-gray-50 p-4"><p className="text-xs text-gray-500">Entrada liquida na conta</p><p className="mt-1 text-xl font-semibold">{currency(cashIn)}</p></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancelar</Button><Button disabled={saving || !canSettle} onClick={() => void savePayment()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Confirmar recebimento</Button></div></DialogContent></Dialog>

    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="max-w-5xl"><DialogHeader><DialogTitle>Historico de recebimentos</DialogTitle></DialogHeader><div className="max-h-[60vh] overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Parcela</TableHead><TableHead>Conta / metodo</TableHead><TableHead className="text-right">Principal</TableHead><TableHead className="text-right">Encargos</TableHead><TableHead className="text-right">Desconto</TableHead><TableHead className="text-right">Taxa</TableHead><TableHead className="text-right">Dinheiro</TableHead><TableHead>Situacao</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>{payments.length === 0 ? <TableRow><TableCell colSpan={10} className="h-24 text-center text-gray-500">Nenhum recebimento registrado.</TableCell></TableRow> : payments.map((payment) => { const reversed = Boolean(payment.estornado_em || payment.estorno_de_pagamento_id); return <TableRow key={payment.id}><TableCell>{payment.data_pagamento}</TableCell><TableCell>{payment.numero_parcela}</TableCell><TableCell><p>{payment.conta_financeira || '-'}</p><p className="text-xs text-gray-500">{payment.metodo_pagamento || '-'}</p></TableCell><TableCell className="text-right">{currency(payment.valor)}</TableCell><TableCell className="text-right">{currency(payment.juros + payment.multa)}</TableCell><TableCell className="text-right">{currency(payment.desconto)}</TableCell><TableCell className="text-right">{currency(payment.taxa)}</TableCell><TableCell className="text-right font-medium">{currency(payment.valor_liquido)}</TableCell><TableCell><Badge variant="outline">{payment.estorno_de_pagamento_id ? 'Estorno' : payment.estornado_em ? 'Estornado' : 'Confirmado'}</Badge></TableCell><TableCell>{canReverse && !reversed ? <Button variant="ghost" size="icon" title="Estornar" disabled={saving} onClick={() => void reversePayment(payment)}><RotateCcw className="size-4" /></Button> : null}</TableCell></TableRow> })}</TableBody></Table></div></DialogContent></Dialog>
  </div>
}

function FormInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div className="grid gap-2"><Label>{label}</Label><Input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></div> }
function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Option[] }) { return <div className="grid gap-2"><Label>{label}</Label><select value={value} className="h-10 rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => onChange(event.target.value)}><option value="">Selecione</option>{options.map((option) => <option key={option.id} value={option.id}>{option.nome}</option>)}</select></div> }
