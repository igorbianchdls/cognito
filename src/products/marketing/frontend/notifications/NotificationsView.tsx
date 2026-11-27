'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bell, BellOff, Blocks, CalendarClock, Check, CheckCheck, FileText, FolderUp, HardDrive, MessageCircle, MoreVertical, Send, Trash2, UserRoundX } from 'lucide-react'
import { fraseDoAviso, lerAvisos, resumoDoAviso, useAvisosNotas } from '@/products/notas/frontend/avisos'
import { usePessoas } from '@/products/notas/frontend/base/pessoas'
import { formatDateTime } from '@/products/editor/frontend/lib/format'
import { useSettings } from '../settings/store'
import { kindInfo, type AppNotification, type NotificationKind } from './data'
import { removeNotifications, restoreNotifications, setRead, useNotifications } from './store'
import s from '@/products/editor/frontend/shell/ui.module.css'
import n from './notifications.module.css'

const icons: Record<NotificationKind, typeof Bell> = { publicado: Send, erro: AlertTriangle, agendado: CalendarClock, comentario: MessageCircle, conta: UserRoundX, plugin: Blocks, armazenamento: HardDrive, arquivos: FolderUp, notas: FileText }
const groups = ['Todas', 'Publicações', 'Comentários', 'Contas', 'Arquivos', 'Sistema'] as const

/** "há 5 min", "há 3 h", "ontem às 15:10", or the date. */
export function relative(iso: string) {
  const d = new Date(iso), now = new Date()
  const min = Math.round((now.getTime() - d.getTime()) / 60000)
  // Reminders can point to later today, so only past times use "há …".
  if (min >= 0 && min < 1) return 'agora'
  if (min > 0 && min < 60) return `há ${min} min`
  if (min > 0 && min < 60 * 6) return `há ${Math.floor(min / 60)} h`
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(now) - day(d)) / 864e5)
  const time = iso.slice(11, 16)
  if (diff === 0) return `hoje às ${time}`
  if (diff === 1) return `ontem às ${time}`
  return formatDateTime(iso)
}

function section(iso: string) {
  const d = new Date(iso), now = new Date()
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(now) - day(d)) / 864e5)
  return diff <= 0 ? 'Hoje' : diff === 1 ? 'Ontem' : diff < 7 ? 'Esta semana' : 'Antes'
}

/** Notifications the user still wants to see (Configurações → Notificações). */
export function useVisibleNotifications() {
  const all = useAllNotifications()
  const { notifications: prefs } = useSettings()
  return all.filter(x => prefs.kinds[x.kind] !== false)
}

const NOTAS = 'notas:'
const localDate = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }

/** As notificações do Otto e os avisos das Notas (menções, comentários, lembretes) numa lista só. */
function useAllNotifications(): AppNotification[] {
  const all = useNotifications()
  const pessoas = usePessoas()
  const { notificacoes } = useAvisosNotas()
  return useMemo(() => [...all, ...notificacoes.map(a => ({
    id: NOTAS + a.id, kind: 'notas' as const, title: fraseDoAviso(a, pessoas), text: resumoDoAviso(a), date: localDate(a.created_at),
    read: Boolean(a.lida_em), href: a.pagina_id ? `/notas/${a.pagina_id}` : undefined, action: 'Abrir página',
  }))], [all, notificacoes, pessoas])
}

/** Marca lidas/não lidas nos dois lugares (os avisos das Notas só vão para lidos). */
function markRead(ids: string[], read: boolean) {
  setRead(ids.filter(id => !id.startsWith(NOTAS)), read)
  const notas = ids.filter(id => id.startsWith(NOTAS)).map(id => id.slice(NOTAS.length))
  if (read && notas.length) void lerAvisos(notas)
}

