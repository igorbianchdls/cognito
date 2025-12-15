"use client"

import { Handle, Position, type NodeProps } from 'reactflow'
import BlockCard from '../../BlockCard'
import BlockActions from '../../BlockActions'
import type { NodeData } from '@/types/agentes/flow'
import { getVisualForBlock } from '../visuals'
import NodeHeader from '../NodeHeader'

export default function ConditionNode({ data, selected }: NodeProps<NodeData>) {
  const name = data.block.name || 'Condição'
  const visual = getVisualForBlock(data.block)
  const desc = 'Condição'
  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} id="in" />
      <BlockCard selected={selected}>
        <NodeHeader icon={visual.icon} badgeBg={visual.badgeBg} badgeColor={visual.badgeColor} description={desc} title={name} />
        <BlockActions />
      </BlockCard>
      {/* Duas saídas: verdadeiro e falso */}
      <div className="absolute -bottom-3 left-2 text-[10px] text-gray-500">Verdadeiro</div>
      <div className="absolute -bottom-3 right-2 text-[10px] text-gray-500">Falso</div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: 16 }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ right: 16 }} />
    </div>
  )
}
