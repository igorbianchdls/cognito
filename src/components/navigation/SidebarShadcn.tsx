"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  MessageSquare,
  Plug,
  Cpu,
  Plus,
} from "lucide-react"
import { Folder as FolderIcon } from 'lucide-react'
import { Inbox, MessageCircle } from 'lucide-react'

import MetaIcon from "@/components/icons/MetaIcon"
import GoogleAdsIcon from "@/components/icons/GoogleAdsIcon"
import GoogleAnalyticsIcon from "@/components/icons/GoogleAnalyticsIcon"
import ShopifyIcon from "@/components/icons/ShopifyIcon"
import AmazonIcon from "@/components/icons/AmazonIcon"
import ShopeeIcon from "@/components/icons/ShopeeIcon"
import ContaAzulIcon from "@/components/icons/ContaAzulIcon"

import { NavMainSimple } from "@/components/navigation/nav-main-simple"
import { NavAirtable } from "@/components/navigation/nav-airtable"
import { NavErp } from "@/components/navigation/nav-erp"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

// Font variable mapping helper
function fontVar(name?: string) {
  if (!name) return undefined
  if (name === 'Space Mono') return 'var(--font-space-mono), "Space Mono", monospace'
  if (name === 'Barlow') return 'var(--font-barlow), "Barlow", sans-serif'
  if (name === 'Inter') return 'var(--font-inter)'
  if (name === 'Geist') return 'var(--font-geist-sans)'
  if (name === 'Roboto Mono') return 'var(--font-roboto-mono)'
  if (name === 'Geist Mono') return 'var(--font-geist-mono)'
  if (name === 'IBM Plex Mono') return 'var(--font-ibm-plex-mono), "IBM Plex Mono", monospace'
  if (name === 'Avenir') return 'var(--font-avenir), Avenir, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
  if (name === 'EB Garamond') return 'var(--font-eb-garamond), "EB Garamond", serif'
  if (name === 'Libre Baskerville') return 'var(--font-libre-baskerville), "Libre Baskerville", serif'
  return name
}

// Default styles now bound to UI tokens
const DEFAULT_SECTION_TITLE_STYLE: React.CSSProperties = {
  // Use the previous dedicated font for section titles (not the general UI font)
  fontFamily: fontVar('Space Mono'),
  fontWeight: 500,
  fontSize: '12px',
  color: '#808080',
  letterSpacing: '0em',
  textTransform: 'uppercase',
}

const DEFAULT_ITEM_TEXT_STYLE: React.CSSProperties = {
  fontFamily: 'var(--ui-font-family)',
  fontWeight: 400,
  fontSize: 'var(--ui-font-size)',
  color: 'var(--sidebar-accent-foreground)',
  letterSpacing: '-0.02em',
  textTransform: 'none',
}

// Navigation data adapted to shadcn format
const navigationData = {
  user: {
    name: "Usuário",
    email: "usuario@exemplo.com",
    avatar: "/avatars/user.jpg", // fallback will show initials
  },
  teams: [
    {
      name: "Otto",
      logo: Cpu,
      plan: "Professional",
    },
  ],
  navMain: [
    {
      title: "Chats",
      url: "/chat/lista",
      icon: MessageSquare,
    },
    {
      title: "Automacoes",
      url: "/automacoes",
      icon: Cpu,
    },
    {
      title: "Integrações",
      url: "/integracoes",
      icon: Plug,
    },
    // Keep these three at the end, in order: WhatsApp, Drive, Email
    {
      title: "WhatsApp",
      url: "/whatsapp",
      icon: MessageCircle,
    },
    {
      title: "Drive",
      url: "/drive",
      icon: FolderIcon,
    },
    {
      title: "Email",
      url: "/email",
      icon: Inbox,
    },
  ],
  integrations: [
    {
      title: "Meta Ads",
      icon: MetaIcon,
    },
    {
      title: "Google Ads", 
      icon: GoogleAdsIcon,
    },
    {
      title: "Google Analytics",
      icon: GoogleAnalyticsIcon,
    },
    {
      title: "Shopify",
      icon: ShopifyIcon,
    },
    {
      title: "Amazon Ads",
      icon: AmazonIcon,
    },
    {
      title: "Shopee",
      icon: ShopeeIcon,
    },
    {
      title: "ContaAzul",
      icon: ContaAzulIcon,
    },
  ],
}

import { cn } from "@/lib/utils"

