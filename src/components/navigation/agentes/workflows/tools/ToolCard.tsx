"use client"

import { Button } from '@/components/ui/button'
import type { ToolMeta } from './tools.mock'

export default function ToolCard({ tool, onActivate, active }: { tool: ToolMeta; onActivate?: (id: string) => void; active?: boolean }) {
  const Icon = tool.icon
  return (
    <div className="border rounded-md p-3 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100 border">
            <Icon className="w-4 h-4 text-gray-700" />
          </span>
          <div className="text-sm font-medium">{tool.name}</div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border">{tool.category}</span>
      </div>
      <div className="mt-2 text-xs text-gray-600 line-clamp-2">{tool.description}</div>
      <div className="mt-3 flex items-center gap-2">
        <Button
          variant={active ? 'default' : 'outline'}
          className="h-7 px-3 text-xs"
          onClick={() => onActivate?.(tool.id)}
          disabled={active}
        >
          {active ? 'Ativo' : 'Ativar'}
        </Button>
        <Button variant="ghost" className="h-7 px-3 text-xs" disabled>Configurar</Button>
      </div>
    </div>
  )
}
