"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DollarSign, ShoppingCart, Users, Package, ShoppingBag, Wrench, Megaphone, Briefcase, BookOpen, Building2, ChevronRight, ChevronDown, Home, Truck, BarChart3, Settings } from "lucide-react"

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

export function NavErp({ groupLabelStyle, itemTextStyle }: { groupLabelStyle?: React.CSSProperties; itemTextStyle?: React.CSSProperties } = {}) {
  const router = useRouter()
  const pathname = usePathname()

  // Financeiro sempre expandido

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel style={groupLabelStyle}>Gestão ERP</SidebarGroupLabel>
        <SidebarMenu className="gap-0.5">
          {/* Financeiro primeiro */}
          <Collapsible
            key="financeiro"
            asChild
            defaultOpen={pathname.startsWith("/erp/financeiro")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Financeiro">
                  <DollarSign className="w-3 h-3" />
                  <span style={itemTextStyle}>Financeiro</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/financeiro"}>
                      <a href="/erp/financeiro">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/financeiro/relatorio"}>
                      <a href="/erp/financeiro/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          {/* Contabilidade logo abaixo */}
          <Collapsible
            key="contabilidade"
            asChild
            defaultOpen={pathname.startsWith("/erp/contabilidade")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Contabilidade">
                  <BookOpen className="w-3 h-3" />
                  <span style={itemTextStyle}>Contabilidade</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/contabilidade"}>
                      <a href="/erp/contabilidade">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/contabilidade/relatorio"}>
                      <a href="/erp/contabilidade/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          {/* Compras */}
          <Collapsible
            key="compras"
            asChild
            defaultOpen={pathname.startsWith("/erp/compras")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Compras">
                  <ShoppingBag className="w-3 h-3" />
                  <span style={itemTextStyle}>Compras</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/compras"}>
                      <a href="/erp/compras">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/compras/relatorio"}>
                      <a href="/erp/compras/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* Vendas */}
          <Collapsible
            key="vendas"
            asChild
            defaultOpen={pathname.startsWith("/erp/vendas")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Vendas">
                  <ShoppingCart className="w-3 h-3" />
                  <span style={itemTextStyle}>Vendas</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/vendas"}>
                      <a href="/erp/vendas">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/vendas/relatorio"}>
                      <a href="/erp/vendas/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/servicos"}>
                      <a href="/erp/servicos">
                        <span style={itemTextStyle}>Serviços</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* Produtos */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Produtos"
              onClick={() => router.push("/erp/produtos")}
              isActive={pathname.startsWith("/erp/produtos")}
            >
              <Package className="w-3 h-3" />
              <span style={itemTextStyle}>Produtos</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Serviços */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Serviços"
              onClick={() => router.push("/erp/servicos")}
              isActive={pathname.startsWith("/erp/servicos")}
            >
              <Wrench className="w-3 h-3" />
              <span style={itemTextStyle}>Serviços</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Estoque */}
          <Collapsible
            key="estoque"
            asChild
            defaultOpen={pathname.startsWith("/erp/estoque")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Estoque">
                  <Package className="w-3 h-3" />
                  <span style={itemTextStyle}>Estoque</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/estoque"}>
                      <a href="/erp/estoque">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/estoque/relatorio"}>
                      <a href="/erp/estoque/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* Cadastros (antigo Empresa) */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cadastros"
              onClick={() => router.push("/erp/empresa")}
              isActive={pathname.startsWith("/erp/empresa")}
            >
              <Building2 className="w-3 h-3" />
              <span style={itemTextStyle}>Cadastros</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Administrativo - removed globally */}
          {/* Documentos - removed globally */}
        </SidebarMenu>
      </SidebarGroup>
      {/* Outros: une Vendas, Supply Chain, Pós-Vendas e Marketing */}
      <SidebarGroup>
        <SidebarGroupLabel style={groupLabelStyle}>Outros</SidebarGroupLabel>
        <SidebarMenu className="gap-0.5">
          {/* Vendas */}
          <Collapsible
            key="crm"
            asChild
            defaultOpen={pathname.startsWith("/erp/crm")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="CRM">
                  <Users className="w-3 h-3" />
                  <span style={itemTextStyle}>CRM</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/crm"}>
                      <a href="/erp/crm">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/crm/relatorio"}>
                      <a href="/erp/crm/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Comercial"
              onClick={() => router.push("/erp/comercial")}
              isActive={pathname.startsWith("/erp/comercial")}
            >
              <Users className="w-3 h-3" />
              <span style={itemTextStyle}>Comercial</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Supply Chain */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Transportes"
              onClick={() => router.push("/erp/transportes")}
              isActive={pathname.startsWith("/erp/transportes")}
            >
              <Truck className="w-3 h-3" />
              <span style={itemTextStyle}>Transportes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Pós-Vendas */}
          <Collapsible
            key="servicos"
            asChild
            defaultOpen={pathname.startsWith("/erp/servicos") || pathname.startsWith("/erp/ordensdeservicos")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Ordens de Serviço">
                  <Wrench className="w-3 h-3" />
                  <span style={itemTextStyle}>Ordens de Serviço</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/ordensdeservicos" || pathname === "/erp/servicos"}>
                      <a href="/erp/ordensdeservicos">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/ordensdeservicos/relatorio" || pathname === "/erp/servicos/relatorio"}>
                      <a href="/erp/ordensdeservicos/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <Collapsible
            key="producao"
            asChild
            defaultOpen={pathname.startsWith("/erp/producao")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Produção">
                  <Package className="w-3 h-3" />
                  <span style={itemTextStyle}>Produção</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/producao"}>
                      <a href="/erp/producao">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/producao/relatorio"}>
                      <a href="/erp/producao/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <Collapsible
            key="manutencao"
            asChild
            defaultOpen={pathname.startsWith("/erp/manutencao")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Manutenção">
                  <Settings className="w-3 h-3" />
                  <span style={itemTextStyle}>Manutenção</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/manutencao"}>
                      <a href="/erp/manutencao">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* Marketing */}
          <Collapsible
            key="marketing"
            asChild
            defaultOpen={pathname.startsWith("/erp/marketing")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Marketing Orgânico">
                  <Megaphone className="w-3 h-3" />
                  <span style={itemTextStyle}>Marketing Orgânico</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/marketing"}>
                      <a href="/erp/marketing">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/marketing/relatorio"}>
                      <a href="/erp/marketing/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <Collapsible
            key="trafego-pago"
            asChild
            defaultOpen={pathname.startsWith("/erp/trafego-pago")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Tráfego Pago">
                  <Megaphone className="w-3 h-3" />
                  <span style={itemTextStyle}>Tráfego Pago</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/trafego-pago"}>
                      <a href="/erp/trafego-pago">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/trafego-pago/relatorio"}>
                      <a href="/erp/trafego-pago/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <Collapsible
            key="web-analytics"
            asChild
            defaultOpen={pathname.startsWith("/erp/web-analytics")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Web Analytics">
                  <BarChart3 className="w-3 h-3" />
                  <span style={itemTextStyle}>Web Analytics</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/web-analytics"}>
                      <a href="/erp/web-analytics">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/web-analytics/relatorio"}>
                      <a href="/erp/web-analytics/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>

      
    </>
  )
}
