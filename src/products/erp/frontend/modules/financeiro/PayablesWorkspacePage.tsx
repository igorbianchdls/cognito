'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Banknote, History, Loader2, Plus, RefreshCw, RotateCcw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ErpPagination } from '@/products/erp/frontend/components/ErpPagination'
import { ErpAsyncCatalogSelect } from '@/products/erp/frontend/components/ErpAsyncCatalogSelect'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'

type Option = { id: string; nome: string; documento?: string; padrao?: boolean }
type Catalogs = { suppliers: Option[]; categories: Option[]; costCenters: Option[]; financialAccounts: Option[]; paymentMethods: Option[] }
type Payable = {
  id: string; conta_id: string; parcela_id: string; descricao: string; fornecedor: string;
  parcela: number; vencimento: string; valor: number; valor_pago: number; saldo: number;
  origem: string; tipo_lancamento: string; categoria: string; conta_financeira: string; status: string;
}
type Payment = { id: string; data_pagamento: string; valor: number; juros: number; multa: number; desconto: number; taxa: number; valor_liquido: number; estornado_em: string; estorno_de_pagamento_id: string; numero_parcela: number; conta_financeira: string; metodo_pagamento: string }

const emptyCatalogs: Catalogs = { suppliers: [], categories: [], costCenters: [], financialAccounts: [], paymentMethods: [] }
const today = () => new Date().toISOString().slice(0, 10)
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

async function parseResponse<T>(response: Response): Promise<T> {
  return parseErpResponse<T>(response)
}

function statusTone(status: string) {
  if (status === 'pago') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'vencido') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (status === 'cancelado') return 'border-gray-200 bg-gray-100 text-gray-500'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

