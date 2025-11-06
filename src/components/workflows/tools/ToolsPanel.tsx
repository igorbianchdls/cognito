"use client"

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft } from 'lucide-react'
import ToolsGrid from './ToolsGrid'
import { TOOLS_MOCK } from './tools.mock'

export default function ToolsPanel({ category, onBack }: { category: string; onBack?: () => void }) {
  const items = category ? TOOLS_MOCK.filter(t => t.category === category) : TOOLS_MOCK
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b">
        <div>
          <div className="text-xl font-semibold">Ferramentas — {category}</div>
          <div className="text-xs text-gray-500">Explore e gerencie integrações desta categoria</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-auto custom-scrollbar">
        <ToolsGrid items={items} />
      </div>
    </div>
  )
}
