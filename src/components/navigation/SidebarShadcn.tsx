"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  IconChartBar,
  IconCirclePlus,
  IconFileText,
  IconFolder,
  IconGridDots,
  IconInbox,
  IconMessageCircle,
  IconPlugConnected,
  IconPresentation,
  IconSettingsAutomation,
} from "@tabler/icons-react"

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

const BrandIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconGridDots stroke={1.75} {...props} />
const ChatsIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconMessageCircle stroke={1.75} {...props} />
const AutomationIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconSettingsAutomation stroke={1.75} {...props} />
const IntegrationsIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconPlugConnected stroke={1.75} {...props} />
const DriveIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconFolder stroke={1.75} {...props} />
const EmailIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconInbox stroke={1.75} {...props} />
const NewChatIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconCirclePlus stroke={1.75} {...props} />
const DashboardsArtifactIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconChartBar stroke={1.75} {...props} />
const ReportsArtifactIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconFileText stroke={1.75} {...props} />
const SlidesArtifactIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconPresentation stroke={1.75} {...props} />

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
  fontFamily: fontVar('Geist'),
  fontWeight: 400,
  fontSize: 'var(--ui-font-size)',
  color: 'var(--sidebar-accent-foreground)',
  letterSpacing: '-0.01em',
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
    // Keep these two at the end, in order: Drive, Email
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
  const finalBgColor = bgColor ?? '#F7F7F7'
  const finalTextColor = textColor ?? '#4D4D4D'
  const finalItemTextColor = itemTextColor ?? '#4D4D4D'
  const finalSectionTitleStyle = sectionTitleStyle ?? DEFAULT_SECTION_TITLE_STYLE
  const finalItemTextStyle = itemTextStyle ?? DEFAULT_ITEM_TEXT_STYLE
  const finalIconSizePx = iconSizePx ?? 12

  // Inline CSS variable overrides for sidebar theme
  // Inline style with custom CSS variables (typed safely)
  const inlineStyleBase: React.CSSProperties = { ...(style || {}) }
  const inlineStyle = inlineStyleBase as React.CSSProperties & Record<string, string | number>
  // Defaults requested: compact sidebar typography/colors
  inlineStyle['--sidebar'] = finalBgColor
  inlineStyle['--sidebar-accent-foreground'] = finalItemTextColor
  inlineStyle['--ui-font-size'] = '14px'
  inlineStyle['--ui-tracking-pct'] = '-2'

  return (
    <Sidebar
      collapsible="icon"
      style={inlineStyle}
      className={cn('ui-text', borderless ? '!border-r-0 !border-l-0 !border-0' : undefined, className)}
      {...props}
    >
      <SidebarHeader className={cn("gap-0 p-0")} style={{ backgroundColor: 'var(--sidebar)' }}>
        <div className="flex h-[43px] w-full items-center justify-start gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <BrandIcon className="h-4 w-4 shrink-0 text-[#4D4D4D]" />
          <span className="text-[13px] font-normal leading-none tracking-[-0.01em] text-[#4D4D4D] group-data-[collapsible=icon]:hidden" style={{ fontFamily: fontVar('Geist') }}>Creatto</span>
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
        <div className="group-data-[collapsible=icon]:hidden">
          <NavMainSimple
            items={dataWithActiveState.artifacts}
            groupLabel="Artifacts"
            groupLabelStyle={finalSectionTitleStyle}
            itemTextStyle={finalItemTextStyle}
            iconSizePx={finalIconSizePx}
          />
        </div>
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
