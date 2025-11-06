"use client"

import 'reactflow/dist/style.css'
import React, { useCallback } from 'react'
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap, addEdge, applyEdgeChanges, applyNodeChanges, useReactFlow, type Connection, type Edge, type EdgeChange, type Node, type NodeChange, type OnSelectionChangeParams } from 'reactflow'
import type { NodeData } from '@/types/agentes/flow'
import AgentNode from './nodeTypes/AgentNode'
import ToolNode from './nodeTypes/ToolNode'
import ConditionNode from './nodeTypes/ConditionNode'
import ResponseNode from './nodeTypes/ResponseNode'
import PlaceholderNode from './nodeTypes/PlaceholderNode'
import StepNode from './nodeTypes/StepNode'
import PrepareStepNode from './nodeTypes/PrepareStepNode'
import StopWhenNode from './nodeTypes/StopWhenNode'
import type { Block, BlockKind } from '@/types/agentes/builder'

const nodeTypes = {
  agente: AgentNode,
  ferramenta: ToolNode,
  condicao: ConditionNode,
  resposta: ResponseNode,
  nota: PlaceholderNode,
  loop: PlaceholderNode,
  aprovacao: PlaceholderNode,
  transform: PlaceholderNode,
  setstate: PlaceholderNode,
  step: StepNode,
  prepareStep: PrepareStepNode,
  stopWhen: StopWhenNode,
} as const

type Props = {
  nodes: Node<NodeData>[]
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData>[]>>
  edges: Edge[]
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  onSelectNode?: (id: string | null) => void
}

export default function FlowCanvas({ nodes, setNodes, edges, setEdges, onSelectNode }: Props) {
  const rf = useReactFlow()
  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection }, eds))
  }, [setEdges])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds))
  }, [setNodes])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds))
  }, [setEdges])

  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    onSelectNode?.(params.nodes?.[0]?.id ?? null)
  }, [onSelectNode])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const kind = e.dataTransfer.getData('application/x-block-kind')
    const name = e.dataTransfer.getData('application/x-block-name')
    const toolId = e.dataTransfer.getData('application/x-tool-id')
    if (!kind) return
    const position = rf.project({ x: e.clientX, y: e.clientY })
    const id = `b${Date.now()}`
    const block: Block = { id, kind: kind as BlockKind, name: name || (kind.charAt(0).toUpperCase() + kind.slice(1)) }
    if (kind === 'ferramenta' && toolId) {
      block.config = { ...(block.config || {}), toolIds: [toolId] }
    }
    const node: Node<NodeData> = { id, type: kind as BlockKind, data: { block }, position }
    setNodes((nds) => nds.concat(node))
  }, [rf, setNodes])

  return (
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          deleteKeyCode={["Backspace", "Delete"]}
          defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#FAFAFA' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#D1D5DB" />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
  )
}
