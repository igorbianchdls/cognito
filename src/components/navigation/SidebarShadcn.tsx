"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useOrganization, useOrganizationList } from "@clerk/nextjs"
import {
  IconArchiveFilled, IconArrowsExchange, IconArticleFilled, IconBasketFilled, IconBellFilled, IconBookFilled, IconBriefcaseFilled,
  IconCalendarFilled, IconCashBanknoteFilled, IconClockFilled, IconStarFilled, IconTrashFilled, IconChartAreaLineFilled, IconBoltFilled, IconSpeakerphone, IconChartAreaFilled, IconWorldFilled, IconPlayerPlayFilled, IconAdjustmentsFilled, IconMessageCircleFilled, IconCheck, IconChevronDown, IconChevronRight, IconClipboardListFilled, IconCoinFilled,
  IconCreditCardFilled, IconEdit, IconFileTextFilled, IconFolderFilled, IconHelpCircleFilled, IconLayoutDashboardFilled, IconLockFilled,
  IconReceiptFilled, IconReportAnalyticsFilled, IconScaleFilled, IconSearch, IconSendFilled, IconSettingsFilled, IconShoppingCartFilled,
  IconTagFilled, IconTruckFilled, IconUserFilled, IconVideoFilled,
} from "@tabler/icons-react"

import { AuthUserMenu } from "@/products/auth/frontend/components/AuthUserMenu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import "./sidebar-dark.css"
import { sidebarFont } from "./sidebarFont"
import { useErpAccess } from "@/products/erp/frontend/hooks/useErpAccess"
import type { ErpCapability } from "@/products/erp/shared/professionalContracts"
import { useNotifications } from "@/products/social/frontend/notifications/store"

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>
type NavigationItem = {
  title: string
  url: string
  icon?: IconComponent
  /** Other pages that belong to this item and keep it highlighted. */
  activePaths?: string[]
  /** Pages under the item's url that belong to another item. */
  excludePaths?: string[]
  /** Pages shown as tabs inside the item: found by the search, not listed in the menu. */
  tabs?: { title: string; url: string }[]
  exactActive?: boolean
  capability?: ErpCapability
  children?: NavigationItem[]
}
type Section = { id: "vendas" | "financeiro" | "marketing" | "drive" | "analytics" | "inbox"; title: string; items: NavigationItem[] }

const reports = [
  { title: "DRE", url: "/erp/relatorios/dre" }, { title: "Fluxo de caixa", url: "/erp/relatorios/fluxo-de-caixa" },
  { title: "Contas em atraso", url: "/erp/relatorios/contas-em-atraso" }, { title: "Margem", url: "/erp/relatorios/margem" },
  { title: "Orçado × realizado", url: "/erp/relatorios/orcado-realizado" }, { title: "Relatório de vendas", url: "/erp/relatorios/vendas" },
  { title: "Relatório de compras", url: "/erp/relatorios/compras" },
]

/** Always visible, above the sections. */
const topNavigation: NavigationItem[] = [
  { title: "Visão geral", url: "/erp", icon: IconLayoutDashboardFilled, exactActive: true, capability: "erp.relatorios.visualizar" },
  { title: "Relatórios", url: "/erp/relatorios/dre", icon: IconReportAnalyticsFilled, activePaths: ["/erp/relatorios"], capability: "erp.relatorios.visualizar", tabs: reports },
]

