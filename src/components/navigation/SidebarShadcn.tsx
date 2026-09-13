"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  IconAddressBook, IconBuildingWarehouse, IconCashBanknote,
  IconChartBar, IconClipboardList, IconFileInvoice,
  IconPackage, IconReportAnalytics, IconSearch, IconSettings, IconShoppingBag,
  IconSparkles, IconTruckDelivery, IconUsers,
} from "@tabler/icons-react"
import { CircleHelp } from "lucide-react"

import { NavMainSimple, type SimpleNavigationItem } from "@/components/navigation/nav-main-simple"
import { NavUser } from "@/components/nav-user"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { useErpAccess } from "@/products/erp/frontend/hooks/useErpAccess"
import type { ErpCapability } from "@/products/erp/shared/professionalContracts"

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>
type NavigationItem = {
  title: string
  url?: string
  icon?: IconComponent
  activePrefix?: string
  exactActive?: boolean
  capability?: ErpCapability
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  { title: "Visão geral", url: "/erp", icon: IconChartBar, exactActive: true, capability: "erp.relatorios.visualizar" },
  {
    title: "Vendas", url: "/erp/vendas/pedidos", icon: IconShoppingBag, activePrefix: "/erp/vendas", capability: "erp.vendas.visualizar",
    children: [
      { title: "Orçamentos", url: "/erp/vendas/orcamentos" },
      { title: "Pedidos", url: "/erp/vendas/pedidos" },
      { title: "Ordens de serviço", url: "/erp/vendas/ordens-servico" },
      { title: "Contratos", url: "/erp/vendas/contratos" },
    ],
  },
  {
    title: "Compras", url: "/erp/compras/pedidos-compra", icon: IconClipboardList, activePrefix: "/erp/compras", capability: "erp.compras.visualizar",
    children: [
      { title: "Pedidos de compra", url: "/erp/compras/pedidos-compra" },
      { title: "Parcelas a pagar", url: "/erp/compras/parcelas-a-pagar" },
      { title: "Notas de compra", url: "/erp/compras/notas-compra" },
    ],
  },
  {
    title: "Financeiro", url: "/erp/financeiro/contas-a-pagar", icon: IconCashBanknote, activePrefix: "/erp/financeiro", capability: "erp.financeiro.visualizar",
    children: [
      { title: "Contas a pagar", url: "/erp/financeiro/contas-a-pagar" },
      { title: "Contas a receber", url: "/erp/financeiro/contas-a-receber" },
      { title: "Conciliação", url: "/erp/financeiro/conciliacao-bancaria" },
      { title: "Contas financeiras", url: "/erp/financeiro/contas-financeiras" },
      { title: "Transferências", url: "/erp/financeiro/transferencias-financeiras" },
      { title: "Fechamentos", url: "/erp/financeiro/fechamentos" },
    ],
  },
  {
    title: "Estoque", url: "/erp/estoque/posicao-estoque", icon: IconBuildingWarehouse, activePrefix: "/erp/estoque", capability: "erp.estoque.visualizar",
    children: [
      { title: "Situação", url: "/erp/estoque/posicao-estoque" },
      { title: "Movimentações", url: "/erp/estoque/movimentacoes" },
      { title: "Inventários", url: "/erp/estoque/inventarios" },
      { title: "Transferências", url: "/erp/estoque/transferencias" },
    ],
  },
  { title: "Notas fiscais", url: "/erp/compras/notas-compra", icon: IconFileInvoice, capability: "erp.compras.visualizar" },
  { title: "Clientes", url: "/erp/cadastros/clientes", icon: IconUsers, capability: "erp.cadastros.visualizar" },
  { title: "Fornecedores", url: "/erp/cadastros/fornecedores", icon: IconTruckDelivery, capability: "erp.cadastros.visualizar" },
  {
    title: "Produtos e serviços", url: "/erp/cadastros/produtos", icon: IconPackage, capability: "erp.cadastros.visualizar",
    children: [
      { title: "Produtos", url: "/erp/cadastros/produtos" },
      { title: "Serviços", url: "/erp/cadastros/servicos" },
      { title: "Categorias", url: "/erp/cadastros/categorias" },
      { title: "Importar e exportar", url: "/erp/cadastros/importacoes" },
      { title: "Rotinas e recorrências", url: "/erp/cadastros/automacoes" },
    ],
  },
  { title: "Relatórios", url: "/erp/relatorios/posicao-financeira", icon: IconReportAnalytics, activePrefix: "/erp/relatorios", capability: "erp.relatorios.visualizar" },
  { title: "IA", url: "/configuracoes/integracoes-ia", icon: IconSparkles },
]

