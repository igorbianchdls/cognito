"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  IconBook,
  IconBuildingStore,
  IconChevronRight,
  IconCoin,
  IconPackage,
  IconShoppingBag,
  IconShoppingCart,
  IconTool,
  IconUsers,
} from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
                  <IconCoin className="w-3 h-3" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Financeiro</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" stroke={1.75} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/financeiro"}>
                      <a href="/erp/financeiro">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/financeiro/relatorio"}>
                      <a href="/erp/financeiro/relatorio">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Relatório</span>
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
                  <IconBook className="w-3 h-3" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Contabilidade</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" stroke={1.75} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/contabilidade"}>
                      <a href="/erp/contabilidade">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/contabilidade/relatorio"}>
                      <a href="/erp/contabilidade/relatorio">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Relatório</span>
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
                  <IconShoppingBag className="w-3 h-3" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Compras</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" stroke={1.75} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/compras"}>
                      <a href="/erp/compras">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/compras/relatorio"}>
                      <a href="/erp/compras/relatorio">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Relatório</span>
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
                  <IconShoppingCart className="w-3 h-3" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Vendas</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" stroke={1.75} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/vendas"}>
                      <a href="/erp/vendas">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/vendas/relatorio"}>
                      <a href="/erp/vendas/relatorio">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/servicos"}>
                      <a href="/erp/servicos">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Serviços</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

          {/* Comercial */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Comercial"
              onClick={() => router.push("/erp/comercial")}
              isActive={pathname.startsWith("/erp/comercial")}
            >
              <IconUsers className="w-3 h-3" stroke={1.75} />
              <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Comercial</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* CRM */}
          <Collapsible
            key="crm"
            asChild
            defaultOpen={pathname.startsWith("/erp/crm")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="CRM">
                  <IconUsers className="w-3 h-3" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>CRM</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" stroke={1.75} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/crm"}>
                      <a href="/erp/crm">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/crm/relatorio"}>
                      <a href="/erp/crm/relatorio">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Relatório</span>
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
              <IconPackage className="w-3 h-3" stroke={1.75} />
              <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Produtos</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Serviços */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Serviços"
              onClick={() => router.push("/erp/servicos")}
              isActive={pathname.startsWith("/erp/servicos")}
            >
              <IconTool className="w-3 h-3" stroke={1.75} />
              <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Serviços</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Ordens de Serviço (Pós-Vendas) */}
          <Collapsible
            key="ordensdeservicos"
            asChild
            defaultOpen={pathname.startsWith("/erp/ordensdeservicos")}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip="Ordens de Serviço">
                  <IconTool className="w-3 h-3" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Ordens de Serviço</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" stroke={1.75} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/ordensdeservicos"}>
                      <a href="/erp/ordensdeservicos">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/ordensdeservicos/relatorio"}>
                      <a href="/erp/ordensdeservicos/relatorio">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Relatório</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>

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
                  <IconPackage className="w-3 h-3" stroke={1.75} />
                  <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Estoque</span>
                  <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" stroke={1.75} />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/estoque"}>
                      <a href="/erp/estoque">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Gestão</span>
                      </a>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={pathname === "/erp/estoque/relatorio"}>
                      <a href="/erp/estoque/relatorio">
                        <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Relatório</span>
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
              <IconBuildingStore className="w-3 h-3" stroke={1.75} />
              <span className="group-data-[collapsible=icon]:hidden" style={itemTextStyle}>Cadastros</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Administrativo - removed globally */}
          {/* Documentos - removed globally */}
        </SidebarMenu>
      </SidebarGroup>
    </>
  )
}
