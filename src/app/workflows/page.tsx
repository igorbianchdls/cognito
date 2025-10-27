"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { workflowsMock } from "@/data/workflows.mock"
import WorkflowList from "@/components/workflows/WorkflowList"
import { WorkflowFilters, type FiltersState } from "@/components/workflows/WorkflowFilters"
import { Button } from "@/components/ui/button"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"

export default function WorkflowsPage() {
  const [filters, setFilters] = useState<FiltersState>({ q: '', status: 'todos', sort: 'recentes' })
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
      <SidebarInset>
        {/* Header */}
        <div className="border-b" style={{ backgroundColor: 'hsl(0 0% 98%)' }}>
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground mt-1">Gerencie e crie automações visuais</p>
              </div>
              <div className="hidden md:block">
                <Link href="/workflows/new">
                  <Button>Novo workflow</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ backgroundColor: 'hsl(0 0% 98%)' }}>
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
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
