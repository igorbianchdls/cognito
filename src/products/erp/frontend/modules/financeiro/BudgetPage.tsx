'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErpModuleWorkspaceTabs, ErpStatusBadge, ErpWorkspaceHeader } from '@/products/erp/frontend/components/ErpWorkspaceChrome'
import { erpClientToday } from '@/products/erp/frontend/services/erpTimeZone'
import {
  DialogActions, DialogError, ErrorBanner, Field, NativeSelect, currency, erpJson, errorMessage, inputClass, primaryButtonClass, toNumber, type Option,
} from '@/products/erp/frontend/modules/vendas/commercialUi'

type Budget = { id: string; ano: number; nome: string; status: 'rascunho' | 'aprovado'; versao: number; resultado_orcado: string }
type Line = { categoria_id: string; categoria: string; tipo: string; mes: number; valor: string }
type Comparison = { orcamento: Budget; ate_mes: number; linhas: Array<{ codigo: number; grupo: string; orcado: number; realizado: number; desvio: number; desvio_percentual: number | null }>; resultado: { orcado: number; realizado: number; desvio: number } }
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// Orçamento anual por categoria e mês (Fase 2E) e o comparativo orçado × realizado pela estrutura da DRE.
export function BudgetPage({ comparisonOnly = false }: { comparisonOnly?: boolean }) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selected, setSelected] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [untilMonth, setUntilMonth] = useState(String(Number(erpClientToday().slice(5, 7))))
  const [categories, setCategories] = useState<Array<Option & { tipo: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const body = await erpJson<{ records: Budget[] }>('/api/erp/orcamentos-financeiros')
      setBudgets(body.records)
      setSelected(current => current && body.records.some(item => item.id === current) ? current : body.records[0]?.id || '')
      const [receitas, despesas] = await Promise.all(['receita', 'despesa'].map(tipo =>
        erpJson<{ options: Array<{ value: string; label: string }> }>(`/api/erp/catalogos/categorias?tipo=${tipo}&identificador=id`).catch(() => ({ options: [] }))))
      setCategories([...receitas.options.map(o => ({ id: o.value, nome: o.label, tipo: 'receita' })), ...despesas.options.map(o => ({ id: o.value, nome: o.label, tipo: 'despesa' }))])
    } catch (loadError) { setError(errorMessage(loadError, 'Não foi possível carregar os orçamentos.')) }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!selected) { setLines([]); setComparison(null); return }
    let active = true
    Promise.all([
      erpJson<{ linhas: Line[] }>(`/api/erp/orcamentos-financeiros?id=${selected}`),
      erpJson<Comparison>(`/api/erp/orcamentos-financeiros?id=${selected}&comparar=1&ate_mes=${untilMonth}`),
    ]).then(([detail, compared]) => { if (active) { setLines(detail.linhas); setComparison(compared); setEdits({}) } })
      .catch(loadError => { if (active) setError(errorMessage(loadError, 'Não foi possível abrir o orçamento.')) })
    return () => { active = false }
  }, [selected, untilMonth])

  const budget = budgets.find(item => item.id === selected)
  // Grade categoria × mês (valores digitados sobrepõem os salvos).
  const grid = useMemo(() => {
    const rows = new Map<string, { categoria: string; tipo: string; meses: number[] }>()
    for (const category of categories) rows.set(category.id, { categoria: category.nome, tipo: category.tipo, meses: Array(12).fill(0) })
    for (const line of lines) {
      const row = rows.get(String(line.categoria_id)) || { categoria: line.categoria, tipo: line.tipo, meses: Array(12).fill(0) }
      row.meses[Number(line.mes) - 1] = Number(line.valor); rows.set(String(line.categoria_id), row)
    }
    return [...rows.entries()].sort((a, b) => (a[1].tipo === b[1].tipo ? a[1].categoria.localeCompare(b[1].categoria) : a[1].tipo === 'receita' ? -1 : 1))
  }, [categories, lines])
  const cell = (categoryId: string, month: number, saved: number) => edits[`${categoryId}|${month}`] ?? (saved ? String(saved) : '')

  async function saveGrid() {
    if (!budget) return
    setSaving(true); setError(null)
    try {
      const payload = grid.flatMap(([categoryId, row]) => row.meses.map((saved, index) => ({ categoria_id: Number(categoryId), mes: index + 1, valor: toNumber(cell(categoryId, index + 1, saved)) ?? 0 })))
        .filter(line => line.valor > 0)
      await erpJson('/api/erp/orcamentos-financeiros', { method: 'POST', body: { id: Number(budget.id), expectedVersion: budget.versao, values: { ano: budget.ano, nome: budget.nome, linhas: payload } } })
      await load()
      setSelected(budget.id)
    } catch (saveError) { setError(errorMessage(saveError, 'Não foi possível salvar o orçamento.')) }
    finally { setSaving(false) }
  }
  async function approve() {
    if (!budget) return
    try { await erpJson('/api/erp/orcamentos-financeiros', { method: 'POST', body: { id: Number(budget.id), expectedVersion: budget.versao, values: { ano: budget.ano, nome: budget.nome, status: budget.status === 'aprovado' ? 'rascunho' : 'aprovado' } } }); await load() }
    catch (approveError) { setError(errorMessage(approveError, 'Não foi possível alterar a situação.')) }
  }

  return <div className="flex min-h-full min-w-0 flex-col bg-white">
    <ErpWorkspaceHeader section={comparisonOnly ? 'Relatórios' : 'Financeiro'} title={comparisonOnly ? 'Orçado × realizado' : 'Orçamento'}
      menuItems={[{ label: 'Atualizar dados', onSelect: () => void load() }]}
      primaryAction={comparisonOnly ? undefined : <Button className={primaryButtonClass} onClick={() => setCreating(true)}><Plus className="size-4" />Novo orçamento</Button>} />
    {comparisonOnly ? null : <ErpModuleWorkspaceTabs sectionId="financeiro" moduleId="orcamento" />}
    <div className="flex flex-wrap items-end gap-3 border-b border-[#e7e7e4] px-5 py-3 md:px-8 lg:px-10">
      <Field label="Orçamento" className="min-w-64"><NativeSelect label="Orçamento" value={selected} onChange={setSelected} options={budgets.map(item => ({ id: item.id, nome: `${item.ano} · ${item.nome}` }))} placeholder={budgets.length ? undefined : 'Nenhum orçamento'} /></Field>
      <Field label="Até o mês"><select aria-label="Até o mês" className={inputClass} value={untilMonth} onChange={event => setUntilMonth(event.target.value)}>{MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></Field>
      {budget ? <><ErpStatusBadge status={budget.status === 'aprovado' ? 'ativo' : 'rascunho'} label={budget.status === 'aprovado' ? 'Aprovado' : 'Rascunho'} />
        {comparisonOnly ? null : <Button size="sm" variant="outline" onClick={() => void approve()}>{budget.status === 'aprovado' ? 'Voltar a rascunho' : 'Aprovar'}</Button>}</> : null}
    </div>
    <ErrorBanner error={error} />
    {loading ? <div className="grid h-40 place-items-center"><Loader2 className="size-5 animate-spin" /></div> : null}
    {comparison ? <section className="px-5 py-4 md:px-8 lg:px-10">
      <h2 className="mb-2 text-sm font-semibold">Orçado × realizado (jan a {MONTHS[comparison.ate_mes - 1].toLowerCase()})</h2>
      <div className="overflow-x-auto rounded-md border"><Table>
        <TableHeader><TableRow className="bg-[#fbfbfa]"><TableHead>Grupo da DRE</TableHead><TableHead className="text-right">Orçado</TableHead><TableHead className="text-right">Realizado</TableHead><TableHead className="text-right">Desvio</TableHead><TableHead className="text-right">Desvio %</TableHead></TableRow></TableHeader>
        <TableBody>
          {comparison.linhas.map(row => <TableRow key={row.codigo}><TableCell>{row.grupo}</TableCell><TableCell className="text-right tabular-nums">{currency(row.orcado)}</TableCell>
            <TableCell className="text-right tabular-nums">{currency(row.realizado)}</TableCell><TableCell className={`text-right tabular-nums ${row.desvio < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{currency(row.desvio)}</TableCell>
            <TableCell className="text-right tabular-nums">{row.desvio_percentual == null ? '—' : `${row.desvio_percentual.toLocaleString('pt-BR')}%`}</TableCell></TableRow>)}
          <TableRow className="bg-[#f6f7f2] font-semibold"><TableCell>= Resultado</TableCell><TableCell className="text-right tabular-nums">{currency(comparison.resultado.orcado)}</TableCell>
            <TableCell className="text-right tabular-nums">{currency(comparison.resultado.realizado)}</TableCell><TableCell className="text-right tabular-nums">{currency(comparison.resultado.desvio)}</TableCell><TableCell /></TableRow>
        </TableBody></Table></div>
      <p className="mt-2 text-xs text-gray-500">Desvio positivo é favorável (mais receita ou menos despesa que o orçado).</p>
    </section> : null}
    {!comparisonOnly && budget ? <section className="px-5 pb-6 md:px-8 lg:px-10">
      <div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-semibold">Valores orçados por categoria (positivos; a categoria define se soma ou subtrai)</h2>
        <Button size="sm" disabled={saving || !Object.keys(edits).length} onClick={() => void saveGrid()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar valores</Button></div>
      <div className="overflow-x-auto rounded-md border"><Table className="min-w-[1200px]">
        <TableHeader><TableRow className="bg-[#fbfbfa]"><TableHead className="min-w-[200px]">Categoria</TableHead>{MONTHS.map(month => <TableHead key={month} className="w-24 text-right">{month}</TableHead>)}<TableHead className="text-right">Ano</TableHead></TableRow></TableHeader>
        <TableBody>{grid.map(([categoryId, row]) => <TableRow key={categoryId}>
          <TableCell><span className="font-medium">{row.categoria}</span><span className="ml-2 text-xs text-gray-500">{row.tipo === 'receita' ? 'receita' : 'despesa'}</span></TableCell>
          {row.meses.map((saved, index) => <TableCell key={index} className="p-1"><input aria-label={`${row.categoria} ${MONTHS[index]}`} inputMode="decimal" className="h-8 w-full rounded border border-[#e5e5e2] px-2 text-right text-sm"
            value={cell(categoryId, index + 1, saved)} onChange={event => setEdits(current => ({ ...current, [`${categoryId}|${index + 1}`]: event.target.value }))} /></TableCell>)}
          <TableCell className="text-right tabular-nums">{currency(row.meses.reduce((sum, saved, index) => sum + (toNumber(cell(categoryId, index + 1, saved)) ?? 0), 0))}</TableCell>
        </TableRow>)}</TableBody></Table></div>
    </section> : null}
    {creating ? <NewBudgetDialog onClose={() => setCreating(false)} onCreated={id => { setCreating(false); void load().then(() => setSelected(id)) }} /> : null}
  </div>
}

function NewBudgetDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const year = Number(erpClientToday().slice(0, 4))
  const [values, setValues] = useState({ ano: String(year + 1), nome: 'Orçamento', origem: 'copiar', base: String(year), reajuste: '0' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function save() {
    setSaving(true); setError(null)
    try {
      const created = await erpJson<{ id: string }>('/api/erp/orcamentos-financeiros', { method: 'POST', body: { values: {
        ano: Number(values.ano), nome: values.nome, ...(values.origem === 'copiar' ? { copiar_realizado_de: Number(values.base), reajuste_percentual: toNumber(values.reajuste) ?? 0 } : { linhas: [] }),
      } } })
      onCreated(created.id)
    } catch (saveError) { setError(errorMessage(saveError, 'Não foi possível criar o orçamento.')) }
    finally { setSaving(false) }
  }
  return <Dialog open onOpenChange={value => { if (!value) onClose() }}><DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>Novo orçamento</DialogTitle></DialogHeader>
    <div className="grid gap-4 py-2 sm:grid-cols-2">
      <Field label="Ano"><input className={inputClass} inputMode="numeric" value={values.ano} onChange={event => setValues(current => ({ ...current, ano: event.target.value }))} /></Field>
      <Field label="Nome"><input className={inputClass} value={values.nome} onChange={event => setValues(current => ({ ...current, nome: event.target.value }))} /></Field>
      <Field label="Começar" className="sm:col-span-2"><select aria-label="Começar" className={inputClass} value={values.origem} onChange={event => setValues(current => ({ ...current, origem: event.target.value }))}>
        <option value="copiar">Copiar o realizado de um ano (com reajuste)</option><option value="vazio">Em branco</option></select></Field>
      {values.origem === 'copiar' ? <>
        <Field label="Ano base"><input className={inputClass} inputMode="numeric" value={values.base} onChange={event => setValues(current => ({ ...current, base: event.target.value }))} /></Field>
        <Field label="Reajuste (%)"><input className={inputClass} inputMode="decimal" value={values.reajuste} onChange={event => setValues(current => ({ ...current, reajuste: event.target.value }))} /></Field>
      </> : null}
      <div className="sm:col-span-2"><DialogError error={error} /></div>
    </div>
    <DialogActions onCancel={onClose} onConfirm={() => void save()} saving={saving} label="Criar" disabled={!values.nome.trim() || !Number(values.ano)} />
  </DialogContent></Dialog>
}
