'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreditCard, Loader2, Plus, RotateCcw, WalletCards } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErpMutation } from '@/products/erp/frontend/services/erpMutation'
import { ErpHistoryPanel, ErpBillingHistory } from '@/products/erp/frontend/components/ErpHistoryPanel'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'

type Option = { id: string; nome: string; padrao?: boolean }
export type FinancialInstallment = {
  parcela_id: string; conta_id: string; entidade_id: string; saldo: number; valor: number
  valor_pago: number; credito: number; renegociado: number; tipo_lancamento?: string
}
type Composition = { valor: number; principal_pago: number; credito: number; renegociado: number; saldo: number; juros_realizados: number; multa_realizada: number; desconto_realizado: number; taxa_realizada: number; dinheiro_movimentado: number }
type Advance = { id: string; saldo: number; valor: number; data_movimento: string; conta_financeira_id: string; metodo_pagamento_id: string; motivo: string }
type Application = { id: string; adiantamento_id: string; valor: number; data_aplicacao: string; motivo: string; reversao_de_id: string; revertida: boolean }
type Agreement = { id: string; numero: string; data_acordo: string; status: string; desconto: number; encargos: number; papel: string; valor: number }
type Allocation = { categoria_id: string; centro_custo_id: string; valor: string }

const today = () => new Date().toISOString().slice(0, 10)
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))

