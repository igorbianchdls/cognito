'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Banknote, History, Loader2, RefreshCw, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpPagination } from '@/products/erp/frontend/components/ErpPagination'

type Option = { id: string; nome: string; padrao?: boolean }
type Catalogs = { financialAccounts: Option[]; paymentMethods: Option[] }
type Receivable = { id: string; parcela_id: string; descricao: string; documento: string; cliente: string; vencimento: string; valor: number; valor_pago: number; status: string }
type Payment = { id: string; data_pagamento: string; valor: number; juros: number; multa: number; desconto: number; taxa: number; valor_liquido: number; estornado_em: string; estorno_de_pagamento_id: string; numero_parcela: number; conta_financeira: string; metodo_pagamento: string }

const today = () => new Date().toISOString().slice(0, 10)
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as { error?: string }
  if (!response.ok) throw new Error(body.error || 'Nao foi possivel concluir a operacao.')
  return body as T
}

function statusTone(status: string) {
  if (status === 'pago') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'vencido') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'cancelado') return 'border-gray-200 bg-gray-100 text-gray-500'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

export function ReceivablesWorkspacePage() {
  const [records, setRecords] = useState<Receivable[]>([])
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [catalogs, setCatalogs] = useState<Catalogs>({ financialAccounts: [], paymentMethods: [] })
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      const [recordsResponse, catalogsResponse] = await Promise.all([
        fetch(`/api/erp/contas-a-receber${params.size ? `?${params}` : ''}`, { cache: 'no-store' }),
        fetch('/api/erp/vendas/catalogos', { cache: 'no-store' }),
      ])
      const recordsPage = await parseResponse<{ records: Receivable[]; total: number }>(recordsResponse)
      setRecords(recordsPage.records); setTotalRecords(recordsPage.total)
      setCatalogs(await parseResponse<Catalogs>(catalogsResponse))
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar contas a receber.') }
    finally { setLoading(false) }
  }, [deferredQuery, page, status])

  useEffect(() => { void loadData() }, [loadData])

  const summary = useMemo(() => ({
    open: records.filter((record) => !['pago', 'cancelado'].includes(record.status)).reduce((sum, record) => sum + Math.max(0, record.valor - record.valor_pago), 0),
    overdue: records.filter((record) => record.status === 'vencido').reduce((sum, record) => sum + Math.max(0, record.valor - record.valor_pago), 0),
    received: records.reduce((sum, record) => sum + record.valor_pago, 0),
  }), [records])

  function openPayment(record: Receivable) {
    setSelected(record); setPaymentAmount(String(Math.max(0, record.valor - record.valor_pago))); setPaymentDate(today())
    setFinancialAccountId(catalogs.financialAccounts.find((item) => item.padrao)?.id || ''); setPaymentMethodId('')
    setInterest('0'); setFine('0'); setDiscount('0'); setFee('0'); setError(null); setPaymentOpen(true)
  }

  async function savePayment() {
    if (!selected?.parcela_id) return
    setSaving(true); setError(null)
    try {
      await parseResponse(await fetch(`/api/erp/contas-receber-parcelas/${selected.parcela_id}/baixar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ values: { valor: paymentAmount, data_pagamento: paymentDate, conta_financeira_id: financialAccountId, metodo_pagamento_id: paymentMethodId, juros: interest, multa: fine, desconto: discount, taxa: fee } }),
      }))
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

  return <div className="flex min-h-full flex-col gap-5">
    <div className="flex items-center justify-between"><div><p className="text-xs font-medium text-gray-500">ERP / Financeiro</p><h1 className="mt-1 text-2xl font-semibold text-gray-950">Contas a receber</h1><p className="mt-1 text-sm text-gray-600">Titulos, recebimentos parciais e estornos.</p></div><Button variant="outline" size="icon" title="Atualizar" onClick={() => void loadData()}><RefreshCw className="size-4" /></Button></div>
    <div className="grid gap-px overflow-hidden rounded-md border bg-gray-200 sm:grid-cols-3"><Metric label="Saldo nesta pagina" value={currency(summary.open)} /><Metric label="Vencido nesta pagina" value={currency(summary.overdue)} danger /><Metric label="Recebido nesta pagina" value={currency(summary.received)} /></div>
    <div className="flex flex-wrap gap-2 border-y py-3"><Input value={query} placeholder="Buscar descricao, cliente ou documento" className="min-w-64 flex-1 md:max-w-sm" onChange={(event) => { setQuery(event.target.value); setPage(1) }} /><select value={status} className="h-10 rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => { setStatus(event.target.value); setPage(1) }}><option value="">Todas as situacoes</option><option value="aberto">Aberto</option><option value="parcial">Parcial</option><option value="vencido">Vencido</option><option value="pago">Pago</option><option value="cancelado">Cancelado</option></select></div>
    {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    <div className="overflow-hidden rounded-md border bg-white"><Table><TableHeader><TableRow className="bg-gray-50"><TableHead>Vencimento</TableHead><TableHead>Descricao</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Recebido</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Situacao</TableHead><TableHead className="w-24" /></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={8} className="h-32 text-center text-gray-500"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />Carregando</TableCell></TableRow> : records.length === 0 ? <TableRow><TableCell colSpan={8} className="h-32 text-center text-gray-500">Nenhum titulo encontrado.</TableCell></TableRow> : records.map((record) => <TableRow key={record.id}><TableCell>{record.vencimento || '-'}</TableCell><TableCell><p className="font-medium">{record.descricao}</p><p className="text-xs text-gray-500">{record.documento}</p></TableCell><TableCell>{record.cliente}</TableCell><TableCell className="text-right">{currency(record.valor)}</TableCell><TableCell className="text-right">{currency(record.valor_pago)}</TableCell><TableCell className="text-right font-medium">{currency(Math.max(0, record.valor - record.valor_pago))}</TableCell><TableCell><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusTone(record.status)}`}>{record.status}</span></TableCell><TableCell><div className="flex justify-end"><Button variant="ghost" size="icon" title="Historico" onClick={() => void openHistory(record)}><History className="size-4" /></Button>{record.parcela_id ? <Button variant="ghost" size="icon" title="Registrar recebimento" onClick={() => openPayment(record)}><Banknote className="size-4" /></Button> : null}</div></TableCell></TableRow>)}</TableBody></Table><ErpPagination page={page} pageSize={50} total={totalRecords} onPageChange={setPage} /></div>

    <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Registrar recebimento</DialogTitle></DialogHeader><div className="grid gap-4 py-2 md:grid-cols-2"><FormInput label="Valor principal" value={paymentAmount} onChange={setPaymentAmount} type="number" /><FormInput label="Data do recebimento" value={paymentDate} onChange={setPaymentDate} type="date" /><FormSelect label="Conta de recebimento" value={financialAccountId} onChange={setFinancialAccountId} options={catalogs.financialAccounts} /><FormSelect label="Forma de recebimento" value={paymentMethodId} onChange={setPaymentMethodId} options={catalogs.paymentMethods} /><FormInput label="Juros" value={interest} onChange={setInterest} type="number" /><FormInput label="Multa" value={fine} onChange={setFine} type="number" /><FormInput label="Desconto" value={discount} onChange={setDiscount} type="number" /><FormInput label="Tarifa" value={fee} onChange={setFee} type="number" /><div className="md:col-span-2 rounded-md bg-gray-50 p-4"><p className="text-xs text-gray-500">Entrada liquida na conta</p><p className="mt-1 text-xl font-semibold">{currency(cashIn)}</p></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancelar</Button><Button disabled={saving} onClick={() => void savePayment()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Confirmar recebimento</Button></div></DialogContent></Dialog>

    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Historico de recebimentos</DialogTitle></DialogHeader><div className="max-h-[60vh] overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Parcela</TableHead><TableHead>Conta</TableHead><TableHead>Metodo</TableHead><TableHead className="text-right">Liquido</TableHead><TableHead>Situacao</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>{payments.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-500">Nenhum recebimento registrado.</TableCell></TableRow> : payments.map((payment) => { const reversed = Boolean(payment.estornado_em || payment.estorno_de_pagamento_id); return <TableRow key={payment.id}><TableCell>{payment.data_pagamento}</TableCell><TableCell>{payment.numero_parcela}</TableCell><TableCell>{payment.conta_financeira || '-'}</TableCell><TableCell>{payment.metodo_pagamento || '-'}</TableCell><TableCell className="text-right">{currency(payment.valor_liquido)}</TableCell><TableCell><Badge variant="outline">{payment.estorno_de_pagamento_id ? 'Estorno' : payment.estornado_em ? 'Estornado' : 'Confirmado'}</Badge></TableCell><TableCell>{!reversed ? <Button variant="ghost" size="icon" title="Estornar" disabled={saving} onClick={() => void reversePayment(payment)}><RotateCcw className="size-4" /></Button> : null}</TableCell></TableRow> })}</TableBody></Table></div></DialogContent></Dialog>
  </div>
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) { return <div className="bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className={`mt-1 text-xl font-semibold ${danger ? 'text-rose-700' : ''}`}>{value}</p></div> }
function FormInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div className="grid gap-2"><Label>{label}</Label><Input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></div> }
function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Option[] }) { return <div className="grid gap-2"><Label>{label}</Label><select value={value} className="h-10 rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => onChange(event.target.value)}><option value="">Selecione</option>{options.map((option) => <option key={option.id} value={option.id}>{option.nome}</option>)}</select></div> }
