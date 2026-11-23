'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useAuth, useOrganization } from '@clerk/nextjs'
import {
  IconAddressBook, IconArrowsSort, IconBolt, IconSpeakerphone, IconBriefcase, IconBrandInstagram, IconBrandMessenger, IconBrandWhatsapp, IconCheck, IconChevronDown, IconCopy, IconFlask,
  IconHash, IconInbox, IconLayoutSidebarRight, IconMessageCircle, IconNotes, IconPhone, IconPlug, IconSearch, IconSettings, IconTag, IconUserCircle, IconUsers,
} from '@tabler/icons-react'
import { CHANNEL_LABEL, windowLeft, windowOpen, type ChannelKind } from '../shared/rules'
import { deniedMessage, formatPhone, post, supabase, time, type Channel, type Conversation, type Message, type Note, type QuickReply, type Tag } from './data'

// ---------- small pieces ----------

type Member = { id: string; name: string; image?: string }
type Status = 'abertas' | 'aguardando' | 'encerradas' | 'todas'
type Tab = 'minhas' | 'sem' | 'todas'
type Sort = 'recentes' | 'antigas' | 'nao_lidas'
type Row = Conversation & { tags: string[] }

const STATUS: { id: Status; label: string }[] = [{ id: 'abertas', label: 'Abertas' }, { id: 'aguardando', label: 'Aguardando cliente' }, { id: 'encerradas', label: 'Encerradas' }, { id: 'todas', label: 'Todas' }]
const SORT: { id: Sort; label: string }[] = [{ id: 'recentes', label: 'Recentes' }, { id: 'antigas', label: 'Antigas' }, { id: 'nao_lidas', label: 'Não lidas' }]
const SITUACAO: Record<Conversation['status'], { label: string; cls: string }> = {
  aberta: { label: 'Aberta', cls: 'bg-[#e8f1ff] text-[#1d4ed8]' }, pendente: { label: 'Aguardando cliente', cls: 'bg-[#fff4e0] text-[#9a5b00]' }, fechada: { label: 'Encerrada', cls: 'bg-[#eef0f2] text-[#555]' },
}
const STATUS_ICON: Record<Message['status'], string> = { recebida: '', enviando: '🕓', enviada: '✓', entregue: '✓✓', lida: '✓✓', falhou: '!' }

