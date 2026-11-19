'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrganization, useUser } from '@clerk/nextjs'
import { ArrowLeft, Bell, CalendarClock, Clapperboard, FolderClosed, Send } from 'lucide-react'
import { useVisibleNotifications } from '@/products/social/frontend/notifications/NotificationsView'
import { usePosts } from '@/products/social/frontend/posts/store'
import s from '@/products/editor/frontend/shell/ui.module.css'

/** Menu of the Social product: posting, scheduled posts and notifications, plus the Editor it is built on. */
export function SocialSidebar() {
  const path = usePathname()
  const unread = useVisibleNotifications().filter(x => !x.read).length
  const scheduled = usePosts().posts.filter(p => p.status === 'agendado').length
  const { organization } = useOrganization()
  const { user } = useUser()
  const item = (href: string, label: string, Icon: typeof Send, on: boolean, extra?: React.ReactNode) =>
    <Link href={href} className={`${s.navItem} ${on ? s.navOn : ''}`} aria-current={on ? 'page' : undefined}><Icon size={18} />{label}{extra}</Link>
  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress || ''
  return <aside className={s.sidebar}>
    <div className={s.logo}><Link href="/social/posts"><span className={s.logoMark}><Send size={16} /></span>Social</Link></div>
    {item('/social/postar', 'Postar', Send, path === '/social/postar')}
    {item('/social/posts', 'Agendados', CalendarClock, path === '/social/posts', scheduled > 0 ? <span className={s.countBadge}>{scheduled}</span> : undefined)}
    {item('/social/notificacoes', 'Notificações', Bell, path === '/social/notificacoes', unread > 0 ? <span className={s.badge}>{unread}</span> : undefined)}
    <span className={s.subDivider} />
    {item('/editor/spaces', 'Spaces', FolderClosed, false)}
    {item('/editor', 'Editor', Clapperboard, false)}
    <div className={s.spacer} />
    {item('/erp', 'Voltar ao Otto', ArrowLeft, false)}
    <div className={s.user}>
      <span className={s.avatar} style={{ background: 'var(--accent)' }}>{name.trim()[0]?.toUpperCase() ?? '?'}</span>
      <span><b>{name || 'Minha conta'}</b><small>{organization?.name ?? ''}</small></span>
    </div>
  </aside>
}
