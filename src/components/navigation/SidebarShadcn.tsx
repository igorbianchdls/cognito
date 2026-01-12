"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  LayoutGrid,
  Plug,
  Cpu,
  ChevronsUpDown,
  BarChart3,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

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
      title: "Chat",
      url: "/nexus",
      icon: MessageSquare,
      isActive: false, // Will be set dynamically
    },
    {
      title: "Dashboards",
      url: "/dashboards",
      icon: BarChart3,
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

type HeaderVariant = 'default' | 'compact'

function SidebarHeaderCompact({
  teams,
}: {
  teams: { name: string; logo: React.ElementType; plan: string }[]
}) {
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  if (!activeTeam) return null

  const Logo = activeTeam.logo || Cpu

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center h-10 gap-2 px-2 rounded-md text-gray-800 hover:bg-gray-50 focus-visible:outline-none"
        >
          <Logo className="w-4 h-4 text-gray-900" />
          <span className="text-gray-300">/</span>
          <span className="inline-flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-purple-500" />
            <span className="text-sm font-medium leading-none">{activeTeam.name}</span>
            <Badge variant="secondary" className="text-xs px-2 py-0 h-5 rounded-md bg-gray-100 text-gray-700">
              {activeTeam.plan}
            </Badge>
            <ChevronsUpDown className="w-4 h-4 text-gray-500" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="min-w-56">
        {teams.map((team, index) => (
          <DropdownMenuItem key={team.name} className="gap-2 p-2" onClick={() => setActiveTeam(team)}>
            <div className="flex size-6 items-center justify-center rounded-md border">
              <team.logo className="size-3.5 shrink-0" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm">{team.name}</span>
              <span className="text-xs text-gray-500">{team.plan}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SidebarShadcn({ bgColor, textColor, itemTextColor, itemTextStyle, sectionTitleStyle, style, borderless, headerBorderless, className, headerVariant = 'compact', ...props }: React.ComponentProps<typeof Sidebar> & { bgColor?: string; textColor?: string; itemTextColor?: string; itemTextStyle?: React.CSSProperties; sectionTitleStyle?: React.CSSProperties; borderless?: boolean; headerBorderless?: boolean; className?: string; headerVariant?: HeaderVariant }) {
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
  const finalBgColor = bgColor ?? '#f9fafb'
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
      <SidebarHeader className={cn("h-16 bg-gray-50", headerBorderless ? undefined : "border-b") }>
        {headerVariant === 'compact' ? (
          <div className="h-full flex items-center px-2">
            <SidebarHeaderCompact teams={dataWithActiveState.teams} />
          </div>
        ) : (
          <TeamSwitcher teams={dataWithActiveState.teams} />
        )}
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
