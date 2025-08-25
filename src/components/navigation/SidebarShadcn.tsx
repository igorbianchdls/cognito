"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  LayoutGrid,
  Users,
  Sheet,
  Database,
  GalleryVerticalEnd,
} from "lucide-react"

import MetaIcon from "@/components/icons/MetaIcon"
import GoogleAdsIcon from "@/components/icons/GoogleAdsIcon"
import GoogleAnalyticsIcon from "@/components/icons/GoogleAnalyticsIcon"
import ShopifyIcon from "@/components/icons/ShopifyIcon"

import { NavMainSimple } from "@/components/navigation/nav-main-simple"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
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
      title: "Apps", 
      url: "/apps",
      icon: LayoutGrid,
    },
    {
      title: "Organograma",
      url: "/orgchart",
      icon: Users,
    },
    {
      title: "Planilhas",
      url: "/sheets",
      icon: Sheet,
    },
    {
      title: "BigQuery",
      url: "/bigquery-test",
      icon: Database,
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
  ],
}

export function SidebarShadcn({ ...props }: React.ComponentProps<typeof Sidebar>) {
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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={dataWithActiveState.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMainSimple items={dataWithActiveState.navMain} />
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
      <SidebarRail />
    </Sidebar>
  )
}