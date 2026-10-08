'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronDown, ChevronRight, Download, Loader2, Printer, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import { erpClientToday } from '@/products/erp/frontend/services/erpTimeZone'

type Monthly = Record<string, number>
type Category = { id: string | null; nome: string; total: number; mensal: Monthly; subcategorias: Array<{ id: string; nome: string; total: number; mensal: Monthly }> }
type Group = { codigo: number; nome: string; natureza: string; total: number; mensal: Monthly; anterior: number; categorias: Category[] }
type Line = { tipo: 'grupo'; codigo: number } | { tipo: 'subtotal'; chave: string; nome: string; total: number; mensal: Monthly; anterior: number }
type Dre = { visao: 'competencia' | 'caixa'; inicio: string; fim: string; anterior: { from: string; to: string }; meses: string[]; grupos: Group[]; linhas: Line[]; base_percentual: number; nao_classificado: number; fora_dre: number }
type Entry = { data: string; descricao: string | null; pessoa: string | null; valor: string | number; origem: string }

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const pct = (value: number, base: number) => base ? `${(value / base * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'
const monthLabel = (month: string) => new Date(`${month}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de ', '/').replace('.', '')
const tone = (value: number) => value < 0 ? 'text-rose-700' : 'text-gray-950'

function presets() {
  const today = erpClientToday(), year = today.slice(0, 4), month = today.slice(0, 7)
  const firstOfMonth = `${month}-01`
  const prev = new Date(`${firstOfMonth}T12:00:00`); prev.setMonth(prev.getMonth() - 1)
  const prevMonth = prev.toISOString().slice(0, 7)
  const lastOfPrev = new Date(`${firstOfMonth}T12:00:00`); lastOfPrev.setDate(0)
  const twelve = new Date(`${firstOfMonth}T12:00:00`); twelve.setMonth(twelve.getMonth() - 11)
  return [
    { id: 'mes', label: 'Este mês', from: firstOfMonth, to: today },
    { id: 'mes_anterior', label: 'Mês anterior', from: `${prevMonth}-01`, to: lastOfPrev.toISOString().slice(0, 10) },
    { id: 'ano', label: 'Este ano', from: `${year}-01-01`, to: today },
    { id: '12m', label: 'Últimos 12 meses', from: twelve.toISOString().slice(0, 7) + '-01', to: today },
  ]
}

