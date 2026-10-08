'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronLeft, ChevronRight, MoreVertical, Search, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { getErpSection } from '@/products/erp/shared/navigation'
import type { ErpSectionId } from '@/products/erp/shared/types'

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
    <header className="erp-workspace-header">
      <div className="flex min-w-0 items-start gap-3">
        <SidebarTrigger className="mt-6 md:hidden" />
        <div className="min-w-0">
          <p className="erp-workspace-eyebrow">{section}</p>
          <h1 className="erp-workspace-title">{title}</h1>
        </div>
      </div>
      <div className="erp-workspace-header-actions">
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
        <div className="erp-workspace-secondary-action hidden sm:block">{secondaryAction}</div>
        <div className="erp-workspace-primary-action">{primaryAction}</div>
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
  return <ErpWorkspaceTabs label="Financeiro" tabs={financeTabs} activeHref={activeHref} />
}

export function ErpSalesTabs({ activeHref }: { activeHref: string }) {
  return <ErpWorkspaceTabs label="Vendas" activeHref={activeHref} tabs={[
    { label: 'Orçamentos', href: '/erp/vendas/orcamentos' },
    { label: 'Pedidos', href: '/erp/vendas/pedidos' },
    { label: 'Ordens de serviço', href: '/erp/vendas/ordens-servico' },
    { label: 'Contratos', href: '/erp/vendas/contratos' },
    {label:'Notas de serviço',href:'/erp/vendas/notas-fiscais'},
    { label: 'Devoluções', href: '/erp/vendas/devolucoes' },
    { label: 'Tabelas de preço', href: '/erp/vendas/tabelas-preco' },
    { label: 'Comissões', href: '/erp/vendas/gestao-comissoes' },
    { label: 'Metas', href: '/erp/vendas/metas-vendas' },
  ]} />
}

export function ErpModuleWorkspaceTabs({ sectionId, moduleId }: { sectionId: ErpSectionId; moduleId: string }) {
  const section = getErpSection(sectionId)
  const itemGroup = ['produtos', 'servicos']
  const categoryGroup = ['categorias', 'categorias-cadastro']
  const peopleGroup = ['clientes', 'fornecedores', 'vendedores']
  const group = sectionId === 'cadastros' ? (itemGroup.includes(moduleId) ? itemGroup : categoryGroup.includes(moduleId) ? categoryGroup : peopleGroup) : undefined
  const labels: Record<string, string> = {
    servicos: 'Serviços', 'posicao-estoque': 'Situação', movimentacoes: 'Movimentações', inventarios: 'Inventários',
    transferencias: 'Transferências', 'conversoes-unidades': 'Conversões',
  }
  const modules = section.modules.filter(module => !group || group.includes(module.id))
  return <ErpWorkspaceTabs label={sectionId === 'cadastros' && itemGroup.includes(moduleId) ? 'Produtos e serviços' : section.label} activeHref={section.modules.find(module => module.id === moduleId)?.href ?? ''} tabs={modules.map(module => ({ label: labels[module.id] ?? module.label, href: module.href }))} />
}

