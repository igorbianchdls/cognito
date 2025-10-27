"use client"

import WorkflowCard from "@/components/workflows/WorkflowCard"
import EmptyState from "@/components/workflows/EmptyState"
import type { WorkflowSummary } from "@/app/workflows/types"

type Props = {
  data: WorkflowSummary[]
  onOpen?: (id: string) => void
  onCreate?: () => void
}

export function WorkflowList({ data, onOpen, onCreate }: Props) {
  if (!data.length) {
    return <EmptyState onCreate={onCreate} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((w) => (
        <WorkflowCard key={w.id} workflow={w} onOpen={onOpen} />
      ))}
    </div>
  )
}

export default WorkflowList
