"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  IconChartBar,
  IconFileText,
  IconGridDots,
  IconHistory,
  IconMessageCircle,
  IconPresentation,
  IconPlugConnected,
} from "@tabler/icons-react"

import { NavMainSimple } from "@/components/navigation/nav-main-simple"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const BrandIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconGridDots stroke={1.75} {...props} />
const IntegrationsIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconPlugConnected stroke={1.75} {...props} />
const DashboardsIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconChartBar stroke={1.75} {...props} />
const SlidesIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconPresentation stroke={1.75} {...props} />
const ReportsIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconFileText stroke={1.75} {...props} />
const ChatIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconMessageCircle stroke={1.75} {...props} />
const HistoryIcon = (props: { className?: string; style?: React.CSSProperties }) => <IconHistory stroke={1.75} {...props} />

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
      title: "Chat",
      icon: ChatIcon,
    },
    {
      title: "Histórico",
      icon: HistoryIcon,
    },
    {
      title: "Integrações",
      url: "/integracoes",
      icon: IntegrationsIcon,
    },
    {
      title: "Dashboards",
      url: "/artifacts/dashboards",
      icon: DashboardsIcon,
    },
    {
      title: "Slides",
      url: "/artifacts/slides",
      icon: SlidesIcon,
    },
    {
      title: "Reports",
      url: "/artifacts/reports",
      icon: ReportsIcon,
    },
  ],
}

import { cn } from "@/lib/utils"

export function SidebarShadcn({ bgColor, textColor, itemTextColor, itemTextStyle, sectionTitleStyle, style, borderless, headerBorderless, className, headerVariant: _headerVariant = 'compact', showHeaderTrigger: _showHeaderTrigger = true, iconSizePx = 24, ...props }: React.ComponentProps<typeof Sidebar> & { bgColor?: string; textColor?: string; itemTextColor?: string; itemTextStyle?: React.CSSProperties; sectionTitleStyle?: React.CSSProperties; borderless?: boolean; headerBorderless?: boolean; className?: string; headerVariant?: 'default' | 'compact'; showHeaderTrigger?: boolean; iconSizePx?: number }) {
  const pathname = usePathname()
  void _headerVariant
  void _showHeaderTrigger

  // Static defaults only (avoid visual flash on hydration)

  // Update active state based on current path
  const navMainWithActiveState = navigationData.navMain.map(item => ({
    ...item,
    isActive: pathname === item.url
  }))

  const dataWithActiveState = {
    ...navigationData,
    navMain: navMainWithActiveState,
  }

  // Apply default values consistently (no localStorage overrides)
  const finalBgColor = bgColor ?? '#FAFAFA'
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
  inlineStyle['--sidebar-width'] = 'fit-content'
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
          <span className="text-[18px] font-semibold leading-none tracking-normal text-[#181818] group-data-[collapsible=icon]:hidden" style={{ fontFamily: fontVar('Geist') }}>Otto</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="ui-text">
        <NavMainSimple items={dataWithActiveState.navMain} groupLabelStyle={finalSectionTitleStyle} itemTextStyle={finalItemTextStyle} iconSizePx={finalIconSizePx} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={dataWithActiveState.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
