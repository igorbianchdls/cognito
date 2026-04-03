'use client'

type AnyRecord = Record<string, any>

type DashboardNode = {
  type: string
  props?: AnyRecord
  children?: Array<DashboardNode | string>
}

function cloneNode<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => cloneNode(item)) as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, next] of Object.entries(value as Record<string, unknown>)) out[key] = cloneNode(next)
    return out as T
  }
  return value
}

function getNodeAtPath(root: DashboardNode, path: number[]): DashboardNode | null {
  let current: DashboardNode | null = root
  for (const index of path) {
    const children = Array.isArray(current?.children) ? current.children : []
    const next = children[index]
    if (!next || typeof next !== 'object') return null
    current = next as DashboardNode
  }
  return current
}

function removeNodeAtPath(root: DashboardNode, path: number[]): { nextTree: DashboardNode; removed: DashboardNode | null } {
  if (path.length === 0) return { nextTree: root, removed: null }

  const nextTree = cloneNode(root)
  const parentPath = path.slice(0, -1)
  const removeIndex = path[path.length - 1]
  const parentNode = getNodeAtPath(nextTree, parentPath)
  if (!parentNode || !Array.isArray(parentNode.children)) return { nextTree: root, removed: null }
  const removed = parentNode.children[removeIndex]
  if (!removed || typeof removed !== 'object') return { nextTree: root, removed: null }
  parentNode.children = parentNode.children.filter((_, index) => index !== removeIndex)
  return { nextTree, removed: removed as DashboardNode }
}

function adjustPathAfterRemoval(path: number[], removedPath: number[]) {
  if (removedPath.length === 0 || path.length === 0) return path
  const parentLen = removedPath.length - 1
  if (path.length <= parentLen) return path
  for (let i = 0; i < parentLen; i += 1) {
    if (path[i] !== removedPath[i]) return path
  }
  if (path[parentLen] > removedPath[parentLen]) {
    const next = path.slice()
    next[parentLen] -= 1
    return next
  }
  return path
}

function buildHorizontalFromReference(reference: DashboardNode | null, panel: DashboardNode): DashboardNode {
  const props = reference?.props && typeof reference.props === 'object' ? { ...reference.props } : {}
  delete props.id
  delete props.x
  delete props.y
  return {
    type: 'Horizontal',
    props: {
      columns: props.columns ?? 12,
      rowHeight: props.rowHeight ?? 32,
      gap: props.gap ?? 16,
      ...(props.style && typeof props.style === 'object' ? { style: props.style } : {}),
    },
    children: [panel],
  }
}

function getPanelSpan(panel: DashboardNode) {
  const raw = panel?.props?.span
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, raw)
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) return Math.max(1, parsed)
  }
  return 1
}

function getHorizontalColumns(node: DashboardNode) {
  const raw = node?.props?.columns
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, raw)
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) return Math.max(1, parsed)
  }
  return 12
}

function sumChildSpans(node: DashboardNode) {
  return (Array.isArray(node.children) ? node.children : []).reduce((total, child) => {
    if (!child || typeof child !== 'object' || child.type !== 'Panel') return total
    return total + getPanelSpan(child)
  }, 0)
}

function clearPanelGridPosition(panel: DashboardNode) {
  const nextPanel = cloneNode(panel)
  if (nextPanel.props && typeof nextPanel.props === 'object') {
    delete nextPanel.props.x
    delete nextPanel.props.y
  }
  return nextPanel
}

export function movePanelBetweenContainers(
  root: DashboardNode,
  sourcePath: number[],
  targetPath: number[],
  targetType: 'vertical' | 'horizontal',
) {
  const { nextTree: treeWithoutPanel, removed } = removeNodeAtPath(root, sourcePath)
  if (!removed) return root

  const panel = clearPanelGridPosition(removed)
  const adjustedTargetPath = adjustPathAfterRemoval(targetPath, sourcePath)
  const targetNode = getNodeAtPath(treeWithoutPanel, adjustedTargetPath)
  if (!targetNode) return root

  if (targetType === 'horizontal' && targetNode.type === 'Horizontal') {
    const totalSpan = sumChildSpans(targetNode)
    const nextSpan = getPanelSpan(panel)
    const limit = getHorizontalColumns(targetNode)
    if (totalSpan + nextSpan <= limit) {
      targetNode.children = [...(Array.isArray(targetNode.children) ? targetNode.children : []), panel]
      return treeWithoutPanel
    }

    const parentPath = adjustedTargetPath.slice(0, -1)
    const parentNode = getNodeAtPath(treeWithoutPanel, parentPath)
    if (parentNode?.type === 'Vertical' && Array.isArray(parentNode.children)) {
      const targetIndex = adjustedTargetPath[adjustedTargetPath.length - 1]
      const nextRow = buildHorizontalFromReference(targetNode, panel)
      parentNode.children = [
        ...parentNode.children.slice(0, targetIndex + 1),
        nextRow,
        ...parentNode.children.slice(targetIndex + 1),
      ]
      return treeWithoutPanel
    }

    targetNode.children = [...(Array.isArray(targetNode.children) ? targetNode.children : []), panel]
    return treeWithoutPanel
  }

  if (targetType === 'vertical' && targetNode.type === 'Vertical') {
    const sampleHorizontal = (Array.isArray(targetNode.children) ? targetNode.children : []).find(
      (child) => child && typeof child === 'object' && child.type === 'Horizontal',
    ) as DashboardNode | undefined
    const nextRow = buildHorizontalFromReference(sampleHorizontal || null, panel)
    targetNode.children = [...(Array.isArray(targetNode.children) ? targetNode.children : []), nextRow]
    return treeWithoutPanel
  }

  return root
}