// DRE gerencial: os 9 grupos fixos com subtotais, % sobre a receita líquida, comparação com o período anterior,
// colunas mensais e detalhamento até o lançamento.
export function DreReportPage() {
  const options = useMemo(presets, [])
  const [view, setView] = useState<'competencia' | 'caixa'>('competencia')
  // Links antigos (Resultado dos pagamentos) chegam com ?visao=caixa.
  useEffect(() => { if (new URLSearchParams(window.location.search).get('visao') === 'caixa') setView('caixa') }, [])
  const [period, setPeriod] = useState({ preset: 'ano', from: options[2].from, to: options[2].to })
  const [monthly, setMonthly] = useState(false)
  const [data, setData] = useState<Dre | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [detail, setDetail] = useState<{ title: string; query: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ inicio: period.from, fim: period.to, visao: view })
      setData(await parseErpResponse<Dre>(await fetch(`/api/erp/relatorios/dre?${params}`, { cache: 'no-store' })))
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a DRE.') }
    finally { setLoading(false) }
  }, [period.from, period.to, view])
  useEffect(() => { void load() }, [load])

  const groups = useMemo(() => new Map((data?.grupos || []).map(group => [group.codigo, group])), [data])
  const months = monthly && data && data.meses.length > 1 ? data.meses.slice(-12) : []
  const base = data?.base_percentual || 0

  function exportCsv() {
    if (!data) return
    const rows: string[][] = [['Linha', ...months.map(monthLabel), 'Total', '% receita líquida', 'Período anterior']]
    for (const line of data.linhas) {
      if (line.tipo === 'subtotal') { rows.push([`= ${line.nome}`, ...months.map(m => String(line.mensal[m] || 0)), String(line.total), pct(line.total, base), String(line.anterior)]); continue }
      const group = groups.get(line.codigo)!
      rows.push([group.nome, ...months.map(m => String(group.mensal[m] || 0)), String(group.total), pct(group.total, base), String(group.anterior)])
      for (const category of group.categorias) {
        rows.push([`  ${category.nome}`, ...months.map(m => String(category.mensal[m] || 0)), String(category.total), pct(category.total, base), ''])
        for (const sub of category.subcategorias) rows.push([`    ${sub.nome}`, ...months.map(m => String(sub.mensal[m] || 0)), String(sub.total), pct(sub.total, base), ''])
      }
    }
    const csv = rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
    link.download = `dre-${view}-${period.from}-${period.to}.csv`; link.click(); URL.revokeObjectURL(link.href)
  }

  function openDetail(title: string, category: { id: string | null }, devolucoes = false) {
    const params = new URLSearchParams({ inicio: period.from, fim: period.to, visao: view })
    if (devolucoes) params.set('devolucoes', '1')
    else if (category.id) params.set('categoria_id', category.id)
    else params.set('sem_categoria', '1')
    setDetail({ title, query: params.toString() })
  }

  const valueCells = (mensal: Monthly, total: number, anterior: number | null, strong = false) => <>
    {months.map(month => <TableCell key={month} className={`text-right tabular-nums ${tone(mensal[month] || 0)}`}>{mensal[month] ? money(mensal[month]) : '—'}</TableCell>)}
    <TableCell className={`text-right tabular-nums ${strong ? 'font-semibold' : ''} ${tone(total)}`}>{money(total)}</TableCell>
    <TableCell className="text-right tabular-nums text-gray-500">{pct(total, base)}</TableCell>
    <TableCell className="text-right tabular-nums text-gray-500">{anterior === null ? '' : money(anterior)}</TableCell>
  </>

  return <div className="flex min-h-full flex-col gap-5 print:block">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500">ERP / Relatórios</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-950">DRE</h1>
        <p className="mt-1 text-sm text-gray-600">Resultado do período pelos grupos da DRE: receita líquida, lucro bruto, resultado operacional e lucro líquido.</p>
      </div>
      <div className="flex gap-2 print:hidden">
        <Button variant="outline" size="icon" title="Atualizar" onClick={() => void load()}><RefreshCw className="size-4" /></Button>
        <Button variant="outline" size="icon" title="Exportar CSV" disabled={!data} onClick={exportCsv}><Download className="size-4" /></Button>
        <Button variant="outline" size="icon" title="Imprimir" onClick={() => window.print()}><Printer className="size-4" /></Button>
      </div>
    </div>

    <div className="flex flex-wrap items-end gap-3 print:hidden">
      <div className="flex rounded-md border border-[#dfdfdc] p-0.5" role="tablist" aria-label="Visão">
        {([['competencia', 'Competência'], ['caixa', 'Caixa']] as const).map(([id, label]) =>
          <button key={id} role="tab" aria-selected={view === id} title={id === 'competencia' ? 'Quando a venda ou a despesa aconteceu' : 'Quando o dinheiro entrou ou saiu'}
            className={`rounded px-3 py-1.5 text-sm ${view === id ? 'bg-[#111] text-white' : 'text-gray-600'}`} onClick={() => setView(id)}>{label}</button>)}
      </div>
      <select aria-label="Período" className="h-9 rounded-md border border-[#dfdfdc] bg-white px-3 text-sm" value={period.preset}
        onChange={event => { const preset = options.find(option => option.id === event.target.value); setPeriod(preset ? { preset: preset.id, from: preset.from, to: preset.to } : { ...period, preset: 'custom' }) }}>
        {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        <option value="custom">Personalizado</option>
      </select>
      <input aria-label="De" type="date" className="h-9 rounded-md border border-[#dfdfdc] bg-white px-3 text-sm" value={period.from} onChange={event => setPeriod({ preset: 'custom', from: event.target.value, to: period.to })} />
      <input aria-label="Até" type="date" className="h-9 rounded-md border border-[#dfdfdc] bg-white px-3 text-sm" value={period.to} onChange={event => setPeriod({ preset: 'custom', from: period.from, to: event.target.value })} />
      <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={monthly} onChange={event => setMonthly(event.target.checked)} />Mês a mês</label>
    </div>

    {data && data.nao_classificado !== 0 ? <div role="alert" className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 print:hidden">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{money(data.nao_classificado)} estão em categorias sem grupo da DRE (linha &quot;Não classificado&quot;). <Link className="font-medium underline" href="/erp/cadastros/categorias">Classifique as categorias</Link> para o resultado ficar completo.</span>
    </div> : null}
    {error ? <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

    <div className="min-w-0 overflow-x-auto rounded-md border border-[#e7e7e4]">
      <Table className={months.length ? 'min-w-[1100px]' : 'min-w-[720px]'}>
        <TableHeader><TableRow className="bg-[#fbfbfa] hover:bg-[#fbfbfa]">
          <TableHead className="min-w-[280px]">{view === 'competencia' ? 'Por competência' : 'Pelo caixa'}</TableHead>
          {months.map(month => <TableHead key={month} className="text-right">{monthLabel(month)}</TableHead>)}
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">% receita líquida</TableHead>
          <TableHead className="text-right" title={data ? `${data.anterior.from} a ${data.anterior.to}` : ''}>Período anterior</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={months.length + 4} className="h-32 text-center"><Loader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>
            : data?.linhas.map(line => {
              if (line.tipo === 'subtotal') return <TableRow key={line.chave} className="bg-[#f6f7f2] hover:bg-[#f6f7f2]">
                <TableCell className="font-semibold">= {line.nome}</TableCell>{valueCells(line.mensal, line.total, line.anterior, true)}
              </TableRow>
              const group = groups.get(line.codigo)!
              const key = `g${group.codigo}`, expanded = open[key]
              return <Fragment key={key}>
                <TableRow className={`cursor-pointer ${group.codigo === 0 ? 'bg-amber-50/60' : ''}`} onClick={() => setOpen(current => ({ ...current, [key]: !expanded }))}>
                  <TableCell className="font-medium"><span className="inline-flex items-center gap-1">{group.categorias.length ? (expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />) : <span className="inline-block w-4" />}{group.nome}</span></TableCell>
                  {valueCells(group.mensal, group.total, group.anterior)}
                </TableRow>
                {expanded ? group.categorias.map(category => {
                  const catKey = `${key}-${category.id ?? category.nome}`, catOpen = open[catKey]
                  const isReturn = !category.id && category.nome === 'Devoluções de vendas'
                  return <Fragment key={catKey}>
                    <TableRow>
                      <TableCell className="pl-10 text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          {category.subcategorias.length ? <button aria-label="Subcategorias" onClick={() => setOpen(current => ({ ...current, [catKey]: !catOpen }))}>{catOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</button> : <span className="inline-block w-3.5" />}
                          <button className="text-left underline-offset-2 hover:underline" onClick={() => openDetail(category.nome, category, isReturn)}>{category.nome}</button>
                        </span>
                      </TableCell>
                      {valueCells(category.mensal, category.total, null)}
                    </TableRow>
                    {catOpen ? category.subcategorias.map(sub => <TableRow key={sub.id}>
                      <TableCell className="pl-16 text-gray-600"><button className="text-left underline-offset-2 hover:underline" onClick={() => openDetail(`${category.nome} › ${sub.nome}`, sub)}>{sub.nome}</button></TableCell>
                      {valueCells(sub.mensal, sub.total, null)}
                    </TableRow>) : null}
                  </Fragment>
                }) : null}
              </Fragment>
            })}
        </TableBody>
      </Table>
    </div>
    {data && data.fora_dre !== 0 ? <p className="text-xs text-gray-500">Fora da DRE no período (empréstimos, aportes, distribuição de lucros, equipamentos): {money(data.fora_dre)}. Esses valores aparecem no fluxo de caixa.</p> : null}
    {detail ? <EntriesDialog title={detail.title} query={detail.query} onClose={() => setDetail(null)} /> : null}
  </div>
}

