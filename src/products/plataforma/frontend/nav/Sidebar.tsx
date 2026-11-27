"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { IconChevronDown, IconChevronRight, IconEdit, IconSearch } from "@tabler/icons-react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sidebar, SidebarContent, SidebarHeader, useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import "./sidebar-dark.css"
import { sidebarFont } from "./sidebarFont"
import { CompanySwitcher } from "../empresa/Seletor"
import { createActions, isActive, sections, type NavigationItem, type Section } from "./secoes"
import { useEmpresaAtiva } from "../empresa/useEmpresaAtiva"
import { secoesPorCategoria } from "../../shared/categorias"
import { useErpAccess } from "@/products/erp/frontend/hooks/useErpAccess"
import type { ErpCapability } from "@/products/erp/shared/professionalContracts"

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
  const showItems = open || section.alwaysOpen || state === "collapsed"
  return (
    <div className="mt-[18px] first:mt-0 group-data-[collapsible=icon]:mt-2">
      {section.alwaysOpen ? (
        <div data-sidebar="group-label" className="flex h-9 w-full items-center px-3 text-[16px] font-medium text-[#6e6e73] group-data-[collapsible=icon]:hidden">
          <span>{section.title}</span>
        </div>
      ) : (
        <button type="button" onClick={onToggle} aria-expanded={open} data-sidebar="group-label"
          className="flex h-9 w-full items-center gap-1.5 rounded-xl px-3 text-left text-[16px] font-medium text-[#6e6e73] outline-none hover:text-[#1d1d1f] focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30 group-data-[collapsible=icon]:hidden">
          <span>{section.title}</span>
          {open ? <IconChevronDown className="size-4" stroke={2} /> : <IconChevronRight className="size-4" stroke={2} />}
        </button>
      )}
      {showItems ? (
        <ul className="mt-0.5 grid gap-0.5">
          {items.map((item) => <Row key={item.url + item.title} item={item} pathname={pathname} onNavigate={onNavigate} />)}
        </ul>
      ) : null}
    </div>
  )
}

/** Opens the search of the menu (the Ajuda button of the header sends it). */
export const OPEN_SEARCH_EVENT = "otto:open-search"

// ---------- the menu ----------

export function AppSidebar({ className, style, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const access = useErpAccess()
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
      // Uma tela com busca própria (Notas) já tratou o atalho: não abre as duas.
      if (event.defaultPrevented) return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    const openSearch = () => setSearchOpen(true)
    window.addEventListener("keydown", handleShortcut)
    window.addEventListener(OPEN_SEARCH_EVENT, openSearch)
    return () => { window.removeEventListener("keydown", handleShortcut); window.removeEventListener(OPEN_SEARCH_EVENT, openSearch) }
  }, [])

  const allowed = (item: { capability?: ErpCapability }) => !item.capability || access.can(item.capability)
  // The company's category decides which sections show and in which order; the ERP profile hides what it doesn't allow.
  const { categoria } = useEmpresaAtiva()
  const visibleSections = secoesPorCategoria[categoria]
    .flatMap((id) => sections.filter((section) => section.id === id))
    .map((section) => ({ section, items: section.items.filter(allowed) })).filter((s) => s.items.length)
  const shortcuts = createActions.filter((action) => action.categorias.includes(categoria) && allowed(action))
  const searchable = [
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
                {shortcuts.map((action) => (
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
          {visibleSections.map(({ section, items }) => {
            const current = items.some((item) => isActive(item, pathname))
            const open = current || Boolean(openSections[section.id])
            return <SectionGroup key={section.id} section={section} items={items} open={open} onToggle={() => toggle(section.id, open)} pathname={pathname} onNavigate={navigate} />
          })}
        </SidebarContent>
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
