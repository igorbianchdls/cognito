"use client"

import { useMemo } from "react"
import WorkflowCard from "@/components/workflows/WorkflowCard"
import EmptyState from "@/components/workflows/EmptyState"
import type { WorkflowSummary } from "@/types/apps/workflows"

type Props = {
  data: WorkflowSummary[]
  q?: string
  status?: 'todos' | 'ativo' | 'pausado' | 'rascunho'
  sort?: 'recentes' | 'nome' | 'execucoes'
  onOpen?: (id: string) => void
  onCreate?: () => void
}

export function WorkflowList({ data, q = '', status = 'todos', sort = 'recentes', onOpen, onCreate }: Props) {
  const items = useMemo(() => {
    let arr = data
    if (q) {
      const term = q.toLowerCase()
      arr = arr.filter(w =>
        w.name.toLowerCase().includes(term) ||
        w.description?.toLowerCase().includes(term) ||
        w.tags?.some(t => t.toLowerCase().includes(term))
      )
    }
    if (status !== 'todos') {
      arr = arr.filter(w => w.status === status)
    }
    if (sort === 'recentes') {
      arr = [...arr].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    } else if (sort === 'nome') {
      arr = [...arr].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sort === 'execucoes') {
      arr = [...arr].sort((a, b) => (b.runs || 0) - (a.runs || 0))
    }
    return arr
  }, [data, q, status, sort])

  if (!items.length) {
    return <EmptyState onCreate={onCreate} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((w) => (
        <WorkflowCard key={w.id} workflow={w} onOpen={onOpen} />
      ))}
    </div>
  )
}

export default WorkflowList

