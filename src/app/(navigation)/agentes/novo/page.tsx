"use client"

import { useMemo, useState } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import Link from "next/link"
import { SidebarShadcn } from "@/components/navigation/SidebarShadcn"
import BlockPalette from "@/components/navigation/agentes/builder/BlockPalette"
import FlowCanvas from "@/components/navigation/agentes/builder/flow/FlowCanvas"
import { ReactFlowProvider } from 'reactflow'
import PropertiesPanel from "@/components/navigation/agentes/builder/PropertiesPanel"
import WorkflowRunChatPanel from "@/components/navigation/agentes/workflows/exec/WorkflowRunChatPanel"
import ToolsPanel from "@/components/navigation/agentes/workflows/tools/ToolsPanel"
import CategoriesPanel from "@/components/navigation/agentes/workflows/tools/CategoriesPanel"
import type { Block, BlockKind, ToolBlockConfig } from "@/types/agentes/builder"
import type { Node, Edge } from 'reactflow'
import type { NodeData } from '@/types/agentes/flow'
import { flowToGraph } from '@/components/navigation/agentes/builder/flow/serialization'
import { Button } from "@/components/ui/button"
import { Code2, Play, Save, ArrowLeft, Paperclip, Settings as Cog, Play as PreviewIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import CodePreview from "@/components/navigation/agentes/codegen/CodePreview"

export default function NewAgentPage() {
  const [name, setName] = useState("Novo agente")
  const [enabled, setEnabled] = useState(true)
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
          name: 'Preparar contexto e histórico',
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
          name: 'Condições de parada',
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
      data: { block: { id: 'b4', kind: 'step', name: 'Buscar dados na tabela SQL', config: { toolChoice: 'auto' } } },
      position: { x: 100, y: 420 },
    },
    {
      id: 'b6',
      type: 'step',
      data: { block: { id: 'b6', kind: 'step', name: 'Analisar intenção e escolher tool', config: { toolChoice: 'auto' } } },
      position: { x: 100, y: 540 },
    },
    {
      id: 'b7',
      type: 'step',
      data: { block: { id: 'b7', kind: 'step', name: 'Gerar resposta e formatar', config: { toolChoice: 'auto' } } },
      position: { x: 100, y: 660 },
    },
    { id: 'b5', type: 'resposta', data: { block: { id: 'b5', kind: 'resposta', name: 'Responder ao usuário' } }, position: { x: 100, y: 780 } },
  ]
  const initialEdges: Edge[] = [
    { id: 'b1-b2', source: 'b1', target: 'b2' },
    { id: 'b2-b3', source: 'b2', target: 'b3' },
    { id: 'b3-b4', source: 'b3', target: 'b4' },
    { id: 'b4-b6', source: 'b4', target: 'b6' },
    { id: 'b6-b7', source: 'b6', target: 'b7' },
    { id: 'b7-b5', source: 'b7', target: 'b5' },
  ]
  const [nodes, setNodes] = useState<Node<NodeData>[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedBlock = useMemo(() => {
    const explicit = nodes.find(n => n.id === selectedId)?.data.block
    if (explicit) return explicit
    const agent = nodes.find(n => n.data.block.kind === 'agente')?.data.block
    return agent || null
  }, [nodes, selectedId])
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
        <div className="flex items-center justify-between pl-2 pr-3 md:pl-3 md:pr-6 h-14 border-b">
          {/* Left: back, badge icon, title input, toggle */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/agentes" className="text-gray-700 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="inline-flex items-center justify-center w-7 h-7 rounded-md border bg-yellow-100 text-yellow-800 border-yellow-200">
              <Paperclip className="w-4 h-4" />
            </div>
            <input
              className="text-[15px] font-semibold outline-none bg-transparent w-auto flex-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: `${Math.min(Math.max((name || '').length + 2, 8), 40)}ch` }}
            />
            <Switch checked={enabled} onCheckedChange={setEnabled} className="data-[state=checked]:bg-blue-600" />
          </div>
          {/* Right: Settings, Preview, Save */}
          <div className="flex items-center gap-4">
            <Button
              onClick={() => {/* open settings */}}
              className="rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 border-0 shadow-none h-8 px-3"
            >
              <Cog className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button
              onClick={() => { setRightPanelMode('exec'); setRunTrigger(v => v + 1) }}
              className="rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 border-0 shadow-none h-8 px-3"
            >
              <PreviewIcon className="w-4 h-4 mr-2" /> Preview
            </Button>
            <Button
              onClick={handleTest}
              className="rounded-full bg-blue-600 text-white hover:bg-blue-700 border-0 shadow-none h-8 px-4"
            >
              <Save className="w-4 h-4 mr-2" /> Save
            </Button>
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
                    if (selectedBlock?.kind === 'step') {
                      const stepNode = nodes.find(n => n.data.block.id === selectedBlock.id)
                      const scfg = (stepNode?.data.block.config || {}) as Partial<ToolBlockConfig> & { stepTools?: string[] }
                      return Array.isArray(scfg.stepTools) ? scfg.stepTools : []
                    }
                    const agent = nodes.find(n => n.data.block.kind === 'agente')
                    const cfg = (agent?.data.block.config || {}) as Partial<ToolBlockConfig> & { toolIds?: string[] }
                    return Array.isArray(cfg.toolIds) ? cfg.toolIds : []
                  })()}
                  onActivate={(id) => {
                    if (selectedBlock?.kind === 'step') {
                      const idx = nodes.findIndex(n => n.data.block.id === selectedBlock.id)
                      if (idx >= 0) {
                        const node = nodes[idx]
                        const cfg = (node.data.block.config || {}) as { stepTools?: string[] }
                        const current: string[] = Array.isArray(cfg.stepTools) ? cfg.stepTools : []
                        const next = Array.from(new Set([...current, id]))
                        const updated = { ...node, data: { block: { ...node.data.block, config: { ...cfg, stepTools: next } } } }
                        setNodes(prev => prev.map((n, i) => i === idx ? updated : n))
                      }
                    } else {
                      const agentIdx = nodes.findIndex(n => n.data.block.kind === 'agente')
                      if (agentIdx >= 0) {
                        const node = nodes[agentIdx]
                        const cfg = (node.data.block.config || {}) as { toolIds?: string[] }
                        const current: string[] = Array.isArray(cfg.toolIds) ? cfg.toolIds : []
                        const next = Array.from(new Set([...current, id]))
                        const updated = { ...node, data: { block: { ...node.data.block, config: { ...cfg, toolIds: next } } } }
                        setNodes(prev => prev.map((n, i) => i === agentIdx ? updated : n))
                      }
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
