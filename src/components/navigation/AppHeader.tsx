"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrganization } from "@clerk/nextjs"
import { IconBellFilled, IconHelpCircleFilled, IconSettingsFilled } from "@tabler/icons-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { AuthUserMenu } from "@/products/auth/frontend/components/AuthUserMenu"
import { useNotifications } from "@/products/marketing/frontend/notifications/store"
import { OPEN_SEARCH_EVENT, roleLabel } from "./SidebarShadcn"

const button = "relative grid size-9 place-items-center rounded-xl text-[#1d1d1f] outline-none hover:bg-black/[0.05] focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30"

/**
 * The bar at the top of every screen, right of the menu: notifications, settings, help (the search of the menu) and the
 * person's account. Its height is --app-header-h (globals.css), which full-height screens subtract.
 */
export function AppHeader({ className }: { className?: string }) {
  const pathname = usePathname()
  const { membership } = useOrganization()
  const unread = useNotifications().filter((n) => !n.read).length
  const on = (url: string) => pathname === url || pathname.startsWith(url + "/")

  return (
    <header className={cn("sticky top-0 z-30 flex h-[var(--app-header-h)] shrink-0 items-center gap-1 border-b border-black/[0.06] bg-white px-3", className)}>
      <SidebarTrigger className="md:hidden" />
      <div className="flex-1" />
      <Link href="/marketing/notificacoes" title="Notificações" aria-label={unread ? `Notificações (${unread} não lidas)` : "Notificações"}
        className={cn(button, on("/marketing/notificacoes") && "bg-black/[0.06]")}>
        <IconBellFilled className="size-[21px]" />
        {unread ? (
          <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e5484d] px-1 text-[10px] font-semibold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </Link>
      <Link href="/configuracoes" title="Configurações" aria-label="Configurações" className={cn(button, on("/configuracoes") && "bg-black/[0.06]")}>
        <IconSettingsFilled className="size-[21px]" />
      </Link>
      <button type="button" title="Ajuda (⌘K)" aria-label="Ajuda" className={button} onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}>
        <IconHelpCircleFilled className="size-[21px]" />
      </button>
      <div className="ml-1">
        <AuthUserMenu variant="header" subtitle={membership?.role ? roleLabel[membership.role] ?? "Membro" : undefined} />
      </div>
    </header>
  )
}
