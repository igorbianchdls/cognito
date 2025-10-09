"use client"

import { ChevronRight, DollarSign } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
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
  { name: "Categorias", tableName: "gestaofinanceira.categorias" },
  { name: "Contas Bancárias", tableName: "gestaofinanceira.contas" },
  { name: "Contas a Pagar", tableName: "gestaofinanceira.contas_a_pagar" },
  { name: "Contas a Receber", tableName: "gestaofinanceira.contas_a_receber" },
  { name: "Transações", tableName: "gestaofinanceira.transacoes" },
]

export function NavGestao() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTable = searchParams.get("table")

  const [isFinanceiraOpen, setIsFinanceiraOpen] = useState(true)

  const handleTableClick = (tableName: string) => {
    router.push(`/gestao?table=${tableName}`)
  }

  const isActive = pathname === "/gestao"

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
                  <SidebarMenuSubItem key={table.tableName}>
                    <SidebarMenuSubButton
                      onClick={() => handleTableClick(table.tableName)}
                      isActive={isActive && currentTable === table.tableName}
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
