"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  LayoutGrid,
  GalleryVerticalEnd,
  Plug,
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
      logo: GalleryVerticalEnd,
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

export function SidebarShadcn({ bgColor, textColor, itemTextColor, style, ...props }: React.ComponentProps<typeof Sidebar> & { bgColor?: string; textColor?: string; itemTextColor?: string }) {
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

  // Inline CSS variable overrides for sidebar theme
  const inlineStyle = {
    ...(style || {}),
    ...(bgColor ? ({ ["--sidebar"]: bgColor } as React.CSSProperties) : {}),
    ...(textColor ? ({ ["--sidebar-foreground"]: textColor } as React.CSSProperties) : {}),
    ...(itemTextColor ? ({ ["--sidebar-accent-foreground"]: itemTextColor } as React.CSSProperties) : {}),
  } as React.CSSProperties

  return (
    <Sidebar collapsible="icon" style={inlineStyle} {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={dataWithActiveState.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMainSimple items={dataWithActiveState.navMain} />
        <NavModulos />
        
        <SidebarGroup>
          <SidebarGroupLabel>Integrações</SidebarGroupLabel>
          <SidebarMenu>
            {navigationData.integrations.map((integration) => (
              <SidebarMenuItem key={integration.title}>
                <SidebarMenuButton tooltip={integration.title}>
                  <integration.icon className="w-4 h-4" backgroundColor="transparent" />
                  <span>{integration.title}</span>
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
