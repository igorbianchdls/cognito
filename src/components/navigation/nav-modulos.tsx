"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { DollarSign, ShoppingCart, Users, Package, ShoppingBag, Wrench, Megaphone, Briefcase, BookOpen, FileText, Building2, ChevronRight, ChevronDown, Home, Truck, BarChart3, Settings } from "lucide-react"

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

export function NavModulos({ groupLabelStyle, itemTextStyle }: { groupLabelStyle?: React.CSSProperties; itemTextStyle?: React.CSSProperties } = {}) {
  const router = useRouter()
  const pathname = usePathname()

  // Financeiro sempre expandido

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel style={groupLabelStyle}>Gestão</SidebarGroupLabel>
        <SidebarMenu>
          {/* Financeiro primeiro */}
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
                  <span style={itemTextStyle}>Financeiro</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/financeiro"}>
                      <a href="/modulos/financeiro">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/financeiro/relatorio"}>
                      <a href="/modulos/financeiro/relatorio">
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
            defaultOpen={pathname.startsWith("/modulos/contabilidade")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Contabilidade">
                  <BookOpen />
                  <span style={itemTextStyle}>Contabilidade</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/contabilidade"}>
                      <a href="/modulos/contabilidade">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/contabilidade/relatorio"}>
                      <a href="/modulos/contabilidade/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          {/* Recursos Humanos abaixo de Contabilidade */}
          <Collapsible
            key="recursos-humanos"
            asChild
            defaultOpen={pathname.startsWith("/modulos/recursos-humanos")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Recursos Humanos">
                  <Briefcase />
                  <span style={itemTextStyle}>Recursos Humanos</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/recursos-humanos"}>
                      <a href="/modulos/recursos-humanos">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/recursos-humanos/relatorio"}>
                      <a href="/modulos/recursos-humanos/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* Fiscal */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Fiscal"
              onClick={() => router.push("/modulos/fiscal")}
              isActive={pathname.startsWith("/modulos/fiscal")}
            >
              <FileText />
              <span style={itemTextStyle}>Fiscal</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Demais itens */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Empresa"
              onClick={() => router.push("/modulos/empresa")}
              isActive={pathname.startsWith("/modulos/empresa")}
            >
              <Building2 />
              <span style={itemTextStyle}>Empresa</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Administrativo"
              onClick={() => router.push("/modulos/admnistrativo")}
              isActive={pathname.startsWith("/modulos/admnistrativo")}
            >
              <Building2 />
              <span style={itemTextStyle}>Administrativo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Documentos"
              onClick={() => router.push("/modulos/documentos")}
              isActive={pathname.startsWith("/modulos/documentos")}
            >
              <FileText />
              <span style={itemTextStyle}>Documentos</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel style={groupLabelStyle}>Vendas</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Produtos"
              onClick={() => router.push("/modulos/produtos")}
              isActive={pathname.startsWith("/modulos/produtos")}
            >
              <Package />
              <span style={itemTextStyle}>Produtos</span>
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
                  <span style={itemTextStyle}>Vendas</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/vendas"}>
                      <a href="/modulos/vendas">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/vendas/relatorio"}>
                      <a href="/modulos/vendas/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <Collapsible
            key="crm"
            asChild
            defaultOpen={pathname.startsWith("/modulos/crm")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="CRM">
                  <Users />
                  <span style={itemTextStyle}>CRM</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/crm"}>
                      <a href="/modulos/crm">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/crm/relatorio"}>
                      <a href="/modulos/crm/relatorio">
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
              onClick={() => router.push("/modulos/comercial")}
              isActive={pathname.startsWith("/modulos/comercial")}
            >
              <Users />
              <span style={itemTextStyle}>Comercial</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel style={groupLabelStyle}>Pós-Vendas</SidebarGroupLabel>
        <SidebarMenu>
          <Collapsible
            key="servicos"
            asChild
            defaultOpen={pathname.startsWith("/modulos/servicos")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Serviços">
                  <Wrench />
                  <span style={itemTextStyle}>Serviços</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/servicos"}>
                      <a href="/modulos/servicos">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/servicos/relatorio"}>
                      <a href="/modulos/servicos/relatorio">
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
            defaultOpen={pathname.startsWith("/modulos/manutencao")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Manutenção">
                  <Settings />
                  <span style={itemTextStyle}>Manutenção</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/manutencao"}>
                      <a href="/modulos/manutencao">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel style={groupLabelStyle}>Marketing</SidebarGroupLabel>
        <SidebarMenu>
          <Collapsible
            key="marketing"
            asChild
            defaultOpen={pathname.startsWith("/modulos/marketing")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Marketing Orgânico">
                  <Megaphone />
                  <span style={itemTextStyle}>Marketing Orgânico</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/marketing"}>
                      <a href="/modulos/marketing">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/marketing/relatorio"}>
                      <a href="/modulos/marketing/relatorio">
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
            defaultOpen={pathname.startsWith("/modulos/trafego-pago")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Tráfego Pago">
                  <Megaphone />
                  <span style={itemTextStyle}>Tráfego Pago</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/trafego-pago"}>
                      <a href="/modulos/trafego-pago">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/trafego-pago/relatorio"}>
                      <a href="/modulos/trafego-pago/relatorio">
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
            defaultOpen={pathname.startsWith("/modulos/web-analytics")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Web Analytics">
                  <BarChart3 />
                  <span style={itemTextStyle}>Web Analytics</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/web-analytics"}>
                      <a href="/modulos/web-analytics">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/web-analytics/relatorio"}>
                      <a href="/modulos/web-analytics/relatorio">
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

      <SidebarGroup>
        <SidebarGroupLabel style={groupLabelStyle}>Supply Chain</SidebarGroupLabel>
        <SidebarMenu>
          <Collapsible
            key="estoque"
            asChild
            defaultOpen={pathname.startsWith("/modulos/estoque")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Estoque">
                  <Package />
                  <span style={itemTextStyle}>Estoque</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/estoque"}>
                      <a href="/modulos/estoque">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/estoque/relatorio"}>
                      <a href="/modulos/estoque/relatorio">
                        <span style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          {/* Compras dentro de Supply Chain */}
          <Collapsible
            key="compras"
            asChild
            defaultOpen={pathname.startsWith("/modulos/compras")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Compras">
                  <ShoppingBag />
                  <span style={itemTextStyle}>Compras</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/compras"}>
                      <a href="/modulos/compras">
                        <span style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/modulos/compras/relatorio"}>
                      <a href="/modulos/compras/relatorio">
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
              tooltip="Transportes"
              onClick={() => router.push("/modulos/transportes")}
              isActive={pathname.startsWith("/modulos/transportes")}
            >
              <Truck />
              <span style={itemTextStyle}>Transportes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
