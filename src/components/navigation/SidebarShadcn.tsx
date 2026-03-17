"use client"

import * as React from "react"
import { Icon } from "@iconify/react"
import { usePathname, useRouter } from "next/navigation"

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

function SidebarGlyph({ icon, className }: { icon: string; className?: string }) {
  return <Icon icon={icon} className={className} />
}

const BrandIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:widget-5-bold" {...props} />
const ChatsIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:chat-round-dots-bold" {...props} />
const AutomationIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:cpu-bolt-bold" {...props} />
const IntegrationsIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:plug-circle-bold" {...props} />
const WhatsappIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:chat-round-line-bold" {...props} />
const DriveIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:folder-with-files-bold" {...props} />
const EmailIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:inbox-bold" {...props} />
const NewChatIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:add-circle-bold" {...props} />
const DashboardsArtifactIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:chart-2-bold" {...props} />
const ReportsArtifactIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:document-text-bold" {...props} />
const SlidesArtifactIcon = (props: { className?: string }) => <SidebarGlyph icon="solar:gallery-wide-bold" {...props} />

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
      name: "Alfred",
      logo: BrandIcon,
      plan: "Professional",
    },
  ],
  navMain: [
    {
      title: "Chats",
      url: "/chat/lista",
      icon: ChatsIcon,
    },
    {
      title: "Automacoes",
      url: "/automacoes",
      icon: AutomationIcon,
    },
    {
      title: "Integrações",
      url: "/integracoes",
      icon: IntegrationsIcon,
    },
    // Keep these three at the end, in order: WhatsApp, Drive, Email
    {
      title: "WhatsApp",
      url: "/whatsapp",
      icon: WhatsappIcon,
    },
    {
      title: "Drive",
      url: "/drive",
      icon: DriveIcon,
    },
    {
      title: "Email",
      url: "/email",
      icon: EmailIcon,
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
  artifacts: [
    {
      title: "Dashboards",
      url: "/artifacts/dashboards",
      icon: DashboardsArtifactIcon,
    },
    {
      title: "Reports",
      url: "/artifacts/reports",
      icon: ReportsArtifactIcon,
    },
    {
      title: "Slides",
      url: "/artifacts/slides",
      icon: SlidesArtifactIcon,
    },
  ],
}

import { cn } from "@/lib/utils"

export function SidebarShadcn({ bgColor, textColor, itemTextColor, itemTextStyle, sectionTitleStyle, style, borderless, headerBorderless, className, headerVariant: _headerVariant = 'compact', showHeaderTrigger: _showHeaderTrigger = true, iconSizePx = 14, ...props }: React.ComponentProps<typeof Sidebar> & { bgColor?: string; textColor?: string; itemTextColor?: string; itemTextStyle?: React.CSSProperties; sectionTitleStyle?: React.CSSProperties; borderless?: boolean; headerBorderless?: boolean; className?: string; headerVariant?: 'default' | 'compact'; showHeaderTrigger?: boolean; iconSizePx?: number }) {
  const pathname = usePathname()
  const router = useRouter()
  void _headerVariant
  void _showHeaderTrigger

  // Static defaults only (avoid visual flash on hydration)

  const handleNewChat = () => {
    try {
      const id = (globalThis as any)?.crypto?.randomUUID?.() || (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))
      router.replace(`/chat/codex/${id}`)
    } catch {
      const id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      router.replace(`/chat/codex/${id}`)
    }
  }

  // Update active state based on current path
  const navMainWithActiveState = navigationData.navMain.map(item => ({
    ...item,
    isActive: pathname === item.url
  }))

  const dataWithActiveState = {
    ...navigationData,
    navMain: navMainWithActiveState,
    artifacts: navigationData.artifacts.map(item => ({
      ...item,
      isActive: pathname === item.url,
    })),
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
      <SidebarHeader className={cn("border-b-[0.5px] border-[#DDDDD8] p-0")} style={{ backgroundColor: 'var(--sidebar)' }}>
        <div className="flex min-h-[57px] w-full items-center justify-start gap-2 px-5 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <BrandIcon className="h-4 w-4 text-black shrink-0" />
          <span className="text-black font-bold text-base leading-none group-data-[collapsible=icon]:hidden">Creatto</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="ui-text">
        <div className="px-2 pt-1">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full h-8 inline-flex items-center justify-center gap-2 rounded-md bg-white border border-gray-200 text-black text-sm hover:bg-gray-50 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:gap-0"
            title="Novo Chat"
          >
            <NewChatIcon className="w-3.5 h-3.5" />
            <span className="group-data-[collapsible=icon]:hidden">Novo Chat</span>
          </button>
        </div>
        <NavMainSimple items={dataWithActiveState.navMain} groupLabelStyle={finalSectionTitleStyle} itemTextStyle={finalItemTextStyle} iconSizePx={finalIconSizePx} />
        <NavMainSimple
          items={dataWithActiveState.artifacts}
          groupLabel="Artifacts"
          groupLabelStyle={finalSectionTitleStyle}
          itemTextStyle={finalItemTextStyle}
          iconSizePx={finalIconSizePx}
        />
        <NavErp groupLabelStyle={finalSectionTitleStyle} itemTextStyle={finalItemTextStyle} />
        <NavAirtable groupLabelStyle={finalSectionTitleStyle} itemTextStyle={finalItemTextStyle} />

        <SidebarGroup>
          <SidebarGroupLabel style={finalSectionTitleStyle}>Integrações</SidebarGroupLabel>
          <SidebarMenu>
            {navigationData.integrations.map((integration) => (
              <SidebarMenuItem key={integration.title}>
                <SidebarMenuButton tooltip={integration.title}>
                  <span data-sidebar-icon style={{ width: finalIconSizePx, height: finalIconSizePx }} className="inline-flex items-center justify-center">
                    <integration.icon className="w-full h-full" backgroundColor="transparent" />
                  </span>
                  <span className="group-data-[collapsible=icon]:hidden" style={finalItemTextStyle}>{integration.title}</span>
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