/** The sections that open and close. Each ERP item shows only to profiles with its capability. */
const sections: Section[] = [
  {
    id: "vendas", title: "Vendas", items: [
      { title: "Orçamentos", url: "/erp/vendas/orcamentos", icon: IconFileTextFilled, capability: "erp.vendas.visualizar" },
      { title: "Pedidos", url: "/erp/vendas/pedidos", icon: IconShoppingCartFilled, capability: "erp.vendas.visualizar" },
      { title: "Ordens de serviço", url: "/erp/vendas/ordens-servico", icon: IconClipboardListFilled, capability: "erp.vendas.visualizar" },
      { title: "Contratos", url: "/erp/vendas/contratos", icon: IconArticleFilled, capability: "erp.vendas.visualizar" },
      { title: "Notas de serviço", url: "/erp/vendas/notas-fiscais", icon: IconReceiptFilled, capability: "erp.vendas.visualizar" },
      { title: "Clientes", url: "/erp/cadastros/clientes", icon: IconUserFilled, capability: "erp.cadastros.visualizar" },
      { title: "Vendedores", url: "/erp/cadastros/vendedores", icon: IconBriefcaseFilled, capability: "erp.cadastros.visualizar" },
    ],
  },
  {
    id: "financeiro", title: "Financeiro", items: [
      { title: "Contas a pagar", url: "/erp/financeiro/contas-a-pagar", icon: IconCreditCardFilled, capability: "erp.financeiro.visualizar" },
      { title: "Contas a receber", url: "/erp/financeiro/contas-a-receber", icon: IconCoinFilled, capability: "erp.financeiro.visualizar" },
      { title: "Conciliação", url: "/erp/financeiro/conciliacao-bancaria", icon: IconScaleFilled, capability: "erp.financeiro.visualizar" },
      { title: "Contas financeiras", url: "/erp/financeiro/contas-financeiras", icon: IconCashBanknoteFilled, capability: "erp.financeiro.visualizar" },
      { title: "Transferências", url: "/erp/financeiro/transferencias-financeiras", icon: IconArrowsExchange, capability: "erp.financeiro.visualizar" },
      { title: "Fechamentos", url: "/erp/financeiro/fechamentos", icon: IconLockFilled, capability: "erp.financeiro.visualizar" },
      {
        title: "Compras", url: "/erp/compras/pedidos-compra", icon: IconBasketFilled, activePaths: ["/erp/compras"], capability: "erp.compras.visualizar",
        children: [
          { title: "Pedidos de compra", url: "/erp/compras/pedidos-compra" },
          { title: "Parcelas a pagar", url: "/erp/compras/parcelas-a-pagar" },
          { title: "Notas de compra", url: "/erp/compras/notas-compra" },
        ],
      },
      {
        title: "Estoque", url: "/erp/estoque/posicao-estoque", icon: IconArchiveFilled, activePaths: ["/erp/estoque"], capability: "erp.estoque.visualizar",
        children: [
          { title: "Situação", url: "/erp/estoque/posicao-estoque" },
          { title: "Movimentações", url: "/erp/estoque/movimentacoes" },
          { title: "Inventários", url: "/erp/estoque/inventarios" },
          { title: "Transferências", url: "/erp/estoque/transferencias" },
        ],
      },
      { title: "Fornecedores", url: "/erp/cadastros/fornecedores", icon: IconTruckFilled, capability: "erp.cadastros.visualizar" },
      { title: "Contas contábeis", url: "/erp/cadastros/contas-contabeis", icon: IconBookFilled, capability: "erp.cadastros.visualizar" },
      {
        title: "Produtos e serviços", url: "/erp/cadastros/produtos", icon: IconTagFilled, capability: "erp.cadastros.visualizar",
        activePaths: ["/erp/cadastros/produtos", "/erp/cadastros/servicos", "/erp/cadastros/categorias", "/erp/cadastros/importacoes", "/erp/cadastros/automacoes"],
        children: [
          { title: "Produtos", url: "/erp/cadastros/produtos" },
          { title: "Serviços", url: "/erp/cadastros/servicos" },
          { title: "Categorias", url: "/erp/cadastros/categorias" },
          { title: "Importar e exportar", url: "/erp/cadastros/importacoes" },
          { title: "Rotinas e recorrências", url: "/erp/cadastros/automacoes" },
        ],
      },
    ],
  },
  {
    id: "marketing", title: "Marketing", items: [
      { title: "Editor", url: "/editor", icon: IconVideoFilled },
      { title: "Postar", url: "/social/postar", icon: IconSendFilled },
      { title: "Agendados", url: "/social/posts", icon: IconCalendarFilled },
      {
        title: "Video Hosting", url: "/videohosting", icon: IconPlayerPlayFilled, activePaths: ["/videohosting"],
        children: [
          { title: "Vídeos", url: "/videohosting", excludePaths: ["/videohosting/configuracoes"] },
          { title: "Configurações", url: "/videohosting/configuracoes" },
        ],
      },
    ],
  },
  {
    id: "drive", title: "Drive", items: [
      { title: "Início", url: "/drive", icon: IconFolderFilled, excludePaths: ["/drive/recentes", "/drive/favoritos", "/drive/lixeira"] },
      { title: "Recentes", url: "/drive/recentes", icon: IconClockFilled },
      { title: "Favoritos", url: "/drive/favoritos", icon: IconStarFilled },
      { title: "Lixeira", url: "/drive/lixeira", icon: IconTrashFilled },
    ],
  },
  {
    id: "analytics", title: "Analytics", items: [
      { title: "Painéis", url: "/analytics", icon: IconChartAreaLineFilled, exactActive: true },
      { title: "Eventos", url: "/analytics/eventos", icon: IconBoltFilled },
      { title: "Sites e apps", url: "/analytics/sites", icon: IconWorldFilled },
    ],
  },
  {
    id: "inbox", title: "Inbox", items: [
      { title: "Caixa de entrada", url: "/inbox", icon: IconMessageCircleFilled, exactActive: true },
      { title: "Negócios", url: "/inbox/negocios", icon: IconBriefcaseFilled },
      { title: "Contatos", url: "/inbox/contatos", icon: IconUserFilled },
      { title: "Automações", url: "/inbox/automacoes", icon: IconBoltFilled },
      { title: "Disparos", url: "/inbox/disparos", icon: IconSpeakerphone },
      { title: "Relatórios", url: "/inbox/relatorios", icon: IconChartAreaFilled },
      { title: "Canais", url: "/inbox/canais", icon: IconArrowsExchange },
      { title: "Configurações", url: "/inbox/configuracoes", icon: IconAdjustmentsFilled },
    ],
  },
]

