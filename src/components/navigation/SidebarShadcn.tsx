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

import { NavMainSimple } from "@/components/navigation/nav-main-simple"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
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
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={dataWithActiveState.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}