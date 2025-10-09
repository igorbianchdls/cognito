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
  { name: "Categorias", route: "/gestao/financeira/categorias" },
  { name: "Contas Bancárias", route: "/gestao/financeira/contas" },
  { name: "Contas a Pagar", route: "/gestao/financeira/contas-a-pagar" },
  { name: "Contas a Receber", route: "/gestao/financeira/contas-a-receber" },
  { name: "Conciliação Bancária", route: "/gestao/financeira/conciliacao-bancaria" },
  { name: "Movimentos", route: "/gestao/financeira/movimentos" },
  { name: "Contratos", route: "/gestao/financeira/contratos" },
  { name: "Documento Itens", route: "/gestao/financeira/documento-itens" },
  { name: "Documentos", route: "/gestao/financeira/documentos" },
  { name: "Entidades", route: "/gestao/financeira/entidades" },
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