export function SidebarShadcn({ bgColor, textColor, itemTextColor, itemTextStyle, sectionTitleStyle, style, borderless, headerBorderless, className, headerVariant: _headerVariant = 'compact', showHeaderTrigger: _showHeaderTrigger = true, iconSizePx = 12, ...props }: React.ComponentProps<typeof Sidebar> & { bgColor?: string; textColor?: string; itemTextColor?: string; itemTextStyle?: React.CSSProperties; sectionTitleStyle?: React.CSSProperties; borderless?: boolean; headerBorderless?: boolean; className?: string; headerVariant?: 'default' | 'compact'; showHeaderTrigger?: boolean; iconSizePx?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  void _headerVariant
  void _showHeaderTrigger

  // Static defaults only (avoid visual flash on hydration)

  const handleNewChat = () => {
    try {
      const id = (globalThis as any)?.crypto?.randomUUID?.() || (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
      router.replace(`/chat/${id}?auto=1`)
    } catch {
      const id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      router.replace(`/chat/${id}?auto=1`)
    }
  }

  // Update active state based on current path
  const navMainWithActiveState = navigationData.navMain.map(item => ({
    ...item,
    isActive: pathname === item.url
  }))

  const dataWithActiveState = {
    ...navigationData,
    navMain: navMainWithActiveState
  }

  // Apply default values consistently (no localStorage overrides)
  const finalBgColor = bgColor ?? '#f9fafb'
  const finalTextColor = textColor ?? '#717171'
  const finalItemTextColor = itemTextColor ?? '#0f172a'
  const finalSectionTitleStyle = sectionTitleStyle ?? DEFAULT_SECTION_TITLE_STYLE
  const finalItemTextStyle = itemTextStyle ?? DEFAULT_ITEM_TEXT_STYLE
  const finalIconSizePx = iconSizePx ?? 12

  // Inline CSS variable overrides for sidebar theme
  // Inline style with custom CSS variables (typed safely)
  const inlineStyleBase: React.CSSProperties = { ...(style || {}) }
  const inlineStyle = inlineStyleBase as React.CSSProperties & Record<string, string | number>
  // Defaults requested: font-size 14px, item color rgb(110,110,10), letter-spacing -0.02em, bg rgb(250,250,250)
  inlineStyle['--sidebar'] = 'rgb(253, 253, 254)'
  inlineStyle['--sidebar-accent-foreground'] = 'rgb(128, 128, 128)'
  inlineStyle['--ui-font-size'] = '14px'
  inlineStyle['--ui-tracking-pct'] = '-2'

  return (
    <Sidebar
      collapsible="icon"
      style={inlineStyle}
      className={cn('ui-text', borderless ? '!border-r-0 !border-l-0 !border-0' : undefined, className)}
      {...props}
    >
      <SidebarHeader className={cn("h-16 p-0")} style={{ backgroundColor: 'var(--sidebar)' }}>
        <div className="h-full w-full flex items-center justify-start gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Cpu className="h-4 w-4 text-black shrink-0" />
          <span className="text-black font-bold text-base leading-none group-data-[collapsible=icon]:hidden">Cretto</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="ui-text">
        <div className="px-2 pt-1">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full h-8 inline-flex items-center justify-center gap-2 rounded-md bg-white border border-gray-200 text-black text-sm hover:bg-gray-50"
            title="Novo Chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Chat</span>
          </button>
        </div>
        <NavMainSimple items={dataWithActiveState.navMain} groupLabelStyle={finalSectionTitleStyle} itemTextStyle={finalItemTextStyle} iconSizePx={finalIconSizePx} />
        <NavAirtable groupLabelStyle={finalSectionTitleStyle} itemTextStyle={finalItemTextStyle} />
        <NavErp groupLabelStyle={finalSectionTitleStyle} itemTextStyle={finalItemTextStyle} />

        <SidebarGroup>
          <SidebarGroupLabel style={finalSectionTitleStyle}>Integrações</SidebarGroupLabel>
          <SidebarMenu>
            {navigationData.integrations.map((integration) => (
              <SidebarMenuItem key={integration.title}>
                <SidebarMenuButton tooltip={integration.title}>
                  <span style={{ width: finalIconSizePx, height: finalIconSizePx }} className="inline-flex items-center justify-center">
                    <integration.icon className="w-full h-full" backgroundColor="transparent" />
                  </span>
                  <span style={finalItemTextStyle}>{integration.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={dataWithActiveState.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
