import type { Edge, Node } from 'reactflow'
import type { Graph, Block } from '@/types/agentes/builder'
import type { NodeData } from '@/types/agentes/flow'

export function flowToGraph(nodes: Node<NodeData>[], edges: Edge[]): Graph {
  const blocks: Block[] = nodes.map(n => n.data.block)
  const byId = new Map(blocks.map(b => [b.id, b] as const))

  // Reset connections
  for (const b of blocks) {
    delete b.next
    delete b.branches
  }

  for (const e of edges) {
    const source = byId.get(String(e.source))
    const targetId = e.target ? String(e.target) : null
    if (!source || !targetId) continue
    if (source.kind === 'condicao') {
      const branchKey = e.sourceHandle === 'true' ? 'true' : 'false'
      const label = branchKey === 'true' ? 'true' : 'false'
      source.branches = source.branches || []
      const existing = source.branches.find(b => b.label === label)
      if (existing) existing.next = targetId
      else source.branches.push({ label, next: targetId })
    } else if (source.kind !== 'resposta') {
      source.next = targetId
    }
  }

  const headId = blocks[0]?.id ?? null
  return { headId, blocks }
}

export function graphToFlow(graph: Graph): { nodes: Node<NodeData>[]; edges: Edge[] } {
  const nodes: Node<NodeData>[] = graph.blocks.map((b, idx) => ({
    id: b.id,
    type: b.kind,
    data: { block: b },
    position: { x: 120 * idx, y: 120 * idx },
  }))
  const idSet = new Set(graph.blocks.map(b => b.id))
  const edges: Edge[] = []
  for (const b of graph.blocks) {
    if (b.kind === 'condicao' && b.branches) {
      for (const br of b.branches) {
        if (br.next && idSet.has(br.next)) {
          edges.push({ id: `${b.id}-${br.label}-${br.next}` , source: b.id, sourceHandle: br.label, target: br.next, label: br.label })
        }
      }
    } else if (b.next && idSet.has(b.next)) {
      edges.push({ id: `${b.id}-${b.next}`, source: b.id, target: b.next })
    }
  }
  return { nodes, edges }
}

