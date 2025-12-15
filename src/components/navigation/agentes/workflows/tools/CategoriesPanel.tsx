"use client"

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, Database, Globe, Mail, Bot, Cloud, MessageSquare, Plug, FlaskConical } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TOOL_CATEGORIES, TOOLS_MOCK } from './tools.mock'

export default function CategoriesPanel({ onBack, onOpenCategory }: { onBack?: () => void; onOpenCategory?: (category: string) => void }) {
  // Build counts per category from mock
  const counts = TOOL_CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = TOOLS_MOCK.filter(t => t.category === cat).length
    return acc
  }, {})

  const total = TOOLS_MOCK.length
  const categories = TOOL_CATEGORIES

  const STYLE: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
    Data: { icon: Database, bg: '#EEF2FF', color: '#1D4ED8' },
    HTTP: { icon: Globe, bg: '#FEF3C7', color: '#B45309' },
    Email: { icon: Mail, bg: '#EAF7EC', color: '#059669' },
    RAG: { icon: Bot, bg: '#F3E8FF', color: '#7E22CE' },
    Databases: { icon: Database, bg: '#DBEAFE', color: '#1D4ED8' },
    Cloud: { icon: Cloud, bg: '#E0F2FE', color: '#0369A1' },
    Messaging: { icon: MessageSquare, bg: '#FFE4E6', color: '#BE123C' },
    External: { icon: Plug, bg: '#F3F4F6', color: '#374151' },
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b">
        <div>
          <div className="text-xl font-semibold">Categorias</div>
          <div className="text-xs text-gray-500">Escolha uma categoria para explorar ferramentas</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 flex-1 overflow-auto custom-scrollbar">
        <div className="grid grid-cols-1 gap-3">
          {categories.map(cat => {
            const st = STYLE[cat] || { icon: FlaskConical, bg: '#F3F4F6', color: '#374151' }
            const Icon = st.icon
            return (
              <button key={cat} type="button" onClick={() => onOpenCategory?.(cat)} className="border rounded-md p-3 hover:bg-gray-50 transition flex items-center gap-3 text-left">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg border" style={{ background: st.bg, color: st.color, borderColor: 'rgba(0,0,0,0.06)' }}>
                  <Icon className="w-4 h-4" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{cat}</div>
                  <div className="text-xs text-gray-600">{counts[cat]} ferramentas</div>
                </div>
              </button>
            )
          })}
        </div>
        <Separator className="my-4" />
        <div className="text-xs text-gray-500">Total: {total} ferramentas</div>
      </div>
    </div>
  )
}