export function PayablesWorkspacePage({ purchaseOnly = false }: { purchaseOnly?: boolean }) {
  const [records, setRecords] = useState<Payable[]>([])
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [catalogs, setCatalogs] = useState<Catalogs>(emptyCatalogs)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [origin, setOrigin] = useState(purchaseOnly ? 'compra' : '')
  const [launchType, setLaunchType] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      const [payablesResponse, catalogsResponse] = await Promise.all([
        fetch(`/api/erp/contas-a-pagar${params.toString() ? `?${params}` : ''}`, { cache: 'no-store' }),
        fetch('/api/erp/compras/catalogos', { cache: 'no-store' }),
      ])
      const payablesPage = await parseResponse<{ records: Payable[]; total: number }>(payablesResponse)
      setRecords(payablesPage.records); setTotalRecords(payablesPage.total)
      setCatalogs(await parseResponse<Catalogs>(catalogsResponse))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar as contas a pagar.')
    } finally { setLoading(false) }
  }, [launchType, origin, page, query, status])

  useEffect(() => { void loadData() }, [loadData])

  const summary = useMemo(() => ({
    open: records.filter((record) => !['pago', 'cancelado'].includes(record.status)).reduce((sum, record) => sum + record.saldo, 0),
    overdue: records.filter((record) => record.status === 'vencido').reduce((sum, record) => sum + record.saldo, 0),
    paid: records.reduce((sum, record) => sum + record.valor_pago, 0),
  }), [records])

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
          recorrencia: repeat ? { frequencia: frequency, intervalo: 1, quantidade_ocorrencias: occurrences } : undefined,
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
    if (!selected) return
    setSaving(true); setError(null)
    try {
      await parseResponse(await fetch(`/api/erp/contas-pagar-parcelas/${selected.parcela_id}/baixar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ values: {
          valor: paymentAmount, data_pagamento: paymentDate, conta_financeira_id: financialAccountId,
          metodo_pagamento_id: paymentMethodId, juros: interest, multa: fine, desconto: discount, taxa: fee,
        } }),
      }))
      setPaymentOpen(false); await loadData()
    } catch (paymentError) { setError(paymentError instanceof Error ? paymentError.message : 'Nao foi possivel registrar o pagamento.') }
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

  return <div className="flex min-h-full flex-col gap-5">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-medium text-gray-500">ERP / {purchaseOnly ? 'Compras' : 'Financeiro'}</p><h1 className="mt-1 text-2xl font-semibold text-gray-950">{purchaseOnly ? 'Parcelas a pagar' : 'Contas a pagar'}</h1></div><div className="flex gap-2"><Button variant="outline" size="icon" title="Atualizar" onClick={() => void loadData()}><RefreshCw className="size-4" /></Button>{!purchaseOnly ? <Button onClick={openExpense}><Plus className="size-4" />Nova despesa</Button> : null}</div></div>
    <div className="grid gap-px overflow-hidden rounded-md border bg-gray-200 sm:grid-cols-3"><Metric label="Saldo nesta pagina" value={currency(summary.open)} /><Metric label="Vencido nesta pagina" value={currency(summary.overdue)} danger /><Metric label="Pago nesta pagina" value={currency(summary.paid)} /></div>
    <div className="flex flex-wrap gap-2 border-y py-3"><Input value={query} placeholder="Buscar descricao, fornecedor ou documento" className="min-w-64 flex-1 md:max-w-sm" onChange={(event) => { setQuery(event.target.value); setPage(1) }} /><Filter value={status} onChange={(value) => { setStatus(value); setPage(1) }} label="Todas as situacoes" options={[['aberto','Aberto'],['parcial','Parcial'],['vencido','Vencido'],['pago','Pago'],['cancelado','Cancelado']]} />{!purchaseOnly ? <Filter value={origin} onChange={(value) => { setOrigin(value); setPage(1) }} label="Todas as origens" options={[['manual','Manual'],['compra','Compra'],['recorrencia','Recorrencia'],['xml','XML'],['integracao','Integracao']]} /> : null}<Filter value={launchType} onChange={(value) => { setLaunchType(value); setPage(1) }} label="Previsao e efetivo" options={[['previsao','Previsao'],['efetivo','Efetivo']]} /></div>
    {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    <div className="overflow-hidden rounded-md border bg-white"><Table><TableHeader><TableRow className="bg-gray-50"><TableHead>Vencimento</TableHead><TableHead>Descricao</TableHead><TableHead>Fornecedor</TableHead><TableHead>Categoria</TableHead><TableHead>Origem</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Situacao</TableHead><TableHead className="w-24" /></TableRow></TableHeader><TableBody>
      {loading ? <TableRow><TableCell colSpan={9} className="h-32 text-center text-gray-500"><Loader2 className="mx-auto mb-2 size-5 animate-spin" />Carregando</TableCell></TableRow> : records.length === 0 ? <TableRow><TableCell colSpan={9} className="h-32 text-center text-gray-500">Nenhum lancamento encontrado.</TableCell></TableRow> : records.map((record) => <TableRow key={record.parcela_id}><TableCell>{record.vencimento}</TableCell><TableCell><p className="font-medium">{record.descricao}</p><p className="text-xs text-gray-500">Parcela {record.parcela}</p></TableCell><TableCell>{record.fornecedor}</TableCell><TableCell>{record.categoria || '-'}</TableCell><TableCell><Badge variant="outline">{record.tipo_lancamento === 'previsao' ? 'Previsao' : record.origem}</Badge></TableCell><TableCell className="text-right">{currency(record.valor)}</TableCell><TableCell className="text-right font-medium">{currency(record.saldo)}</TableCell><TableCell><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusTone(record.status)}`}>{record.status}</span></TableCell><TableCell><div className="flex justify-end"><Button variant="ghost" size="icon" title="Historico" onClick={() => void openHistory(record)}><History className="size-4" /></Button>{!['pago','cancelado'].includes(record.status) ? <Button variant="ghost" size="icon" title="Registrar pagamento" onClick={() => openPayment(record)}><Banknote className="size-4" /></Button> : null}</div></TableCell></TableRow>)}
    </TableBody></Table><ErpPagination page={page} pageSize={50} total={totalRecords} onPageChange={setPage} /></div>

    <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Nova despesa</DialogTitle></DialogHeader><div className="grid gap-4 py-2 md:grid-cols-2">
      <ErpAsyncCatalogSelect label="Fornecedor *" type="fornecedor" value={supplierId} selectedLabel={catalogs.suppliers.find((item) => item.id === supplierId)?.nome} onChange={(value, record) => { setSupplierId(value); setCatalogs((current) => ({ ...current, suppliers: [record, ...current.suppliers.filter((item) => item.id !== record.id)] })) }} /><FormInput label="Descricao *" value={description} onChange={setDescription} />
      <FormInput label="Valor *" value={amount} onChange={setAmount} type="number" /><FormSelect label="Categoria *" value={categoryId} onChange={setCategoryId} options={catalogs.categories.map((item) => [item.id, item.nome])} />
      <FormInput label="Competencia" value={competence} onChange={setCompetence} type="date" /><FormInput label="Primeiro vencimento" value={dueDate} onChange={setDueDate} type="date" />
      <FormSelect label="Centro de custo" value={costCenterId} onChange={setCostCenterId} options={catalogs.costCenters.map((item) => [item.id, item.nome])} /><FormInput label="Parcelas" value={String(installmentCount)} onChange={(value) => setInstallmentCount(Math.min(48, Math.max(1, Number(value))))} type="number" />
      <FormSelect label="Forma de pagamento" value={paymentMethodId} onChange={setPaymentMethodId} options={catalogs.paymentMethods.map((item) => [item.id, item.nome])} /><FormSelect label="Conta de pagamento" value={financialAccountId} onChange={setFinancialAccountId} options={catalogs.financialAccounts.map((item) => [item.id, item.nome])} />
      <div className="flex items-center gap-3"><Switch checked={repeat} onCheckedChange={setRepeat} /><Label>Repetir lancamento</Label></div>{repeat ? <div className="grid grid-cols-2 gap-2"><Filter value={frequency} onChange={setFrequency} label="Frequencia" options={[['dia','Dia'],['semana','Semana'],['mes','Mes'],['ano','Ano']]} /><Input type="number" min="1" max="366" value={occurrences} onChange={(event) => setOccurrences(Number(event.target.value))} /></div> : <div />}
      <div className="grid gap-2 md:col-span-2"><Label>Observacoes</Label><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
    </div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setExpenseOpen(false)}>Cancelar</Button><Button disabled={saving} onClick={() => void saveExpense()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar despesa</Button></div></DialogContent></Dialog>

    <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>Registrar pagamento</DialogTitle></DialogHeader><div className="grid gap-4 py-2 md:grid-cols-2"><FormInput label="Valor principal" value={paymentAmount} onChange={setPaymentAmount} type="number" /><FormInput label="Data do pagamento" value={paymentDate} onChange={setPaymentDate} type="date" /><FormSelect label="Conta de pagamento" value={financialAccountId} onChange={setFinancialAccountId} options={catalogs.financialAccounts.map((item) => [item.id, item.nome])} /><FormSelect label="Forma de pagamento" value={paymentMethodId} onChange={setPaymentMethodId} options={catalogs.paymentMethods.map((item) => [item.id, item.nome])} /><FormInput label="Juros" value={interest} onChange={setInterest} type="number" /><FormInput label="Multa" value={fine} onChange={setFine} type="number" /><FormInput label="Desconto" value={discount} onChange={setDiscount} type="number" /><FormInput label="Tarifa" value={fee} onChange={setFee} type="number" /><div className="md:col-span-2 rounded-md bg-gray-50 p-4"><p className="text-xs text-gray-500">Saida da conta financeira</p><p className="mt-1 text-xl font-semibold">{currency(cashOut)}</p></div></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancelar</Button><Button disabled={saving} onClick={() => void savePayment()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Confirmar pagamento</Button></div></DialogContent></Dialog>

    <Dialog open={historyOpen} onOpenChange={setHistoryOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Historico de pagamentos</DialogTitle></DialogHeader><div className="max-h-[60vh] overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Parcela</TableHead><TableHead>Conta</TableHead><TableHead>Metodo</TableHead><TableHead className="text-right">Liquido</TableHead><TableHead>Situacao</TableHead><TableHead className="w-12" /></TableRow></TableHeader><TableBody>{payments.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-500">Nenhum pagamento registrado.</TableCell></TableRow> : payments.map((payment) => { const reversed = Boolean(payment.estornado_em || payment.estorno_de_pagamento_id); return <TableRow key={payment.id}><TableCell>{payment.data_pagamento}</TableCell><TableCell>{payment.numero_parcela}</TableCell><TableCell>{payment.conta_financeira || '-'}</TableCell><TableCell>{payment.metodo_pagamento || '-'}</TableCell><TableCell className="text-right">{currency(payment.valor_liquido)}</TableCell><TableCell><Badge variant="outline">{payment.estorno_de_pagamento_id ? 'Estorno' : payment.estornado_em ? 'Estornado' : 'Confirmado'}</Badge></TableCell><TableCell>{!reversed ? <Button variant="ghost" size="icon" title="Estornar" disabled={saving} onClick={() => void reversePayment(payment)}><RotateCcw className="size-4" /></Button> : null}</TableCell></TableRow> })}</TableBody></Table></div></DialogContent></Dialog>
  </div>
}

function Metric({ label, value, danger }: { label: string; value: string; danger?: boolean }) { return <div className="bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className={`mt-1 text-xl font-semibold ${danger ? 'text-rose-700' : ''}`}>{value}</p></div> }
function Filter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[][] }) { return <select value={value} className="h-10 rounded-md bg-gray-50 px-3 text-sm" onChange={(event) => onChange(event.target.value)}><option value="">{label}</option>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select> }
function FormInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div className="grid gap-2"><Label>{label}</Label><Input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></div> }
function FormSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) { return <div className="grid gap-2"><Label>{label}</Label><Filter value={value} onChange={onChange} label="Selecione" options={options} /></div> }
