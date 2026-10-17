'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, Plus } from 'lucide-react'
export function AppsNavigation() {
  const path = usePathname()
  return <section className="mx-3 mt-4 border-t border-[#e6e6e2] pt-3 group-data-[collapsible=icon]:mx-1" aria-label="Apps"><div className="mb-1 flex items-center justify-between px-2 text-[11px] font-medium uppercase tracking-wide text-[#777] group-data-[collapsible=icon]:hidden"><Link href="/apps">Apps</Link><Link href="/apps/novo" aria-label="Novo app" className="rounded p-1 hover:bg-black/5"><Plus size={15} /></Link></div><Link href="/apps" className={`flex h-9 items-center gap-2.5 rounded-md px-2 text-[13px] group-data-[collapsible=icon]:justify-center ${path.startsWith('/apps') ? 'bg-black/[0.06] font-medium text-[#181818]' : 'text-[#555] hover:bg-black/[0.035]'}`}><LayoutGrid size={17} /><span className="group-data-[collapsible=icon]:hidden">Meus apps</span></Link><Link href="/apps/novo" className="mt-1 flex h-8 items-center gap-2 px-2 text-[12px] text-[#777] hover:text-black group-data-[collapsible=icon]:hidden"><Plus size={14} />Novo app</Link></section>
}
