"use client"

import 'reactflow/dist/style.css'
import React, { useCallback } from 'react'
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap, addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type Edge, type EdgeChange, type Node, type NodeChange, type OnSelectionChangeParams, ReactFlowProvider } from 'reactflow'
import type { NodeData } from '@/types/agentes/flow'
import AgentNode from './nodeTypes/AgentNode'
import ToolNode from './nodeTypes/ToolNode'
import ConditionNode from './nodeTypes/ConditionNode'
import ResponseNode from './nodeTypes/ResponseNode'

const nodeTypes = {
  agente: AgentNode,
  ferramenta: ToolNode,
  condicao: ConditionNode,
  resposta: ResponseNode,
} as const

type Props = {
  nodes: Node<NodeData>[]
  setNodes: React.Dispatch<React.SetStateAction<Node<NodeData>[]>>
  edges: Edge[]
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  onSelectNode?: (id: string | null) => void
}

export default function FlowCanvas({ nodes, setNodes, edges, setEdges, onSelectNode }: Props) {
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

  return (
    <ReactFlowProvider>
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          deleteKeyCode={["Backspace", "Delete"]}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <MiniMap />
          <Controls />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  )
}
