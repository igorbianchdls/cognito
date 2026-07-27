'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { ERP_NAVIGATION } from '@/products/erp/shared/navigation'

export function ErpSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-[216px] shrink-0 border-r border-gray-200 bg-[#f6f7f8] md:block">
      <div className="flex h-full flex-col">
        <div className="border-b border-gray-200 px-4 py-4">
          <div className="text-sm font-semibold tracking-normal text-gray-950">ERP</div>
          <div className="mt-1 text-xs leading-5 text-gray-500">Operacao, estoque e financeiro</div>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-3">
          {ERP_NAVIGATION.map((item) => {
            const active = item.id === 'overview'
              ? pathname === '/erp'
              : pathname === item.href || pathname.startsWith(`/erp/${item.id}`)
            const Icon = item.icon

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:text-gray-950',
                  active && 'bg-white text-gray-950 shadow-xs',
                )}
              >
                <Icon className="size-4 shrink-0" stroke={1.8} />
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