function ChannelIcon({ kind, className = 'size-4' }: { kind?: ChannelKind; className?: string }) {
  if (kind === 'whatsapp') return <IconBrandWhatsapp className={`${className} text-[#16a34a]`} stroke={2} aria-label="WhatsApp" />
  if (kind === 'instagram') return <IconBrandInstagram className={`${className} text-[#d62976]`} stroke={2} aria-label="Instagram" />
  if (kind === 'messenger') return <IconBrandMessenger className={`${className} text-[#0866ff]`} stroke={2} aria-label="Messenger" />
  return <IconFlask className={`${className} text-[#6b7280]`} stroke={2} aria-label="Canal de teste" />
}
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || '?'
function Avatar({ name, image, size = 'size-8' }: { name: string; image?: string; size?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- avatar from Clerk
  if (image) return <img src={image} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  return <span className={`${size} grid shrink-0 place-items-center rounded-full bg-[#e9e7f5] text-[12px] font-semibold text-[#4b3f8f]`}>{initials(name)}</span>
}
function Menu({ label, value, options, onChange, icon }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (v: string) => void; icon?: ReactNode }) {
  return (
    <label className="relative inline-flex h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-[#f2f2f4] pl-2 pr-6 text-[12px] font-medium text-[#333] hover:bg-[#e9e9ec]">
      {icon}<span className="sr-only">{label}</span>{options.find(o => o.id === value)?.label}
      <IconChevronDown className="pointer-events-none absolute right-1.5 size-3.5" />
      <select value={value} onChange={e => onChange(e.target.value)} aria-label={label} className="absolute inset-0 cursor-pointer opacity-0">
        {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  )
}
function NavItem({ active, onClick, href, icon, label, count }: { active?: boolean; onClick?: () => void; href?: string; icon: ReactNode; label: string; count?: number }) {
  const cls = `flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] ${active ? 'bg-white font-medium text-[#111] shadow-[0_1px_2px_rgba(0,0,0,0.06)]' : 'text-[#3a3a3c] hover:bg-black/[0.04]'}`
  const body = <>{icon}<span className="min-w-0 flex-1 truncate">{label}</span>{count ? <span className="text-[12px] text-[#8e8e93]">{count}</span> : null}</>
  return href ? <Link href={href} className={cls}>{body}</Link> : <button type="button" onClick={onClick} aria-pressed={active} className={cls}>{body}</button>
}
function Group({ title, children, open: initial = true }: { title: string; children: ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial)
  return (
    <div className="mt-4">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-7 w-full items-center gap-1 px-2.5 text-[12.5px] font-medium text-[#8e8e93] hover:text-[#3a3a3c]">
        {title}<IconChevronDown className={`size-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open ? <div className="grid gap-0.5">{children}</div> : null}
    </div>
  )
}

// ---------- page ----------

/** Live inbox in four panes: views and boxes, the conversation list, the chat, and the contact. */
export function InboxView() {
  const { orgId, userId, isLoaded } = useAuth()
  const { memberships, organization } = useOrganization({ memberships: { pageSize: 100 } })
  const members = useMemo<Member[]>(() => (memberships?.data ?? []).map(m => ({
    id: m.publicUserData?.userId ?? '', image: m.publicUserData?.imageUrl,
    name: [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || m.publicUserData?.identifier || 'Pessoa',
  })).filter(m => m.id), [memberships?.data])
  const memberOf = useCallback((id: string | null) => (id ? members.find(m => m.id === id) ?? { id, name: 'Alguém da equipe' } : null), [members])

  const router = useRouter(), pathname = usePathname(), params = useSearchParams()
  const selected = params.get('c')
  const select = useCallback((id: string | null) => router.replace(id ? `${pathname}?c=${id}` : pathname, { scroll: false }), [router, pathname])

  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick(t => t + 1), [])
  const [rows, setRows] = useState<Row[] | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [status, setStatus] = useState<Status>('abertas')
  const [tab, setTab] = useState<Tab>('todas')
  const [sort, setSort] = useState<Sort>('recentes')
  const [box, setBox] = useState<string | null>(null)       // channel id
  const [label, setLabel] = useState<string | null>(null)   // tag id
  const [search, setSearch] = useState('')
  const [showContact, setShowContact] = useState(true)

  // Live: Supabase Realtime, with a slow poll in case the socket drops.
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
      supabase().from('channels').select('id, kind, name, external_id, display, status, last_error, created_at').eq('workspace_id', orgId).order('created_at'),
      supabase().from('tags').select('id, name, color').eq('workspace_id', orgId).order('name'),
      supabase().from('contact_tags').select('contact_id, tag_id').eq('workspace_id', orgId),
    ]).then(([c, ch, t, ct]) => {
      if (!live) return
      const byContact = new Map<string, string[]>()
      for (const r of ct.data ?? []) byContact.set(r.contact_id, [...(byContact.get(r.contact_id) ?? []), r.tag_id])
      setRows(((c.data ?? []) as unknown as Conversation[]).map(x => ({ ...x, tags: byContact.get(x.contact_id) ?? [] })))
      setChannels((ch.data ?? []) as Channel[]); setTags((t.data ?? []) as Tag[])
    })
    return () => { live = false }
  }, [isLoaded, orgId, tick])

  const inStatus = useCallback((c: Row) => status === 'todas' ? true : status === 'abertas' ? c.status === 'aberta' : status === 'aguardando' ? c.status === 'pendente' : c.status === 'fechada', [status])
  const scoped = useMemo(() => (rows ?? []).filter(c => inStatus(c) && (!box || c.channel_id === box) && (!label || c.tags.includes(label))), [rows, inStatus, box, label])
  const counts = { minhas: scoped.filter(c => c.assignee === userId).length, sem: scoped.filter(c => !c.assignee).length, todas: scoped.length }
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase(), digits = q.replace(/\D/g, '')
    const list = scoped.filter(c => (tab === 'todas' || (tab === 'minhas' ? c.assignee === userId : !c.assignee))
      && (!q || (c.contact?.name ?? '').toLowerCase().includes(q) || (c.last_preview ?? '').toLowerCase().includes(q) || (!!digits && (c.contact?.phone ?? '').includes(digits))))
    return list.sort((a, b) => sort === 'antigas' ? a.last_message_at.localeCompare(b.last_message_at)
      : sort === 'nao_lidas' && (b.unread > 0) !== (a.unread > 0) ? (b.unread > 0 ? 1 : -1) : b.last_message_at.localeCompare(a.last_message_at))
  }, [scoped, tab, userId, search, sort])
  const openByChannel = (id: string) => (rows ?? []).filter(c => c.channel_id === id && c.status !== 'fechada').length
  const openByTag = (id: string) => (rows ?? []).filter(c => c.tags.includes(id) && c.status !== 'fechada').length
  const current = rows?.find(c => c.id === selected) ?? null
  const tagById = useMemo(() => new Map(tags.map(t => [t.id, t])), [tags])

  if (rows === null) return <div className="p-8 text-[14px] text-[#666]">Carregando…</div>
  if (!channels.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="text-[24px] font-semibold text-[#111]">Atendimento em um lugar só</h1>
        <p className="mt-2 text-[15px] text-[#555]">Conecte o WhatsApp, o Instagram ou o Messenger da empresa e responda todos os clientes daqui, com a equipe.</p>
        <Link href="/inbox/canais" className="mt-6 inline-flex h-10 items-center rounded-lg bg-[#111] px-5 text-[14px] font-medium text-white">Conectar um canal</Link>
        <p className="mt-3 text-[13px] text-[#777]">Sem o app da Meta ainda? Crie um canal de teste para conhecer.</p>
      </div>
    )
  }
  const allActive = !box && !label
  return (
    <div className="flex h-[calc(100dvh-3rem)] min-h-0 bg-white text-[#1c1c1e] md:h-[100dvh]">
      {/* ---------- views and boxes ---------- */}
      <nav aria-label="Caixas do Inbox" className="hidden w-[232px] shrink-0 flex-col overflow-y-auto border-r border-[#ececef] bg-[#f7f7f8] px-2.5 py-3 lg:flex">
        <div className="mb-3 flex items-center gap-2 px-1.5">
          <span className="grid size-6 place-items-center rounded-md bg-[#111] text-[11px] font-bold text-white">{initials(organization?.name ?? 'Otto').slice(0, 1)}</span>
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{organization?.name ?? 'Inbox'}</span>
        </div>
        <NavItem active={allActive} onClick={() => { setBox(null); setLabel(null) }} icon={<IconInbox className="size-4" />} label="Todas as conversas" count={(rows ?? []).filter(c => c.status !== 'fechada').length} />
        <Group title="Ferramentas">
          <NavItem href="/inbox/negocios" icon={<IconBriefcase className="size-4" />} label="Negócios" />
          <NavItem href="/inbox/contatos" icon={<IconAddressBook className="size-4" />} label="Contatos" />
          <NavItem href="/inbox/automacoes" icon={<IconBolt className="size-4" />} label="Automações" />
          <NavItem href="/inbox/disparos" icon={<IconSpeakerphone className="size-4" />} label="Disparos" />
          <NavItem href="/inbox/canais" icon={<IconPlug className="size-4" />} label="Canais" />
          <NavItem href="/inbox/configuracoes" icon={<IconSettings className="size-4" />} label="Etiquetas e respostas" />
        </Group>
        <Group title="Caixas">
          {channels.map(ch => <NavItem key={ch.id} active={box === ch.id} onClick={() => { setBox(box === ch.id ? null : ch.id); setLabel(null) }}
            icon={<ChannelIcon kind={ch.kind} />} label={ch.name + (ch.status === 'desconectado' ? ' (desconectado)' : '')} count={openByChannel(ch.id)} />)}
        </Group>
        <Group title="Etiquetas">
          {!tags.length ? <Link href="/inbox/configuracoes" className="px-2.5 py-1 text-[12.5px] text-[#8e8e93] underline">Criar etiquetas</Link> : null}
          {tags.map(t => <NavItem key={t.id} active={label === t.id} onClick={() => { setLabel(label === t.id ? null : t.id); setBox(null) }}
            icon={<span className="mx-1 size-2 rounded-full" style={{ background: t.color }} />} label={t.name} count={openByTag(t.id)} />)}
        </Group>
      </nav>

      {/* ---------- list ---------- */}
      <section aria-label="Conversas" className={`${current ? 'hidden md:flex' : 'flex'} w-full min-w-0 flex-col border-r border-[#ececef] md:w-[330px] md:shrink-0`}>
        <header className="border-b border-[#ececef] px-3 pb-2.5 pt-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold">Conversas</h1>
            <Menu label="Situação" value={status} options={STATUS} onChange={v => setStatus(v as Status)} />
            <span className="flex-1" />
            <Menu label="Ordem" value={sort} options={SORT} onChange={v => setSort(v as Sort)} icon={<IconArrowsSort className="size-3.5" />} />
          </div>
          <div className="relative mt-2.5">
            <IconSearch className="pointer-events-none absolute left-2.5 top-2 size-4 text-[#8e8e93]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, número ou mensagem" aria-label="Buscar conversas"
              className="h-8 w-full rounded-lg bg-[#f2f2f4] pl-8 pr-2 text-[13px] outline-none focus:bg-white focus:ring-1 focus:ring-[#d1d1d6]" />
          </div>
          <div role="tablist" aria-label="De quem" className="mt-2.5 flex rounded-lg bg-[#f2f2f4] p-0.5">
            {([['minhas', 'Minhas'], ['sem', 'Sem responsável'], ['todas', 'Todas']] as const).map(([id, text]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                className={`h-7 flex-auto whitespace-nowrap rounded-md px-2 text-[12.5px] ${tab === id ? 'bg-white font-medium shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-[#636366]'}`}>
                {text} <span className="text-[#8e8e93]">{counts[id]}</span>
              </button>
            ))}
          </div>
          {box || label ? (
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#636366]">
              Filtrando: <b className="font-medium text-[#1c1c1e]">{box ? channels.find(c => c.id === box)?.name : tagById.get(label!)?.name}</b>
              <button type="button" onClick={() => { setBox(null); setLabel(null) }} className="underline">limpar</button>
            </p>
          ) : null}
        </header>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {!visible.length ? <li className="p-6 text-center text-[13px] text-[#8e8e93]">Nenhuma conversa aqui.</li> : null}
          {visible.map(c => {
            const who = memberOf(c.assignee)
            return (
              <li key={c.id}>
                <button type="button" onClick={() => select(c.id)} aria-current={selected === c.id}
                  className={`relative block w-full border-b border-[#f2f2f4] px-3 py-2.5 text-left ${selected === c.id ? 'bg-[#f4f6fb] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[#2563eb]' : 'hover:bg-[#fafafa]'}`}>
                  <span className="flex items-center gap-1.5">
                    <ChannelIcon kind={c.channel?.kind} className="size-4 shrink-0" />
                    <span className={`truncate text-[13.5px] ${c.unread ? 'font-semibold' : 'font-medium'}`}>{c.contact?.name ?? 'Contato'}</span>
                    {who ? <span className="shrink-0 truncate text-[12px] text-[#8e8e93]">› {who.name.split(' ')[0]}</span> : null}
                    <span className="ml-auto shrink-0 text-[11.5px] text-[#8e8e93]">{time(c.last_message_at)}</span>
                  </span>
                  <span className="mt-1 flex items-start gap-2">
                    <span className={`line-clamp-2 flex-1 text-[13px] leading-snug ${c.unread ? 'text-[#1c1c1e]' : 'text-[#636366]'}`}>{c.last_preview || '—'}</span>
                    {c.unread ? <span className="mt-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#2563eb] px-1 text-[10.5px] font-semibold text-white">{c.unread}</span> : null}
                  </span>
                  {c.tags.length ? (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {c.tags.slice(0, 3).map(id => { const t = tagById.get(id); return t ? <span key={id} className="rounded-md px-1.5 py-0.5 text-[11px] font-medium" style={{ background: t.color + '22', color: t.color }}>{t.name}</span> : null })}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      {current ? <Chat key={current.id} conversation={current} tick={tick} onChange={refresh} onBack={() => select(null)} members={members} memberOf={memberOf}
        showContact={showContact} onToggleContact={() => setShowContact(v => !v)} tags={tags} />
        : <div className="hidden flex-1 place-items-center text-[14px] text-[#8e8e93] md:grid">
          <span className="flex flex-col items-center gap-2"><IconMessageCircle className="size-8 text-[#c7c7cc]" stroke={1.5} />Escolha uma conversa.</span>
        </div>}
    </div>
  )
}

// ---------- chat ----------

type Item = { at: string; message?: Message; note?: Note }

function Chat({ conversation: c, tick, onChange, onBack, members, memberOf, showContact, onToggleContact, tags }: {
  conversation: Row; tick: number; onChange: () => void; onBack: () => void; members: Member[]; memberOf: (id: string | null) => Member | null
  showContact: boolean; onToggleContact: () => void; tags: Tag[]
}) {
  const { orgId, userId } = useAuth()
  const [items, setItems] = useState<Item[] | null>(null)
  const [quick, setQuick] = useState<QuickReply[]>([])
  const [text, setText] = useState('')
  const [noteMode, setNoteMode] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const kind = c.channel?.kind ?? 'teste'
  const contactName = c.contact?.name ?? 'Contato'

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
  const assignee = memberOf(c.assignee)

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
      <section aria-label="Conversa" className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-2 border-b border-[#ececef] px-3">
          <button type="button" onClick={onBack} className="rounded-md px-1.5 py-1 text-[14px] text-[#555] hover:bg-[#f2f2f4] md:hidden" aria-label="Voltar">←</button>
          <ChannelIcon kind={kind} />
          <span className="min-w-0 truncate text-[13.5px] font-semibold text-[#1c1c1e]" title={c.channel?.name}>{contactName}</span>
          <span className="flex-1" />
          <Menu label="Situação" value={c.status} options={[{ id: 'aberta', label: 'Aberta' }, { id: 'pendente', label: 'Aguardando cliente' }, { id: 'fechada', label: 'Encerrada' }]}
            onChange={v => update({ status: v as Conversation['status'] })} />
          <label className="relative hidden h-7 items-center gap-1.5 rounded-md bg-[#f2f2f4] pl-1 pr-6 text-[12px] font-medium hover:bg-[#e9e9ec] sm:inline-flex">
            {assignee ? <Avatar name={assignee.name} image={assignee.image} size="size-5" /> : <IconUserCircle className="size-5 text-[#8e8e93]" stroke={1.5} />}
            <span className="max-w-[110px] truncate">{assignee?.name ?? 'Sem responsável'}</span>
            <IconChevronDown className="pointer-events-none absolute right-1.5 size-3.5" />
            <select value={c.assignee ?? ''} onChange={e => update({ assignee: e.target.value || null })} aria-label="Responsável" className="absolute inset-0 cursor-pointer opacity-0">
              <option value="">Ninguém</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          {c.status === 'fechada'
            ? <button type="button" onClick={() => update({ status: 'aberta' })} className="h-7 rounded-md border border-[#f5d46b] bg-[#fff8db] px-2.5 text-[12px] font-medium text-[#7a5b00]">Reabrir</button>
            : <button type="button" onClick={() => update({ status: 'fechada' })} className="inline-flex h-7 items-center gap-1 rounded-md bg-[#111] px-2.5 text-[12px] font-medium text-white"><IconCheck className="size-3.5" />Encerrar</button>}
          <button type="button" title="Copiar link da conversa" aria-label="Copiar link da conversa" onClick={() => { void navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
            className="hidden h-7 items-center gap-1 rounded-md px-1.5 text-[12px] text-[#636366] hover:bg-[#f2f2f4] sm:inline-flex">
            {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}<IconHash className="size-3" />{c.id.slice(0, 4)}
          </button>
          <button type="button" onClick={onToggleContact} aria-pressed={showContact} aria-label="Mostrar ou ocultar o contato" title="Contato"
            className="hidden size-7 place-items-center rounded-md text-[#636366] hover:bg-[#f2f2f4] xl:grid"><IconLayoutSidebarRight className="size-4" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#fafafb] px-3 py-5 md:px-6">
          {items === null ? <p className="text-center text-[13px] text-[#8e8e93]">Carregando…</p> : null}
          <ol className="mx-auto flex max-w-[720px] flex-col gap-3">
            {(items ?? []).map(item => item.note ? (
              <li key={'n' + item.note.id} className="flex justify-center">
                <div className="max-w-[85%] rounded-xl border border-[#f1e3a6] bg-[#fff8db] px-3 py-2 text-[13px] text-[#5c4a00]">
                  <span className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold"><IconNotes className="size-3.5" />Nota interna · {memberOf(item.note.author)?.name ?? 'Equipe'} · {time(item.note.created_at)}</span>
                  <span className="whitespace-pre-wrap">{item.note.body}</span>
                </div>
              </li>
            ) : <Bubble key={item.message!.id} m={item.message!} contact={contactName} agent={memberOf(item.message!.sent_by)} />)}
          </ol>
          <div ref={end} />
        </div>

        <footer className="border-t border-[#ececef] bg-white p-3">
          {error ? <p role="alert" className="mb-2 rounded-lg bg-[#fdf2f2] px-3 py-2 text-[13px] text-[#8a2b2b]">{error}</p> : null}
          {!open && !noteMode ? (
            <p className="mb-2 rounded-lg bg-[#fff7e6] px-3 py-2 text-[13px] text-[#8a5a00]">
              A janela de 24 horas fechou: pela regra da Meta, só dá para responder com um modelo aprovado (chega com os Disparos). Você ainda pode deixar notas internas.
            </p>
          ) : null}
          {suggestions.length ? (
            <ul className="mb-2 overflow-hidden rounded-lg border border-[#e5e5ea]">
              {suggestions.map(q => (
                <li key={q.id}><button type="button" onClick={() => setText(q.body)} className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[#f2f2f4]">
                  <b>/{q.shortcut}</b> <span className="text-[#636366]">{q.body.slice(0, 90)}</span>
                </button></li>
              ))}
            </ul>
          ) : null}
          <div className={`rounded-xl border ${noteMode ? 'border-[#f1e3a6] bg-[#fffbea]' : 'border-[#e5e5ea] focus-within:border-[#c7c7cc]'}`}>
            <div className="flex items-center gap-1 px-2 pt-1.5">
              <div role="group" aria-label="Tipo" className="flex text-[12px]">
                <button type="button" aria-pressed={!noteMode} onClick={() => setNoteMode(false)} className={`rounded-md px-2 py-1 ${!noteMode ? 'bg-[#f2f2f4] font-medium' : 'text-[#8e8e93]'}`}>Responder</button>
                <button type="button" aria-pressed={noteMode} onClick={() => setNoteMode(true)} className={`rounded-md px-2 py-1 ${noteMode ? 'bg-[#fff1b8] font-medium text-[#5c4a00]' : 'text-[#8e8e93]'}`}>Nota interna</button>
              </div>
              {!noteMode && left ? <span className="ml-auto text-[11.5px] text-[#8e8e93]">Janela da Meta fecha em {left}</span> : null}
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={2} disabled={!open && !noteMode}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit() } }}
              placeholder={noteMode ? 'Nota só para a equipe…' : open ? `Responder ${contactName.split(' ')[0]}… ("/" abre as respostas rápidas)` : 'Janela fechada'}
              aria-label={noteMode ? 'Nota interna' : 'Resposta'} className="block w-full resize-none bg-transparent px-3 py-1.5 text-[14px] outline-none disabled:cursor-not-allowed" />
            <div className="flex justify-end px-2 pb-2">
              <button type="button" onClick={() => void submit()} disabled={sending || !text.trim() || (!open && !noteMode)}
                className="h-8 rounded-lg bg-[#111] px-4 text-[13px] font-medium text-white disabled:opacity-35">{sending ? 'Enviando…' : noteMode ? 'Salvar nota' : 'Enviar'}</button>
            </div>
          </div>
        </footer>
      </section>
      {showContact ? <ContactPanel conversation={c} tags={tags} onChanged={onChange} /> : null}
    </>
  )
}

function Bubble({ m, contact, agent }: { m: Message; contact: string; agent: Member | null }) {
  const out = m.direction === 'saida'
  const media = m.media_path ? `/api/inbox/midia/${m.id}` : null
  const who = out ? agent?.name ?? 'Equipe' : contact
  return (
    <li className={`flex items-end gap-2 ${out ? 'flex-row-reverse' : ''}`}>
      <Avatar name={who} image={out ? agent?.image : undefined} size="size-7" />
      <div className={`max-w-[78%] rounded-2xl border px-3.5 py-2.5 text-[14px] leading-relaxed ${out ? 'rounded-br-md border-[#e7e7ec] bg-[#f2f2f5]' : 'rounded-bl-md border-[#ececef] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]'}`}>
        <span className="mb-1 flex items-center gap-1.5 text-[11.5px] text-[#8e8e93]"><b className="font-medium text-[#3a3a3c]">{who}</b>{time(m.created_at)}
          {out ? <span className={m.status === 'lida' ? 'text-[#2563eb]' : m.status === 'falhou' ? 'font-bold text-[#c0392b]' : ''} title={m.error ?? m.status}>{STATUS_ICON[m.status]}</span> : null}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed link behind a redirect */}
        {media && m.kind === 'imagem' ? <a href={media} target="_blank" rel="noreferrer"><img src={media} alt={m.body ?? 'Imagem'} className="mb-1 max-h-72 rounded-lg" /></a> : null}
        {media && m.kind === 'audio' ? <audio src={media} controls className="mb-1 max-w-full" /> : null}
        {media && m.kind === 'video' ? <video src={media} controls className="mb-1 max-h-72 rounded-lg" /> : null}
        {media && (m.kind === 'documento' || m.kind === 'outro' || m.kind === 'figurinha') ? <a href={media + '?baixar=1'} className="mb-1 block underline">📄 {m.media_name ?? 'Arquivo'}</a> : null}
        {!media && m.kind !== 'texto' && m.kind !== 'localizacao' && m.kind !== 'reacao' && m.kind !== 'outro' ? <span className="mb-1 block text-[12px] italic text-[#8e8e93]">Arquivo indisponível</span> : null}
        {m.kind === 'reacao' ? <span className="text-[13px] text-[#636366]">Reagiu {m.body}</span> : m.body ? <span className="whitespace-pre-wrap break-words">{m.body}</span> : null}
        {m.status === 'falhou' && m.error ? <span className="mt-1 block text-[12px] text-[#c0392b]">Não enviada: {m.error}</span> : null}
      </div>
    </li>
  )
}

// ---------- contact ----------

function Stat({ label, value, tone }: { label: string; value: string | number; tone: 'green' | 'blue' | 'orange' | 'red' }) {
  const t = { green: 'border-[#cdebd6] bg-[#f1faf3] text-[#166534]', blue: 'border-[#cfe0fb] bg-[#f2f7ff] text-[#1d4ed8]', orange: 'border-[#f6dfb8] bg-[#fff8ee] text-[#9a5b00]', red: 'border-[#f5d0d0] bg-[#fff5f5] text-[#a12b2b]' }[tone]
  return <div className={`rounded-lg border px-2.5 py-2 ${t}`}><p className="text-[11.5px] font-medium">{label}</p><p className="mt-0.5 text-[16px] font-semibold text-[#1c1c1e]">{value}</p></div>
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <section className="border-t border-[#ececef] px-4 py-3">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-1 text-[12.5px] font-medium text-[#636366]">
        {title}<IconChevronDown className={`size-3.5 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </section>
  )
}

function ContactPanel({ conversation: c, tags, onChanged }: { conversation: Row; tags: Tag[]; onChanged: () => void }) {
  const { orgId } = useAuth()
  const [stats, setStats] = useState<{ total: number; open: number; since: string | null; channels: ChannelKind[]; spent: number; orders: number; deals: { id: string; title: string; value: number | null; stage: { name: string; kind: string } | null }[]; purchases: { product: string | null; amount: number | null; status: string; occurred_at: string }[] } | null>(null)
  const [mine, setMine] = useState<string[]>(c.tags)
  const [message, setMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    void Promise.all([
      supabase().from('conversations').select('id, status, created_at, channel:channels(kind)').eq('contact_id', c.contact_id),
      supabase().from('contact_tags').select('tag_id').eq('contact_id', c.contact_id),
      supabase().from('purchases').select('product, amount, status, occurred_at').eq('contact_id', c.contact_id).order('occurred_at', { ascending: false }).limit(50),
      supabase().from('deals').select('id, title, value, stage:pipeline_stages(name, kind)').eq('contact_id', c.contact_id).order('created_at', { ascending: false }).limit(10),
    ]).then(([cv, ct, pu, dl]) => {
      const convs = (cv.data ?? []) as unknown as { id: string; status: string; created_at: string; channel: { kind: ChannelKind } | null }[]
      const purchases = (pu.data ?? []) as { product: string | null; amount: number | null; status: string; occurred_at: string }[]
      const paid = purchases.filter(p => p.status === 'aprovada')
      if (!live) return
      setStats({ total: convs.length, open: convs.filter(x => x.status !== 'fechada').length, purchases, deals: (dl.data ?? []) as unknown as { id: string; title: string; value: number | null; stage: { name: string; kind: string } | null }[],
        spent: paid.reduce((t, p) => t + Number(p.amount ?? 0), 0), orders: paid.length,
        since: convs.map(x => x.created_at).sort()[0] ?? null, channels: [...new Set(convs.map(x => x.channel?.kind).filter(Boolean) as ChannelKind[])] })
      setMine((ct.data ?? []).map(r => r.tag_id as string))
    })
    return () => { live = false }
  }, [c.contact_id, c.last_message_at])

  async function toggle(tag: Tag) {
    const has = mine.includes(tag.id)
    const { error } = has
      ? await supabase().from('contact_tags').delete().eq('contact_id', c.contact_id).eq('tag_id', tag.id)
      : await supabase().from('contact_tags').insert({ workspace_id: orgId, contact_id: c.contact_id, tag_id: tag.id })
    setMessage(error ? deniedMessage(error, 'Não foi possível mudar a etiqueta.') : null)
    if (!error) { setMine(has ? mine.filter(t => t !== tag.id) : [...mine, tag.id]); onChanged() }
  }
  const copy = (what: string, value: string) => { void navigator.clipboard?.writeText(value); setCopied(what); setTimeout(() => setCopied(null), 1500) }
  const name = c.contact?.name ?? 'Contato'
  return (
    <aside aria-label="Contato" className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-[#ececef] bg-white xl:block">
      <div className="px-4 pb-3 pt-4 text-center">
        <span className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-[#e9e7f5] text-[16px] font-semibold text-[#4b3f8f]">{initials(name)}</span>
        <p className="text-[17px] font-semibold">{name}</p>
        <div className="mt-2 flex justify-center gap-1.5">
          <Link href={`/inbox/contatos?c=${c.contact_id}`} title="Abrir ficha" aria-label="Abrir ficha" className="grid size-7 place-items-center rounded-full border border-[#e5e5ea] text-[#636366] hover:bg-[#f2f2f4]"><IconAddressBook className="size-3.5" /></Link>
          {c.contact?.phone ? <button type="button" title="Copiar telefone" aria-label="Copiar telefone" onClick={() => copy('phone', c.contact!.phone!)} className="grid size-7 place-items-center rounded-full border border-[#e5e5ea] text-[#636366] hover:bg-[#f2f2f4]">{copied === 'phone' ? <IconCheck className="size-3.5" /> : <IconPhone className="size-3.5" />}</button> : null}
          {c.contact?.email ? <button type="button" title="Copiar e-mail" aria-label="Copiar e-mail" onClick={() => copy('email', c.contact!.email!)} className="grid size-7 place-items-center rounded-full border border-[#e5e5ea] text-[#636366] hover:bg-[#f2f2f4]">{copied === 'email' ? <IconCheck className="size-3.5" /> : <IconCopy className="size-3.5" />}</button> : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        <Stat label="Total gasto" value={stats ? stats.spent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '—'} tone="green" />
        <Stat label="Conversas" value={stats?.total ?? '—'} tone="blue" />
        <Stat label="Pedidos" value={stats?.orders ?? '—'} tone="orange" />
        <Stat label="Em aberto" value={stats?.open ?? '—'} tone="red" />
      </div>
      {message ? <p role="alert" className="mx-4 mb-2 rounded-lg bg-[#fdf2f2] px-3 py-2 text-[12px] text-[#8a2b2b]">{message}</p> : null}
      <dl className="grid grid-cols-[72px_1fr] gap-x-2 gap-y-1.5 px-4 pb-3 text-[13px]">
        <dt className="text-[#8e8e93]">E-mail</dt><dd className="truncate">{c.contact?.email ?? '—'}</dd>
        <dt className="text-[#8e8e93]">Telefone</dt><dd>{c.contact?.phone ? formatPhone(c.contact.phone) : '—'}</dd>
        <dt className="text-[#8e8e93]">Canais</dt><dd className="flex gap-1.5">{(stats?.channels ?? []).map(k => <ChannelIcon key={k} kind={k} />)}</dd>
      </dl>
      <Section title="Etiquetas">
        {!tags.length ? <p className="text-[13px] text-[#8e8e93]">Crie etiquetas em <Link href="/inbox/configuracoes" className="underline">Configurações</Link>.</p> : null}
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => {
            const on = mine.includes(t.id)
            return (
              <button key={t.id} type="button" onClick={() => void toggle(t)} aria-pressed={on}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px]" style={on ? { background: t.color + '22', borderColor: t.color + '55', color: t.color } : { borderColor: '#e5e5ea', color: '#636366' }}>
                <IconTag className="size-3" />{t.name}
              </button>
            )
          })}
        </div>
      </Section>
      <Section title="Negócios">
        {(stats?.deals ?? []).map(d => (
          <Link key={d.id} href="/inbox/negocios" className="flex items-baseline gap-2 py-0.5 text-[12.5px] hover:underline">
            <span className="min-w-0 flex-1 truncate">{d.title}</span><span className="text-[#8e8e93]">{d.stage?.name}</span>
          </Link>
        ))}
        {!stats?.deals.length ? <p className="text-[12.5px] text-[#8e8e93]">Nenhum negócio. <Link href="/inbox/negocios" className="underline">Abrir funil</Link></p> : null}
      </Section>
      {stats?.purchases.length ? (
        <Section title="Compras">
          <ul className="grid gap-1.5">
            {stats.purchases.slice(0, 6).map((p, i) => (
              <li key={i} className="flex items-baseline gap-2 text-[12.5px]">
                <span className="min-w-0 flex-1 truncate">{p.product ?? 'Compra'}</span>
                <span className={p.status === 'aprovada' ? 'text-[#166534]' : 'text-[#8e8e93]'}>{p.amount !== null ? Number(p.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''} {p.status !== 'aprovada' ? `· ${p.status}` : ''}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
      <Section title="Atendimento">
        <p className="flex items-center gap-2 text-[13px]"><IconUsers className="size-4 text-[#8e8e93]" />{SITUACAO[c.status].label}<span className={`ml-auto rounded-md px-1.5 py-0.5 text-[11px] font-medium ${SITUACAO[c.status].cls}`}>{CHANNEL_LABEL[c.channel?.kind ?? 'teste']}</span></p>
      </Section>
    </aside>
  )
}
