"use client"

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft } from 'lucide-react'
import { TOOL_CATEGORIES, TOOLS_MOCK } from './tools.mock'

export default function CategoriesPanel({ onBack, onOpenCategory }: { onBack?: () => void; onOpenCategory?: (category: string) => void }) {
  // Build counts per category from mock
  const counts = TOOL_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    if (cat === 'Todas') {
      acc[cat] = TOOLS_MOCK.length
    } else {
      acc[cat] = TOOLS_MOCK.filter(t => t.category === cat).length
    }
    return acc
  }, {})

  const categories = TOOL_CATEGORIES.filter(c => c !== 'Todas')

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center gap-2 border-b">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div>
          <div className="text-xl font-semibold">Categorias</div>
          <div className="text-xs text-gray-500">Escolha uma categoria para explorar ferramentas</div>
        </div>
      </div>
      <div className="p-4 flex-1 overflow-auto custom-scrollbar">
        <div className="grid grid-cols-1 gap-3">
          {categories.map(cat => (
            <button key={cat} type="button" onClick={() => onOpenCategory?.(cat)} className="border rounded-md p-3 hover:bg-gray-50 transition flex items-center justify-between text-left">
              <div>
                <div className="text-sm font-medium">{cat}</div>
                <div className="text-xs text-gray-600">{counts[cat]} ferramentas</div>
              </div>
              {/* right chevron implicit via hover, could add icon if desired */}
            </button>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="text-xs text-gray-500">Total: {counts['Todas']} ferramentas</div>
      </div>
    </div>
  )
}

