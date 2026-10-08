'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpModuleWorkspaceTabs, ErpPeriodSummary, ErpStatusBadge, ErpWorkspaceHeader } from '@/products/erp/frontend/components/ErpWorkspaceChrome'
import { erpClientToday } from '@/products/erp/frontend/services/erpTimeZone'
import { sumMoney } from '@/products/erp/shared/erpMoney'
import {
  CatalogPicker, DialogActions, DialogError, ErrorBanner, Field, NativeSelect, currency, dateLabel, erpJson, errorMessage, inputClass,
  percent, primaryButtonClass, toNumber, type Option,
} from './commercialUi'

type Rule = {
  id: string; nome: string; percentual: string; base: 'faturamento' | 'recebimento'; ativo: boolean; versao: number
  vigencia_inicio: string | null; vigencia_fim: string | null; vendedor_id: string | null; vendedor: string | null
  produto_id: string | null; produto: string | null; servico_id: string | null; servico: string | null; categoria_id: string | null; categoria: string | null
}
type Summary = { vendedor_id: string; vendedor: string; lancamentos: number; valor: string; liberado: string; pago: string; a_pagar: string }
type Entry = { id: string; venda: string; cliente: string; vendedor: string; competencia: string; base: string; valor_base: string; percentual: string; valor: string; liberado: string; valor_pago: string; a_pagar: string }
type Catalogs = { responsibles: Option[]; financialAccounts: Option[] }
type Target = 'todos' | 'produto' | 'servico' | 'categoria'
type RuleDraft = { id?: string; versao?: number; nome: string; vendedor_id: string; alvo: Target; item: Option | null; percentual: string; base: 'faturamento' | 'recebimento'; ativo: boolean; vigencia_inicio: string; vigencia_fim: string }

const yearStart = () => `${erpClientToday().slice(0, 4)}-01-01`

