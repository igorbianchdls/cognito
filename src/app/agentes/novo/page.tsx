"use client"

import { useMemo, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import BlockPalette from "@/components/agentes/builder/BlockPalette"
import AgentCanvas from "@/components/agentes/builder/AgentCanvas"
import PropertiesPanel from "@/components/agentes/builder/PropertiesPanel"
import type { Block, BlockKind } from "@/types/agentes/builder"
import { Button } from "@/components/ui/button"

export default function NewAgentPage() {
  const [name, setName] = useState("Novo agente")
  const [blocks, setBlocks] = useState<Block[]>([
    { id: 'b1', kind: 'agente', name: 'Agente principal', config: { model: '', systemPrompt: '' }, next: 'b2' },
    { id: 'b2', kind: 'ferramenta', name: 'Ferramentas', config: { toolIds: [] }, next: 'b3' },
    { id: 'b3', kind: 'resposta', name: 'Resposta' },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedBlock = useMemo(() => blocks.find(b => b.id === selectedId) || null, [blocks, selectedId])

  const addBlock = (kind: BlockKind) => {
    const id = `b${Date.now()}`
    const base: Block = { id, kind, name: kind.charAt(0).toUpperCase() + kind.slice(1) }
    setBlocks(prev => [...prev, base])
    setSelectedId(id)
  }

  const updateBlock = (patch: Partial<Block>) => {
    if (!selectedBlock) return
    setBlocks(prev => prev.map(b => (b.id === selectedBlock.id ? { ...b, ...patch } : b)))
  }

  const removeSelected = () => {
    if (!selectedBlock) return
    setBlocks(prev => prev.filter(b => b.id !== selectedBlock.id))
    setSelectedId(null)
  }

  const handleTest = async () => {
    try {
      const res = await fetch('/api/agentes/visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: { headId: blocks[0]?.id || null, blocks }, message: 'olá agente' }),
      })
      const data = await res.json()
      alert(`Resposta (MVP): ${data.reply || JSON.stringify(data)}`)
    } catch (e) {
      alert('Falha ao testar agente: ' + (e as Error).message)
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col bg-white">
        <div className="flex items-center justify-between px-6 md:px-10 h-14 border-b">
          <input className="text-xl font-semibold outline-none bg-transparent" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleTest}>Testar</Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex">
          <div className="w-80 border-r bg-white hidden md:block">
            <BlockPalette onAdd={addBlock} />
          </div>
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 h-full overflow-auto custom-scrollbar">
              <AgentCanvas blocks={blocks} setBlocks={setBlocks} selectedId={selectedId} setSelectedId={setSelectedId} />
            </div>
            <div className="w-96 h-full overflow-auto border-l bg-white custom-scrollbar">
              <PropertiesPanel
                block={selectedBlock}
                onChange={updateBlock}
                onDelete={removeSelected}
              />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

