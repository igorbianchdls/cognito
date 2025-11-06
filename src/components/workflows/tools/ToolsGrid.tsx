"use client"

import ToolCard from './ToolCard'
import type { ToolMeta } from './tools.mock'

export default function ToolsGrid({ items, onActivate }: { items: ToolMeta[]; onActivate?: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map(t => (
        <ToolCard key={t.id} tool={t} onActivate={onActivate} />
      ))}
    </div>
  )
}
