'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Database, Plus } from 'lucide-react'
import { useTablesApi, useResource } from './client'
import type { Base } from '../shared/contracts'

export function TablesNavigation() {
  const api = useTablesApi(), pathname = usePathname()
  const [revision, setRevision] = useState(0)
  const { data } = useResource<{ bases: Base[] }>(api, '/bases', revision)
  useEffect(() => { const refresh = () => setRevision(v => v + 1); window.addEventListener('tables:bases-changed', refresh); return () => window.removeEventListener('tables:bases-changed', refresh) }, [])
  return <section className="mx-3 mt-4 border-t border-[#e6e6e2] pt-3 group-data-[collapsible=icon]:mx-1" aria-label="Tables">
    <div className="mb-1 flex items-center justify-between px-2 text-[11px] font-medium uppercase tracking-wide text-[#777] group-data-[collapsible=icon]:hidden"><Link href="/tables">Tables</Link><Link href="/tables/nova" aria-label="Criar base" className="rounded p-1 hover:bg-black/5"><Plus size={15} /></Link></div>
    {data?.bases.length ? data.bases.map(base => <Link key={base.id} href={`/tables/${base.id}`} title={base.nome} className={`mb-0.5 flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 ${pathname.includes(base.id) ? 'bg-black/[0.06] font-medium text-[#181818]' : 'text-[#555] hover:bg-black/[0.035]'}`}><span className="flex size-6 shrink-0 items-center justify-center rounded-md" style={{ color: base.cor, background: base.cor + '18' }}><Database size={15} /></span><span className="truncate group-data-[collapsible=icon]:hidden">{base.nome}</span></Link>) : <Link href="/tables" className="flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] text-[#555] hover:bg-black/[0.035]"><Database size={17} /><span className="group-data-[collapsible=icon]:hidden">Minhas bases</span></Link>}
    <Link href="/tables/nova" className="mt-1 flex h-8 items-center gap-2 px-2 text-[12px] text-[#777] hover:text-black group-data-[collapsible=icon]:hidden"><Plus size={14} />Criar base</Link>
  </section>
}