// Comissões: relatório (gerado, liberado, pago e a pagar por vendedor), pagamento das liberadas e regras.
export function CommissionsPage() {
  const [tab, setTab] = useState<'apagar' | 'regras'>('apagar')
  const [period, setPeriod] = useState({ inicio: yearStart(), fim: erpClientToday() })
  const [sellerFilter, setSellerFilter] = useState('')
  const [summary, setSummary] = useState<Summary[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [rules, setRules] = useState<Rule[]>([])
  const [catalogs, setCatalogs] = useState<Catalogs>({ responsibles: [], financialAccounts: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ruleDraft, setRuleDraft] = useState<RuleDraft | null>(null)
  const [paying, setPaying] = useState<Summary | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ inicio: period.inicio, fim: period.fim, pageSize: '100' })
      if (sellerFilter) params.set('vendedor_id', sellerFilter)
      const [report, ruleList, catalogList] = await Promise.all([
        erpJson<{ summary: Summary[]; records: Entry[] }>(`/api/erp/comissoes?${params}`),
        erpJson<{ records: Rule[] }>('/api/erp/comissoes/regras?pageSize=100'),
        erpJson<Catalogs>('/api/erp/vendas/catalogos'),
      ])
      setSummary(report.summary); setEntries(report.records); setRules(ruleList.records); setCatalogs(catalogList)
    } catch (loadError) { setError(errorMessage(loadError, 'Não foi possível carregar as comissões.')) }
    finally { setLoading(false) }
  }, [period, sellerFilter])
  useEffect(() => { void load() }, [load])

  const editRule = (rule?: Rule) => setRuleDraft(rule ? {
    id: rule.id, versao: rule.versao, nome: rule.nome, vendedor_id: rule.vendedor_id || '', percentual: String(Number(rule.percentual)), base: rule.base,
    ativo: rule.ativo, vigencia_inicio: rule.vigencia_inicio || '', vigencia_fim: rule.vigencia_fim || '',
    alvo: rule.produto_id ? 'produto' : rule.servico_id ? 'servico' : rule.categoria_id ? 'categoria' : 'todos',
    item: rule.produto_id ? { id: rule.produto_id, nome: rule.produto || '' } : rule.servico_id ? { id: rule.servico_id, nome: rule.servico || '' } : rule.categoria_id ? { id: rule.categoria_id, nome: rule.categoria || '' } : null,
  } : { nome: '', vendedor_id: '', alvo: 'todos', item: null, percentual: '', base: 'faturamento', ativo: true, vigencia_inicio: '', vigencia_fim: '' })

  const total = (key: 'valor' | 'liberado' | 'pago' | 'a_pagar') => currency(sumMoney(summary.map(row => Number(row[key]))))

  return <div className="flex min-h-full min-w-0 flex-col bg-white">
    <ErpWorkspaceHeader section="Vendas" title="Comissões" menuItems={[{ label: 'Atualizar dados', onSelect: () => void load() }]}
      primaryAction={tab === 'regras' ? <Button className={primaryButtonClass} onClick={() => editRule()}><Plus className="size-4" />Nova regra</Button> : undefined} />
    <ErpModuleWorkspaceTabs sectionId="vendas" moduleId="gestao-comissoes" />
    <div className="flex flex-wrap items-end gap-3 border-b border-[#e7e7e4] px-5 py-3 md:px-8 lg:px-10">
      <div className="flex rounded-md border border-[#dfdfdc] p-0.5" role="tablist">
        {([['apagar', 'Comissões a pagar'], ['regras', 'Regras']] as const).map(([id, label]) =>
          <button key={id} role="tab" aria-selected={tab === id} className={`rounded px-3 py-1.5 text-sm ${tab === id ? 'bg-[#111] text-white' : 'text-gray-600'}`} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {tab === 'apagar' ? <>
        <Field label="De"><input type="date" className={inputClass} value={period.inicio} onChange={event => setPeriod(current => ({ ...current, inicio: event.target.value }))} /></Field>
        <Field label="Até"><input type="date" className={inputClass} value={period.fim} onChange={event => setPeriod(current => ({ ...current, fim: event.target.value }))} /></Field>
        <Field label="Vendedor" className="min-w-48"><NativeSelect label="Vendedor" value={sellerFilter} onChange={setSellerFilter} options={catalogs.responsibles} placeholder="Todos" /></Field>
      </> : null}
    </div>
    <ErrorBanner error={error} />
    {loading ? <div className="grid h-40 place-items-center"><Loader2 className="size-5 animate-spin" /></div> : tab === 'apagar' ? <>
      <ErpPeriodSummary title="Resumo do período" description="Comissão sobre recebimento só é liberada quando o cliente paga; devoluções reduzem a comissão." metrics={[
        { label: 'Gerado', value: total('valor') }, { label: 'Liberado', value: total('liberado') },
        { label: 'Pago', value: total('pago'), tone: 'success' }, { label: 'A pagar', value: total('a_pagar') },
      ]} />
      <div className="min-w-0 overflow-x-auto"><Table className="erp-workspace-table min-w-[860px] border-b border-[#e7e7e4]">
        <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]"><TableHead className="erp-table-identity-heading">Vendedor</TableHead><TableHead className="text-right">Lançamentos</TableHead><TableHead className="text-right">Gerado</TableHead><TableHead className="text-right">Liberado</TableHead><TableHead className="text-right">Pago</TableHead><TableHead className="text-right">A pagar</TableHead><TableHead className="w-32" /></TableRow></TableHeader>
        <TableBody>{summary.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-500">Nenhuma comissão no período. Comissões são geradas ao confirmar vendas com vendedor e regra aplicável.</TableCell></TableRow>
          : summary.map(row => <TableRow key={row.vendedor_id}>
            <TableCell className="font-medium">{row.vendedor}</TableCell><TableCell className="text-right tabular-nums">{row.lancamentos}</TableCell>
            <TableCell className="text-right tabular-nums">{currency(row.valor)}</TableCell><TableCell className="text-right tabular-nums">{currency(row.liberado)}</TableCell>
            <TableCell className="text-right tabular-nums">{currency(row.pago)}</TableCell><TableCell className="text-right font-medium tabular-nums">{currency(row.a_pagar)}</TableCell>
            <TableCell className="text-right"><Button size="sm" variant="outline" disabled={!(Number(row.a_pagar) > 0)} onClick={() => setPaying(row)}>Pagar</Button></TableCell>
          </TableRow>)}</TableBody></Table></div>
      <h2 className="px-5 pb-2 pt-6 text-sm font-semibold md:px-8 lg:px-10">Lançamentos</h2>
      <div className="min-w-0 overflow-x-auto"><Table className="erp-workspace-table min-w-[1000px] border-b border-[#e7e7e4]">
        <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]"><TableHead>Competência</TableHead><TableHead>Venda</TableHead><TableHead>Cliente</TableHead><TableHead>Vendedor</TableHead><TableHead>Base</TableHead><TableHead className="text-right">Base de cálculo</TableHead><TableHead className="text-right">%</TableHead><TableHead className="text-right">Comissão</TableHead><TableHead className="text-right">A pagar</TableHead></TableRow></TableHeader>
        <TableBody>{entries.map(entry => <TableRow key={entry.id}>
          <TableCell>{dateLabel(entry.competencia)}</TableCell><TableCell className="font-medium">{entry.venda}</TableCell><TableCell>{entry.cliente}</TableCell><TableCell>{entry.vendedor}</TableCell>
          <TableCell>{entry.base === 'recebimento' ? 'Recebimento' : 'Faturamento'}</TableCell><TableCell className="text-right tabular-nums">{currency(entry.valor_base)}</TableCell>
          <TableCell className="text-right tabular-nums">{percent(entry.percentual)}</TableCell><TableCell className="text-right tabular-nums">{currency(entry.valor)}</TableCell><TableCell className="text-right tabular-nums">{currency(entry.a_pagar)}</TableCell>
        </TableRow>)}</TableBody></Table></div>
    </> : <div className="min-w-0 overflow-x-auto"><Table className="erp-workspace-table min-w-[860px] border-b border-[#e7e7e4]">
      <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]"><TableHead className="erp-table-identity-heading">Regra</TableHead><TableHead>Vendedor</TableHead><TableHead>Vale para</TableHead><TableHead className="text-right">%</TableHead><TableHead>Base</TableHead><TableHead>Vigência</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
      <TableBody>{rules.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-gray-500">Nenhuma regra. Crie uma regra geral e, se precisar, regras específicas por vendedor, produto, serviço ou categoria — a mais específica vale.</TableCell></TableRow>
        : rules.map(rule => <TableRow key={rule.id} className="cursor-pointer hover:bg-[#fafaf8]" onClick={() => editRule(rule)}>
          <TableCell className="font-medium">{rule.nome}</TableCell><TableCell>{rule.vendedor || 'Todos'}</TableCell>
          <TableCell>{rule.produto ? `Produto: ${rule.produto}` : rule.servico ? `Serviço: ${rule.servico}` : rule.categoria ? `Categoria: ${rule.categoria}` : 'Todas as vendas'}</TableCell>
          <TableCell className="text-right tabular-nums">{percent(rule.percentual)}</TableCell><TableCell>{rule.base === 'recebimento' ? 'Recebimento' : 'Faturamento'}</TableCell>
          <TableCell>{rule.vigencia_inicio || rule.vigencia_fim ? `${dateLabel(rule.vigencia_inicio)} a ${dateLabel(rule.vigencia_fim)}` : 'Sem prazo'}</TableCell>
          <TableCell><ErpStatusBadge status={rule.ativo ? 'ativo' : 'inativo'} /></TableCell>
        </TableRow>)}</TableBody></Table></div>}
    {ruleDraft ? <RuleDialog draft={ruleDraft} sellers={catalogs.responsibles} onClose={() => setRuleDraft(null)} onSaved={() => { setRuleDraft(null); void load() }} /> : null}
    {paying ? <PayDialog row={paying} until={period.fim} accounts={catalogs.financialAccounts} onClose={() => setPaying(null)} onPaid={() => { setPaying(null); void load() }} /> : null}
  </div>
}

