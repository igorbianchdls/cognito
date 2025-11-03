"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { workflowsMock } from "@/data/workflows.mock"
import WorkflowList from "@/components/workflows/WorkflowList"
import { WorkflowFilters, type FiltersState } from "@/components/workflows/WorkflowFilters"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import PageHeader from "@/components/modulos/PageHeader"
import WorkflowTabs, { type WorkflowTabsValue } from "@/components/workflows/WorkflowTabs"

export default function WorkflowsPage() {
  const [filters, setFilters] = useState<FiltersState>({ q: '', status: 'todos', sort: 'recentes' })
  const [activeCategory, setActiveCategory] = useState<WorkflowTabsValue>('todos')
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

  const handleOpen = (id: string) => {
    console.log('Abrir workflow', id)
  }

  const handleCreate = () => {
    window.location.href = '/workflows/new'
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset className="min-h-screen flex flex-col overflow-auto" style={{ background: 'rgb(253, 253, 253)' }}>
        {/* Topo branco com título e tabs com borda */}
        <div style={{ background: 'white' }}>
          <div style={{ marginBottom: 16 }}>
            <PageHeader
              title={title}
              subtitle="Gerencie e crie automações visuais"
              titleFontFamily="var(--font-crimson-text)"
              titleFontSize={24}
              titleFontWeight="600"
              titleColor="#111827"
              titleLetterSpacing={0}
              className="px-6 md:px-10 pb-2"
              actions={(
                <Link href="/workflows/new">
                  <Button>Novo workflow</Button>
                </Link>
              )}
            />
          </div>
          <WorkflowTabs value={activeCategory} onChange={setActiveCategory} />
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
