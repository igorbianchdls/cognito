'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpModuleWorkspaceTabs, ErpStatusBadge, ErpWorkspaceHeader } from '@/products/erp/frontend/components/ErpWorkspaceChrome'
import {
  CatalogPicker, DialogActions, DialogError, ErrorBanner, Field, NativeSelect, currency, erpJson, errorMessage, inputClass, percent,
  primaryButtonClass, toNumber, type Option,
} from '@/products/erp/frontend/modules/vendas/commercialUi'

type Method = {
  id: string; nome: string; tipo: string; ativo: boolean; versao: number; taxa_percentual: number; taxa_fixa: number; prazo_repasse_dias: number
  repasse: 'unico' | 'parcelado'; conta_maquininha_id: string | null; conta_maquininha: string | null; conta_destino_id: string | null; conta_destino: string | null
  categoria_taxa_id: string | null; categoria_taxa: string | null; adquirente_id: string | null; adquirente: string | null
}
type Account = { id: string; nome: string; tipo: string }
const TYPES: Option[] = [
  { id: 'pix', nome: 'Pix' }, { id: 'boleto', nome: 'Boleto' }, { id: 'dinheiro', nome: 'Dinheiro' }, { id: 'cartao_credito', nome: 'Cartão de crédito' },
  { id: 'cartao_debito', nome: 'Cartão de débito' }, { id: 'transferencia', nome: 'Transferência' }, { id: 'deposito', nome: 'Depósito' },
  { id: 'cheque', nome: 'Cheque' }, { id: 'outro', nome: 'Outro' },
]
const typeLabel = (tipo: string) => TYPES.find(item => item.id === tipo)?.nome || tipo

// Formas de pagamento. No cartão, a "conta da maquininha" faz o ERP lançar a taxa e prever os repasses ao banco
// (que a conciliação confirma quando o crédito aparece no extrato).
export function PaymentMethodsPage() {
  const [records, setRecords] = useState<Method[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Partial<Method> | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [methods, accountPage] = await Promise.all([
        erpJson<{ records: Method[] }>('/api/erp/financeiro/formas-pagamento'),
        erpJson<{ records: Account[] }>('/api/erp/contas-financeiras?pageSize=100'),
      ])
      setRecords(methods.records); setAccounts(accountPage.records.map(row => ({ id: String(row.id), nome: row.nome, tipo: String(row.tipo).toLowerCase() })))
    } catch (loadError) { setError(errorMessage(loadError, 'Não foi possível carregar as formas de pagamento.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  return <div className="flex min-h-full min-w-0 flex-col bg-white">
    <ErpWorkspaceHeader section="Financeiro" title="Formas de pagamento" menuItems={[{ label: 'Atualizar dados', onSelect: () => void load() }]}
      primaryAction={<Button className={primaryButtonClass} onClick={() => setEditing({ tipo: 'pix', ativo: true, repasse: 'unico', taxa_percentual: 0, taxa_fixa: 0, prazo_repasse_dias: 0 })}><Plus className="size-4" />Nova forma</Button>} />
    <ErpModuleWorkspaceTabs sectionId="financeiro" moduleId="formas-pagamento" />
    <ErrorBanner error={error} />
    <div className="min-h-[300px] min-w-0 flex-1 overflow-x-auto"><Table className="erp-workspace-table min-w-[900px] border-b border-[#e7e7e4]">
      <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]"><TableHead className="erp-table-identity-heading">Forma</TableHead><TableHead>Tipo</TableHead><TableHead>Maquininha</TableHead><TableHead className="text-right">Taxa</TableHead><TableHead>Repasse</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
      <TableBody>
        {loading ? <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>
          : records.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-gray-500">Nenhuma forma de pagamento.</TableCell></TableRow>
          : records.map(record => <TableRow key={record.id} className="cursor-pointer hover:bg-[#fafaf8]" onClick={() => setEditing(record)}>
            <TableCell className="font-medium">{record.nome}</TableCell><TableCell>{typeLabel(record.tipo)}</TableCell>
            <TableCell>{record.conta_maquininha ? `${record.conta_maquininha} → ${record.conta_destino}` : '—'}</TableCell>
            <TableCell className="text-right tabular-nums">{record.conta_maquininha ? `${percent(record.taxa_percentual)}${record.taxa_fixa ? ` + ${currency(record.taxa_fixa)}` : ''}` : '—'}</TableCell>
            <TableCell>{record.conta_maquininha ? `${record.repasse === 'parcelado' ? 'Parcelado' : 'De uma vez'} · D+${record.prazo_repasse_dias}` : '—'}</TableCell>
            <TableCell><ErpStatusBadge status={record.ativo ? 'ativo' : 'inativo'} /></TableCell>
          </TableRow>)}
      </TableBody></Table></div>
    {editing ? <MethodDialog initial={editing} accounts={accounts} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load() }} /> : null}
  </div>
}