function RuleDialog({ draft: initial, sellers, onClose, onSaved }: { draft: RuleDraft; sellers: Option[]; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const update = (patch: Partial<RuleDraft>) => setDraft(current => ({ ...current, ...patch }))

  async function save() {
    setSaving(true); setError(null)
    const target = (kind: Target) => draft.alvo === kind && draft.item ? Number(draft.item.id) : null
    const values = {
      nome: draft.nome, vendedor_id: draft.vendedor_id ? Number(draft.vendedor_id) : null, percentual: toNumber(draft.percentual) ?? 0, base: draft.base, ativo: draft.ativo,
      produto_id: target('produto'), servico_id: target('servico'), categoria_id: target('categoria'),
      vigencia_inicio: draft.vigencia_inicio || null, vigencia_fim: draft.vigencia_fim || null,
    }
    try {
      await erpJson(draft.id ? `/api/erp/comissoes/regras/${draft.id}` : '/api/erp/comissoes/regras',
        { method: draft.id ? 'PATCH' : 'POST', body: draft.id ? { expectedVersion: draft.versao, values } : { values } })
      onSaved()
    } catch (saveError) { setError(errorMessage(saveError, 'Não foi possível salvar a regra.')) }
    finally { setSaving(false) }
  }
  async function remove() {
    if (!draft.id || !window.confirm(`Excluir a regra "${draft.nome}"? Comissões já geradas não mudam.`)) return
    setSaving(true); setError(null)
    try { await erpJson(`/api/erp/comissoes/regras/${draft.id}`, { method: 'DELETE', body: { expectedVersion: draft.versao } }); onSaved() }
    catch (removeError) { setError(errorMessage(removeError, 'Não foi possível excluir a regra.')) }
    finally { setSaving(false) }
  }

  return <Dialog open onOpenChange={value => { if (!value) onClose() }}><DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
    <DialogHeader><DialogTitle>{draft.id ? 'Editar regra de comissão' : 'Nova regra de comissão'}</DialogTitle></DialogHeader>
    <div className="grid gap-4 py-2 md:grid-cols-2">
      <Field label="Nome" className="md:col-span-2"><input className={inputClass} value={draft.nome} onChange={event => update({ nome: event.target.value })} /></Field>
      <Field label="Vendedor"><NativeSelect label="Vendedor" value={draft.vendedor_id} onChange={vendedor_id => update({ vendedor_id })} options={sellers} placeholder="Todos os vendedores" /></Field>
      <Field label="Percentual (%)"><input className={inputClass} inputMode="decimal" value={draft.percentual} onChange={event => update({ percentual: event.target.value })} /></Field>
      <Field label="Vale para"><select aria-label="Vale para" className={inputClass} value={draft.alvo} onChange={event => update({ alvo: event.target.value as Target, item: null })}>
        <option value="todos">Todas as vendas</option><option value="produto">Um produto</option><option value="servico">Um serviço</option><option value="categoria">Uma categoria de receita</option>
      </select></Field>
      <Field label="Base"><select aria-label="Base" className={inputClass} value={draft.base} onChange={event => update({ base: event.target.value as RuleDraft['base'] })}>
        <option value="faturamento">Faturamento (na confirmação)</option><option value="recebimento">Recebimento (quando o cliente paga)</option>
      </select></Field>
      {draft.alvo !== 'todos' ? <Field label={draft.alvo === 'produto' ? 'Produto' : draft.alvo === 'servico' ? 'Serviço' : 'Categoria'} className="md:col-span-2">
        <CatalogPicker key={draft.alvo} type={draft.alvo} label={draft.alvo} categoryType={draft.alvo === 'categoria' ? 'receita' : undefined} value={draft.item} onChange={item => update({ item })} />
      </Field> : null}
      <Field label="Vigência — início"><input type="date" className={inputClass} value={draft.vigencia_inicio} onChange={event => update({ vigencia_inicio: event.target.value })} /></Field>
      <Field label="Vigência — fim"><input type="date" className={inputClass} value={draft.vigencia_fim} onChange={event => update({ vigencia_fim: event.target.value })} /></Field>
      <label className="flex items-center gap-2 text-sm"><Switch checked={draft.ativo} onCheckedChange={ativo => update({ ativo })} />Ativa</label>
      <div className="md:col-span-2"><DialogError error={error} /></div>
    </div>
    <DialogActions onCancel={onClose} onConfirm={() => void save()} saving={saving} label="Salvar regra"
      disabled={!draft.nome.trim() || !(Number(toNumber(draft.percentual)) > 0) || (draft.alvo !== 'todos' && !draft.item)}
      extra={draft.id ? <Button variant="ghost" className="text-rose-700" disabled={saving} onClick={() => void remove()}><Trash2 className="size-4" />Excluir</Button> : null} />
  </DialogContent></Dialog>
}

function PayDialog({ row, until, accounts, onClose, onPaid }: { row: Summary; until: string; accounts: Option[]; onClose: () => void; onPaid: () => void }) {
  const [ate, setAte] = useState(until)
  const [category, setCategory] = useState<Option | null>(null)
  const [due, setDue] = useState(erpClientToday())
  const [account, setAccount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ valor: number; lancamentos: number } | null>(null)

  async function pay() {
    if (!category) return
    setSaving(true); setError(null)
    try {
      const result = await erpJson<{ valor: number; lancamentos: number }>('/api/erp/comissoes/pagar', { method: 'POST', idempotent: true, body: { values: {
        vendedor_id: Number(row.vendedor_id), ate, categoria_id: Number(category.id), data_vencimento: due, conta_financeira_id: account ? Number(account) : null,
      } } })
      setDone(result)
    } catch (payError) { setError(errorMessage(payError, 'Não foi possível gerar o pagamento.')) }
    finally { setSaving(false) }
  }

  return <Dialog open onOpenChange={value => { if (!value) (done ? onPaid : onClose)() }}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>Pagar comissões — {row.vendedor}</DialogTitle></DialogHeader>
    {done ? <div className="grid gap-4 py-2">
      <p className="text-sm">Conta a pagar de <strong>{currency(done.valor)}</strong> gerada para {row.vendedor} ({done.lancamentos} lançamento{done.lancamentos === 1 ? '' : 's'}). A baixa é feita em Contas a pagar.</p>
      <div className="flex justify-end"><Button onClick={onPaid}>Concluir</Button></div>
    </div> : <div className="grid gap-4 py-2">
      <p className="text-sm text-gray-600">Gera uma conta a pagar com as comissões liberadas e ainda não pagas até a data. Valor liberado em aberto no período: <strong>{currency(row.a_pagar)}</strong>.</p>
      <Field label="Comissões liberadas até"><input type="date" className={inputClass} value={ate} onChange={event => setAte(event.target.value)} /></Field>
      <Field label="Categoria de despesa"><CatalogPicker type="categoria" categoryType="despesa" label="categoria de despesa" value={category} onChange={setCategory} /></Field>
      <Field label="Vencimento"><input type="date" className={inputClass} value={due} onChange={event => setDue(event.target.value)} /></Field>
      <Field label="Conta financeira (opcional)"><NativeSelect label="Conta financeira" value={account} onChange={setAccount} options={accounts} placeholder="Definir na baixa" /></Field>
      <DialogError error={error} />
      <DialogActions onCancel={onClose} onConfirm={() => void pay()} saving={saving} label="Gerar conta a pagar" disabled={!category || !ate || !due} />
    </div>}
  </DialogContent></Dialog>
}
