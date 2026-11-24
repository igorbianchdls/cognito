'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, FileEdit, Heart, List, MessageCircle, MoreVertical, Pencil, Plus, Repeat2, Search, Send, Trash2, X } from 'lucide-react'
import { useDriveState } from '@/products/drive/frontend/hooks'
import { Thumb } from '@/products/drive/frontend/Thumb'
import { formatDateTime } from '@/products/editor/frontend/lib/format'
import { NetworkIcon, StatusPill } from './badges'
import { formatLabel, type Post, type PostStatus } from './data'
import { getAccounts, useAccounts } from './accounts'
import { deletePost, duplicatePost, nowStamp, reschedule, restorePost, savePost, usePosts } from './store'
import s from '@/products/editor/frontend/shell/ui.module.css'
import p from './posts.module.css'

const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const tone: Record<PostStatus, string> = { agendado: 'var(--blue-soft)', publicado: 'var(--green-soft)', erro: 'var(--red-soft)', rascunho: '#f1f3f6' }
const POST_MIME = 'application/x-otto-social-post'
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6) // 06h–23h
const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function PostRow({ post, onDelete, onOpen, onMenu }: { post: Post; onDelete?: () => void; onOpen?: () => void; onMenu?: (ev: React.MouseEvent) => void }) {
  const f = useDriveState().files.find(x => x.id === post.fileIds[0])
  return <li className={onOpen ? p.clickRow : ''} onClick={onOpen} onContextMenu={onMenu ? ev => { ev.preventDefault(); onMenu(ev) } : undefined}>
    {f && <Thumb file={f} className={s.miniThumb} showKind={false} />}
    <span className={s.rowText}><b>{post.caption || 'Sem legenda'}</b><small>{formatLabel[post.format]}{post.fileIds.length > 1 ? ` · ${post.fileIds.length} arquivos` : ''} · {formatDateTime(post.date)}</small></span>
    <span className={s.netIcons}>{post.accountIds.map(id => { const a = getAccounts().find(x => x.id === id); return a && <NetworkIcon key={id} network={a.network} /> })}</span>
    {post.metrics && <span className={s.metrics}><span><Eye size={14} />{post.metrics.views.toLocaleString('pt-BR')}</span><span><Heart size={14} />{post.metrics.likes}</span><span><MessageCircle size={14} />{post.metrics.comments}</span><span><Repeat2 size={14} />{post.metrics.shares}</span></span>}
    <StatusPill status={post.status} />
    {post.url && <a className={s.iconBtn} href={post.url} target="_blank" rel="noreferrer" aria-label="Abrir no Instagram" onClick={ev => ev.stopPropagation()}><ExternalLink size={16} /></a>}
    {onMenu && <button className={s.iconBtn} onClick={ev => { ev.stopPropagation(); onMenu(ev) }} aria-label="Mais ações"><MoreVertical size={16} /></button>}
    {onDelete && !onMenu && post.status !== 'publicado' && <button className={s.iconBtn} onClick={onDelete} aria-label="Excluir"><Trash2 size={16} /></button>}
  </li>
}

type Toast = { text: string; undo?: () => void } | null
type Menu = { x: number; y: number; post: Post } | null

