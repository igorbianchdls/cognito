'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useOrganization } from '@clerk/nextjs'
import { Notice } from '@/products/analytics/frontend/ui'
import { deniedMessage, supabase } from './data'

type Pipeline = { id: string; name: string; position: number }
type Stage = { id: string; pipeline_id: string; name: string; position: number; kind: 'aberto' | 'ganho' | 'perdido' }
type Deal = { id: string; pipeline_id: string; stage_id: string; contact_id: string | null; title: string; value: number | null; expected_close: string | null; owner: string | null; position: number; notes: string | null; lost_reason: string | null; closed_at: string | null; created_at: string; contact: { id: string; name: string } | null }
type Task = { id: string; title: string; due_at: string | null; done_at: string | null; assignee: string | null; contact_id: string | null; deal_id: string | null; contact: { id: string; name: string } | null }
type Member = { id: string; name: string }

const money = (v: number | null | undefined) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const KIND_COLOR = { aberto: '#2563eb', ganho: '#16a34a', perdido: '#a3a3a3' }
const input = 'mt-1 h-9 w-full rounded-lg border border-[#e2e2e2] px-2.5 text-[13px] text-[#111]'
const DEFAULT_STAGES: [string, Stage['kind']][] = [['Lead', 'aberto'], ['Conversando', 'aberto'], ['Proposta', 'aberto'], ['Ganho', 'ganho'], ['Perdido', 'perdido']]

function useMembers(): Member[] {
  const { memberships } = useOrganization({ memberships: { pageSize: 100 } })
  return useMemo(() => (memberships?.data ?? []).map(m => ({ id: m.publicUserData?.userId ?? '', name: [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || m.publicUserData?.identifier || 'Pessoa' })).filter(m => m.id), [memberships?.data])
}

/** Deals in a kanban per pipeline, and the team's tasks. */
export function DealsView() {
  const params = useSearchParams(), router = useRouter(), pathname = usePathname()
  const tab = params.get('aba') === 'tarefas' ? 'tarefas' : 'funil'
  return (
    <div className="flex h-[calc(100dvh-var(--app-header-h))] min-h-0 flex-col bg-[#fafafa]">
      <header className="flex items-center gap-3 border-b border-[#ececef] bg-white px-4 py-2.5">
        <h1 className="text-[17px] font-semibold">Negócios</h1>
        <div role="tablist" className="flex rounded-lg bg-[#f2f2f4] p-0.5 text-[13px]">
          {(['funil', 'tarefas'] as const).map(t => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => router.replace(t === 'funil' ? pathname : `${pathname}?aba=tarefas`)}
              className={`rounded-md px-3 py-1 ${tab === t ? 'bg-white font-medium shadow-sm' : 'text-[#636366]'}`}>{t === 'funil' ? 'Funil' : 'Tarefas'}</button>
          ))}
        </div>
      </header>
      {tab === 'funil' ? <Board /> : <Tasks />}
    </div>
  )
}

