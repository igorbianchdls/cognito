"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  MessageSquare,
  LayoutGrid,
  Users,
  Sheet,
  Database,
  User
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"

// Navigation data adapted from the current sidebar
const navigationData = {
  user: {
    name: "Usuário",
    avatar: "U",
  },
  navItems: [
    {
      title: "Nexus",
      url: "/nexus",
      icon: MessageSquare,
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
  const router = useRouter()
  const pathname = usePathname()

  const handleNavigation = (url: string) => {
    router.push(url)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Logo Section */}
        <div className="flex h-14 items-center justify-center">
          <div className="w-7 h-7 bg-[#1a73e8] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {navigationData.navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => handleNavigation(item.url)}
                isActive={pathname === item.url}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        {/* User Profile */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Perfil"
              onClick={() => console.log('Perfil')}
            >
              <div className="w-4 h-4 bg-[#1a73e8] rounded-full flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span>Perfil</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}