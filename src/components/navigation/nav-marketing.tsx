"use client"

import { ChevronRight, Share2, TrendingUp, BarChart3 } from "lucide-react"
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

// Tabelas do schema marketing_organico
const organicoTables = [
  { name: "Contas Sociais", route: "/marketing/organico/contas-sociais" },
  { name: "Publicações", route: "/marketing/organico/publicacoes" },
  { name: "Métricas de Publicações", route: "/marketing/organico/metricas-publicacoes" },
  { name: "Resumos de Conta", route: "/marketing/organico/resumos-conta" },
]

// Tabelas do schema trafego_pago
const trafegoPagoTables = [
  { name: "Contas de Ads", route: "/marketing/trafego-pago/contas-ads" },
  { name: "Campanhas", route: "/marketing/trafego-pago/campanhas" },
  { name: "Grupos de Anúncios", route: "/marketing/trafego-pago/grupos-de-anuncios" },
  { name: "Criação de Anúncios", route: "/marketing/trafego-pago/anuncios-criacao" },
  { name: "Anúncios Colaboradores", route: "/marketing/trafego-pago/anuncios-colaboradores" },
  { name: "Anúncios Publicados", route: "/marketing/trafego-pago/anuncios-publicados" },
  { name: "Métricas de Anúncios", route: "/marketing/trafego-pago/metricas-anuncios" },
  { name: "Resumos de Campanhas", route: "/marketing/trafego-pago/resumos-campanhas" },
]

// Tabelas do schema gestaoanalytics
const analyticsTables = [
  { name: "Agregado Diário por Fonte", route: "/marketing/analytics/agregado-diario-por-fonte" },
  { name: "Agregado Diário por Página", route: "/marketing/analytics/agregado-diario-por-pagina" },
  { name: "Consentimentos de Visitante", route: "/marketing/analytics/consentimentos-visitante" },
  { name: "Eventos", route: "/marketing/analytics/eventos" },
  { name: "Itens de Transação", route: "/marketing/analytics/itens-transacao" },
  { name: "Metas", route: "/marketing/analytics/metas" },
  { name: "Propriedades", route: "/marketing/analytics/propriedades" },
  { name: "Propriedades de Visitante", route: "/marketing/analytics/propriedades-visitante" },
  { name: "Sessões", route: "/marketing/analytics/sessoes" },
  { name: "Transações", route: "/marketing/analytics/transacoes" },
  { name: "Visitantes", route: "/marketing/analytics/visitantes" },
]

export function NavMarketing() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOrganicoOpen, setIsOrganicoOpen] = useState(false)
  const [isTrafegoPagoOpen, setIsTrafegoPagoOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Marketing</SidebarGroupLabel>
      <SidebarMenu>
        {/* Orgânico */}
        <Collapsible
          open={isOrganicoOpen}
          onOpenChange={setIsOrganicoOpen}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Orgânico">
                <Share2 />
                <span>Orgânico</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {organicoTables.map((table) => (
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

        {/* Tráfego Pago */}
        <Collapsible
          open={isTrafegoPagoOpen}
          onOpenChange={setIsTrafegoPagoOpen}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Tráfego Pago">
                <TrendingUp />
                <span>Tráfego Pago</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {trafegoPagoTables.map((table) => (
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

        {/* Analytics */}
        <Collapsible
          open={isAnalyticsOpen}
          onOpenChange={setIsAnalyticsOpen}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Analytics">
                <BarChart3 />
                <span>Analytics</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {analyticsTables.map((table) => (
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
