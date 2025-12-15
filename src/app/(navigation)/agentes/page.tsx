"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useStore } from "@nanostores/react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import { Button } from "@/components/ui/button"
import NexusHeader from "@/components/navigation/nexus/NexusHeader"
import NexusPageContainer from "@/components/navigation/nexus/NexusPageContainer"
import PageHeader from "@/components/modulos/PageHeader"
import TabsNav, { type Opcao } from "@/components/modulos/TabsNav"
import { $titulo, $tabs, $layout, moduleUiActions } from "@/stores/modulos/moduleUiStore"
import AgentsGridView from "@/components/navigation/agentes/AgentsGridView"
import { Layout, Users, LayoutGrid, MessageSquare, Landmark, ShoppingCart, BookOpen, Wrench, Briefcase, Package } from "lucide-react"

export default function AgentsIndexPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const layout = useStore($layout)

  useEffect(() => {
    moduleUiActions.setTitulo({ title: 'Agentes', subtitle: 'Selecione um módulo para visualizar agentes' })
    moduleUiActions.setLayout({ contentBg: 'rgb(253,253,253)', contentTopGap: 8, mbTitle: 16, mbTabs: 8 })
    moduleUiActions.setTabs({
      options: [
        { value: 'financeiro', label: 'Financeiro', icon: <Landmark className="text-blue-600" /> },
        { value: 'vendas', label: 'Vendas', icon: <ShoppingCart className="text-emerald-600" /> },
        { value: 'contabilidade', label: 'Contabilidade', icon: <BookOpen className="text-indigo-600" /> },
        { value: 'servicos', label: 'Serviços', icon: <Wrench className="text-amber-600" /> },
        { value: 'crm', label: 'CRM', icon: <Users className="text-fuchsia-600" /> },
        { value: 'produtos', label: 'Produtos', icon: <Package className="text-gray-700" /> },
        { value: 'empresa', label: 'Empresa', icon: <Briefcase className="text-slate-700" /> },
      ],
      selected: 'financeiro',
    })
  }, [])

  const headerRight = (
    <Link href="/agentes/novo">
      <Button size="sm" className="bg-black text-white hover:bg-gray-800">Novo agente</Button>
    </Link>
  )

  return (
    <SidebarProvider defaultOpen={true}>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: layout.contentBg }}>
          <div className="flex flex-col h-full w-full">
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} rightActions={headerRight} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
                <div className="w-full" style={{ marginBottom: layout.mbTitle }}>
                  <PageHeader title={titulo.title} subtitle={titulo.subtitle} />
                </div>
                <div className="w-full" style={{ marginBottom: 0 }}>
                  <TabsNav
                    options={tabs.options as Opcao[]}
                    value={tabs.selected}
                    onValueChange={(v) => moduleUiActions.setTabs({ selected: v })}
                  />
                </div>
                <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
                  <div className="px-4 md:px-6">
                    <AgentsGridView category={tabs.selected as any} />
                  </div>
                </div>
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
