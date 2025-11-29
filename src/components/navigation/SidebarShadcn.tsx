"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  LayoutGrid,
  Plug,
  Cpu,
} from "lucide-react"

import MetaIcon from "@/components/icons/MetaIcon"
import GoogleAdsIcon from "@/components/icons/GoogleAdsIcon"
import GoogleAnalyticsIcon from "@/components/icons/GoogleAnalyticsIcon"
import ShopifyIcon from "@/components/icons/ShopifyIcon"
import AmazonIcon from "@/components/icons/AmazonIcon"
import GoogleIcon from "@/components/icons/GoogleIcon"
import ShopeeIcon from "@/components/icons/ShopeeIcon"
import ContaAzulIcon from "@/components/icons/ContaAzulIcon"

import { NavMainSimple } from "@/components/navigation/nav-main-simple"
import { NavModulos } from "@/components/navigation/nav-modulos"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
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

// Default styles matching financeiro dashboard
const DEFAULT_SECTION_TITLE_STYLE: React.CSSProperties = {
  fontFamily: fontVar('Space Mono'),
  fontWeight: 500,
  fontSize: '12px',
  color: '#808080',
  letterSpacing: '0em',
  textTransform: 'uppercase',
}

const DEFAULT_ITEM_TEXT_STYLE: React.CSSProperties = {
  fontFamily: fontVar('Barlow'),
  fontWeight: 400,
  fontSize: '15px',
  color: 'rgb(64, 64, 64)',
  letterSpacing: '-0.03em',
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
      name: "Creatto",
      logo: Cpu,
      plan: "Professional",
    },
  ],
  navMain: [
    {
      title: "Nexus",
      url: "/nexus",
      icon: MessageSquare,
      isActive: false, // Will be set dynamically
    },
    {
      title: "Agentes",
      url: "/agentes",
      icon: LayoutGrid,
    },
    {
      title: "Integrações",
      url: "/integracoes",
      icon: Plug,
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

export function SidebarShadcn({ bgColor, textColor, itemTextColor, itemTextStyle, sectionTitleStyle, style, borderless, headerBorderless, className, ...props }: React.ComponentProps<typeof Sidebar> & { bgColor?: string; textColor?: string; itemTextColor?: string; itemTextStyle?: React.CSSProperties; sectionTitleStyle?: React.CSSProperties; borderless?: boolean; headerBorderless?: boolean; className?: string }) {
  const pathname = usePathname()

  // Update active state based on current path
  const navMainWithActiveState = navigationData.navMain.map(item => ({
    ...item,
    isActive: pathname === item.url
  }))

  const dataWithActiveState = {
    ...navigationData,
    navMain: navMainWithActiveState
  }

  // Apply default values from financeiro dashboard
  const finalBgColor = bgColor ?? '#fdfdfd'
  const finalTextColor = textColor ?? '#717171'
  const finalItemTextColor = itemTextColor ?? '#0f172a'
  const finalSectionTitleStyle = sectionTitleStyle ?? DEFAULT_SECTION_TITLE_STYLE
  const finalItemTextStyle = itemTextStyle ?? DEFAULT_ITEM_TEXT_STYLE

  // Inline CSS variable overrides for sidebar theme
  const inlineStyle = {
    ...(style || {}),
    ["--sidebar"]: finalBgColor,
    ["--sidebar-foreground"]: finalTextColor,
    ["--sidebar-accent-foreground"]: finalItemTextColor,
  } as React.CSSProperties

  return (
    <Sidebar
      collapsible="icon"
      style={inlineStyle}
      className={cn(borderless ? '!border-r-0 !border-l-0 !border-0' : undefined, className)}
      {...props}
    >
      <SidebarHeader className={cn("h-16 bg-[#fdfdfd]", headerBorderless ? undefined : "border-b") }>
        <TeamSwitcher teams={dataWithActiveState.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMainSimple items={dataWithActiveState.navMain} groupLabelStyle={finalSectionTitleStyle} itemTextStyle={finalItemTextStyle} />
        <NavModulos groupLabelStyle={finalSectionTitleStyle} itemTextStyle={finalItemTextStyle} />

        <SidebarGroup>
          <SidebarGroupLabel style={finalSectionTitleStyle}>Integrações</SidebarGroupLabel>
          <SidebarMenu>
            {navigationData.integrations.map((integration) => (
              <SidebarMenuItem key={integration.title}>
                <SidebarMenuButton tooltip={integration.title}>
                  <integration.icon className="w-4 h-4" backgroundColor="transparent" />
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
