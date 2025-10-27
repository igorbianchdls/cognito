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
      <SidebarInset className="h-screen flex flex-col overflow-auto bg-white">
        {/* Header com PageHeader + Tabs (estilo Financeiro) */}
        <PageHeader
          title={title}
          subtitle="Gerencie e crie automações visuais"
          actions={(
            <Link href="/workflows/new">
              <Button>Novo workflow</Button>
            </Link>
          )}
          className="px-6 md:px-10 pb-2"
        />
        <WorkflowTabs value={activeCategory} onChange={setActiveCategory} />

        {/* Content */}
        <div className="flex-1 bg-[#FBFBFB]">
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