function ErpWorkspaceTabs({ label, tabs, activeHref }: {
  label: string
  tabs: Array<{ label: string; href: string }>
  activeHref: string
}) {
  const router = useRouter()
  return (
    <nav aria-label={label} className="erp-workspace-tabs">
      <div className="erp-workspace-tabs-list">
        {tabs.map((tab) => {
          const active = activeHref === tab.href
          return (
            <button
              type="button"
              key={tab.href}
              aria-current={active ? 'page' : undefined}
              onClick={() => router.push(tab.href)}
              className={cn(
                'erp-workspace-tab relative shrink-0 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#111]',
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

export function ErpSearchToolbar({ query, onQueryChange, placeholder, resultLabel, children, endActions }: {
  query: string
  onQueryChange: (value: string) => void
  placeholder: string
  resultLabel: ReactNode
  children?: ReactNode
  endActions?: ReactNode
}) {
  return <div className="erp-workspace-toolbar">
    <div className="erp-workspace-search relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#777]" />
      <Input aria-label={placeholder} value={query} placeholder={placeholder} className="erp-workspace-search-input pl-9" onChange={event => onQueryChange(event.target.value)} />
    </div>
    <div className="erp-workspace-toolbar-controls">{children}</div>
    <div className="erp-workspace-toolbar-end"><span className="erp-workspace-result-count">{resultLabel}</span>{endActions}</div>
  </div>
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
    <section className="erp-workspace-summary">
      <h2 className="erp-workspace-summary-title">{title}</h2>
      <p className="erp-workspace-summary-description">{description}</p>
      <div className="erp-workspace-metrics">
        {metrics.map((metric) => (
          <div key={metric.label} className="erp-workspace-metric">
            <p className="erp-workspace-metric-label">{metric.label}</p>
            <p className={cn(
              'erp-workspace-metric-value',
              metric.tone === 'danger' && 'erp-workspace-metric-danger',
              metric.tone === 'success' && 'erp-workspace-metric-success',
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
    <div className="erp-workspace-period">
      <div className="flex items-center gap-2 px-3 text-[13px] text-[#292929]">
        <CalendarDays className="size-4 text-[#666]" /><span>{normalizedLabel}</span>
      </div>
      <Button type="button" variant="ghost" size="icon" className="size-8 rounded-none" onClick={onPrevious} aria-label="Mês anterior"><ChevronLeft className="size-4" /></Button>
      <Button type="button" variant="ghost" size="icon" className="size-8 rounded-none" onClick={onNext} aria-label="Próximo mês"><ChevronRight className="size-4" /></Button>
    </div>
  )
}

export function ErpFilterButton({ active, onClick }: { active?: boolean; onClick?: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onClick} className={cn('erp-workspace-filter', active && 'erp-workspace-filter-active')}>
      <SlidersHorizontal className="size-4" />Mais filtros{active ? <span className="size-1.5 rounded-full bg-[#151515]" /> : null}
    </Button>
  )
}

export function ErpStatusBadge({ status, label: customLabel, tone }: { status: string; label?: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const normalized = status.toLocaleLowerCase('pt-BR')
  const label: Record<string, string> = {
    aberto: 'Em aberto', parcial: 'Pago parcial', vencido: 'Vencido',
    pago: 'Pago', cancelado: 'Cancelado', renegociado: 'Renegociado',
    previsao: 'Previsão',
    rascunho: 'Rascunho', confirmada: 'Confirmada', cancelada: 'Cancelada',
    em_andamento: 'Em andamento', aprovado: 'Aprovado', recusado: 'Recusado', convertido: 'Convertido',
    pendente: 'Pendente', atendido: 'Atendido', emitida: 'Emitida', nao_aplicavel: 'Não aplicável',
    orcamento_pendente: 'Orçamento pendente', aprovada: 'Aprovada', em_execucao: 'Em execução', concluida: 'Concluída',
    ativo: 'Ativo', inativo: 'Inativo', pausado: 'Pausado', encerrado: 'Encerrado', bloqueada: 'Bloqueada',
    cotacao: 'Cotação', pedido_compra: 'Pedido de compra', pedido_recorrente: 'Pedido recorrente', compra: 'Compra',
    importada: 'Importada', recebida: 'Recebida', parcialmente_recebida: 'Recebida parcialmente',
    normal: 'Normal', repor: 'Repor', finalizado: 'Finalizado', finalizada: 'Finalizada', em_contagem: 'Em contagem',
    entrada: 'Entrada', saida: 'Saída', ajuste_entrada: 'Ajuste de entrada', ajuste_saida: 'Ajuste de saída',
  }
  return (
    <span className={cn(
      'erp-workspace-status inline-flex items-center rounded px-2 text-[12px] font-normal',
      (tone ? tone === 'success' : ['pago', 'confirmada', 'aprovado', 'aprovada', 'atendido', 'emitida', 'concluida', 'ativo', 'convertido', 'compra', 'recebida', 'importada', 'normal', 'finalizado', 'finalizada', 'entrada', 'ajuste_entrada'].includes(normalized)) && 'bg-[#e4f6e7] text-[#21683a]',
      (tone ? tone === 'danger' : ['vencido', 'recusado', 'bloqueada', 'repor'].includes(normalized)) && 'bg-[#fbe9e7] text-[#9b392a]',
      !tone && ['parcial', 'em_execucao', 'parcialmente_recebida'].includes(normalized) && 'bg-[#e7f0fb] text-[#285d96]',
      (tone ? tone === 'warning' : ['aberto', 'previsao', 'rascunho', 'pendente', 'em_andamento', 'orcamento_pendente', 'pausado', 'cotacao', 'pedido_compra', 'pedido_recorrente', 'em_contagem'].includes(normalized)) && 'bg-[#fff4d9] text-[#71541a]',
      !tone && normalized === 'renegociado' && 'bg-[#eee9fb] text-[#604a96]',
      (tone ? tone === 'default' : ['cancelado', 'cancelada', 'encerrado', 'inativo', 'nao_aplicavel', 'saida', 'ajuste_saida'].includes(normalized)) && 'bg-[#eeeeec] text-[#666]',
    )}>
      {customLabel ?? label[normalized] ?? status.replaceAll('_', ' ')}
    </span>
  )
}

export function ErpBulkActionBar({ count, totalLabel, children }: {
  count: number
  totalLabel: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="erp-workspace-bulk-bar sticky bottom-0 z-20">
      <div className="flex items-center gap-4 text-[14px] text-[#686868]">
        <span>{count} selecionado{count === 1 ? '' : 's'}</span>
        {children}
      </div>
      <div className="text-right text-[14px] text-[#686868]">{totalLabel}</div>
    </div>
  )
}
