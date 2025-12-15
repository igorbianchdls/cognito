"use client"

import { GitBranch, CheckCircle2 } from "lucide-react"
import BlockCard from "../BlockCard"
import BlockActions from "../BlockActions"

export default function ConditionBlock({ index, name = 'Condição', selected, onSelect, onDelete, onDuplicate }: { index: number; name?: string; selected?: boolean; onSelect?: () => void; onDelete?: () => void; onDuplicate?: () => void }) {
  return (
    <div className="w-full">
      <BlockCard selected={selected} onClick={onSelect}>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 text-orange-700">
            <GitBranch className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs text-gray-500">{index}. Condição</div>
            <div className="text-sm font-medium">{name}</div>
          </div>
        </div>
        <div className="text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <BlockActions onDelete={onDelete} onDuplicate={onDuplicate} />
      </BlockCard>

      <div className="relative mt-2">
        <div className="flex items-center justify-between px-6">
          <div className="inline-flex items-center gap-2 text-xs text-white bg-purple-600 rounded-full px-2.5 py-1">Se Verdadeiro</div>
          <div className="inline-flex items-center gap-2 text-xs text-white bg-purple-600 rounded-full px-2.5 py-1">Se Falso</div>
        </div>
        <div className="h-6" />
        <div className="grid grid-cols-2 gap-6">
          <div className="flex justify-start">
            <BlockCard variant="dashed" className="opacity-70">
              <div className="text-sm text-gray-500">Adicionar bloco (verdadeiro)…</div>
            </BlockCard>
          </div>
          <div className="flex justify-end">
            <BlockCard variant="dashed" className="opacity-70">
              <div className="text-sm text-gray-500">Adicionar bloco (falso)…</div>
            </BlockCard>
          </div>
        </div>
      </div>
    </div>
  )
}

