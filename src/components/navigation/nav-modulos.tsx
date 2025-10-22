"use client"

import { usePathname, useRouter } from "next/navigation"
import { DollarSign, ShoppingCart, Users, Package, ShoppingBag, Wrench, Megaphone, Briefcase } from "lucide-react"

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

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Módulos</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Financeiro"
            onClick={() => router.push("/modulos/financeiro")}
            isActive={pathname.startsWith("/modulos/financeiro")}
          >
            <DollarSign />
            <span>Financeiro</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Vendas"
            onClick={() => router.push("/modulos/vendas")}
            isActive={pathname.startsWith("/modulos/vendas")}
          >
            <ShoppingCart />
            <span>Vendas</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="CRM"
            onClick={() => router.push("/modulos/crm")}
            isActive={pathname.startsWith("/modulos/crm")}
          >
            <Users />
            <span>CRM</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Estoque"
            onClick={() => router.push("/modulos/estoque")}
            isActive={pathname.startsWith("/modulos/estoque")}
          >
            <Package />
            <span>Estoque</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Compras"
            onClick={() => router.push("/modulos/compras")}
            isActive={pathname.startsWith("/modulos/compras")}
          >
            <ShoppingBag />
            <span>Compras</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Serviços"
            onClick={() => router.push("/modulos/servicos")}
            isActive={pathname.startsWith("/modulos/servicos")}
          >
            <Wrench />
            <span>Serviços</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Marketing"
            onClick={() => router.push("/modulos/marketing")}
            isActive={pathname.startsWith("/modulos/marketing")}
          >
            <Megaphone />
            <span>Marketing</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Recursos Humanos"
            onClick={() => router.push("/modulos/recursos-humanos")}
            isActive={pathname.startsWith("/modulos/recursos-humanos")}
          >
            <Briefcase />
            <span>Recursos Humanos</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
