"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { workflowsMock } from "@/data/workflows.mock"
import WorkflowList from "@/components/workflows/WorkflowList"
import { WorkflowFilters, type FiltersState } from "@/components/workflows/WorkflowFilters"
import { Button } from "@/components/ui/button"

export default function WorkflowsPage() {
  const [filters, setFilters] = useState<FiltersState>({ q: '', status: 'todos', sort: 'recentes' })
  const total = workflowsMock.length
  const title = useMemo(() => `Workflows (${total})`, [total])

  const handleOpen = (id: string) => {
    // No backend yet; navegação futura para edição / visualização
    // Por ora, podemos direcionar para uma rota futura
    console.log('Abrir workflow', id)
  }

  const handleCreate = () => {
    // Quando o builder estiver pronto, usar /workflows/new
    // Link direto para evitar erro caso a rota ainda não exista
    window.location.href = '/workflows/new'
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
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
  )
}

