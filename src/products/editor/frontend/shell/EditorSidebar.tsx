'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrganization, useUser } from '@clerk/nextjs'
import { ArrowLeft, Clapperboard, Clock, FolderClosed, Star, Trash2 } from 'lucide-react'
import { useDrive } from '@/products/editor/frontend/spaces/hooks'
import s from './ui.module.css'

/** Menu of the Editor product: projects, Spaces (with each space, recents, favorites and trash) and the way back to Otto. */
export function EditorSidebar() {
  const path = usePathname()
  const { folders, spaces } = useDrive()
  const { organization } = useOrganization()
  const { user } = useUser()
  const inSpaces = path.startsWith('/editor/spaces') || path.startsWith('/editor/pastas')
  const folderSpace = path.startsWith('/editor/pastas/') ? folders.find(f => f.id === path.split('/')[3])?.spaceId : undefined
  const inProjects = path.startsWith('/editor') && !inSpaces
  const item = (href: string, label: string, Icon: typeof FolderClosed, on: boolean) =>
    <Link href={href} className={`${s.navItem} ${on ? s.navOn : ''}`} aria-current={on ? 'page' : undefined}><Icon size={18} />{label}</Link>
  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress || ''
  return <aside className={s.sidebar}>
    <div className={s.logo}><Link href="/editor"><span className={s.logoMark}><Clapperboard size={16} /></span>Editor</Link></div>
    {item('/editor', 'Projetos', Clapperboard, inProjects)}
    {item('/editor/spaces', 'Spaces', FolderClosed, inSpaces)}
    {inSpaces && <div className={s.subNav}>
      {spaces.map(p => { const on = path === `/editor/spaces/${p.id}` || folderSpace === p.id; return <Link key={p.id} href={`/editor/spaces/${p.id}`} className={`${s.subItem} ${on ? s.subOn : ''}`}>{p.name}</Link> })}
      <span className={s.subDivider} />
      {([['/editor/spaces/recentes', 'Recentes', Clock], ['/editor/spaces/favoritos', 'Favoritos', Star], ['/editor/spaces/lixeira', 'Lixeira', Trash2]] as const).map(([href, label, Icon]) =>
        <Link key={href} href={href} className={`${s.subItem} ${path === href ? s.subOn : ''}`}><Icon size={15} className={s.subIcon} />{label}</Link>)}
    </div>}
    <div className={s.spacer} />
    {item('/erp', 'Voltar ao Otto', ArrowLeft, false)}
    <div className={s.user}>
      <span className={s.avatar} style={{ background: 'var(--accent)' }}>{name.trim()[0]?.toUpperCase() ?? '?'}</span>
      <span><b>{name || 'Minha conta'}</b><small>{organization?.name ?? ''}</small></span>
    </div>
  </aside>
}