export function NotificationsView() {
  const visible = useVisibleNotifications()
  const all = useAllNotifications()
  const [tab, setTab] = useState<'todas' | 'naoLidas'>('todas')
  const [group, setGroup] = useState<(typeof groups)[number]>('Todas')
  const [menu, setMenu] = useState<{ x: number; y: number; item: AppNotification } | null>(null)
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null)
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 5000); return () => clearTimeout(t) }, [toast])
  useEffect(() => { if (!menu) return; const c = () => setMenu(null); window.addEventListener('click', c); return () => window.removeEventListener('click', c) }, [menu])

  const list = visible.filter(x => (tab === 'todas' || !x.read) && (group === 'Todas' || kindInfo[x.kind].group === group)).sort((a, b) => b.date.localeCompare(a.date))
  const unread = visible.filter(x => !x.read)
  const hidden = all.length - visible.length
  const bySection = list.reduce<Record<string, AppNotification[]>>((acc, x) => { (acc[section(x.date)] ??= []).push(x); return acc }, {})

  const remove = (items: AppNotification[]) => { removeNotifications(items.filter(x => !x.id.startsWith(NOTAS)).map(x => x.id)); setToast({ text: items.length === 1 ? 'Notificação apagada.' : `${items.length} notificações apagadas.`, undo: () => restoreNotifications(items) }) }

  return <section className={s.content}>
    <div className={s.pageHead}>
      <div><h1>Notificações</h1><p>{unread.length ? `${unread.length} não ${unread.length === 1 ? 'lida' : 'lidas'}.` : 'Tudo em dia.'} O que aconteceu nas suas contas, posts, drives e notas.</p></div>
      <div className={s.row}>
        <button className={s.secondary} disabled={!unread.length} onClick={() => { markRead(unread.map(x => x.id), true); const desfazer = unread.filter(x => !x.id.startsWith(NOTAS)).map(x => x.id); setToast({ text: 'Todas marcadas como lidas.', undo: desfazer.length ? () => setRead(desfazer, false) : undefined }) }}><CheckCheck size={15} />Marcar todas como lidas</button>
      </div>
    </div>
    <div className={s.toolbar}>
      <div className={s.segment}>
        <button className={tab === 'todas' ? s.segOn : ''} onClick={() => setTab('todas')}>Todas</button>
        <button className={tab === 'naoLidas' ? s.segOn : ''} onClick={() => setTab('naoLidas')}>Não lidas{unread.length > 0 && <span className={n.count}>{unread.length}</span>}</button>
      </div>
      <div className={n.chips}>{groups.map(g => <button key={g} className={group === g ? n.chipOn : ''} onClick={() => setGroup(g)}>{g}</button>)}</div>
    </div>

    {Object.entries(bySection).map(([title, items]) => <div key={title} className={n.block}>
      <h3>{title}</h3>
      <ul className={n.list}>{items.map(x => { const Icon = icons[x.kind]; return <li key={x.id} className={`${n.item} ${x.read ? '' : n.unread}`} onClick={() => !x.read && markRead([x.id], true)}>
        <span className={`${n.icon} ${n[`k_${x.kind}`]}`}><Icon size={17} /></span>
        <span className={n.text}><b>{x.title}</b><span>{x.text}</span><small>{relative(x.date)} · {kindInfo[x.kind].label}</small></span>
        {x.href && <Link href={x.href} className={s.secondary} onClick={ev => { ev.stopPropagation(); markRead([x.id], true) }}>{x.action ?? 'Abrir'}</Link>}
        {!x.read && <i className={n.dot} aria-label="Não lida" />}
        <button className={s.iconBtn} aria-label="Mais ações" onClick={ev => { ev.stopPropagation(); setMenu({ x: Math.min(ev.clientX, window.innerWidth - 230), y: ev.clientY, item: x }) }}><MoreVertical size={16} /></button>
      </li> })}</ul>
    </div>)}
    {!list.length && <div className={n.empty}><Bell size={40} strokeWidth={1.3} /><b>{tab === 'naoLidas' ? 'Nenhuma notificação não lida' : 'Nenhuma notificação aqui'}</b><span>Quando algo acontecer nas suas contas ou no Drive, aparece aqui.</span></div>}
    {hidden > 0 && <p className={n.hiddenNote}><BellOff size={14} />{hidden} {hidden === 1 ? 'notificação escondida' : 'notificações escondidas'} pelas suas preferências.</p>}

    {menu && <div className={n.menu} style={{ left: menu.x, top: menu.y }} role="menu" onClick={ev => ev.stopPropagation()}>
      {menu.item.id.startsWith(NOTAS)
        ? <button role="menuitem" disabled={menu.item.read} onClick={() => { markRead([menu.item.id], true); setMenu(null) }}><Check size={15} />{menu.item.read ? 'Já lida' : 'Marcar como lida'}</button>
        : <>
          <button role="menuitem" onClick={() => { markRead([menu.item.id], !menu.item.read); setMenu(null) }}><Check size={15} />{menu.item.read ? 'Marcar como não lida' : 'Marcar como lida'}</button>
          <button role="menuitem" className={n.danger} onClick={() => { remove([menu.item]); setMenu(null) }}><Trash2 size={15} />Apagar</button>
        </>}
    </div>}
    {toast && <div className={s.toast} role="status">{toast.text}{toast.undo && <button className={n.undo} onClick={() => { toast.undo!(); setToast(null) }}>Desfazer</button>}</div>}
  </section>
}
