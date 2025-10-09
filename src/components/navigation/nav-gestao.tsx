"use client"

import { ChevronRight, DollarSign } from "lucide-react"
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

// Tabelas do schema gestaofinanceira
const financeiraTables = [
  { name: "Categorias", route: "/gestao/categorias" },
  { name: "Contas Bancárias", route: "/gestao/contas" },
  { name: "Contas a Pagar", route: "/gestao/contas-a-pagar" },
  { name: "Contas a Receber", route: "/gestao/contas-a-receber" },
  { name: "Conciliação Bancária", route: "/gestao/conciliacao-bancaria" },
  { name: "Movimentos", route: "/gestao/movimentos" },
  { name: "Contratos", route: "/gestao/contratos" },
  { name: "Documento Itens", route: "/gestao/documento-itens" },
  { name: "Documentos", route: "/gestao/documentos" },
  { name: "Entidades", route: "/gestao/entidades" },
]

export function NavGestao() {
  const router = useRouter()
  const pathname = usePathname()
  const [isFinanceiraOpen, setIsFinanceiraOpen] = useState(true)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Gestão</SidebarGroupLabel>
      <SidebarMenu>
        <Collapsible
          open={isFinanceiraOpen}
          onOpenChange={setIsFinanceiraOpen}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Financeira">
                <DollarSign />
                <span>Financeira</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {financeiraTables.map((table) => (
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
