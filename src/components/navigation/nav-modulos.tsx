"use client"

import { usePathname, useRouter } from "next/navigation"
import { DollarSign } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavModulos() {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = pathname.startsWith("/modulos/financeiro")

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Módulos</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Financeiro"
            onClick={() => router.push("/modulos/financeiro")}
            isActive={isActive}
          >
            <DollarSign />
            <span>Financeiro</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

