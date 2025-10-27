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
  const total = workflowsMock.length
  const title = useMemo(() => `Workflows (${total})`, [total])

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
          className="pb-2"
        />
        <div className="px-4 md:px-6">
          <WorkflowTabs value={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <WorkflowFilters value={filters} onChange={setFilters} onCreate={handleCreate} />

            <div className="mt-6">
              <WorkflowList
                data={workflowsMock}
                q={filters.q}
                status={filters.status}
                sort={filters.sort}
                onOpen={handleOpen}
                onCreate={handleCreate}
                category={activeCategory}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