function EntriesDialog({ title, query, onClose }: { title: string; query: string; onClose: () => void }) {
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    void fetch(`/api/erp/relatorios/dre?${query}`, { cache: 'no-store' }).then(response => parseErpResponse<{ records: Entry[] }>(response))
      .then(body => { if (active) setEntries(body.records) })
      .catch(loadError => { if (active) { setEntries([]); setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os lançamentos.') } })
    return () => { active = false }
  }, [query])
  const total = (entries || []).reduce((sum, entry) => sum + Number(entry.valor), 0)
  return <Dialog open onOpenChange={value => { if (!value) onClose() }}><DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    {entries === null ? <Loader2 className="mx-auto size-5 animate-spin" /> : <Table>
      <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Cliente/fornecedor</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
      <TableBody>
        {entries.length === 0 ? <TableRow><TableCell colSpan={4} className="h-16 text-center text-gray-500">Nenhum lançamento.</TableCell></TableRow>
          : entries.map((entry, index) => <TableRow key={index}>
            <TableCell>{new Date(`${entry.data.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR')}</TableCell>
            <TableCell>{entry.descricao || '—'}{entry.origem === 'estorno' ? <span className="ml-2 text-xs text-gray-500">(estorno)</span> : null}</TableCell>
            <TableCell>{entry.pessoa || '—'}</TableCell>
            <TableCell className={`text-right tabular-nums ${tone(Number(entry.valor))}`}>{money(Number(entry.valor))}</TableCell>
          </TableRow>)}
        {entries.length ? <TableRow className="bg-[#fbfbfa]"><TableCell colSpan={3} className="font-medium">Total{entries.length >= 300 ? ' (primeiros 300 lançamentos)' : ''}</TableCell><TableCell className="text-right font-semibold tabular-nums">{money(total)}</TableCell></TableRow> : null}
      </TableBody>
    </Table>}
  </DialogContent></Dialog>
}
