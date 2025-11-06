"use client"

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft } from 'lucide-react'
import ToolFilterBar from './ToolFilterBar'
import ToolsGrid from './ToolsGrid'
import { TOOL_CATEGORIES, TOOLS_MOCK } from './tools.mock'

export default function ToolsPanel({ onBack }: { onBack?: () => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center gap-2 border-b">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="text-xl font-semibold">Ferramentas</div>
          <div className="text-xs text-gray-500">Explore e gerencie integrações</div>
        </div>
      </div>
      <div className="p-4 space-y-4 flex-1 overflow-auto custom-scrollbar">
        <ToolFilterBar categories={Array.from(TOOL_CATEGORIES)} activeCategory={TOOL_CATEGORIES[0]} />
        <Separator />
        <ToolsGrid items={TOOLS_MOCK} />
      </div>
    </div>
  )
}

