"use client"

import { useMemo, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import BlockPalette from "@/components/agentes/builder/BlockPalette"
import FlowCanvas from "@/components/agentes/builder/flow/FlowCanvas"
import { ReactFlowProvider } from 'reactflow'
import PropertiesPanel from "@/components/agentes/builder/PropertiesPanel"
import type { Block, BlockKind } from "@/types/agentes/builder"
import type { Node, Edge } from 'reactflow'
import type { NodeData } from '@/types/agentes/flow'
import { flowToGraph } from '@/components/agentes/builder/flow/serialization'
import { Button } from "@/components/ui/button"

export default function NewAgentPage() {
  const [name, setName] = useState("Novo agente")
  const initialNodes: Node<NodeData>[] = [
    { id: 'b1', type: 'agente', data: { block: { id: 'b1', kind: 'agente', name: 'Agente principal', config: { model: '', systemPrompt: '' } } }, position: { x: 100, y: 80 } },
    { id: 'b2', type: 'ferramenta', data: { block: { id: 'b2', kind: 'ferramenta', name: 'Ferramentas', config: { toolIds: [] } } }, position: { x: 100, y: 220 } },
    { id: 'b3', type: 'resposta', data: { block: { id: 'b3', kind: 'resposta', name: 'Resposta' } }, position: { x: 100, y: 360 } },
  ]
  const initialEdges: Edge[] = [
    { id: 'b1-b2', source: 'b1', target: 'b2' },
    { id: 'b2-b3', source: 'b2', target: 'b3' },
  ]
  const [nodes, setNodes] = useState<Node<NodeData>[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedBlock = useMemo(() => nodes.find(n => n.id === selectedId)?.data.block || null, [nodes, selectedId])

  const addBlock = (payload: { kind: BlockKind; name?: string; toolId?: string }) => {
    const { kind, name, toolId } = payload
    const id = `b${Date.now()}`
    const block: Block = { id, kind, name: name || (kind.charAt(0).toUpperCase() + kind.slice(1)) }
    if (kind === 'ferramenta' && toolId) {
      block.config = { ...(block.config || {}), toolIds: [toolId] }
      if (!block.name) block.name = toolId
    }
    const base: Node<NodeData> = { id, type: kind, data: { block }, position: { x: 320, y: 120 } }
    setNodes(prev => [...prev, base])
    setSelectedId(id)
  }

  const updateBlock = (patch: Partial<Block>) => {
    if (!selectedBlock) return
    setNodes(prev => prev.map(n => (n.id === selectedBlock.id ? { ...n, data: { block: { ...n.data.block, ...patch } } } : n)))
  }

  const removeSelected = () => {
    if (!selectedBlock) return
    setNodes(prev => prev.filter(n => n.id !== selectedBlock.id))
    setEdges(prev => prev.filter(e => e.source !== selectedBlock.id && e.target !== selectedBlock.id))
    setSelectedId(null)
  }

  const handleTest = async () => {
    try {
      const res = await fetch('/api/agentes/visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graph: flowToGraph(nodes, edges), message: 'olá agente' }),
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
              <ReactFlowProvider>
                <FlowCanvas nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} onSelectNode={setSelectedId} />
              </ReactFlowProvider>
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
