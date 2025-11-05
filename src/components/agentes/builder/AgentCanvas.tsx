"use client"

import { type Dispatch, type SetStateAction } from "react"
import type { Block } from "@/types/agentes/builder"
import AgentBlock from "./blocks/AgentBlock"
import ToolBlock from "./blocks/ToolBlock"
import ConditionBlock from "./blocks/ConditionBlock"
import ResponseBlock from "./blocks/ResponseBlock"

type Props = {
  blocks: Block[]
  setBlocks: Dispatch<SetStateAction<Block[]>>
  selectedId: string | null
  setSelectedId: Dispatch<SetStateAction<string | null>>
}

export default function AgentCanvas({ blocks, setBlocks, selectedId, setSelectedId }: Props) {
  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    setSelectedId(prev => (prev === id ? null : prev))
  }

  const duplicateBlock = (id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (idx < 0) return prev
      const orig = prev[idx]
      const copy: Block = { ...orig, id: `${orig.id}-copy-${Date.now()}` }
      const arr = [...prev]
      arr.splice(idx + 1, 0, copy)
      return arr
    })
  }

  const renderBlock = (block: Block, index: number) => {
    const common = {
      index: index + 1,
      selected: selectedId === block.id,
      onSelect: () => setSelectedId(block.id),
      onDelete: () => removeBlock(block.id),
      onDuplicate: () => duplicateBlock(block.id),
    }
    if (block.kind === 'agente') return <AgentBlock key={block.id} {...common} name={block.name} />
    if (block.kind === 'ferramenta') return <ToolBlock key={block.id} {...common} name={block.name} />
    if (block.kind === 'condicao') return <ConditionBlock key={block.id} {...common} name={block.name} />
    if (block.kind === 'resposta') return <ResponseBlock key={block.id} {...common} name={block.name} />
    return <div key={block.id} className="text-sm text-gray-500">Bloco não suportado</div>
  }

  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex justify-center py-10 bg-dots" onClick={() => setSelectedId(null)}>
      <div className="w-full max-w-3xl px-4">
        {blocks.map((block, i) => (
          <div key={block.id} className="w-full flex flex-col items-center">
            {i === 0 ? (
              <div className="flex flex-col items-center">
                <div className="w-0.5 bg-gray-300/80" style={{ height: 12 }} />
              </div>
            ) : null}
            {renderBlock(block, i)}
            <div className="flex justify-center my-2">
              <div className="w-0.5 bg-gray-300/80" style={{ height: 24 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

