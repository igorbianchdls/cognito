'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth, useOrganization } from '@clerk/nextjs'
import { CHANNEL_LABEL, windowLeft, windowOpen, type ChannelKind } from '../shared/rules'
import { deniedMessage, formatPhone, post, supabase, time, type Conversation, type Message, type Note, type QuickReply, type Tag } from './data'

type Filter = 'abertas' | 'minhas' | 'sem' | 'fechadas'
const FILTERS: { id: Filter; label: string }[] = [{ id: 'abertas', label: 'Abertas' }, { id: 'minhas', label: 'Minhas' }, { id: 'sem', label: 'Sem responsável' }, { id: 'fechadas', label: 'Fechadas' }]
const CHANNEL_COLOR: Record<ChannelKind, string> = { whatsapp: '#16a34a', instagram: '#d62976', messenger: '#0866ff', teste: '#6b7280' }
const STATUS_ICON: Record<Message['status'], string> = { recebida: '', enviando: '🕓', enviada: '✓', entregue: '✓✓', lida: '✓✓', falhou: '!' }

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || '?'
function Avatar({ name, kind }: { name: string; kind?: ChannelKind }) {
  return (
    <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[#ececec] text-[13px] font-semibold text-[#444]">
      {initials(name)}
      {kind ? <span className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white" style={{ background: CHANNEL_COLOR[kind] }} title={CHANNEL_LABEL[kind]} /> : null}
    </span>
  )
}

/** Live inbox: conversations on the left, the chat in the middle, the contact and the team's tools on the right. */
export function InboxView() {
  const { orgId, userId, isLoaded } = useAuth()
  const { memberships } = useOrganization({ memberships: { pageSize: 100 } })
  const members = useMemo(() => (memberships?.data ?? []).map(m => ({
    id: m.publicUserData?.userId ?? '', name: [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || m.publicUserData?.identifier || 'Pessoa',
  })).filter(m => m.id), [memberships?.data])
  const nameOf = useCallback((id: string | null) => (id ? members.find(m => m.id === id)?.name ?? 'Alguém da equipe' : null), [members])

  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [hasChannels, setHasChannels] = useState(true)
  const [filter, setFilter] = useState<Filter>('abertas')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  // ---------- live updates: Supabase Realtime, with a slow poll in case the socket drops ----------
  useEffect(() => {
    if (!orgId) return
    const db = supabase()
    const channel = db.channel('inbox:' + orgId)
      .on('postgres_changes', { event: '*', schema: 'inbox', table: 'messages', filter: `workspace_id=eq.${orgId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'inbox', table: 'conversations', filter: `workspace_id=eq.${orgId}` }, refresh)
      .subscribe()
    const poll = setInterval(refresh, 15000)
    return () => { clearInterval(poll); void db.removeChannel(channel) }
  }, [orgId, refresh])

  useEffect(() => {
    if (!isLoaded || !orgId) return
    let live = true
    void Promise.all([
      supabase().from('conversations').select('id, status, assignee, last_message_at, last_inbound_at, last_preview, unread, contact_id, channel_id, contact:contacts(id, name, phone, email), channel:channels(id, kind, name, status)')
        .eq('workspace_id', orgId).order('last_message_at', { ascending: false }).limit(300),
      supabase().from('channels').select('id', { count: 'exact', head: true }).eq('workspace_id', orgId),
    ]).then(([c, ch]) => {
      if (!live) return
      setConversations((c.data ?? []) as unknown as Conversation[])
      setHasChannels((ch.count ?? 0) > 0)
    })
    return () => { live = false }
  }, [isLoaded, orgId, tick])

  const visible = useMemo(() => (conversations ?? []).filter(c => {
    if (filter === 'fechadas' ? c.status !== 'fechada' : c.status === 'fechada') return false
    if (filter === 'minhas' && c.assignee !== userId) return false
    if (filter === 'sem' && c.assignee) return false
    const q = search.trim().toLowerCase()
    return !q || (c.contact?.name ?? '').toLowerCase().includes(q) || (c.contact?.phone ?? '').includes(q.replace(/\D/g, '') || '§') || (c.last_preview ?? '').toLowerCase().includes(q)
  }), [conversations, filter, search, userId])
  const current = conversations?.find(c => c.id === selected) ?? null

  if (conversations === null) return <div className="p-8 text-[14px] text-[#666]">Carregando…</div>
  if (!hasChannels) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-[24px] font-semibold text-[#111]">Atendimento em um lugar só</h1>
        <p className="mt-2 text-[15px] text-[#555]">Conecte o WhatsApp, o Instagram ou o Messenger da empresa e responda todos os clientes daqui, com a equipe.</p>
        <Link href="/inbox/canais" className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#111] px-5 text-[14px] font-medium text-white">Conectar um canal</Link>
        <p className="mt-3 text-[13px] text-[#777]">Sem o app da Meta ainda? Crie um canal de teste para conhecer.</p>
      </div>
    )
  }
  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 bg-white md:h-[100dvh]">
      {/* ---------- list ---------- */}
      <aside className={`${current ? 'hidden md:flex' : 'flex'} w-full min-w-0 flex-col border-r border-[#ececec] md:w-[340px] md:shrink-0`}>
        <div className="border-b border-[#ececec] p-3">
          <h1 className="mb-2 px-1 text-[18px] font-semibold text-[#111]">Caixa de entrada</h1>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, número ou mensagem" aria-label="Buscar conversas"
            className="h-9 w-full rounded-lg border border-[#e2e2e2] px-3 text-[14px]" />
          <div role="tablist" aria-label="Filtro" className="mt-2 flex gap-1 overflow-x-auto">
            {FILTERS.map(f => {
              const count = f.id === 'fechadas' ? null : (conversations ?? []).filter(c => c.status !== 'fechada' && (f.id !== 'minhas' || c.assignee === userId) && (f.id !== 'sem' || !c.assignee)).length
              return (
                <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
                  className={`h-8 shrink-0 rounded-md px-2.5 text-[13px] ${filter === f.id ? 'bg-[#111] text-white' : 'text-[#555] hover:bg-[#f3f3f3]'}`}>
                  {f.label}{count ? <span className="ml-1 opacity-70">{count}</span> : null}
                </button>
              )
            })}
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {!visible.length ? <li className="p-6 text-center text-[13px] text-[#777]">Nenhuma conversa aqui.</li> : null}
          {visible.map(c => (
            <li key={c.id}>
              <button type="button" onClick={() => setSelected(c.id)} aria-current={selected === c.id}
                className={`flex w-full gap-3 border-b border-[#f3f3f3] px-3 py-3 text-left ${selected === c.id ? 'bg-[#f3f4f6]' : 'hover:bg-[#fafafa]'}`}>
                <Avatar name={c.contact?.name ?? '?'} kind={c.channel?.kind} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-[14px] ${c.unread ? 'font-semibold text-[#111]' : 'font-medium text-[#222]'}`}>{c.contact?.name ?? 'Contato'}</span>
                    <span className="shrink-0 text-[12px] text-[#888]">{time(c.last_message_at)}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2">
                    <span className={`truncate text-[13px] ${c.unread ? 'text-[#222]' : 'text-[#777]'}`}>{c.last_preview || '—'}</span>
                    {c.unread ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#16a34a] px-1.5 text-[11px] font-semibold text-white">{c.unread}</span> : null}
                  </span>
                  {c.assignee ? <span className="mt-1 block truncate text-[12px] text-[#888]">→ {nameOf(c.assignee)}</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {current ? <Chat key={current.id} conversation={current} tick={tick} onChange={refresh} onBack={() => setSelected(null)} members={members} nameOf={nameOf} />
        : <div className="hidden flex-1 place-items-center text-[14px] text-[#888] md:grid">Escolha uma conversa.</div>}
    </div>
  )
}

type Member = { id: string; name: string }
type Item = { at: string; message?: Message; note?: Note }

function Chat({ conversation: c, tick, onChange, onBack, members, nameOf }: {
  conversation: Conversation; tick: number; onChange: () => void; onBack: () => void; members: Member[]; nameOf: (id: string | null) => string | null
}) {
  const { orgId, userId } = useAuth()
  const [items, setItems] = useState<Item[] | null>(null)
  const [quick, setQuick] = useState<QuickReply[]>([])
  const [text, setText] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const kind = c.channel?.kind ?? 'teste'

  useEffect(() => {
    let live = true
    void Promise.all([
      supabase().from('messages').select('id, direction, kind, body, media_path, media_mime, media_name, status, error, sent_by, created_at').eq('conversation_id', c.id).order('created_at').limit(500),
      supabase().from('notes').select('id, body, author, created_at').eq('conversation_id', c.id).order('created_at'),
    ]).then(([m, n]) => {
      if (!live) return
      const all: Item[] = [...((m.data ?? []) as Message[]).map(message => ({ at: message.created_at, message })), ...((n.data ?? []) as Note[]).map(note => ({ at: note.created_at, note }))]
      setItems(all.sort((a, b) => a.at.localeCompare(b.at)))
    })
    return () => { live = false }
  }, [c.id, tick])
  useEffect(() => {
    if (!orgId) return
    let live = true
    void supabase().from('quick_replies').select('id, shortcut, body').eq('workspace_id', orgId).order('shortcut').then(r => { if (live) setQuick((r.data ?? []) as QuickReply[]) })
    return () => { live = false }
  }, [orgId])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [items?.length])
  // Opening the conversation marks it read (for people who can write; viewers just don't change it).
  useEffect(() => { if (c.unread) void supabase().from('conversations').update({ unread: 0 }).eq('id', c.id).then(() => undefined) }, [c.id, c.unread])

  const open = windowOpen(kind, c.last_inbound_at)
  const left = windowLeft(kind, c.last_inbound_at)
  const suggestions = !noteMode && text.startsWith('/') ? quick.filter(q => q.shortcut.startsWith(text.slice(1).toLowerCase())).slice(0, 6) : []

  async function submit() {
    const body = text.trim()
    if (!body || sending) return
    setSending(true); setError(null)
    try {
      if (noteMode) {
        const { error: e } = await supabase().from('notes').insert({ workspace_id: orgId, conversation_id: c.id, body, author: userId })
        if (e) throw new Error(deniedMessage(e, 'Não foi possível salvar a nota.'))
      } else {
        const result = await post<{ status: string; erro?: string }>(`/api/inbox/conversas/${c.id}/mensagens`, { texto: body })
        if (result.status === 'falhou') setError(`Não foi enviada: ${result.erro ?? 'a Meta recusou.'}`)
      }
      setText('')
      onChange()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }
  async function update(fields: Partial<Pick<Conversation, 'status' | 'assignee'>>) {
    const { error: e } = await supabase().from('conversations').update(fields).eq('id', c.id)
    if (e) setError(deniedMessage(e, 'Não foi possível atualizar a conversa.')); else onChange()
  }

  return (
    <>
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-[#ececec] px-3 py-2.5">
          <button type="button" onClick={onBack} className="rounded-md px-2 py-1 text-[14px] text-[#555] hover:bg-[#f3f3f3] md:hidden" aria-label="Voltar">←</button>
          <Avatar name={c.contact?.name ?? '?'} kind={kind} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[#111]">{c.contact?.name}</p>
            <p className="truncate text-[12px] text-[#777]">{CHANNEL_LABEL[kind]} · {c.channel?.name}{c.contact?.phone ? ` · ${formatPhone(c.contact.phone)}` : ''}</p>
          </div>
          {c.status === 'fechada'
            ? <button type="button" onClick={() => update({ status: 'aberta' })} className="h-8 rounded-lg border border-[#e2e2e2] px-3 text-[13px]">Reabrir</button>
            : <button type="button" onClick={() => update({ status: 'fechada' })} className="h-8 rounded-lg bg-[#111] px-3 text-[13px] font-medium text-white">Encerrar</button>}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f5] px-3 py-4 md:px-6">
          {items === null ? <p className="text-center text-[13px] text-[#888]">Carregando…</p> : null}
          <ol className="mx-auto flex max-w-3xl flex-col gap-1.5">
            {(items ?? []).map(item => item.note ? (
              <li key={'n' + item.note.id} className="mx-auto my-1 max-w-[85%] rounded-xl border border-[#f1e3a6] bg-[#fff8db] px-3 py-2 text-[13px] text-[#5c4a00]">
                <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wide">Nota interna · {nameOf(item.note.author) ?? 'Equipe'} · {time(item.note.created_at)}</span>
                <span className="whitespace-pre-wrap">{item.note.body}</span>
              </li>
            ) : <Bubble key={item.message!.id} m={item.message!} who={nameOf(item.message!.sent_by)} />)}
          </ol>
          <div ref={end} />
        </div>

        <footer className="border-t border-[#ececec] bg-white p-3">
          {error ? <p role="alert" className="mb-2 rounded-lg bg-[#fdf2f2] px-3 py-2 text-[13px] text-[#8a2b2b]">{error}</p> : null}
          {!open && !noteMode ? (
            <p className="mb-2 rounded-lg bg-[#fff7e6] px-3 py-2 text-[13px] text-[#8a5a00]">
              A janela de 24 horas fechou: pela regra da Meta, só dá para responder com um modelo aprovado (chega com os Disparos). Você ainda pode deixar notas internas.
            </p>
          ) : left ? <p className="mb-1.5 text-[12px] text-[#888]">Janela de resposta da Meta fecha em {left}.</p> : null}
          {suggestions.length ? (
            <ul className="mb-2 overflow-hidden rounded-lg border border-[#e2e2e2]">
              {suggestions.map(q => (
                <li key={q.id}><button type="button" onClick={() => setText(q.body)} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f3f3f3]">
                  <b>/{q.shortcut}</b> <span className="text-[#666]">{q.body.slice(0, 90)}</span>
                </button></li>
              ))}
            </ul>
          ) : null}
          <div className={`rounded-xl border ${noteMode ? 'border-[#f1e3a6] bg-[#fffbea]' : 'border-[#e2e2e2]'}`}>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={2} disabled={!open && !noteMode}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit() } }}
              placeholder={noteMode ? 'Nota só para a equipe…' : open ? 'Escreva uma resposta. "/" abre as respostas rápidas.' : 'Janela fechada'}
              aria-label={noteMode ? 'Nota interna' : 'Resposta'} className="block w-full resize-none bg-transparent px-3 py-2 text-[14px] outline-none disabled:cursor-not-allowed" />
            <div className="flex items-center justify-between gap-2 px-2 pb-2">
              <div role="group" aria-label="Tipo" className="flex rounded-lg bg-[#f3f3f3] p-0.5 text-[12px]">
                <button type="button" aria-pressed={!noteMode} onClick={() => setNoteMode(false)} className={`rounded-md px-2.5 py-1 ${!noteMode ? 'bg-white shadow-sm' : 'text-[#666]'}`}>Responder</button>
                <button type="button" aria-pressed={noteMode} onClick={() => setNoteMode(true)} className={`rounded-md px-2.5 py-1 ${noteMode ? 'bg-white shadow-sm' : 'text-[#666]'}`}>Nota interna</button>
              </div>
              <button type="button" onClick={() => void submit()} disabled={sending || !text.trim() || (!open && !noteMode)}
                className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white disabled:opacity-40">{sending ? 'Enviando…' : noteMode ? 'Salvar nota' : 'Enviar'}</button>
            </div>
          </div>
        </footer>
      </section>
      <ContactPanel conversation={c} members={members} onAssign={assignee => update({ assignee })} onStatus={status => update({ status })} />
    </>
  )
}

function Bubble({ m, who }: { m: Message; who: string | null }) {
  const out = m.direction === 'saida'
  const media = m.media_path ? `/api/inbox/midia/${m.id}` : null
  return (
    <li className={`flex ${out ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-[14px] shadow-sm ${out ? 'rounded-br-md bg-[#dcf8c6] text-[#111]' : 'rounded-bl-md bg-white text-[#111]'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed link behind a redirect */}
        {media && m.kind === 'imagem' ? <a href={media} target="_blank" rel="noreferrer"><img src={media} alt={m.body ?? 'Imagem'} className="mb-1 max-h-72 rounded-lg" /></a> : null}
        {media && m.kind === 'audio' ? <audio src={media} controls className="mb-1 max-w-full" /> : null}
        {media && m.kind === 'video' ? <video src={media} controls className="mb-1 max-h-72 rounded-lg" /> : null}
        {media && (m.kind === 'documento' || m.kind === 'outro' || m.kind === 'figurinha') ? <a href={media + '?baixar=1'} className="mb-1 block underline">📄 {m.media_name ?? 'Arquivo'}</a> : null}
        {!media && m.kind !== 'texto' && m.kind !== 'localizacao' && m.kind !== 'reacao' && m.kind !== 'outro' ? <span className="mb-1 block text-[12px] italic text-[#777]">Arquivo indisponível</span> : null}
        {m.kind === 'reacao' ? <span className="text-[13px] text-[#666]">Reagiu {m.body}</span> : m.body ? <span className="whitespace-pre-wrap break-words">{m.body}</span> : null}
        <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[#777]">
          {out && who ? <span>{who} ·</span> : null}{time(m.created_at)}
          {out ? <span className={m.status === 'lida' ? 'text-[#2563eb]' : m.status === 'falhou' ? 'font-bold text-[#c0392b]' : ''} title={m.error ?? m.status}>{STATUS_ICON[m.status]}</span> : null}
        </span>
        {m.status === 'falhou' && m.error ? <span className="mt-1 block text-[12px] text-[#c0392b]">Não enviada: {m.error}</span> : null}
      </div>
    </li>
  )
}

function ContactPanel({ conversation: c, members, onAssign, onStatus }: {
  conversation: Conversation; members: Member[]; onAssign: (id: string | null) => void; onStatus: (s: Conversation['status']) => void
}) {
  const { orgId } = useAuth()
  const [tags, setTags] = useState<Tag[]>([])
  const [mine, setMine] = useState<string[]>([])
  const [version, setVersion] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    if (!orgId) return
    let live = true
    void Promise.all([
      supabase().from('tags').select('id, name, color').eq('workspace_id', orgId).order('name'),
      supabase().from('contact_tags').select('tag_id').eq('contact_id', c.contact_id),
    ]).then(([t, ct]) => { if (live) { setTags((t.data ?? []) as Tag[]); setMine((ct.data ?? []).map(r => r.tag_id as string)) } })
    return () => { live = false }
  }, [orgId, c.contact_id, version])

  async function toggle(tag: Tag) {
    const has = mine.includes(tag.id)
    const { error } = has
      ? await supabase().from('contact_tags').delete().eq('contact_id', c.contact_id).eq('tag_id', tag.id)
      : await supabase().from('contact_tags').insert({ workspace_id: orgId, contact_id: c.contact_id, tag_id: tag.id })
    setMessage(error ? deniedMessage(error, 'Não foi possível mudar a etiqueta.') : null)
    setVersion(v => v + 1)
  }
  return (
    <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-[#ececec] p-4 xl:block">
      <div className="text-center">
        <span className="mx-auto mb-2 grid size-14 place-items-center rounded-full bg-[#ececec] text-[18px] font-semibold text-[#444]">{initials(c.contact?.name ?? '?')}</span>
        <p className="text-[16px] font-semibold text-[#111]">{c.contact?.name}</p>
        {c.contact?.phone ? <p className="text-[13px] text-[#666]">{formatPhone(c.contact.phone)}</p> : null}
        {c.contact?.email ? <p className="text-[13px] text-[#666]">{c.contact.email}</p> : null}
        <Link href={`/inbox/contatos?c=${c.contact_id}`} className="mt-1 inline-block text-[13px] text-[#2563eb] underline">Ver ficha</Link>
      </div>
      {message ? <p role="alert" className="mt-3 rounded-lg bg-[#fdf2f2] px-3 py-2 text-[12px] text-[#8a2b2b]">{message}</p> : null}
      <label className="mt-5 block text-[12px] font-semibold uppercase tracking-wide text-[#888]">Responsável
        <select value={c.assignee ?? ''} onChange={e => onAssign(e.target.value || null)} className="mt-1 h-9 w-full rounded-lg border border-[#e2e2e2] bg-white px-2 text-[14px] font-normal normal-case tracking-normal text-[#111]">
          <option value="">Ninguém</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      <label className="mt-4 block text-[12px] font-semibold uppercase tracking-wide text-[#888]">Situação
        <select value={c.status} onChange={e => onStatus(e.target.value as Conversation['status'])} className="mt-1 h-9 w-full rounded-lg border border-[#e2e2e2] bg-white px-2 text-[14px] font-normal normal-case tracking-normal text-[#111]">
          <option value="aberta">Aberta</option><option value="pendente">Aguardando cliente</option><option value="fechada">Encerrada</option>
        </select>
      </label>
      <div className="mt-4">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#888]">Etiquetas</p>
        {!tags.length ? <p className="mt-1 text-[13px] text-[#777]">Crie etiquetas em <Link href="/inbox/configuracoes" className="underline">Configurações</Link>.</p> : null}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map(t => {
            const on = mine.includes(t.id)
            return (
              <button key={t.id} type="button" onClick={() => void toggle(t)} aria-pressed={on}
                className="rounded-full border px-2.5 py-0.5 text-[12px]" style={on ? { background: t.color, borderColor: t.color, color: '#fff' } : { borderColor: '#e2e2e2', color: '#555' }}>
                {t.name}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
