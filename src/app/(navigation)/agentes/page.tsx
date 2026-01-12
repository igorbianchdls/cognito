"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useStore } from "@nanostores/react"
import { Button } from "@/components/ui/button"
import NexusShell from "@/components/navigation/nexus/NexusShell"
import PageHeader from "@/components/modulos/PageHeader"
import TabsNav, { type Opcao } from "@/components/modulos/TabsNav"
import { $titulo, $tabs, $layout, moduleUiActions } from "@/stores/modulos/moduleUiStore"
import AgentsGridView from "@/components/navigation/agentes/AgentsGridView"
import { Layout, Users, LayoutGrid, MessageSquare, Landmark, ShoppingCart, BookOpen, Wrench, Briefcase, Package } from "lucide-react"

export default function AgentsIndexPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const layout = useStore($layout)

  const fontVar = (name?: string) => {
    if (!name) return undefined
    if (name === 'Inter') return 'var(--font-inter)'
    if (name === 'Geist') return 'var(--font-geist-sans)'
    return name
  }

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
    <NexusShell outerBg={layout.contentBg}>
      <div className="w-full" style={{ marginBottom: layout.mbTitle }}>
        <PageHeader title={titulo.title} subtitle={titulo.subtitle} />
      </div>
      <div className="w-full" style={{ marginBottom: 0 }}>
        <TabsNav
          options={tabs.options as Opcao[]}
          value={tabs.selected}
          onValueChange={(v) => moduleUiActions.setTabs({ selected: v })}
          fontFamily={fontVar(tabs.fontFamily)}
          fontSize={tabs.fontSize}
          fontWeight={tabs.fontWeight}
          color={tabs.color}
          letterSpacing={tabs.letterSpacing}
          iconSize={tabs.iconSize}
          labelOffsetY={tabs.labelOffsetY}
          startOffset={tabs.leftOffset}
          activeColor={tabs.activeColor}
          activeFontWeight={tabs.activeFontWeight}
          activeBorderColor={tabs.activeBorderColor}
          className="px-0 md:px-0"
        />
      </div>
      <div style={{ paddingTop: (layout.contentTopGap || 0) + (layout.mbTabs || 0) }}>
        <div className="px-4 md:px-6">
          <AgentsGridView category={tabs.selected as any} />
        </div>
      </div>
    </NexusShell>
  )
}
