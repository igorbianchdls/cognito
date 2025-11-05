"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DollarSign, ShoppingCart, Users, Package, ShoppingBag, Wrench, Megaphone, Briefcase, BookOpen, FileText, Building2, ChevronRight, ChevronDown, Home, Truck, BarChart3 } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function NavModulos() {
  const router = useRouter()
  const pathname = usePathname()

  // Financeiro sempre expandido

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Gestão</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Empresa"
              onClick={() => router.push("/modulos/empresa")}
              isActive={pathname.startsWith("/modulos/empresa")}
            >
              <Building2 />
              <span>Empresa</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Administrativo"
              onClick={() => router.push("/modulos/admnistrativo")}
              isActive={pathname.startsWith("/modulos/admnistrativo")}
            >
              <Building2 />
              <span>Administrativo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Collapsible
            key="financeiro"
            asChild
            defaultOpen={pathname.startsWith("/modulos/financeiro")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Financeiro">
                  <DollarSign />
                  <span>Financeiro</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/financeiro"}>
                      <a href="/modulos/financeiro">
                        <span>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/financeiro/dashboard"}>
                      <a href="/modulos/financeiro/dashboard">
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Contabilidade"
              onClick={() => router.push("/modulos/contabilidade")}
              isActive={pathname.startsWith("/modulos/contabilidade")}
            >
              <BookOpen />
              <span>Contabilidade</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Documentos"
              onClick={() => router.push("/modulos/documentos")}
              isActive={pathname.startsWith("/modulos/documentos")}
            >
              <FileText />
              <span>Documentos</span>
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
      <SidebarGroup>
        <SidebarGroupLabel>Vendas</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Produtos"
              onClick={() => router.push("/modulos/produtos")}
              isActive={pathname.startsWith("/modulos/produtos")}
            >
              <Package />
              <span>Produtos</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Collapsible
            key="vendas"
            asChild
            defaultOpen={pathname.startsWith("/modulos/vendas")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Vendas">
                  <ShoppingCart />
                  <span>Vendas</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/vendas"}>
                      <a href="/modulos/vendas">
                        <span>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/vendas/dashboard"}>
                      <a href="/modulos/vendas/dashboard">
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
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
              tooltip="Serviços"
              onClick={() => router.push("/modulos/servicos")}
              isActive={pathname.startsWith("/modulos/servicos")}
            >
              <Wrench />
              <span>Serviços</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Marketing</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Marketing Orgânico"
              onClick={() => router.push("/modulos/marketing")}
              isActive={pathname.startsWith("/modulos/marketing")}
            >
              <Megaphone />
              <span>Marketing Orgânico</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Tráfego Pago"
              onClick={() => router.push("/modulos/trafego-pago")}
              isActive={pathname.startsWith("/modulos/trafego-pago")}
            >
              <Megaphone />
              <span>Tráfego Pago</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Web Analytics"
              onClick={() => router.push("/modulos/web-analytics")}
              isActive={pathname.startsWith("/modulos/web-analytics")}
            >
              <BarChart3 />
              <span>Web Analytics</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Supply Chain</SidebarGroupLabel>
        <SidebarMenu>
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
              tooltip="Transportes"
              onClick={() => router.push("/modulos/transportes")}
              isActive={pathname.startsWith("/modulos/transportes")}
            >
              <Truck />
              <span>Transportes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