function Board() {
  const { orgId, isLoaded } = useAuth()
  const members = useMembers()
  const [pipelines, setPipelines] = useState<Pipeline[] | null>(null)
  const [current, setCurrent] = useState<string | null>(null)
  const [stages, setStages] = useState<Stage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [version, setVersion] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [editingStages, setEditingStages] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const reload = () => setVersion(v => v + 1)

  useEffect(() => {
    if (!isLoaded || !orgId) return
    let live = true
    void supabase().from('pipelines').select('id, name, position').eq('workspace_id', orgId).order('position').then(r => {
      if (!live) return
      const list = (r.data ?? []) as Pipeline[]
      setPipelines(list); setCurrent(c => (c && list.some(p => p.id === c) ? c : list[0]?.id ?? null))
    })
    return () => { live = false }
  }, [isLoaded, orgId, version])
  useEffect(() => {
    if (!current) return
    let live = true
    void Promise.all([
      supabase().from('pipeline_stages').select('id, pipeline_id, name, position, kind').eq('pipeline_id', current).order('position'),
      supabase().from('deals').select('id, pipeline_id, stage_id, contact_id, title, value, expected_close, owner, position, notes, lost_reason, closed_at, created_at, contact:contacts(id, name)').eq('pipeline_id', current).order('position').limit(2000),
    ]).then(([s, d]) => { if (live) { setStages((s.data ?? []) as Stage[]); setDeals((d.data ?? []) as unknown as Deal[]) } })
    return () => { live = false }
  }, [current, version])

  async function createPipeline() {
    const name = window.prompt('Nome do funil:', pipelines?.length ? 'Novo funil' : 'Vendas')
    if (!name?.trim()) return
    const { data, error } = await supabase().from('pipelines').insert({ workspace_id: orgId, name: name.trim(), position: pipelines?.length ?? 0 }).select('id').single()
    if (error) return setMessage(deniedMessage(error, 'Não foi possível criar o funil.'))
    const { error: e2 } = await supabase().from('pipeline_stages').insert(DEFAULT_STAGES.map(([n, kind], position) => ({ workspace_id: orgId, pipeline_id: data.id, name: n, kind, position })))
    if (e2) setMessage(deniedMessage(e2, 'Funil criado sem etapas.'))
    setCurrent(data.id); reload()
  }
  async function move(dealId: string, stageId: string, beforeId?: string) {
    const col = deals.filter(d => d.stage_id === stageId && d.id !== dealId).sort((a, b) => a.position - b.position)
    const i = beforeId ? col.findIndex(d => d.id === beforeId) : -1
    const position = i < 0 ? (col.at(-1)?.position ?? 0) + 1 : i === 0 ? col[0].position - 1 : (col[i - 1].position + col[i].position) / 2
    setDeals(ds => ds.map(d => (d.id === dealId ? { ...d, stage_id: stageId, position } : d)))
    const { error } = await supabase().from('deals').update({ stage_id: stageId, position }).eq('id', dealId)
    if (error) { setMessage(deniedMessage(error, 'Não foi possível mover.')); reload() }
  }
  async function quickAdd(stage: Stage) {
    const title = window.prompt(`Novo negócio em "${stage.name}" — título:`)
    if (!title?.trim()) return
    const position = (deals.filter(d => d.stage_id === stage.id).at(-1)?.position ?? 0) + 1
    const { data, error } = await supabase().from('deals').insert({ workspace_id: orgId, pipeline_id: stage.pipeline_id, stage_id: stage.id, title: title.trim(), position }).select('id').single()
    if (error) return setMessage(deniedMessage(error, 'Não foi possível criar.'))
    setSelected(data.id); reload()
  }

  if (!pipelines) return <div className="p-6"><Notice>Carregando…</Notice></div>
  if (!pipelines.length) return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <h2 className="text-[20px] font-semibold">Seu funil de vendas</h2>
      <p className="mt-2 text-[14px] text-[#555]">Acompanhe cada negociação por etapa — Lead, Conversando, Proposta, Ganho ou Perdido — com valor e previsão. Compras aprovadas das integrações movem o negócio para “Ganho” sozinhas.</p>
      <button type="button" onClick={() => void createPipeline()} className="mt-5 h-10 rounded-lg bg-[#111] px-5 text-[14px] font-medium text-white">Criar funil de vendas</button>
      {message ? <p role="alert" className="mt-3 text-[13px] text-[#a12b2b]">{message}</p> : null}
    </div>
  )
  const deal = deals.find(d => d.id === selected) ?? null
  const open = deals.filter(d => stages.find(s => s.id === d.stage_id)?.kind === 'aberto')
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-[13px]">
          <select value={current ?? ''} onChange={e => setCurrent(e.target.value)} aria-label="Funil" className="h-8 rounded-lg border border-[#e2e2e2] bg-white px-2 font-medium">
            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="text-[#636366]">{open.length} em aberto · {money(open.reduce((t, d) => t + Number(d.value ?? 0), 0))}</span>
          <span className="flex-1" />
          <button type="button" onClick={() => setEditingStages(true)} className="h-8 rounded-lg border border-[#e2e2e2] bg-white px-3">Etapas</button>
          <button type="button" onClick={() => void createPipeline()} className="h-8 rounded-lg border border-[#e2e2e2] bg-white px-3">Novo funil</button>
        </div>
        {message ? <p role="alert" className="mx-4 mb-2 rounded-lg bg-[#fdf2f2] px-3 py-2 text-[13px] text-[#8a2b2b]">{message}</p> : null}
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 pb-4">
          {stages.map(stage => {
            const cards = deals.filter(d => d.stage_id === stage.id).sort((a, b) => a.position - b.position)
            return (
              <section key={stage.id} aria-label={stage.name} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragging) void move(dragging, stage.id); setDragging(null) }}
                className="flex w-[272px] shrink-0 flex-col rounded-xl bg-[#f0f0f2]">
                <header className="flex items-center gap-2 px-3 pb-1.5 pt-2.5">
                  <span className="size-2 rounded-full" style={{ background: KIND_COLOR[stage.kind] }} />
                  <h2 className="min-w-0 flex-1 truncate text-[13px] font-semibold">{stage.name}</h2>
                  <span className="text-[12px] text-[#8e8e93]">{cards.length}</span>
                </header>
                <p className="px-3 pb-2 text-[12px] text-[#636366]">{money(cards.reduce((t, d) => t + Number(d.value ?? 0), 0))}</p>
                <ol className="min-h-[40px] flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                  {cards.map(d => {
                    const late = d.expected_close && stage.kind === 'aberto' && new Date(d.expected_close) < new Date(new Date().toDateString())
                    return (
                      <li key={d.id} draggable onDragStart={() => setDragging(d.id)} onDragEnd={() => setDragging(null)}
                        onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.stopPropagation(); if (dragging && dragging !== d.id) void move(dragging, stage.id, d.id); setDragging(null) }}
                        onClick={() => setSelected(d.id)}
                        className={`cursor-grab rounded-lg border bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:cursor-grabbing ${selected === d.id ? 'border-[#111]' : 'border-[#e5e5ea]'} ${dragging === d.id ? 'opacity-40' : ''}`}>
                        <p className="text-[13px] font-medium leading-snug">{d.title}</p>
                        {d.contact ? <p className="mt-0.5 truncate text-[12px] text-[#636366]">{d.contact.name}</p> : null}
                        <p className="mt-1.5 flex items-center gap-2 text-[12px]">
                          <span className="font-medium">{d.value !== null ? money(Number(d.value)) : '—'}</span>
                          {d.expected_close ? <span className={late ? 'text-[#c0392b]' : 'text-[#8e8e93]'}>{new Date(d.expected_close + 'T12:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span> : null}
                          {d.owner ? <span className="ml-auto grid size-5 place-items-center rounded-full bg-[#e9e7f5] text-[9px] font-semibold text-[#4b3f8f]" title={members.find(m => m.id === d.owner)?.name}>{(members.find(m => m.id === d.owner)?.name ?? '?').split(' ').map(p => p[0]).join('').slice(0, 2)}</span> : null}
                        </p>
                      </li>
                    )
                  })}
                </ol>
                {stage.kind === 'aberto' ? <button type="button" onClick={() => void quickAdd(stage)} className="mx-2 mb-2 rounded-lg py-1.5 text-left text-[12.5px] text-[#636366] hover:bg-black/[0.04]">+ Negócio</button> : null}
              </section>
            )
          })}
        </div>
      </div>
      {deal ? <DealPanel key={deal.id} deal={deal} stages={stages} members={members} onClose={() => setSelected(null)} onChanged={reload} /> : null}
      {editingStages && current ? <StagesEditor pipelineId={current} stages={stages} deals={deals} onClose={() => { setEditingStages(false); reload() }} /> : null}
    </div>
  )
}

