'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, MoreVertical, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

export function ErpWorkspaceHeader({
  section,
  title,
  primaryAction,
  secondaryAction,
  menuItems = [],
}: {
  section: string
  title: string
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  menuItems?: Array<{ label: string; onSelect: () => void }>
}) {
  return (
    <header className="flex min-h-[124px] items-center justify-between gap-5 px-5 py-6 md:px-8 lg:px-10">
      <div className="flex min-w-0 items-start gap-3">
        <SidebarTrigger className="mt-6 md:hidden" />
        <div className="min-w-0">
          <p className="mb-1.5 text-[14px] font-normal text-[#686868]">{section}</p>
          <h1 className="truncate text-[clamp(28px,3vw,40px)] font-medium leading-none tracking-[-0.035em] text-[#111]">{title}</h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {menuItems.length ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais ações"><MoreVertical className="size-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuItems.map((item) => <DropdownMenuItem key={item.label} onSelect={item.onSelect}>{item.label}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <div className="hidden sm:block">{secondaryAction}</div>
        {primaryAction}
      </div>
    </header>
  )
}

const financeTabs = [
  { label: 'Contas a pagar', href: '/erp/financeiro/contas-a-pagar' },
  { label: 'Contas a receber', href: '/erp/financeiro/contas-a-receber' },
  { label: 'Conciliação', href: '/erp/financeiro/conciliacao-bancaria' },
]

export function ErpFinanceTabs({ activeHref }: { activeHref: string }) {
  const router = useRouter()
  return (
    <nav aria-label="Financeiro" className="border-b border-[#e7e7e4] px-5 md:px-8 lg:px-10">
      <div className="flex h-14 gap-8 overflow-x-auto">
        {financeTabs.map((tab) => {
          const active = activeHref === tab.href
          return (
            <button
              type="button"
              key={tab.href}
              aria-current={active ? 'page' : undefined}
              onClick={() => router.push(tab.href)}
              className={cn(
                'relative shrink-0 px-1 text-[14px] text-[#626262] outline-none transition-colors hover:text-[#111] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#111]',
                active && 'font-medium text-[#111] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#111]',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export type ErpSummaryMetric = {
  label: string
  value: string
  tone?: 'default' | 'danger' | 'success'
}

export function ErpPeriodSummary({ title, description, metrics }: {
  title: string
  description: string
  metrics: ErpSummaryMetric[]
}) {
  return (
    <section className="border-b border-[#e7e7e4] px-5 py-7 md:px-8 lg:px-10">
      <h2 className="text-[20px] font-medium leading-tight tracking-[-0.02em] text-[#171717]">{title}</h2>
      <p className="mt-0.5 text-[14px] text-[#777]">{description}</p>
      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0">
            <p className="text-[13px] text-[#777]">{metric.label}</p>
            <p className={cn(
              'mt-1 truncate text-[clamp(20px,2.2vw,26px)] font-normal leading-tight tracking-[-0.025em] text-[#151515]',
              metric.tone === 'danger' && 'text-[#a53621]',
              metric.tone === 'success' && 'text-[#16784a]',
            )}>{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ErpPeriodControl({ month, onPrevious, onNext }: {
  month: Date
  onPrevious: () => void
  onNext: () => void
}) {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month)
  const normalizedLabel = label.charAt(0).toLocaleUpperCase('pt-BR') + label.slice(1)
  return (
    <div className="flex h-10 items-center rounded-lg border border-[#dfdfdc] bg-white">
      <div className="flex min-w-[145px] items-center gap-2 px-3 text-[14px] text-[#292929]">
        <CalendarDays className="size-4 text-[#666]" /><span>{normalizedLabel}</span>
      </div>
      <Button type="button" variant="ghost" size="icon" className="size-9 rounded-none" onClick={onPrevious} aria-label="Mês anterior"><ChevronLeft className="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon" className="size-9 rounded-none" onClick={onNext} aria-label="Próximo mês"><ChevronRight className="size-4" /></Button>
    </div>
  )
}

export function ErpFilterButton({ active, onClick }: { active?: boolean; onClick?: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className={cn('h-10 rounded-lg border-[#dfdfdc] bg-white px-4 font-normal', active && 'border-[#b8b8b2] bg-[#f4f4f1]')}>
      <SlidersHorizontal className="size-4" />Mais filtros{active ? <span className="size-1.5 rounded-full bg-[#151515]" /> : null}
    </Button>
  )
}

export function ErpStatusBadge({ status }: { status: string }) {
  const normalized = status.toLocaleLowerCase('pt-BR')
  const label: Record<string, string> = {
    aberto: 'Em aberto', parcial: 'Pago parcial', vencido: 'Vencido',
    pago: 'Pago', cancelado: 'Cancelado', renegociado: 'Renegociado',
    previsao: 'Previsão',
  }
  return (
    <span className={cn(
      'inline-flex min-h-7 items-center rounded-md px-2.5 text-[13px] font-medium',
      normalized === 'pago' && 'bg-[#e4f6e7] text-[#21683a]',
      normalized === 'vencido' && 'bg-[#fbe9e7] text-[#9b392a]',
      normalized === 'parcial' && 'bg-[#e7f0fb] text-[#285d96]',
      (normalized === 'aberto' || normalized === 'previsao') && 'bg-[#fff4d9] text-[#71541a]',
      normalized === 'renegociado' && 'bg-[#eee9fb] text-[#604a96]',
      normalized === 'cancelado' && 'bg-[#eeeeec] text-[#666]',
    )}>
      {label[normalized] ?? status}
    </span>
  )
}

export function ErpBulkActionBar({ count, totalLabel, children }: {
  count: number
  totalLabel: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="sticky bottom-0 z-20 flex min-h-16 items-center justify-between gap-4 border-t border-[#e3e3df] bg-white/95 px-5 backdrop-blur md:px-8 lg:px-10">
      <div className="flex items-center gap-4 text-[14px] text-[#686868]">
        <span>{count} selecionado{count === 1 ? '' : 's'}</span>
        {children}
      </div>
      <div className="text-right text-[14px] text-[#686868]">{totalLabel}</div>
    </div>
  )
}
