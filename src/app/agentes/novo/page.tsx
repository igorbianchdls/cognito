"use client"

import { useMemo, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import BlockPalette from "@/components/agentes/builder/BlockPalette"
import FlowCanvas from "@/components/agentes/builder/flow/FlowCanvas"
import { ReactFlowProvider } from 'reactflow'
import PropertiesPanel from "@/components/agentes/builder/PropertiesPanel"
import WorkflowRunChatPanel from "@/components/workflows/exec/WorkflowRunChatPanel"
import ToolsPanel from "@/components/workflows/tools/ToolsPanel"
import CategoriesPanel from "@/components/workflows/tools/CategoriesPanel"
import type { Block, BlockKind, ToolBlockConfig } from "@/types/agentes/builder"
import type { Node, Edge } from 'reactflow'
import type { NodeData } from '@/types/agentes/flow'
import { flowToGraph } from '@/components/agentes/builder/flow/serialization'
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import CodePreview from "@/components/agentes/codegen/CodePreview"

export default function NewAgentPage() {
  const [name, setName] = useState("Novo agente")
  const initialNodes: Node<NodeData>[] = [
    {
      id: 'b1',
      type: 'agente',
      data: {
        block: {
          id: 'b1',
          kind: 'agente',
          name: 'Agente principal',
          config: {
            model: 'anthropic/claude-3-haiku-latest',
            systemPrompt:
              'Você é um assistente. Use tool-calling quando necessário. Se o usuário pedir sobre clima, chame getWeather com { location }. Se pedir horário local, chame getTime com { location? e/ou timezone }. Se estiver ambíguo, peça esclarecimento antes de chamar a tool. Responda de forma concisa e útil.',
          },
        },
      },
      position: { x: 100, y: 60 },
    },
    {
      id: 'b2',
      type: 'prepareStep',
      data: {
        block: {
          id: 'b2',
          kind: 'prepareStep',
          name: 'PrepareStep',
          config: {
            compressAfterMessages: 10,
            keepLastMessages: 10,
            defaultToolChoice: 'auto',
          },
        },
      },
      position: { x: 100, y: 180 },
    },
    {
      id: 'b3',
      type: 'stopWhen',
      data: {
        block: {
          id: 'b3',
          kind: 'stopWhen',
          name: 'StopWhen',
          config: {
            stepLimit: 2,
            stopOnTools: [],
          },
        },
      },
      position: { x: 100, y: 300 },
    },
    {
      id: 'b4',
      type: 'step',
      data: { block: { id: 'b4', kind: 'step', name: 'Step 1', config: { toolChoice: 'auto' } } },
      position: { x: 100, y: 420 },
    },
    { id: 'b5', type: 'resposta', data: { block: { id: 'b5', kind: 'resposta', name: 'Resposta' } }, position: { x: 100, y: 540 } },
  ]
  const initialEdges: Edge[] = [
    { id: 'b1-b2', source: 'b1', target: 'b2' },
    { id: 'b2-b3', source: 'b2', target: 'b3' },
    { id: 'b3-b4', source: 'b3', target: 'b4' },
    { id: 'b4-b5', source: 'b4', target: 'b5' },
  ]
  const [nodes, setNodes] = useState<Node<NodeData>[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedBlock = useMemo(() => nodes.find(n => n.id === selectedId)?.data.block || null, [nodes, selectedId])
  const [showCode, setShowCode] = useState(false)
  const [runTrigger, setRunTrigger] = useState(0)
  const [leftTab, setLeftTab] = useState<'agentes' | 'workflows'>('agentes')
  const [rightPanelMode, setRightPanelMode] = useState<'playground' | 'categories' | 'tools' | 'exec'>('playground')
  const [selectedCategory, setSelectedCategory] = useState<string>('Data')

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

  // handleRun removed (unused) — run is triggered by switching to exec panel

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset className="h-screen flex flex-col bg-white">
        <div className="flex items-center justify-between px-6 md:px-10 h-14 border-b">
          <input className="text-xl font-semibold outline-none bg-transparent" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowCode(true)}>Código</Button>
            <Button variant="outline" onClick={() => { setRightPanelMode('exec'); setRunTrigger(v => v + 1) }}>Run</Button>
            <Button variant="outline" onClick={handleTest}>Testar</Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden flex">
          <div className="w-80 border-r bg-white hidden md:block">
            <div className="px-3 pt-2">
              <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as 'agentes' | 'workflows')}>
                <TabsList variant="underline" className="border-b-0">
                  <TabsTrigger value="agentes">Agentes</TabsTrigger>
                  <TabsTrigger value="workflows">Workflows</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <BlockPalette onAdd={addBlock} />
          </div>
          <div className="flex-1 overflow-hidden flex">
            <div className="flex-1 h-full overflow-auto custom-scrollbar">
              <ReactFlowProvider>
                <FlowCanvas nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} onSelectNode={setSelectedId} />
              </ReactFlowProvider>
            </div>
            <div className="w-96 h-full overflow-auto border-l bg-white custom-scrollbar">
              {rightPanelMode === 'exec' ? (
                <WorkflowRunChatPanel graph={flowToGraph(nodes, edges)} autoSend={runTrigger ? 'olá agente' : undefined} />
              ) : rightPanelMode === 'categories' ? (
                <CategoriesPanel onBack={() => setRightPanelMode('playground')} onOpenCategory={(cat) => { setSelectedCategory(cat); setRightPanelMode('tools') }} />
              ) : rightPanelMode === 'tools' ? (
                <ToolsPanel
                  category={selectedCategory}
                  onBack={() => setRightPanelMode('categories')}
                  activeToolIds={(() => {
                    const agent = nodes.find(n => n.data.block.kind === 'agente')
                    const cfg = (agent?.data.block.config || {}) as Partial<ToolBlockConfig> & { toolIds?: string[] }
                    return Array.isArray(cfg.toolIds) ? cfg.toolIds : []
                  })()}
                  onActivate={(id) => {
                    // Ativa tool sem criar node no canvas: grava no config do primeiro agente
                    const agentIdx = nodes.findIndex(n => n.data.block.kind === 'agente')
                    if (agentIdx >= 0) {
                      const node = nodes[agentIdx]
                      const cfg = (node.data.block.config || {}) as Partial<ToolBlockConfig> & { toolIds?: string[] }
                      const current: string[] = Array.isArray(cfg.toolIds) ? cfg.toolIds : []
                      const next = Array.from(new Set([...current, id]))
                      const updated = { ...node, data: { block: { ...node.data.block, config: { ...cfg, toolIds: next } } } }
                      setNodes(prev => prev.map((n, i) => i === agentIdx ? updated : n))
                    }
                  }}
                />
              ) : (
                <PropertiesPanel
                  block={selectedBlock}
                  onChange={updateBlock}
                  onDelete={removeSelected}
                  onOpenTools={() => setRightPanelMode('categories')}
                />
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Código gerado</DialogTitle>
          </DialogHeader>
          <CodePreview graph={flowToGraph(nodes, edges)} initialSlug={name} />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}