export function PostsView({ openPostId }: { openPostId?: string }) {
  const router = useRouter()
  const { posts } = usePosts()
  useAccounts() // re-render when the workspace's accounts load (rows below look them up)
  const [mode, setMode] = useState<'lista' | 'semana' | 'mes'>('lista')
  const [status, setStatus] = useState<PostStatus | 'todos'>('todos')
  const [q, setQ] = useState('')
  const [anchor, setAnchor] = useState(() => new Date())
  const [open, setOpen] = useState<string | null>(openPostId ?? null)
  const [menu, setMenu] = useState<Menu>(null)
  const [toast, setToast] = useState<Toast>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t) }, [toast])
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close); window.addEventListener('scroll', close, true)
    return () => { window.removeEventListener('click', close); window.removeEventListener('scroll', close, true) }
  }, [menu])

  const today = dayKey(new Date())
  const term = q.trim().toLowerCase()
  const list = posts.filter(x => (status === 'todos' || x.status === status) && (!term || x.caption.toLowerCase().includes(term)))
    .sort((a, b) => (status === 'publicado' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))
  const count = (st: PostStatus) => posts.filter(x => x.status === st).length
  const current = posts.find(x => x.id === open) ?? null

  // Month grid (6 weeks) and week (Sunday to Saturday) around the anchor date.
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const gridStart = new Date(monthStart); gridStart.setDate(1 - monthStart.getDay())
  const monthDays = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
  const weekStart = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - anchor.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i))
  const title = mode === 'semana'
    ? `${weekDays[0].getDate()} ${weekDays[0].toLocaleDateString('pt-BR', { month: 'short' })} – ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString('pt-BR', { month: 'short' })} ${weekDays[6].getFullYear()}`.replace(/\./g, '')
    : monthStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const shift = (dir: number) => setAnchor(a => mode === 'semana' ? new Date(a.getFullYear(), a.getMonth(), a.getDate() + dir * 7) : new Date(a.getFullYear(), a.getMonth() + dir, 1))
  const byDay = useMemo(() => {
    const m = new Map<string, Post[]>()
    for (const x of posts) { const k = x.date.slice(0, 10); m.set(k, [...(m.get(k) ?? []), x]) }
    for (const v of m.values()) v.sort((a, b) => a.date.localeCompare(b.date))
    return m
  }, [posts])

  /** Drop on a day keeps the time; drop on a week slot sets day and hour. */
  const drop = (ev: React.DragEvent, day: string, hour?: number) => {
    ev.preventDefault(); setDragOver(null)
    const id = ev.dataTransfer.getData(POST_MIME)
    const post = posts.find(x => x.id === id)
    if (!post) return
    const time = hour !== undefined ? `${pad(hour)}:${post.date.slice(14, 16)}` : post.date.slice(11, 16)
    const date = `${day}T${time}`
    if (date === post.date) return
    if (post.status === 'agendado' && date < nowStamp()) return setToast({ text: 'Não dá para agendar no passado.' })
    const before = post.date
    if (reschedule(id, date)) setToast({ text: `Reagendado para ${formatDateTime(date)}.`, undo: () => reschedule(id, before) })
  }
  const dragProps = (x: Post) => x.status === 'publicado' ? { draggable: false } : {
    draggable: true,
    onDragStart: (ev: React.DragEvent) => { ev.dataTransfer.setData(POST_MIME, x.id); ev.dataTransfer.effectAllowed = 'move' },
  }
  const dropProps = (key: string, day: string, hour?: number) => ({
    onDragOver: (ev: React.DragEvent) => { if (ev.dataTransfer.types.includes(POST_MIME)) { ev.preventDefault(); setDragOver(key) } },
    onDragLeave: () => setDragOver(d => d === key ? null : d),
    onDrop: (ev: React.DragEvent) => drop(ev, day, hour),
  })

  const remove = (x: Post) => { deletePost(x.id); setOpen(null); setToast({ text: 'Post excluído.', undo: () => restorePost(x) }) }
  const duplicate = (x: Post) => { const id = duplicatePost(x.id); if (id) router.push(`/marketing/postar?editar=${id}`) }
  const publishNow = (x: Post) => { savePost({ ...x, status: 'publicado', date: nowStamp() }); setToast({ text: 'Post enviado para publicação (demonstração).' }) }
  const toDraft = (x: Post) => { savePost({ ...x, status: 'rascunho' }); setToast({ text: 'Movido para rascunhos.', undo: () => savePost(x) }) }
  const actions = (x: Post) => [
    ...(x.status !== 'publicado' ? [{ label: 'Editar', icon: Pencil, run: () => router.push(`/marketing/postar?editar=${x.id}`) }] : []),
    { label: 'Duplicar', icon: Copy, run: () => duplicate(x) },
    ...(x.status === 'agendado' || x.status === 'rascunho' ? [{ label: 'Publicar agora', icon: Send, run: () => publishNow(x) }] : []),
    ...(x.status === 'agendado' ? [{ label: 'Mover para rascunhos', icon: FileEdit, run: () => toDraft(x) }] : []),
    ...(x.url ? [{ label: 'Abrir no Instagram', icon: ExternalLink, run: () => window.open(x.url, '_blank', 'noreferrer') }] : []),
    ...(x.status !== 'publicado' ? [{ label: 'Excluir', icon: Trash2, run: () => remove(x), danger: true }] : []),
  ]
  const showMenu = (ev: React.MouseEvent, x: Post) => { ev.stopPropagation(); setMenu({ x: Math.min(ev.clientX, window.innerWidth - 220), y: Math.min(ev.clientY, window.innerHeight - 260), post: x }) }
  const chip = (x: Post) => <button key={x.id} className={`${p.chip} ${x.status === 'publicado' ? p.chipLocked : ''}`} style={{ background: tone[x.status] }} {...dragProps(x)}
    onClick={ev => { ev.stopPropagation(); setOpen(x.id) }} onContextMenu={ev => { ev.preventDefault(); showMenu(ev, x) }} title={`${x.caption}${x.status === 'publicado' ? ' · já publicado' : ' · arraste para reagendar'}`}>
    <b>{x.date.slice(11, 16)}</b><span>{formatLabel[x.format]}</span>
    <span className={p.chipNets}>{x.accountIds.map(id => { const a = getAccounts().find(y => y.id === id); return a && <NetworkIcon key={id} network={a.network} size={14} /> })}</span>
  </button>
  const earlyThisWeek = posts.filter(x => weekDays.some(d => x.date.startsWith(dayKey(d))) && +x.date.slice(11, 13) < HOURS[0]).length

  return <section className={s.content}>
    <div className={s.pageHead}><div><h1>Posts</h1><p>Agendados, publicados e rascunhos em todas as contas. Arraste no calendário para reagendar.</p></div><Link href="/marketing/postar" className={s.primary}><Plus size={16} />Novo post</Link></div>
    <div className={s.statsRow}>
      <div className={s.stat}><small>Agendados</small><b>{count('agendado')}</b></div>
      <div className={s.stat}><small>Publicados</small><b>{count('publicado')}</b></div>
      <div className={s.stat}><small>Visualizações</small><b>{posts.reduce((v, x) => v + (x.metrics?.views ?? 0), 0).toLocaleString('pt-BR')}</b><em>nos posts publicados</em></div>
      <div className={s.stat}><small>Rascunhos</small><b>{count('rascunho')}</b></div>
    </div>
    <div className={s.toolbar}>
      <div className={s.segment}>
        <button className={mode === 'lista' ? s.segOn : ''} onClick={() => setMode('lista')}><List size={15} />Lista</button>
        <button className={mode === 'semana' ? s.segOn : ''} onClick={() => setMode('semana')}><CalendarRange size={15} />Semana</button>
        <button className={mode === 'mes' ? s.segOn : ''} onClick={() => setMode('mes')}><CalendarDays size={15} />Mês</button>
      </div>
      {mode === 'lista' ? <>
        <div className={s.segment}>{(['todos', 'agendado', 'publicado', 'rascunho'] as const).map(st => <button key={st} className={status === st ? s.segOn : ''} onClick={() => setStatus(st)}>{st === 'todos' ? 'Todos' : st[0].toUpperCase() + st.slice(1) + 's'}</button>)}</div>
        <label className={s.search}><Search size={16} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar na legenda" aria-label="Buscar posts" /></label>
      </> : <div className={s.row}>
        <button className={s.secondary} onClick={() => setAnchor(new Date())}>Hoje</button>
        <button className={s.iconBtn} onClick={() => shift(-1)} aria-label="Anterior"><ChevronLeft size={18} /></button>
        <b className={`${p.calTitle} ${mode === 'mes' ? p.capital : ''}`}>{title}</b>
        <button className={s.iconBtn} onClick={() => shift(1)} aria-label="Próximo"><ChevronRight size={18} /></button>
      </div>}
    </div>

    {mode === 'lista' && <div className={s.card}><ul className={s.rows}>{list.map(x => <PostRow key={x.id} post={x} onOpen={() => setOpen(x.id)} onMenu={ev => showMenu(ev, x)} />)}{!list.length && <li className={s.empty}>Nenhum post aqui.</li>}</ul></div>}

    {mode === 'mes' && <div className={s.calendar}>{weekdays.map(d => <b key={d}>{d}</b>)}
      {monthDays.map(d => { const k = dayKey(d), items = byDay.get(k) ?? []; return <div key={k} className={`${s.day} ${d.getMonth() !== monthStart.getMonth() ? s.dayOut : ''} ${k === today ? s.dayToday : ''} ${dragOver === k ? p.dropOn : ''} ${k < today ? p.past : ''}`} {...dropProps(k, k)}>
        <span className={s.dayNum}>{d.getDate()}</span>
        {items.slice(0, 3).map(chip)}
        {items.length > 3 && <button className={p.moreDay} onClick={() => { setAnchor(d); setMode('semana') }}>+{items.length - 3} mais</button>}
      </div> })}
    </div>}

    {mode === 'semana' && <div className={p.week}>
      <div className={p.weekHead}><span />{weekDays.map(d => { const k = dayKey(d); return <b key={k} className={k === today ? p.todayCol : ''}><small>{weekdays[d.getDay()]}</small><span>{d.getDate()}</span></b> })}</div>
      <div className={p.weekBody}>{HOURS.map(h => <div key={h} className={p.weekRow}>
        <span className={p.hour}>{pad(h)}:00</span>
        {weekDays.map(d => { const k = dayKey(d), slot = `${k}-${h}`, items = (byDay.get(k) ?? []).filter(x => +x.date.slice(11, 13) === h)
          return <div key={slot} className={`${p.slot} ${dragOver === slot ? p.dropOn : ''} ${k < today ? p.past : ''}`} {...dropProps(slot, k, h)}>{items.map(chip)}</div> })}
      </div>)}</div>
      {earlyThisWeek > 0 && <p className={s.muted} style={{ padding: 10 }}>{earlyThisWeek} post(s) antes das 6h nesta semana: veja na lista.</p>}
    </div>}

    {current && <aside className={p.drawer} aria-label="Detalhes do post">
      <div className={p.drawerHead}><StatusPill status={current.status} /><span className={p.grow} /><button className={s.iconBtn} onClick={() => setOpen(null)} aria-label="Fechar"><X size={18} /></button></div>
      <DrawerBody post={current} />
      <div className={p.drawerActions}>{actions(current).map(a => <button key={a.label} className={`${a.label === 'Editar' ? s.primary : s.secondary} ${a.danger ? p.danger : ''}`} onClick={a.run}><a.icon size={15} />{a.label}</button>)}</div>
    </aside>}

    {menu && <div className={p.menu} style={{ left: menu.x, top: menu.y }} role="menu" onClick={ev => ev.stopPropagation()}>
      {actions(menu.post).map(a => <button key={a.label} role="menuitem" className={a.danger ? p.danger : ''} onClick={() => { setMenu(null); a.run() }}><a.icon size={15} />{a.label}</button>)}
    </div>}
    {toast && <div className={s.toast} role="status">{toast.text}{toast.undo && <button className={p.undo} onClick={() => { toast.undo!(); setToast(null) }}>Desfazer</button>}</div>}
  </section>
}

