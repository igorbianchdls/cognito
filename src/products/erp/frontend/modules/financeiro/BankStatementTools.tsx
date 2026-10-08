'use client'

import { useCallback, useEffect, useState } from 'react'
import { FileUp, Loader2, Plus, Scale, Trash2, Wand2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  CatalogPicker, DialogActions, DialogError, Field, NativeSelect, currency, dateLabel, erpJson, errorMessage, inputClass, type Option,
} from '@/products/erp/frontend/modules/vendas/commercialUi'

// Ferramentas da conciliação (Fase 2C): importar extrato OFX ou CSV (com mapeamento de colunas salvo por conta),
// conferir saldo extrato × ERP e regras que lançam tarifas, IOF e rendimentos automaticamente.
type Balance = { conta: string; data_extrato: string | null; saldo_extrato: number | null; saldo_erp: number | null; diferenca: number | null; pendentes: number; conciliado_ate: string | null }
type Rule = { id: string; nome: string; conta: string | null; descricao_contem: string; tipo_transacao: 'credito' | 'debito'; categoria: string; entidade: string; ativo: boolean }
type ImportResult = { imported?: number; ignored?: number; reused?: boolean; regras?: { lancadas: number; falhas: Array<{ motivo: string }> } }

export function BankStatementTools({ onChanged }: { onChanged: () => void }) {
  const [accounts, setAccounts] = useState<Option[]>([])
  const [account, setAccount] = useState('')
  const [balance, setBalance] = useState<Balance | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [importing, setImporting] = useState(false)
  const [ruleOpen, setRuleOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadRules = useCallback(async () => {
    try { setRules((await erpJson<{ records: Rule[] }>('/api/erp/conciliacao/lancamentos')).records) } catch { setRules([]) }
  }, [])
  useEffect(() => {
    erpJson<{ records: Array<{ value: string; label: string }> }>('/api/erp/operacoes/catalogos?resource=conciliacao-bancaria&source=accounts')
      .then(body => { setAccounts(body.records.map(row => ({ id: row.value, nome: row.label }))); if (body.records[0]) setAccount(current => current || body.records[0].value) })
      .catch(() => setAccounts([]))
    void loadRules()
  }, [loadRules])
  useEffect(() => {
    if (!account) return
    let active = true
    erpJson<Balance>(`/api/erp/conciliacao/lancamentos?saldo_conta=${account}`).then(body => { if (active) setBalance(body) }).catch(() => { if (active) setBalance(null) })
    return () => { active = false }
  }, [account, message])

  async function applyRules() {
    setBusy(true); setError(null)
    try {
      const result = await erpJson<{ lancadas: number; falhas: Array<{ motivo: string }> }>(`/api/erp/conciliacao/lancamentos?aplicar=1${account ? `&conta=${account}` : ''}`, { method: 'POST', body: {} })
      setMessage(`${result.lancadas} transação(ões) lançada(s) pelas regras.${result.falhas.length ? ` ${result.falhas.length} não puderam ser lançadas: ${result.falhas[0].motivo}` : ''}`)
      onChanged()
    } catch (applyError) { setError(errorMessage(applyError, 'Não foi possível aplicar as regras.')) }
    finally { setBusy(false) }
  }
  async function removeRule(rule: Rule) {
    if (!window.confirm(`Excluir a regra "${rule.nome}"?`)) return
    try { await erpJson(`/api/erp/conciliacao/lancamentos?id=${rule.id}`, { method: 'DELETE' }); await loadRules() }
    catch (removeError) { setError(errorMessage(removeError, 'Não foi possível excluir a regra.')) }
  }

  return <section className="grid gap-4 border-t pt-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold">Extrato e saldo</h2>
        <p className="mt-1 text-sm text-gray-600">Importe o extrato (OFX ou CSV), confira o saldo do banco com o do ERP e deixe tarifas e rendimentos com lançamento automático.</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Conta" className="min-w-52"><NativeSelect label="Conta" value={account} onChange={setAccount} options={accounts} /></Field>
        <Button variant="outline" onClick={() => setImporting(true)}><FileUp className="size-4" />Importar extrato</Button>
      </div>
    </div>
    {message ? <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</div> : null}
    {error ? <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
    {balance ? <div className="grid gap-px overflow-hidden rounded-md border bg-gray-200 sm:grid-cols-4">
      <Metric label={`Saldo no extrato${balance.data_extrato ? ` (${dateLabel(balance.data_extrato)})` : ''}`} value={balance.saldo_extrato == null ? 'Sem saldo importado' : currency(balance.saldo_extrato)} />
      <Metric label="Saldo no ERP na mesma data" value={balance.saldo_erp == null ? '—' : currency(balance.saldo_erp)} />
      <Metric label="Diferença" value={balance.diferenca == null ? '—' : currency(balance.diferenca)} tone={balance.diferenca ? 'warning' : 'ok'} icon />
      <Metric label="Pendentes / conciliado até" value={`${balance.pendentes} · ${balance.conciliado_ate ? dateLabel(balance.conciliado_ate) : '—'}`} />
    </div> : null}

    <div className="rounded-md border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <p className="text-sm font-medium">Regras de lançamento automático</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={busy || !rules.length} onClick={() => void applyRules()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}Aplicar às pendentes</Button>
          <Button size="sm" variant="outline" onClick={() => setRuleOpen(true)}><Plus className="size-4" />Nova regra</Button>
        </div>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Quando a descrição contém</TableHead><TableHead>Tipo</TableHead><TableHead>Lança em</TableHead><TableHead>Cliente/fornecedor</TableHead><TableHead>Conta</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
        <TableBody>{rules.length === 0 ? <TableRow><TableCell colSpan={6} className="h-14 text-center text-sm text-gray-500">Nenhuma regra. Exemplo: &quot;TARIFA&quot; (débito) → categoria Tarifas bancárias, fornecedor o banco.</TableCell></TableRow>
          : rules.map(rule => <TableRow key={rule.id}>
            <TableCell className="font-medium">&quot;{rule.descricao_contem}&quot;</TableCell><TableCell>{rule.tipo_transacao === 'debito' ? 'Débito (despesa)' : 'Crédito (receita)'}</TableCell>
            <TableCell>{rule.categoria}</TableCell><TableCell>{rule.entidade}</TableCell><TableCell>{rule.conta || 'Todas'}</TableCell>
            <TableCell><Button size="icon" variant="ghost" title="Excluir" onClick={() => void removeRule(rule)}><Trash2 className="size-4" /></Button></TableCell>
          </TableRow>)}</TableBody>
      </Table>
    </div>
    {importing ? <ImportDialog accounts={accounts} account={account} onClose={() => setImporting(false)} onDone={result => {
      setImporting(false)
      setMessage(result.reused ? 'Este arquivo já tinha sido importado.' : `${result.imported || 0} transação(ões) importada(s), ${result.ignored || 0} repetida(s) ignorada(s).${result.regras?.lancadas ? ` ${result.regras.lancadas} lançada(s) pelas regras.` : ''}`)
      onChanged()
    }} /> : null}
    {ruleOpen ? <RuleDialog accounts={accounts} onClose={() => setRuleOpen(false)} onSaved={() => { setRuleOpen(false); void loadRules() }} /> : null}
  </section>
}

function Metric({ label, value, tone, icon }: { label: string; value: string; tone?: 'ok' | 'warning'; icon?: boolean }) {
  return <div className={`bg-white p-3 ${tone === 'warning' ? 'text-amber-800' : ''}`}><p className="text-xs text-gray-500">{label}</p>
    <p className="mt-1 flex items-center gap-1 text-sm font-semibold">{icon ? <Scale className="size-4" /> : null}{value}</p></div>
}

function ImportDialog({ accounts, account, onClose, onDone }: { accounts: Option[]; account: string; onClose: () => void; onDone: (result: ImportResult) => void }) {
  const [accountId, setAccountId] = useState(account)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[]>([])
  const [mapping, setMapping] = useState({ coluna_data: '', coluna_descricao: '', coluna_valor: '', coluna_credito: '', coluna_debito: '', coluna_documento: '', coluna_saldo: '', formato_data: 'dd/mm/aaaa', separador: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const csv = Boolean(file && /\.csv$/i.test(file.name))

  async function choose(selected?: File) {
    setFile(selected || null); setPreview([])
    if (!selected || !/\.csv$/i.test(selected.name)) return
    const header = (await selected.text()).replace(/^﻿/, '').split(/\r?\n/)[0] || ''
    const separator = header.includes(';') ? ';' : ','
    setPreview(header.split(separator).map(cell => cell.replace(/^"|"$/g, '').trim()).filter(Boolean))
    setMapping(current => ({ ...current, separador: separator }))
  }

  async function submit() {
    if (!file) return
    setSaving(true); setError(null)
    try {
      const content = await file.text()
      const columns = Object.fromEntries(Object.entries(mapping).filter(([, value]) => value))
      const hasMapping = Boolean(mapping.coluna_data && mapping.coluna_descricao)
      onDone(await erpJson<ImportResult>('/api/erp/bancos/importar-ofx', { method: 'POST', body: {
        accountId: Number(accountId), fileName: file.name, content, format: csv ? 'csv' : 'ofx', ...(csv && hasMapping ? { mapping: columns } : {}),
      } }))
    } catch (importError) { setError(errorMessage(importError, 'Não foi possível importar o extrato.')) }
    finally { setSaving(false) }
  }

  const columnSelect = (key: keyof typeof mapping, label: string) => <Field label={label}>
    <select aria-label={label} className={inputClass} value={mapping[key]} onChange={event => setMapping(current => ({ ...current, [key]: event.target.value }))}>
      <option value="">—</option>{preview.map(column => <option key={column} value={column}>{column}</option>)}
    </select></Field>

  return <Dialog open onOpenChange={value => { if (!value) onClose() }}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
    <DialogHeader><DialogTitle>Importar extrato</DialogTitle></DialogHeader>
    <div className="grid gap-4 py-2">
      <Field label="Conta"><NativeSelect label="Conta" value={accountId} onChange={setAccountId} options={accounts} /></Field>
      <Field label="Arquivo (OFX ou CSV)"><input type="file" accept=".ofx,.csv,text/csv,application/x-ofx" className="text-sm" onChange={event => void choose(event.target.files?.[0])} /></Field>
      {csv ? <>
        <p className="text-sm text-gray-600">Indique as colunas do CSV. O mapeamento fica salvo na conta; nas próximas importações deste banco pode deixar em branco.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {columnSelect('coluna_data', 'Data')}
          {columnSelect('coluna_descricao', 'Descrição')}
          {columnSelect('coluna_valor', 'Valor (com sinal)')}
          {columnSelect('coluna_documento', 'Documento (opcional)')}
          {columnSelect('coluna_credito', 'Ou: coluna de crédito')}
          {columnSelect('coluna_debito', 'Ou: coluna de débito')}
          {columnSelect('coluna_saldo', 'Saldo (opcional)')}
          <Field label="Formato da data"><select aria-label="Formato da data" className={inputClass} value={mapping.formato_data} onChange={event => setMapping(current => ({ ...current, formato_data: event.target.value }))}>
            <option value="dd/mm/aaaa">31/12/2026</option><option value="aaaa-mm-dd">2026-12-31</option></select></Field>
        </div>
      </> : null}
      <DialogError error={error} />
    </div>
    <DialogActions onCancel={onClose} onConfirm={() => void submit()} saving={saving} label="Importar" disabled={!file || !accountId} />
  </DialogContent></Dialog>
}

function RuleDialog({ accounts, onClose, onSaved }: { accounts: Option[]; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState({ descricao_contem: '', tipo_transacao: 'debito' as 'debito' | 'credito', conta_financeira_id: '' })
  const [category, setCategory] = useState<Option | null>(null)
  const [entity, setEntity] = useState<Option | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function save() {
    setSaving(true); setError(null)
    try {
      await erpJson('/api/erp/conciliacao/lancamentos', { method: 'POST', body: { values: {
        descricao_contem: values.descricao_contem, tipo_transacao: values.tipo_transacao, categoria_id: Number(category?.id), entidade_id: Number(entity?.id),
        conta_financeira_id: values.conta_financeira_id ? Number(values.conta_financeira_id) : null,
      } } })
      onSaved()
    } catch (saveError) { setError(errorMessage(saveError, 'Não foi possível salvar a regra.')) }
    finally { setSaving(false) }
  }
  const debit = values.tipo_transacao === 'debito'
  return <Dialog open onOpenChange={value => { if (!value) onClose() }}><DialogContent className="max-w-xl">
    <DialogHeader><DialogTitle>Nova regra de lançamento</DialogTitle></DialogHeader>
    <div className="grid gap-4 py-2">
      <Field label="Quando a descrição do extrato contém"><input className={inputClass} placeholder="Ex.: TARIFA, IOF, RENDIMENTO" value={values.descricao_contem} onChange={event => setValues(current => ({ ...current, descricao_contem: event.target.value }))} /></Field>
      <Field label="Tipo"><select aria-label="Tipo" className={inputClass} value={values.tipo_transacao} onChange={event => { setValues(current => ({ ...current, tipo_transacao: event.target.value as 'debito' })); setCategory(null); setEntity(null) }}>
        <option value="debito">Débito → despesa paga</option><option value="credito">Crédito → receita recebida</option></select></Field>
      <Field label={debit ? 'Categoria de despesa' : 'Categoria de receita'}><CatalogPicker key={values.tipo_transacao} type="categoria" categoryType={debit ? 'despesa' : 'receita'} label="categoria" value={category} onChange={setCategory} /></Field>
      <Field label={debit ? 'Fornecedor (ex.: o banco)' : 'Cliente (ex.: o banco)'}><CatalogPicker key={`e-${values.tipo_transacao}`} type={debit ? 'fornecedor' : 'cliente'} label="cadastro" value={entity} onChange={setEntity} /></Field>
      <Field label="Conta (opcional)"><NativeSelect label="Conta" value={values.conta_financeira_id} onChange={id => setValues(current => ({ ...current, conta_financeira_id: id }))} options={accounts} placeholder="Todas as contas" /></Field>
      <DialogError error={error} />
    </div>
    <DialogActions onCancel={onClose} onConfirm={() => void save()} saving={saving} label="Salvar regra" disabled={values.descricao_contem.trim().length < 3 || !category || !entity} />
  </DialogContent></Dialog>
}