function DealPanel({ deal, stages, members, onClose, onChanged }: { deal: Deal; stages: Stage[]; members: Member[]; onClose: () => void; onChanged: () => void }) {
  const { orgId } = useAuth()
  const [form, setForm] = useState({ title: deal.title, value: deal.value === null ? '' : String(deal.value), expected_close: deal.expected_close ?? '', owner: deal.owner ?? '', notes: deal.notes ?? '', lost_reason: deal.lost_reason ?? '', stage_id: deal.stage_id })
  const [contact, setContact] = useState(deal.contact)
  const [search, setSearch] = useState('')
  const [found, setFound] = useState<{ id: string; name: string }[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [conv, setConv] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [taskVersion, setTaskVersion] = useState(0)
  useEffect(() => {
    if (search.trim().length < 2 || !orgId) return
    let live = true
    const t = setTimeout(() => void supabase().from('contacts').select('id, name').eq('workspace_id', orgId).ilike('name', `%${search.trim()}%`).limit(8).then(r => { if (live) setFound((r.data ?? []) as { id: string; name: string }[]) }), 250)
    return () => { live = false; clearTimeout(t) }
  }, [search, orgId])
  useEffect(() => {
    let live = true
    void supabase().from('tasks').select('id, title, due_at, done_at, assignee, contact_id, deal_id, contact:contacts(id, name)').eq('deal_id', deal.id).order('due_at').then(r => { if (live) setTasks((r.data ?? []) as unknown as Task[]) })
    return () => { live = false }
  }, [deal.id, taskVersion])
  useEffect(() => {
    if (!contact) return
    let live = true
    void supabase().from('conversations').select('id').eq('contact_id', contact.id).order('last_message_at', { ascending: false }).limit(1).then(r => { if (live) setConv((r.data?.[0]?.id as string) ?? null) })
    return () => { live = false }
  }, [contact])
  async function save() {
    const value = form.value.trim() ? Number(form.value.replace(/\./g, '').replace(',', '.')) : null
    if (value !== null && !(value >= 0)) return setMessage('Valor inválido.')
    const { error } = await supabase().from('deals').update({ title: form.title.trim() || deal.title, value, expected_close: form.expected_close || null, owner: form.owner || null,
      notes: form.notes.trim() || null, lost_reason: form.lost_reason.trim() || null, stage_id: form.stage_id, contact_id: contact?.id ?? null }).eq('id', deal.id)
    setMessage(error ? deniedMessage(error, 'Não foi possível salvar.') : 'Salvo.')
    if (!error) onChanged()
  }
  const stageKind = stages.find(s => s.id === form.stage_id)?.kind
  return (
    <aside aria-label="Negócio" className="flex w-[340px] shrink-0 flex-col overflow-y-auto border-l border-[#ececef] bg-white p-4 text-[13px]">
      <div className="mb-3 flex items-center"><b className="flex-1">Negócio</b><button type="button" onClick={onClose} aria-label="Fechar" className="text-[#8e8e93]">✕</button></div>
      <label className="text-[#555]">Título<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={input} /></label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-[#555]">Valor (R$)<input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} inputMode="decimal" className={input} /></label>
        <label className="text-[#555]">Previsão<input type="date" value={form.expected_close} onChange={e => setForm({ ...form, expected_close: e.target.value })} className={input} /></label>
      </div>
      <label className="mt-2 text-[#555]">Etapa<select value={form.stage_id} onChange={e => setForm({ ...form, stage_id: e.target.value })} className={input}>{stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      {stageKind === 'perdido' ? <label className="mt-2 text-[#555]">Motivo da perda<input value={form.lost_reason} onChange={e => setForm({ ...form, lost_reason: e.target.value })} className={input} placeholder="preço, prazo, concorrente…" /></label> : null}
      <label className="mt-2 text-[#555]">Responsável<select value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} className={input}><option value="">Ninguém</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <div className="mt-2 text-[#555]">Contato
        {contact ? (
          <p className="mt-1 flex items-center gap-2 rounded-lg border border-[#e5e5ea] px-2.5 py-1.5 text-[#111]">
            <Link href={`/inbox/contatos?c=${contact.id}`} className="flex-1 truncate underline">{contact.name}</Link>
            {conv ? <Link href={`/inbox?c=${conv}`} className="text-[#2563eb] underline">conversa</Link> : null}
            <button type="button" onClick={() => setContact(null)} className="text-[#a33]" aria-label="Tirar contato">✕</button>
          </p>
        ) : (<>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar contato pelo nome" className={input} />
          {search.trim().length >= 2 ? <ul className="mt-1 rounded-lg border border-[#e5e5ea]">{found.map(f => <li key={f.id}><button type="button" onClick={() => { setContact(f); setSearch('') }} className="block w-full px-2.5 py-1.5 text-left hover:bg-[#f2f2f4]">{f.name}</button></li>)}{!found.length ? <li className="px-2.5 py-1.5 text-[#8e8e93]">Nenhum contato</li> : null}</ul> : null}
        </>)}
      </div>
      <label className="mt-2 text-[#555]">Anotações<textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-[#e2e2e2] px-2.5 py-1.5 text-[13px] text-[#111]" /></label>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void save()} className="h-9 rounded-lg bg-[#111] px-4 font-medium text-white">Salvar</button>
        <button type="button" onClick={async () => { if (!window.confirm('Excluir este negócio?')) return; const { error } = await supabase().from('deals').delete().eq('id', deal.id); if (error) setMessage(deniedMessage(error, 'Não foi possível excluir.')); else { onClose(); onChanged() } }} className="ml-auto text-[#a33] underline">Excluir</button>
      </div>
      {message ? <p role="status" className="mt-2 text-[12.5px] text-[#555]">{message}</p> : null}
      <div className="mt-5 border-t border-[#f2f2f4] pt-3">
        <p className="mb-2 font-semibold">Tarefas</p>
        <TaskList tasks={tasks} members={members} onChanged={() => setTaskVersion(v => v + 1)} defaults={{ deal_id: deal.id, contact_id: contact?.id ?? null }} compact />
      </div>
    </aside>
  )
}

function StagesEditor({ pipelineId, stages, deals, onClose }: { pipelineId: string; stages: Stage[]; deals: Deal[]; onClose: () => void }) {
  const { orgId } = useAuth()
  const [list, setList] = useState(stages)
  const [message, setMessage] = useState<string | null>(null)
  async function saveAll() {
    for (const [i, s] of list.entries()) {
      const { error } = s.id.startsWith('new-')
        ? await supabase().from('pipeline_stages').insert({ workspace_id: orgId, pipeline_id: pipelineId, name: s.name.trim() || 'Etapa', kind: s.kind, position: i })
        : await supabase().from('pipeline_stages').update({ name: s.name.trim() || 'Etapa', kind: s.kind, position: i }).eq('id', s.id)
      if (error) return setMessage(deniedMessage(error, 'Não foi possível salvar as etapas.'))
    }
    onClose()
  }
  const swap = (i: number, j: number) => setList(l => { const c = [...l]; [c[i], c[j]] = [c[j], c[i]]; return c })
  return (
    <div role="dialog" aria-modal="true" aria-label="Etapas do funil" className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 text-[13px] shadow-xl">
        <h2 className="mb-3 text-[16px] font-semibold">Etapas do funil</h2>
        <ul className="grid gap-1.5">
          {list.map((s, i) => (
            <li key={s.id} className="flex items-center gap-1.5">
              <input value={s.name} onChange={e => setList(l => l.map(x => (x.id === s.id ? { ...x, name: e.target.value } : x)))} aria-label="Nome da etapa" className="h-8 min-w-0 flex-1 rounded-md border border-[#e2e2e2] px-2" />
              <select value={s.kind} onChange={e => setList(l => l.map(x => (x.id === s.id ? { ...x, kind: e.target.value as Stage['kind'] } : x)))} aria-label="Tipo" className="h-8 rounded-md border border-[#e2e2e2] px-1"><option value="aberto">Aberto</option><option value="ganho">Ganho</option><option value="perdido">Perdido</option></select>
              <button type="button" disabled={i === 0} onClick={() => swap(i, i - 1)} aria-label="Subir" className="px-1 disabled:opacity-30">↑</button>
              <button type="button" disabled={i === list.length - 1} onClick={() => swap(i, i + 1)} aria-label="Descer" className="px-1 disabled:opacity-30">↓</button>
              <button type="button" aria-label="Excluir etapa" onClick={async () => {
                if (deals.some(d => d.stage_id === s.id)) return setMessage('Mova os negócios desta etapa antes de excluí-la.')
                if (!s.id.startsWith('new-')) { const { error } = await supabase().from('pipeline_stages').delete().eq('id', s.id); if (error) return setMessage(deniedMessage(error, 'Não foi possível excluir.')) }
                setList(l => l.filter(x => x.id !== s.id))
              }} className="px-1 text-[#a33]">✕</button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setList(l => [...l, { id: 'new-' + Date.now(), pipeline_id: pipelineId, name: 'Nova etapa', position: l.length, kind: 'aberto' }])} className="mt-2 text-[#2563eb] underline">+ etapa</button>
        {message ? <p role="alert" className="mt-2 text-[#a12b2b]">{message}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#e2e2e2] px-4">Cancelar</button>
          <button type="button" onClick={() => void saveAll()} className="h-9 rounded-lg bg-[#111] px-4 font-medium text-white">Salvar</button>
        </div>
      </div>
    </div>
  )
}

function Tasks() {
  const { orgId, userId, isLoaded } = useAuth()
  const members = useMembers()
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [mine, setMine] = useState(true)
  const [done, setDone] = useState(false)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    if (!isLoaded || !orgId) return
    let live = true
    void supabase().from('tasks').select('id, title, due_at, done_at, assignee, contact_id, deal_id, contact:contacts(id, name)').eq('workspace_id', orgId).order('due_at', { ascending: true }).limit(500)
      .then(r => { if (live) setTasks((r.data ?? []) as unknown as Task[]) })
    return () => { live = false }
  }, [isLoaded, orgId, version])
  const visible = (tasks ?? []).filter(t => (mine ? t.assignee === userId : true) && (done ? !!t.done_at : !t.done_at))
  return (
    <div className="mx-auto w-full max-w-3xl overflow-y-auto px-4 py-5">
      <div className="mb-3 flex flex-wrap gap-2 text-[13px]">
        <button type="button" aria-pressed={mine} onClick={() => setMine(!mine)} className={`h-8 rounded-lg border px-3 ${mine ? 'border-[#111] bg-[#111] text-white' : 'border-[#e2e2e2] bg-white'}`}>Só as minhas</button>
        <button type="button" aria-pressed={done} onClick={() => setDone(!done)} className={`h-8 rounded-lg border px-3 ${done ? 'border-[#111] bg-[#111] text-white' : 'border-[#e2e2e2] bg-white'}`}>{done ? 'Concluídas' : 'Pendentes'}</button>
      </div>
      {tasks === null ? <Notice>Carregando…</Notice> : <TaskList tasks={visible} members={members} onChanged={() => setVersion(v => v + 1)} defaults={{ assignee: userId ?? null }} />}
    </div>
  )
}

function TaskList({ tasks, members, onChanged, defaults, compact }: { tasks: Task[]; members: Member[]; onChanged: () => void; defaults: { deal_id?: string; contact_id?: string | null; assignee?: string | null }; compact?: boolean }) {
  const { orgId, userId } = useAuth()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [assignee, setAssignee] = useState(defaults.assignee ?? userId ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const add = useCallback(async () => {
    if (!title.trim()) return
    const { error } = await supabase().from('tasks').insert({ workspace_id: orgId, title: title.trim(), due_at: due ? new Date(due).toISOString() : null, assignee: assignee || null, deal_id: defaults.deal_id ?? null, contact_id: defaults.contact_id ?? null })
    setMessage(error ? deniedMessage(error, 'Não foi possível criar.') : null)
    if (!error) { setTitle(''); setDue(''); onChanged() }
  }, [title, due, assignee, orgId, defaults.deal_id, defaults.contact_id, onChanged])
  const [now] = useState(() => Date.now())
  return (
    <div className="text-[13px]">
      <ul className="grid gap-1">
        {tasks.map(t => (
          <li key={t.id} className={`flex items-start gap-2 rounded-lg ${compact ? 'py-1' : 'border border-[#ececef] bg-white px-3 py-2'}`}>
            <input type="checkbox" checked={!!t.done_at} aria-label={`Concluir ${t.title}`} onChange={async e => { const { error } = await supabase().from('tasks').update({ done_at: e.target.checked ? new Date().toISOString() : null }).eq('id', t.id); if (error) setMessage(deniedMessage(error, 'Não foi possível mudar.')); onChanged() }} className="mt-0.5" />
            <span className="min-w-0 flex-1">
              <span className={t.done_at ? 'text-[#8e8e93] line-through' : ''}>{t.title}</span>
              <span className="block text-[12px] text-[#8e8e93]">
                {t.due_at ? <span className={!t.done_at && new Date(t.due_at).getTime() < now ? 'text-[#c0392b]' : ''}>{new Date(t.due_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span> : 'sem prazo'}
                {t.assignee ? ` · ${members.find(m => m.id === t.assignee)?.name ?? 'equipe'}` : ''}{!compact && t.contact ? ` · ${t.contact.name}` : ''}
              </span>
            </span>
            <button type="button" aria-label="Excluir tarefa" onClick={async () => { await supabase().from('tasks').delete().eq('id', t.id); onChanged() }} className="text-[#c7c7cc] hover:text-[#a33]">✕</button>
          </li>
        ))}
        {!tasks.length ? <li className="text-[#8e8e93]">Nenhuma tarefa.</li> : null}
      </ul>
      <form className={`mt-2 grid gap-1.5 ${compact ? '' : 'rounded-xl bg-white p-3'}`} onSubmit={e => { e.preventDefault(); void add() }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nova tarefa (ex.: ligar para confirmar)" aria-label="Nova tarefa" className="h-8 rounded-md border border-[#e2e2e2] px-2" />
        <div className="flex gap-1.5">
          <input type="datetime-local" value={due} onChange={e => setDue(e.target.value)} aria-label="Prazo" className="h-8 min-w-0 flex-1 rounded-md border border-[#e2e2e2] px-2" />
          <select value={assignee} onChange={e => setAssignee(e.target.value)} aria-label="Responsável" className="h-8 min-w-0 flex-1 rounded-md border border-[#e2e2e2] px-1"><option value="">Ninguém</option>{members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <button type="submit" className="h-8 rounded-md bg-[#111] px-3 text-white">Criar</button>
        </div>
        {message ? <p role="alert" className="text-[#a12b2b]">{message}</p> : null}
      </form>
    </div>
  )
}
