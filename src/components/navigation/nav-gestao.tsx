"use client"

import { ChevronRight, DollarSign, FolderKanban, ShoppingCart, Users } from "lucide-react"
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

// Tabelas do schema gestaodeprojetos
const projetosTables = [
  { name: "Projetos", route: "/gestao/projetos/projects" },
  { name: "Tipos de Status", route: "/gestao/projetos/status-types" },
  { name: "Tarefas", route: "/gestao/projetos/tasks" },
]

// Tabelas do schema vendasecommerce
const vendasTables = [
  { name: "Canais de Venda", route: "/gestao/vendas/channels" },
  { name: "Cupons", route: "/gestao/vendas/coupons" },
  { name: "Clientes", route: "/gestao/vendas/customers" },
  { name: "Pontos de Fidelidade", route: "/gestao/vendas/loyalty-points" },
  { name: "Recompensas", route: "/gestao/vendas/loyalty-rewards" },
  { name: "Itens de Pedido", route: "/gestao/vendas/order-items" },
  { name: "Pedidos", route: "/gestao/vendas/orders" },
  { name: "Pagamentos", route: "/gestao/vendas/payments" },
  { name: "Produtos", route: "/gestao/vendas/products" },
  { name: "Devoluções", route: "/gestao/vendas/returns" },
]

// Tabelas do schema gestaofuncionarios
const funcionariosTables = [
  { name: "Funcionários", route: "/gestao/funcionarios/funcionarios" },
  { name: "Departamentos", route: "/gestao/funcionarios/departamentos" },
  { name: "Cargos", route: "/gestao/funcionarios/cargos" },
  { name: "Histórico de Cargos", route: "/gestao/funcionarios/historico-cargos" },
  { name: "Ponto", route: "/gestao/funcionarios/ponto" },
  { name: "Ausências", route: "/gestao/funcionarios/ausencias" },
  { name: "Folha de Pagamento", route: "/gestao/funcionarios/folha-pagamento" },
  { name: "Benefícios", route: "/gestao/funcionarios/beneficios" },
  { name: "Funcionários Benefícios", route: "/gestao/funcionarios/funcionarios-beneficios" },
  { name: "Treinamentos", route: "/gestao/funcionarios/treinamentos" },
  { name: "Funcionários Treinamentos", route: "/gestao/funcionarios/funcionarios-treinamentos" },
  { name: "Avaliações de Desempenho", route: "/gestao/funcionarios/avaliacoes-desempenho" },
  { name: "Desligamentos", route: "/gestao/funcionarios/desligamentos" },
]

export function NavGestao() {
  const router = useRouter()
  const pathname = usePathname()
  const [isFinanceiraOpen, setIsFinanceiraOpen] = useState(true)
  const [isProjetosOpen, setIsProjetosOpen] = useState(true)
  const [isVendasOpen, setIsVendasOpen] = useState(true)
  const [isFuncionariosOpen, setIsFuncionariosOpen] = useState(true)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Gestão</SidebarGroupLabel>
      <SidebarMenu>
        {/* Financeira */}
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

        {/* Projetos */}
        <Collapsible
          open={isProjetosOpen}
          onOpenChange={setIsProjetosOpen}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Projetos">
                <FolderKanban />
                <span>Projetos</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {projetosTables.map((table) => (
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

        {/* Vendas */}
        <Collapsible
          open={isVendasOpen}
          onOpenChange={setIsVendasOpen}
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
                {vendasTables.map((table) => (
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

        {/* Funcionários */}
        <Collapsible
          open={isFuncionariosOpen}
          onOpenChange={setIsFuncionariosOpen}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Funcionários">
                <Users />
                <span>Funcionários</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {funcionariosTables.map((table) => (
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
