"use client"

import { ChevronRight, ShoppingBag, Warehouse, Truck } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// Tabelas do schema gestaocompras
const comprasTables = [
  { name: "Fornecedores", route: "/supply-chain/compras/fornecedores" },
  { name: "Pedidos de Compra", route: "/supply-chain/compras/pedidos-compra" },
  { name: "Itens de Pedido de Compra", route: "/supply-chain/compras/pedido-compra-itens" },
]

// Tabelas do schema gestaoestoque
const estoqueTables = [
  { name: "Centros de Distribuição", route: "/supply-chain/estoque/centros-distribuicao" },
  { name: "Estoque por Canal", route: "/supply-chain/estoque/estoque-canal" },
  { name: "Integrações de Canais", route: "/supply-chain/estoque/integracoes-canais" },
  { name: "Movimentações de Estoque", route: "/supply-chain/estoque/movimentacoes-estoque" },
  { name: "Preços por Canal", route: "/supply-chain/estoque/precos-canais" },
]

// Tabelas do schema gestaologistica
const logisticaTables = [
  { name: "Envios", route: "/supply-chain/logistica/envios" },
  { name: "Eventos de Rastreio", route: "/supply-chain/logistica/eventos-rastreio" },
  { name: "Logística Reversa", route: "/supply-chain/logistica/logistica-reversa" },
  { name: "Pacotes", route: "/supply-chain/logistica/pacotes" },
  { name: "Transportadoras", route: "/supply-chain/logistica/transportadoras" },
]

export function NavSupplyChain() {
  const router = useRouter()
  const pathname = usePathname()
  const [isComprasOpen, setIsComprasOpen] = useState(false)
  const [isEstoqueOpen, setIsEstoqueOpen] = useState(false)
  const [isLogisticaOpen, setIsLogisticaOpen] = useState(false)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Supply Chain</SidebarGroupLabel>
      <SidebarMenu>
        {/* Compras */}
        <Collapsible
          open={isComprasOpen}
          onOpenChange={setIsComprasOpen}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Compras">
                <ShoppingBag />
                <span>Compras</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {comprasTables.map((table) => (
                  <SidebarMenuSubItem key={table.route}>
                    <SidebarMenuSubButton
                      onClick={() => router.push(table.route)}
                      isActive={pathname === table.route}
                    >
                      <span>{table.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

        {/* Estoque */}
        <Collapsible
          open={isEstoqueOpen}
          onOpenChange={setIsEstoqueOpen}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Estoque">
                <Warehouse />
                <span>Estoque</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {estoqueTables.map((table) => (
                  <SidebarMenuSubItem key={table.route}>
                    <SidebarMenuSubButton
                      onClick={() => router.push(table.route)}
                      isActive={pathname === table.route}
                    >
                      <span>{table.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

        {/* Logística */}
        <Collapsible
          open={isLogisticaOpen}
          onOpenChange={setIsLogisticaOpen}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Logística">
                <Truck />
                <span>Logística</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {logisticaTables.map((table) => (
                  <SidebarMenuSubItem key={table.route}>
                    <SidebarMenuSubButton
                      onClick={() => router.push(table.route)}
                      isActive={pathname === table.route}
                    >
                      <span>{table.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  )
}
