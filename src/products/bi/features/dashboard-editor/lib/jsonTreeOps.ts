import type { JsonTree } from '@/products/bi/shared/types'
import type {
  JsonNodePath,
  NodeDropPlacement,
  NodeMoveDirection,
} from '@/products/bi/features/dashboard-editor/types/editor-types'

type JsonNode = Record<string, any>

function cloneTree<T>(value: T): T {
  return value == null ? value : (JSON.parse(JSON.stringify(value)) as T)
}

function getNodeChildren(node: JsonNode | null | undefined): JsonNode[] | null {
  if (!node || !Array.isArray(node.children)) return null
  return node.children as JsonNode[]
}

function resolveContainerForPath(tree: JsonTree, path: JsonNodePath): { container: JsonNode[]; index: number } | null {
  if (!path.length || !tree) return null

  if (Array.isArray(tree)) {
    if (path.length === 1) return { container: tree as JsonNode[], index: path[0] }
    let node = (tree as JsonNode[])[path[0]] as JsonNode | undefined
    for (let i = 1; i < path.length - 1; i++) {
      const children = getNodeChildren(node)
      if (!children) return null
      node = children[path[i]]
    }
    const children = getNodeChildren(node)
    if (!children) return null
    return { container: children, index: path[path.length - 1] }
  }

  if (path.length === 1) {
    const children = getNodeChildren(tree as JsonNode)
    if (!children) return null
    return { container: children, index: path[0] }
  }

  let node = tree as JsonNode
  for (let i = 0; i < path.length - 1; i++) {
    const children = getNodeChildren(node)
    if (!children) return null
    node = children[path[i]]
  }
  const children = getNodeChildren(node)
  if (!children) return null
  return { container: children, index: path[path.length - 1] }
}

export function getNodeAtPath(tree: JsonTree, path: JsonNodePath | null | undefined): JsonNode | null {
  if (!tree || !path) return null
  if (Array.isArray(tree)) {
    if (!path.length) return null
    let node = (tree as JsonNode[])[path[0]] as JsonNode | undefined
    for (let i = 1; i < path.length; i++) {
      const children = getNodeChildren(node)
      if (!children) return null
      node = children[path[i]]
    }
    return node || null
  }

  if (!path.length) return tree as JsonNode
  let node = tree as JsonNode
  for (let i = 0; i < path.length; i++) {
    const children = getNodeChildren(node)
    if (!children) return null
    node = children[path[i]]
  }
  return node || null
}

export function updateNodeAtPath(
  tree: JsonTree,
  path: JsonNodePath,
  updater: (node: JsonNode) => JsonNode,
): JsonTree {
  if (!tree) return tree
  const next = cloneTree(tree)

  if (!Array.isArray(next) && path.length === 0) {
    return updater(next as JsonNode)
  }

  const target = getNodeAtPath(next, path)
  if (!target) return tree
  const updated = updater(target)

  if (Array.isArray(next)) {
    const container = resolveContainerForPath(next, path)
    if (!container) return tree
    container.container[container.index] = updated
    return next
  }

  if (path.length === 0) return updated
  const container = resolveContainerForPath(next, path)
  if (!container) return tree
  container.container[container.index] = updated
  return next
}

export function setNodePropByPath(
  tree: JsonTree,
  nodePath: JsonNodePath,
  propPath: string,
  value: unknown,
): JsonTree {
  if (!propPath.trim()) return tree
  return updateNodeAtPath(tree, nodePath, (node) => {
    const props = { ...((node.props as JsonNode | undefined) || {}) }
    const parts = propPath.split('.').map((p) => p.trim()).filter(Boolean)
    let curr: JsonNode = props
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i]
      if (i === parts.length - 1) {
        if (value === undefined) {
          delete curr[key]
        } else {
          curr[key] = value
        }
      } else {
        const nextVal = curr[key]
        curr[key] = nextVal && typeof nextVal === 'object' && !Array.isArray(nextVal) ? { ...nextVal } : {}
        curr = curr[key] as JsonNode
      }
    }
    return { ...node, props }
  })
}

export function replaceNodeProps(tree: JsonTree, nodePath: JsonNodePath, props: JsonNode): JsonTree {
  return updateNodeAtPath(tree, nodePath, (node) => ({ ...node, props: { ...(props || {}) } }))
}

export function duplicateNodeAtPath(tree: JsonTree, path: JsonNodePath): JsonTree {
  if (!tree || !path.length) return tree
  const next = cloneTree(tree)
  const container = resolveContainerForPath(next, path)
  if (!container) return tree
  const original = container.container[container.index]
  if (!original) return tree
  container.container.splice(container.index + 1, 0, cloneTree(original))
  return next
}

export function deleteNodeAtPath(tree: JsonTree, path: JsonNodePath): JsonTree {
  if (!tree) return tree
  if (!path.length) return null

  const next = cloneTree(tree)
  if (Array.isArray(next) && path.length === 1) {
    ;(next as JsonNode[]).splice(path[0], 1)
    return next
  }

  const container = resolveContainerForPath(next, path)
  if (!container) return tree
  container.container.splice(container.index, 1)
  return next
}

export function moveNodeAtPath(tree: JsonTree, path: JsonNodePath, direction: NodeMoveDirection): JsonTree {
  if (!tree || !path.length) return tree

  const next = cloneTree(tree)
  const container = resolveContainerForPath(next, path)
  if (!container) return tree

  const fromIndex = container.index
  const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1
  if (fromIndex < 0 || toIndex < 0 || toIndex >= container.container.length) return tree

  const [moved] = container.container.splice(fromIndex, 1)
  if (!moved) return tree
  container.container.splice(toIndex, 0, moved)
  return next
}

export function moveNodeRelativeToPath(
  tree: JsonTree,
  sourcePath: JsonNodePath,
  targetPath: JsonNodePath,
  placement: NodeDropPlacement,
): JsonTree {
  if (!tree || !sourcePath.length || !targetPath.length) return tree
  if (sourcePath.length !== targetPath.length) return tree
  if (sourcePath.every((v, i) => v === targetPath[i])) return tree

  const sameParent = sourcePath.slice(0, -1).every((v, i) => v === targetPath[i])
  if (!sameParent) return tree

  const next = cloneTree(tree)
  const container = resolveContainerForPath(next, sourcePath)
  if (!container) return tree

  const sourceIndex = sourcePath[sourcePath.length - 1]
  const targetIndex = targetPath[targetPath.length - 1]
  if (sourceIndex < 0 || sourceIndex >= container.container.length) return tree
  if (targetIndex < 0 || targetIndex >= container.container.length) return tree

  const [moved] = container.container.splice(sourceIndex, 1)
  if (!moved) return tree

  let insertIndex = placement === 'before' ? targetIndex : targetIndex + 1
  if (sourceIndex < insertIndex) insertIndex -= 1
  if (insertIndex < 0) insertIndex = 0
  if (insertIndex > container.container.length) insertIndex = container.container.length

  container.container.splice(insertIndex, 0, moved)
  return next
}