function DrawerBody({ post }: { post: Post }) {
  const files = useDriveState().files.filter(f => post.fileIds.includes(f.id))
  return <div className={p.drawerBody}>
    <div className={p.drawerMedia}>{files.slice(0, 4).map(f => <Thumb key={f.id} file={f} showKind={false} className={p.drawerThumb} />)}{!files.length && <span className={s.muted}>Arquivo não encontrado.</span>}</div>
    <p className={p.drawerCaption}>{post.caption || <em className={s.muted}>Sem legenda</em>}</p>
    <div className={s.props}>
      <div>Formato<b>{formatLabel[post.format]}{post.fileIds.length > 1 ? ` · ${post.fileIds.length} arquivos` : ''}</b></div>
      <div>{post.status === 'publicado' ? 'Publicado em' : 'Data'}<b>{formatDateTime(post.date)}</b></div>
      <div>Contas<b className={p.drawerNets}>{post.accountIds.map(id => { const a = getAccounts().find(x => x.id === id); return a && <span key={id}><NetworkIcon network={a.network} size={16} />{a.handle}</span> })}</b></div>
    </div>
    {post.metrics && <div className={p.metricsGrid}>
      <span><Eye size={15} /><b>{post.metrics.views.toLocaleString('pt-BR')}</b>visualizações</span>
      <span><Heart size={15} /><b>{post.metrics.likes}</b>curtidas</span>
      <span><MessageCircle size={15} /><b>{post.metrics.comments}</b>comentários</span>
      <span><Repeat2 size={15} /><b>{post.metrics.shares}</b>compartilhamentos</span>
    </div>}
  </div>
}