/** "Novo" in the header: the most common records. */
const createActions: { title: string; url: string; capability?: ErpCapability }[] = [
  { title: "Novo pedido de venda", url: "/erp/vendas/pedidos", capability: "erp.vendas.visualizar" },
  { title: "Novo orçamento", url: "/erp/vendas/orcamentos", capability: "erp.vendas.visualizar" },
  { title: "Nova conta a pagar", url: "/erp/financeiro/contas-a-pagar", capability: "erp.financeiro.visualizar" },
  { title: "Nova conta a receber", url: "/erp/financeiro/contas-a-receber", capability: "erp.financeiro.visualizar" },
  { title: "Novo vídeo", url: "/editor" },
  { title: "Novo post", url: "/social/postar" },
]

const matches = (pathname: string, path: string) => pathname === path || pathname.startsWith(path + "/")
function isActive(item: NavigationItem, pathname: string): boolean {
  if (item.excludePaths?.some((path) => matches(pathname, path))) return false
  if (item.activePaths?.some((path) => matches(pathname, path))) return true
  if (item.children?.some((child) => isActive(child, pathname))) return true
  return item.exactActive ? pathname === item.url : matches(pathname, item.url)
}

const roleLabel: Record<string, string> = { "org:admin": "Administrador", "org:member": "Membro" }
const OPEN_KEY = "otto-sidebar-sections"

function readOpen(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(OPEN_KEY) ?? "{}") } catch { return {} }
}

// ---------- pieces ----------

const rowClass = "flex h-[38px] w-full items-center gap-3 rounded-xl px-3 text-left text-[16px] font-medium text-[#1d1d1f] outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30 data-[active=true]:bg-white data-[active=true]:shadow-[0_1px_2px_rgba(0,0,0,0.05)] group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"