function MethodDialog({ initial, accounts, onClose, onSaved }: { initial: Partial<Method>; accounts: Account[]; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState({
    nome: initial.nome || '', tipo: initial.tipo || 'pix', ativo: initial.ativo !== false, usaMaquininha: Boolean(initial.conta_maquininha_id),
    conta_maquininha_id: initial.conta_maquininha_id || '', conta_destino_id: initial.conta_destino_id || '',
    taxa_percentual: String(initial.taxa_percentual ?? 0), taxa_fixa: String(initial.taxa_fixa ?? 0), prazo_repasse_dias: String(initial.prazo_repasse_dias ?? 0),
    repasse: initial.repasse || 'unico',
  })
  const [category, setCategory] = useState<Option | null>(initial.categoria_taxa_id ? { id: initial.categoria_taxa_id, nome: initial.categoria_taxa || '' } : null)
  const [acquirer, setAcquirer] = useState<Option | null>(initial.adquirente_id ? { id: initial.adquirente_id, nome: initial.adquirente || '' } : null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const update = (patch: Partial<typeof values>) => setValues(current => ({ ...current, ...patch }))
  const card = values.tipo === 'cartao_credito' || values.tipo === 'cartao_debito'
  const machines = accounts.filter(account => account.tipo === 'maquininha'), banks = accounts.filter(account => account.tipo !== 'maquininha')
  const example = (() => {
    const gross = 100, fee = gross * (toNumber(values.taxa_percentual) || 0) / 100 + (toNumber(values.taxa_fixa) || 0)
    return `Venda de ${currency(gross)}: taxa ${currency(fee)}, ${currency(gross - fee)} no banco em D+${values.prazo_repasse_dias || 0}${values.repasse === 'parcelado' ? ' (dividido pelas parcelas, a cada 30 dias)' : ''}.`
  })()

  async function save() {
    setSaving(true); setError(null)
    const machine = card && values.usaMaquininha
    try {
      await erpJson('/api/erp/financeiro/formas-pagamento', { method: 'POST', body: {
        ...(initial.id ? { id: Number(initial.id), expectedVersion: Number(initial.versao) } : {}),
        values: {
          nome: values.nome, tipo: values.tipo, status: values.ativo ? 'ativo' : 'inativo',
          taxa_percentual: machine ? toNumber(values.taxa_percentual) ?? 0 : 0, taxa_fixa: machine ? toNumber(values.taxa_fixa) ?? 0 : 0,
          prazo_repasse_dias: machine ? Math.floor(toNumber(values.prazo_repasse_dias) ?? 0) : 0, repasse: values.repasse,
          conta_maquininha_id: machine ? Number(values.conta_maquininha_id) || null : null, conta_destino_id: machine ? Number(values.conta_destino_id) || null : null,
          categoria_taxa_id: machine && category ? Number(category.id) : null, adquirente_id: machine && acquirer ? Number(acquirer.id) : null,
        },
      } })
      onSaved()
    } catch (saveError) { setError(errorMessage(saveError, 'Não foi possível salvar a forma de pagamento.')) }
    finally { setSaving(false) }
  }

  return <Dialog open onOpenChange={value => { if (!value) onClose() }}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
    <DialogHeader><DialogTitle>{initial.id ? 'Editar forma de pagamento' : 'Nova forma de pagamento'}</DialogTitle></DialogHeader>
    <div className="grid gap-4 py-2 md:grid-cols-2">
      <Field label="Nome"><input className={inputClass} value={values.nome} onChange={event => update({ nome: event.target.value })} placeholder="Ex.: Crédito Stone" /></Field>
      <Field label="Tipo"><NativeSelect label="Tipo" value={values.tipo} onChange={tipo => update({ tipo })} options={TYPES} /></Field>
      <label className="flex items-center gap-2 text-sm"><Switch checked={values.ativo} onCheckedChange={ativo => update({ ativo })} />Ativa</label>
      {card ? <label className="flex items-center gap-2 text-sm md:col-span-2"><Switch checked={values.usaMaquininha} onCheckedChange={usaMaquininha => update({ usaMaquininha })} />Recebe pela maquininha (o ERP lança a taxa e prevê o repasse ao banco)</label> : null}
      {card && values.usaMaquininha ? <>
        <Field label="Conta da maquininha"><NativeSelect label="Conta da maquininha" value={values.conta_maquininha_id} onChange={id => update({ conta_maquininha_id: id })} options={machines} placeholder={machines.length ? 'Selecione' : 'Cadastre uma conta do tipo Maquininha'} /></Field>
        <Field label="Banco que recebe o repasse"><NativeSelect label="Banco" value={values.conta_destino_id} onChange={id => update({ conta_destino_id: id })} options={banks} placeholder="Selecione" /></Field>
        <Field label="Taxa (%)"><input className={inputClass} inputMode="decimal" value={values.taxa_percentual} onChange={event => update({ taxa_percentual: event.target.value })} /></Field>
        <Field label="Taxa fixa por venda (R$)"><input className={inputClass} inputMode="decimal" value={values.taxa_fixa} onChange={event => update({ taxa_fixa: event.target.value })} /></Field>
        <Field label="Prazo do repasse (dias)"><input className={inputClass} inputMode="numeric" value={values.prazo_repasse_dias} onChange={event => update({ prazo_repasse_dias: event.target.value })} /></Field>
        <Field label="Repasse"><select aria-label="Repasse" className={inputClass} value={values.repasse} onChange={event => update({ repasse: event.target.value as 'unico' })}>
          <option value="unico">De uma vez (antecipado)</option><option value="parcelado">Parcelado (um por parcela do cartão)</option></select></Field>
        <Field label="Categoria da taxa (despesa)" className="md:col-span-2"><CatalogPicker type="categoria" categoryType="despesa" label="categoria" value={category} onChange={setCategory} /></Field>
        <Field label="Adquirente (fornecedor da taxa)" className="md:col-span-2"><CatalogPicker type="fornecedor" label="adquirente" value={acquirer} onChange={setAcquirer} placeholder="Ex.: Stone, Cielo, Mercado Pago" /></Field>
        <p className="text-sm text-gray-600 md:col-span-2">{example}</p>
      </> : null}
      <div className="md:col-span-2"><DialogError error={error} /></div>
    </div>
    <DialogActions onCancel={onClose} onConfirm={() => void save()} saving={saving} label="Salvar"
      disabled={!values.nome.trim() || (card && values.usaMaquininha && (!values.conta_maquininha_id || !values.conta_destino_id || !category || !acquirer))} />
  </DialogContent></Dialog>
}
