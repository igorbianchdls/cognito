"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { workflowsMock } from "@/data/workflows.mock"
import WorkflowList from "@/components/workflows/WorkflowList"
import { WorkflowFilters, type FiltersState } from "@/components/workflows/WorkflowFilters"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import PageHeader from "@/components/modulos/PageHeader"
import TabsNav, { type Opcao } from "@/components/modulos/TabsNav"
import { useStore } from "@nanostores/react"
import { $titulo, $tabs, $layout, moduleUiActions } from "@/stores/modulos/moduleUiStore"

export default function WorkflowsPage() {
  const titulo = useStore($titulo)
  const tabs = useStore($tabs)
  const layout = useStore($layout)
  const [filters, setFilters] = useState<FiltersState>({ q: '', status: 'todos', sort: 'recentes' })
  const [activeCategory, setActiveCategory] = useState<'todos' | 'ativos' | 'rascunhos' | 'pausados'>('todos')

  useEffect(() => {
    moduleUiActions.setTitulo({ title: 'Workflows', subtitle: 'Gerencie e crie automações visuais', titleFontFamily: 'var(--font-crimson-text)' })
    moduleUiActions.setTabs({
      options: [
        { value: 'todos', label: 'Todos' },
        { value: 'ativos', label: 'Ativos' },
        { value: 'rascunhos', label: 'Rascunhos' },
        { value: 'pausados', label: 'Pausados' },
      ],
      selected: 'todos',
    })
  }, [])
  const filteredData = useMemo(() => {
    let arr = [...workflowsMock]
    if (activeCategory !== 'todos') {
      arr = arr.filter(w => (w.category || 'outros') === activeCategory)
    }
    if (filters.q) {
      const term = filters.q.toLowerCase()
      arr = arr.filter(w =>
        w.name.toLowerCase().includes(term) ||
        (w.description?.toLowerCase() || '').includes(term) ||
        (w.tags || []).some(t => t.toLowerCase().includes(term))
      )
    }
    if (filters.status !== 'todos') {
      arr = arr.filter(w => w.status === filters.status)
    }
    if (filters.sort === 'recentes') {
      arr.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    } else if (filters.sort === 'nome') {
      arr.sort((a, b) => a.name.localeCompare(b.name))
    } else if (filters.sort === 'execucoes') {
      arr.sort((a, b) => (b.runs || 0) - (a.runs || 0))
    }
    return arr
  }, [activeCategory, filters])
  const title = useMemo(() => `Workflows (${filteredData.length})`, [filteredData.length])

  // Sincroniza seleção do store com estado local de categoria
  useEffect(() => {
    const sel = tabs.selected as 'todos' | 'ativos' | 'rascunhos' | 'pausados'
    if (sel && sel !== activeCategory) setActiveCategory(sel)
  }, [tabs.selected])

  const handleOpen = (id: string) => {
    console.log('Abrir workflow', id)
  }

  const handleCreate = () => {
    window.location.href = '/workflows/new'
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-auto" style={{ background: layout.contentBg }}>
        {/* Topo branco com título e tabs com borda */}
        <div style={{ background: 'white' }}>
          <div style={{ marginBottom: 16 }}>
            <PageHeader
              title={titulo.title || title}
              subtitle={titulo.subtitle}
              titleFontFamily={titulo.titleFontFamily}
              titleFontSize={titulo.titleFontSize}
              titleFontWeight={titulo.titleFontWeight}
              titleColor={titulo.titleColor}
              titleLetterSpacing={titulo.titleLetterSpacing}
              className="px-6 md:px-10 pb-2"
              actions={(
                <Link href="/workflows/new">
                  <Button>Novo workflow</Button>
                </Link>
              )}
            />
          </div>
          <TabsNav
            options={(tabs.options as Opcao[])}
            value={tabs.selected}
            onValueChange={(v) => moduleUiActions.setTabs({ selected: v })}
            fontFamily={tabs.fontFamily}
            fontSize={tabs.fontSize}
            fontWeight={tabs.fontWeight}
            color={tabs.color}
            letterSpacing={tabs.letterSpacing}
            iconSize={tabs.iconSize}
            startOffset={tabs.leftOffset}
            labelOffsetY={tabs.labelOffsetY}
            activeColor={tabs.activeColor}
            activeFontWeight={tabs.activeFontWeight}
            activeBorderColor={tabs.activeBorderColor}
            className="px-6 md:px-10"
          />
        </div>

        {/* Conteúdo em cinza claro */}
        <div className="flex-1">
          <div className="mx-auto max-w-7xl px-6 md:px-10 py-6 pt-6">
            <WorkflowFilters value={filters} onChange={setFilters} onCreate={handleCreate} />

            <div className="mt-6">
              <WorkflowList data={filteredData} onOpen={handleOpen} onCreate={handleCreate} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