function activeItem(item: NavigationItem, pathname: string): SimpleNavigationItem {
  const children = item.children?.map((child) => activeItem(child, pathname))
  const ownActive = item.url
    ? item.exactActive
      ? pathname === item.url
      : pathname === item.url || pathname.startsWith(item.activePrefix ?? item.url + "/")
    : false
  return { ...item, children, isActive: ownActive || Boolean(children?.some((child) => child.isActive)) }
}

function flatten(items: SimpleNavigationItem[], parent?: string): Array<SimpleNavigationItem & { context?: string }> {
  return items.flatMap((item) => [
    ...(item.url ? [{ ...item, context: parent }] : []),
    ...flatten(item.children ?? [], item.title),
  ])
}

export function SidebarShadcn({ className, style, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const access = useErpAccess()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")

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

  const visibleItems = navigation
    .filter((item) => !item.capability || access.can(item.capability))
    .map((item) => activeItem(item, pathname))
  const searchResults = flatten(visibleItems).filter((item) =>
    ((item.context ?? "") + " " + item.title).toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR")),
  )

  const navigate = (url?: string) => {
    if (!url) return
    setSearchOpen(false)
    setQuery("")
    router.push(url)
  }

  return (
    <>
      <Sidebar
        collapsible="icon"
        className={cn("border-r border-[#e8e8e5]", className)}
        style={{ "--sidebar": "#f7f7f4", "--sidebar-width": "232px", ...style } as React.CSSProperties}
        {...props}
      >
        <SidebarHeader className="gap-3 px-3 pb-2 pt-4">
          <button
            type="button"
            onClick={() => router.push("/erp")}
            className="flex h-10 items-center gap-2.5 rounded-lg px-2 text-left group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            aria-label="Ir para a visão geral"
          >
            <Image src="/logoOttoIcon.svg" alt="" width={20} height={20} className="size-5 object-contain" />
            <span className="text-[21px] font-semibold leading-none tracking-[-0.04em] text-[#111] group-data-[collapsible=icon]:hidden">otto</span>
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[#626262] outline-none hover:bg-black/[0.035] focus-visible:ring-2 focus-visible:ring-[#111] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <IconSearch className="size-[18px] shrink-0" stroke={1.7} />
            <span className="flex-1 text-left text-[14px] group-data-[collapsible=icon]:hidden">Pesquisar</span>
            <kbd className="rounded border border-[#deded9] bg-white/70 px-1.5 py-0.5 text-[11px] text-[#777] group-data-[collapsible=icon]:hidden">⌘ K</kbd>
          </button>
        </SidebarHeader>
        <SidebarContent className="py-1">
          <NavMainSimple items={visibleItems} iconSizePx={18} />
        </SidebarContent>
        <SidebarFooter className="gap-1 border-t border-[#e6e6e2] p-2">
          <SidebarMenu className="gap-0.5">
            <SidebarMenuItem>
              <SidebarMenuButton className="h-10 gap-3 rounded-lg px-3 text-[#5d5d5d]" onClick={() => router.push("/configuracoes")}>
                <IconSettings className="size-[18px]" stroke={1.7} /><span>Configurações</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-10 gap-3 rounded-lg px-3 text-[#5d5d5d]" onClick={() => setSearchOpen(true)}>
                <CircleHelp className="size-[18px]" strokeWidth={1.7} /><span>Ajuda</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="border-t border-[#e6e6e2] pt-1"><NavUser user={{ name: "Usuário", email: "", avatar: "" }} /></div>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
          <DialogHeader className="sr-only"><DialogTitle>Pesquisar no ERP</DialogTitle></DialogHeader>
          <div className="flex items-center gap-3 border-b px-4">
            <IconSearch className="size-5 text-[#777]" stroke={1.7} />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar páginas e recursos…"
              className="h-14 border-0 px-0 text-[15px] shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-[360px] overflow-y-auto p-2">
            {searchResults.length ? searchResults.map((item) => (
              <button
                type="button"
                key={(item.context ?? "") + "-" + item.title}
                onClick={() => navigate(item.url)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#f4f4f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111]"
              >
                {item.icon ? <item.icon className="size-4 text-[#777]" /> : <IconAddressBook className="size-4 text-[#999]" />}
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