function Row({ item, pathname, onNavigate, badge }: { item: NavigationItem; pathname: string; onNavigate: (url: string) => void; badge?: React.ReactNode }) {
  const active = isActive(item, pathname)
  const { state } = useSidebar()
  const childActive = item.children?.find((child) => isActive(child, pathname))
  return (
    <li>
      <button type="button" data-active={active && !childActive} data-sidebar="menu-button" title={state === "collapsed" ? item.title : undefined}
        onClick={() => onNavigate(item.url)} className={rowClass} aria-current={active ? "page" : undefined}>
        {item.icon ? <item.icon className="size-[22px] shrink-0 text-[#1d1d1f]" /> : null}
        <span className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
        {badge}
      </button>
      {item.children && active && state !== "collapsed" ? (
        <ul className="mb-1 mt-0.5 grid gap-0.5">
          {item.children.map((child) => (
            <li key={child.url}>
              <button type="button" data-active={isActive(child, pathname)} data-sidebar="menu-sub-button" onClick={() => onNavigate(child.url)}
                className="flex h-[34px] w-full items-center rounded-xl pl-[46px] pr-3 text-left text-[15px] font-medium text-[#5b5b5f] outline-none hover:bg-black/[0.04] hover:text-[#1d1d1f] data-[active=true]:bg-white data-[active=true]:text-[#1d1d1f] data-[active=true]:shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                {child.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function SectionGroup({ section, items, open, onToggle, pathname, onNavigate }: {
  section: Section; items: NavigationItem[]; open: boolean; onToggle: () => void; pathname: string; onNavigate: (url: string) => void
}) {
  const { state } = useSidebar()
  const showItems = open || state === "collapsed"
  return (
    <div className="mt-[18px] first:mt-0 group-data-[collapsible=icon]:mt-2">
      <button type="button" onClick={onToggle} aria-expanded={open} data-sidebar="group-label"
        className="flex h-9 w-full items-center gap-1.5 rounded-xl px-3 text-left text-[16px] font-medium text-[#6e6e73] outline-none hover:text-[#1d1d1f] focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30 group-data-[collapsible=icon]:hidden">
        <span>{section.title}</span>
        {open ? <IconChevronDown className="size-4" stroke={2} /> : <IconChevronRight className="size-4" stroke={2} />}
      </button>
      {showItems ? (
        <ul className="mt-0.5 grid gap-0.5">
          {items.map((item) => <Row key={item.url + item.title} item={item} pathname={pathname} onNavigate={onNavigate} />)}
        </ul>
      ) : null}
    </div>
  )
}

function CompanySwitcher() {
  const { organization, membership } = useOrganization()
  const { userMemberships, setActive, isLoaded } = useOrganizationList({ userMemberships: { infinite: true } })
  const name = organization?.name ?? "Minha empresa"
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "O"
  const others = (userMemberships?.data ?? []).filter((m) => m.organization.id !== organization?.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" data-sidebar="company" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1 text-left outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-0">
          <span data-sidebar="company-logo" className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-[#1d1d1f] text-[13px] font-bold tracking-tight text-white">
            {organization?.hasImage ? <span className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${organization.imageUrl})` }} /> : initials}
          </span>
          <span className="min-w-0 truncate text-[17px] font-semibold tracking-[-0.01em] text-[#1d1d1f] group-data-[collapsible=icon]:hidden">{name}</span>
          <IconChevronDown className="size-4 shrink-0 text-[#1d1d1f] group-data-[collapsible=icon]:hidden" stroke={2.2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-medium text-[#6e6e73]">Empresas</DropdownMenuLabel>
        <DropdownMenuItem disabled className="gap-2 opacity-100">
          <IconCheck className="size-4" /> <span className="truncate font-medium">{name}</span>
          {membership?.role ? <span className="ml-auto text-xs text-[#8e8e93]">{roleLabel[membership.role] ?? "Membro"}</span> : null}
        </DropdownMenuItem>
        {isLoaded && others.length ? <DropdownMenuSeparator /> : null}
        {others.map((m) => (
          <DropdownMenuItem key={m.organization.id} onSelect={() => { void setActive?.({ organization: m.organization.id }) }} className="gap-2">
            <span className="size-4" /> <span className="truncate">{m.organization.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------- the menu ----------

export function SidebarShadcn({ className, style, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const access = useErpAccess()
  const { membership } = useOrganization()
  const notifications = useNotifications()
  const unread = notifications.filter((n) => !n.read).length
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  // Sections open by the visitor's choice (kept in this browser); the section of the current page always opens.
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({})
  React.useEffect(() => { setOpenSections(readOpen()) }, [])
  const toggle = (id: string, open: boolean) => setOpenSections((prev) => {
    const next = { ...prev, [id]: !open }
    try { localStorage.setItem(OPEN_KEY, JSON.stringify(next)) } catch { /* storage blocked */ }
    return next
  })

  React.useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

  const allowed = (item: { capability?: ErpCapability }) => !item.capability || access.can(item.capability)
  const top = topNavigation.filter(allowed)
  const visibleSections = sections.map((section) => ({ section, items: section.items.filter(allowed) })).filter((s) => s.items.length)
  const searchable = [
    ...top.flatMap((item) => [{ ...item, context: undefined as string | undefined }, ...(item.tabs ?? []).map((tab) => ({ ...tab, icon: undefined, context: item.title }))]),
    ...visibleSections.flatMap(({ section, items }) => items.flatMap((item) => [
      { ...item, context: section.title }, ...(item.children ?? []).map((child) => ({ ...child, icon: undefined, context: item.title })),
    ])),
  ]
  const searchResults = searchable.filter((item) =>
    ((item.context ?? "") + " " + item.title).toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")))

  const navigate = (url: string) => {
    setSearchOpen(false)
    setQuery("")
    router.push(url)
  }

  return (
    <>
      <Sidebar
        collapsible="icon"
        className={cn("otto-sidebar border-r-0", sidebarFont.variable, className)}
        style={{ "--sidebar": "#f2f2f2", "--sidebar-accent-foreground": "#1d1d1f", "--sidebar-width": "264px", ...style } as React.CSSProperties}
        {...props}
      >
        <SidebarHeader className="flex-row items-center gap-1 px-3 pb-3 pt-4 group-data-[collapsible=icon]:flex-col">
          <CompanySwitcher />
          <div className="flex items-center gap-0.5 group-data-[collapsible=icon]:flex-col">
            <button type="button" onClick={() => setSearchOpen(true)} title="Pesquisar (⌘K)" aria-label="Pesquisar"
              className="grid size-9 place-items-center rounded-xl text-[#1d1d1f] outline-none hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30">
              <IconSearch className="size-[21px]" stroke={2} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" title="Novo" aria-label="Novo"
                  className="grid size-9 place-items-center rounded-xl text-[#1d1d1f] outline-none hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30">
                  <IconEdit className="size-[21px]" stroke={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {createActions.filter(allowed).map((action) => (
                  <DropdownMenuItem key={action.title} onSelect={() => navigate(action.url)}>{action.title}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 px-3 pb-2">
          {access.loading ? (
            <p role="status" className="px-3 py-3 text-[14px] text-[#6e6e73] group-data-[collapsible=icon]:hidden">Carregando menu…</p>
          ) : access.error ? (
            <div role="alert" className="space-y-3 px-3 py-3 text-[14px] text-[#6e6e73] group-data-[collapsible=icon]:hidden">
              <p>Não foi possível carregar o menu.</p>
              <p className="text-xs">{access.error}</p>
              <button type="button" onClick={access.refresh} className="rounded-lg border bg-white px-3 py-2 text-[#1d1d1f] hover:bg-[#f7f7f7]">Tentar novamente</button>
            </div>
          ) : null}
          {top.length ? (
            <ul className="mb-3 grid gap-0.5 group-data-[collapsible=icon]:mb-2">
              {top.map((item) => <Row key={item.url} item={item} pathname={pathname} onNavigate={navigate} />)}
            </ul>
          ) : null}
          {visibleSections.map(({ section, items }) => {
            const current = items.some((item) => isActive(item, pathname))
            const open = current || Boolean(openSections[section.id])
            return <SectionGroup key={section.id} section={section} items={items} open={open} onToggle={() => toggle(section.id, open)} pathname={pathname} onNavigate={navigate} />
          })}
        </SidebarContent>

        <SidebarFooter className="gap-0.5 px-3 pb-3 pt-2">
          <ul className="grid gap-0.5">
            <Row item={{ title: "Notificações", url: "/social/notificacoes", icon: IconBellFilled }} pathname={pathname} onNavigate={navigate}
              badge={unread ? <span className="rounded-full bg-black/[0.06] px-2.5 py-0.5 text-[13px] font-medium text-[#3a3a3c] group-data-[collapsible=icon]:hidden">{unread > 99 ? "99+" : unread}</span> : null} />
            <Row item={{ title: "Configurações", url: "/configuracoes", icon: IconSettingsFilled }} pathname={pathname} onNavigate={navigate} />
            <li>
              <button type="button" onClick={() => setSearchOpen(true)} className={rowClass} data-sidebar="menu-button">
                <IconHelpCircleFilled className="size-[22px] shrink-0 text-[#1d1d1f]" />
                <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">Ajuda</span>
              </button>
            </li>
          </ul>
          <div className="mt-2"><AuthUserMenu subtitle={membership?.role ? roleLabel[membership.role] ?? "Membro" : undefined} /></div>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
          <DialogHeader className="sr-only"><DialogTitle>Pesquisar no Otto</DialogTitle></DialogHeader>
          <div className="flex items-center gap-3 border-b px-4">
            <IconSearch className="size-5 text-[#777]" stroke={1.7} />
            <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar páginas e recursos…"
              className="h-14 border-0 px-0 text-[15px] shadow-none focus-visible:ring-0" />
          </div>
          <div className="max-h-[360px] overflow-y-auto p-2">
            {searchResults.length ? searchResults.map((item) => (
              <button type="button" key={(item.context ?? "") + "-" + item.title + item.url} onClick={() => navigate(item.url)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#f4f4f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111]">
                {item.icon ? <item.icon className="size-4 text-[#777]" /> : <span className="size-4" />}
                <span className="min-w-0 flex-1 truncate text-[14px] text-[#222]">{item.title}</span>
                {item.context ? <span className="text-[12px] text-[#8a8a8a]">{item.context}</span> : null}
              </button>
            )) : <p className="px-3 py-8 text-center text-[14px] text-[#777]">Nenhuma página encontrada.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