export function FinancialInstallmentActions({ record, side, entityName, accounts, methods, categories = [], costCenters = [], canManage, canReverse, onChanged }: {
  record: FinancialInstallment; side: 'receber' | 'pagar'; entityName: string; accounts: Option[]; methods: Option[]
  categories?: Option[]; costCenters?: Option[]; canManage: boolean; canReverse: boolean; onChanged: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'composicao' | 'adiantamento' | 'aplicacao' | 'devolucao' | 'renegociacao' | 'rateio'>('composicao')
  const [composition, setComposition] = useState<Composition | null>(null)
  const [advances, setAdvances] = useState<Advance[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutation] = useState(() => new ErpMutation(undefined, true))
  const [advanceId, setAdvanceId] = useState('')
  const [amount, setAmount] = useState('')
  const [operationDate, setOperationDate] = useState(today())
  const [accountId, setAccountId] = useState('')
  const [methodId, setMethodId] = useState('')
  const [reason, setReason] = useState('')
  const [agreementNumber, setAgreementNumber] = useState('')
  const [dueDate, setDueDate] = useState(today())
  const [discount, setDiscount] = useState('0')
  const [charges, setCharges] = useState('0')
  const [adjustmentCategoryId, setAdjustmentCategoryId] = useState('')
  const [allocations, setAllocations] = useState<Allocation[]>([{ categoria_id: '', centro_custo_id: '', valor: '' }])

  const load = useCallback(async () => {
    const params = new URLSearchParams({ lado: side, parcela_id: record.parcela_id })
    const advanceParams = new URLSearchParams({ lado: side, entidade_id: record.entidade_id })
    const [position, advanceBody, applicationBody, agreementBody] = await Promise.all([
      fetch(`/api/erp/financeiro/composicao?${params}`, { cache: 'no-store' }).then((response) => parseErpResponse<Composition>(response)),
      fetch(`/api/erp/financeiro/adiantamentos?${advanceParams}`, { cache: 'no-store' }).then((response) => parseErpResponse<{ records: Advance[] }>(response)),
      fetch(`/api/erp/financeiro/aplicacoes?${params}`, { cache: 'no-store' }).then((response) => parseErpResponse<{ records: Application[] }>(response)),
      fetch(`/api/erp/financeiro/renegociacoes?${params}`, { cache: 'no-store' }).then((response) => parseErpResponse<{ records: Agreement[] }>(response)),
    ])
    setComposition(position); setAdvances(advanceBody.records); setApplications(applicationBody.records); setAgreements(agreementBody.records)
  }, [record.entidade_id, record.parcela_id, side])

  useEffect(() => { if (open) void load().catch((cause) => setError(cause instanceof Error ? cause.message : 'Nao foi possivel carregar a composicao.')) }, [load, open])

  function start(nextMode: typeof mode) {
    setMode(nextMode); setError(null); setAmount(String(composition?.saldo ?? record.saldo)); setOperationDate(today())
    setAccountId(accounts.find((item) => item.padrao)?.id || ''); setMethodId(''); setReason('')
    setAdvanceId(advances.find((item) => Number(item.saldo) > 0)?.id || '')
    setAgreementNumber(`AC-${Date.now()}`); setDueDate(today()); setDiscount('0'); setCharges('0'); setAdjustmentCategoryId('')
    setAllocations([{ categoria_id: '', centro_custo_id: '', valor: String(record.valor) }])
  }

  async function submit(endpoint: string, values: Record<string, unknown>) {
    setBusy(true); setError(null)
    try {
      await mutation.submit(`/api/erp/financeiro/${endpoint}`, { values })
      await load(); await onChanged(); setMode('composicao')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Nao foi possivel concluir a operacao.') }
    finally { setBusy(false) }
  }

  async function reverseApplication(application: Application) {
    setBusy(true); setError(null)
    try {
      await new ErpMutation(undefined, true).submit('/api/erp/financeiro/reverter-aplicacao', { values: { aplicacao_id: application.id, data_aplicacao: today(), motivo: 'Reversao solicitada no financeiro' } })
      await load(); await onChanged()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Nao foi possivel reverter a aplicacao.') }
    finally { setBusy(false) }
  }

  async function reverseAgreement(agreement: Agreement) {
    setBusy(true); setError(null)
    try {
      await parseErpResponse(await fetch('/api/erp/financeiro/reverter-renegociacao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: { renegociacao_id: agreement.id, motivo: 'Reversao solicitada no financeiro' } }),
      }))
      await load(); await onChanged()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Nao foi possivel reverter a renegociacao.') }
    finally { setBusy(false) }
  }

  const destinationValue = useMemo(() => Math.max(0, Number(composition?.saldo ?? record.saldo) - Number(discount || 0) + Number(charges || 0)), [charges, composition?.saldo, discount, record.saldo])
  const selectedAdvance = advances.find((item) => item.id === advanceId)

  return <>
    <Button variant="ghost" size="icon" title="Composicao e operacoes financeiras" onClick={() => { setOpen(true); setMode('composicao'); setError(null) }}><WalletCards className="size-4" /></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>Composicao financeira — {entityName}</DialogTitle></DialogHeader>

      {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {mode === 'composicao' ? <>
        <div className="grid gap-px overflow-hidden rounded-md border bg-gray-200 sm:grid-cols-3"><Metric label="Principal" value={composition?.valor} /><Metric label="Principal em dinheiro" value={composition?.principal_pago} /><Metric label="Credito aplicado" value={composition?.credito} /><Metric label="Renegociado" value={composition?.renegociado} /><Metric label="Dinheiro movimentado" value={composition?.dinheiro_movimentado} /><Metric label="Saldo restante" value={composition?.saldo} strong /></div>
        <div className="grid gap-2 rounded-md bg-gray-50 p-4 text-sm sm:grid-cols-4"><Metric label="Juros realizados" value={composition?.juros_realizados} compact /><Metric label="Multa realizada" value={composition?.multa_realizada} compact /><Metric label="Descontos realizados" value={composition?.desconto_realizado} compact /><Metric label="Taxas realizadas" value={composition?.taxa_realizada} compact /></div>
        {applications.length ? <div className="rounded-md border"><p className="border-b px-3 py-2 text-sm font-medium">Aplicacoes de credito</p>{applications.map((item) => <div key={item.id} className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-0"><span>{item.data_aplicacao} · {currency(item.valor)} · {item.reversao_de_id ? 'Reversao' : item.motivo}</span>{canReverse && !item.reversao_de_id && !item.revertida ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => void reverseApplication(item)}><RotateCcw className="size-4" />Reverter</Button> : null}</div>)}</div> : null}
        {agreements.length ? <div className="rounded-md border"><p className="border-b px-3 py-2 text-sm font-medium">Renegociacoes</p>{agreements.map((item) => <div key={`${item.id}-${item.papel}`} className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-0"><span>{item.numero} · {item.papel} · {currency(item.valor)} · {item.status}</span>{canReverse && item.status === 'efetivada' ? <Button size="sm" variant="ghost" disabled={busy} onClick={() => void reverseAgreement(item)}><RotateCcw className="size-4" />Reverter acordo</Button> : null}</div>)}</div> : null}
        {canManage ? <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => start('adiantamento')}><Plus className="size-4" />Novo adiantamento</Button><Button size="sm" variant="outline" disabled={!advances.some((item) => Number(item.saldo) > 0) || !Number(composition?.saldo)} onClick={() => start('aplicacao')}><CreditCard className="size-4" />Aplicar credito</Button><Button size="sm" variant="outline" disabled={!advances.some((item) => Number(item.saldo) > 0)} onClick={() => start('devolucao')}>Devolver credito</Button><Button size="sm" variant="outline" disabled={!Number(composition?.saldo)} onClick={() => start('renegociacao')}>Renegociar saldo</Button><Button size="sm" variant="outline" onClick={() => start('rateio')}>Atualizar rateio</Button></div> : null}
      </> : <div className="grid gap-4 py-2 sm:grid-cols-2">
        {mode === 'adiantamento' ? <><Field label="Valor" value={amount} onChange={setAmount} type="number" /><Field label="Data do movimento" value={operationDate} onChange={setOperationDate} type="date" /><Select label="Conta financeira" value={accountId} onChange={setAccountId} options={accounts} /><Select label="Metodo" value={methodId} onChange={setMethodId} options={methods} optional /></> : null}
        {mode === 'aplicacao' || mode === 'devolucao' ? <><Select label="Adiantamento" value={advanceId} onChange={setAdvanceId} options={advances.filter((item) => Number(item.saldo) > 0).map((item) => ({ id: item.id, nome: `${currency(item.saldo)} disponivel · ${item.data_movimento}` }))} /><Field label="Valor" value={amount} onChange={setAmount} type="number" /><Field label={mode === 'aplicacao' ? 'Data da aplicacao' : 'Data da devolucao'} value={operationDate} onChange={setOperationDate} type="date" /></> : null}
        {mode === 'renegociacao' ? <><Field label="Numero do acordo" value={agreementNumber} onChange={setAgreementNumber} /><Field label="Data do acordo" value={operationDate} onChange={setOperationDate} type="date" /><Field label="Novo vencimento" value={dueDate} onChange={setDueDate} type="date" /><Field label="Desconto do acordo" value={discount} onChange={setDiscount} type="number" /><Field label="Encargos do acordo" value={charges} onChange={setCharges} type="number" /><Select label="Categoria do ajuste" value={adjustmentCategoryId} onChange={setAdjustmentCategoryId} options={categories} optional /><div className="rounded-md bg-gray-50 p-3 sm:col-span-2"><p className="text-xs text-gray-500">Valor transferido para a nova parcela</p><p className="text-lg font-semibold">{currency(destinationValue)}</p></div></> : null}
        {mode === 'rateio' ? <div className="grid gap-3 sm:col-span-2">{allocations.map((item, index) => <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-3" key={index}><Select label="Categoria" value={item.categoria_id} onChange={(value) => setAllocations((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, categoria_id: value } : row))} options={categories} optional /><Select label="Centro de custo" value={item.centro_custo_id} onChange={(value) => setAllocations((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, centro_custo_id: value } : row))} options={costCenters} optional /><Field label="Valor" value={item.valor} onChange={(value) => setAllocations((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, valor: value } : row))} type="number" /></div>)}<Button size="sm" variant="outline" className="w-fit" onClick={() => setAllocations((current) => [...current, { categoria_id: '', centro_custo_id: '', valor: '' }])}><Plus className="size-4" />Adicionar divisao</Button><p className="text-sm text-gray-600">Distribuido: {currency(allocations.reduce((sum, item) => sum + Number(item.valor || 0), 0))} de {currency(record.valor)}</p></div> : null}
        {mode !== 'rateio' ? <Field label="Motivo" value={reason} onChange={setReason} className="sm:col-span-2" /> : null}
        <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="outline" onClick={() => setMode('composicao')}>Voltar</Button><Button disabled={busy} onClick={() => void (mode === 'adiantamento' ? submit('adiantamentos', { tipo: 'constituicao', entidade_id: record.entidade_id, lado: side, conta_financeira_id: accountId, metodo_pagamento_id: methodId, data_movimento: operationDate, data_credito: operationDate, valor: amount, motivo: reason }) : mode === 'aplicacao' ? submit('aplicar-adiantamento', { adiantamento_id: advanceId, parcela_id: record.parcela_id, lado: side, valor: amount, data_aplicacao: operationDate, motivo: reason }) : mode === 'devolucao' ? submit('adiantamentos', { tipo: 'devolucao', adiantamento_id: advanceId, entidade_id: record.entidade_id, lado: side, conta_financeira_id: selectedAdvance?.conta_financeira_id, metodo_pagamento_id: selectedAdvance?.metodo_pagamento_id, data_movimento: operationDate, valor: amount, motivo: reason }) : mode === 'renegociacao' ? submit('renegociar', { entidade_id: record.entidade_id, lado: side, numero: agreementNumber, data_acordo: operationDate, desconto: discount, encargos: charges, categoria_ajuste_id: adjustmentCategoryId, motivo: reason, origens: [record.parcela_id], destinos: [{ valor: destinationValue, data_vencimento: dueDate }] }) : submit('rateios', { lado: side, conta_id: record.conta_id, rateios: allocations }))}>{busy ? <Loader2 className="size-4 animate-spin" /> : null}Confirmar</Button></div>
      </div>}
      {mode === 'composicao' && <><ErpHistoryPanel kind={side === 'receber' ? 'contas-receber' : 'contas-pagar'} id={record.conta_id}/>{side === 'receber' && <ErpBillingHistory key={record.parcela_id} installmentId={record.parcela_id}/>}</>}
    </DialogContent></Dialog>
  </>
}

function Metric({ label, value, strong, compact }: { label: string; value?: number; strong?: boolean; compact?: boolean }) { return <div className={compact ? '' : 'bg-white p-3'}><p className="text-xs text-gray-500">{label}</p><p className={`${compact ? 'mt-0.5 text-sm' : 'mt-1 text-lg'} ${strong ? 'font-semibold text-blue-700' : 'font-medium'}`}>{currency(Number(value || 0))}</p></div> }
function Field({ label, value, onChange, type = 'text', className = '' }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string }) { return <label className={`grid gap-2 ${className}`}><Label>{label}</Label><Input type={type} step={type === 'number' ? '0.01' : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></label> }
function Select({ label, value, onChange, options, optional }: { label: string; value: string; onChange: (value: string) => void; options: Option[]; optional?: boolean }) { return <label className="grid gap-2"><Label>{label}</Label><select className="h-10 rounded-md bg-gray-50 px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{optional ? 'Nao informado' : 'Selecione'}</option>{options.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label> }
