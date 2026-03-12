'use client'

import { useCallback, useState } from 'react'
import type {
  JsonNodePath,
  NodeDropPlacement,
  NodeMenuAction,
  NodeMoveDirection,
} from '@/products/bi/features/dashboard-editor/types/editor-types'

type UseDashboardVisualEditorArgs = {
  onDuplicateNode: (path: JsonNodePath) => void
  onDeleteNode: (path: JsonNodePath) => void
  onMoveNode: (path: JsonNodePath, direction: NodeMoveDirection) => boolean
  onMoveNodeRelative: (
    sourcePath: JsonNodePath,
    targetPath: JsonNodePath,
    placement: NodeDropPlacement,
  ) => boolean
}

export default function useDashboardVisualEditor({
  onDuplicateNode,
  onDeleteNode,
  onMoveNode,
  onMoveNodeRelative,
}: UseDashboardVisualEditorArgs) {
  const [selectedPath, setSelectedPath] = useState<JsonNodePath | null>(null)
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)

  const openPropertiesFor = useCallback((path: JsonNodePath) => {
    setSelectedPath(path)
    setIsPropertiesOpen(true)
  }, [])

  const closeProperties = useCallback(() => {
    setIsPropertiesOpen(false)
    setSelectedPath(null)
  }, [])

  const handleNodeAction = useCallback((path: JsonNodePath, action: NodeMenuAction) => {
    if (action === 'edit') {
      openPropertiesFor(path)
      return
    }
    if (action === 'duplicate') {
      onDuplicateNode(path)
      setSelectedPath([...path.slice(0, -1), path[path.length - 1] + 1])
      return
    }
    if (action === 'delete') {
      onDeleteNode(path)
      setIsPropertiesOpen(false)
      setSelectedPath((prev) => {
        if (!prev) return null
        const deletingAncestor =
          prev.length >= path.length && path.every((v, i) => prev[i] === v)
        return deletingAncestor ? null : prev
      })
    }
  }, [onDeleteNode, onDuplicateNode, openPropertiesFor])

  const handleNodeMove = useCallback((path: JsonNodePath, direction: NodeMoveDirection) => {
    if (!path.length) return

    const didMove = onMoveNode(path, direction)
    if (!didMove) return

    const delta = direction === 'up' ? -1 : 1
    setSelectedPath((prev) => {
      if (!prev) return prev
      const isMovedSubtreeSelected =
        prev.length >= path.length && path.every((segment, index) => prev[index] === segment)

      if (!isMovedSubtreeSelected) return prev
      const next = [...prev]
      next[path.length - 1] = next[path.length - 1] + delta
      return next
    })
  }, [onMoveNode])

  const handleNodeDropReorder = useCallback((
    sourcePath: JsonNodePath,
    targetPath: JsonNodePath,
    placement: NodeDropPlacement,
  ) => {
    if (!sourcePath.length || !targetPath.length) return
    const didMove = onMoveNodeRelative(sourcePath, targetPath, placement)
    if (!didMove) return

    const movedIndex =
      placement === 'before'
        ? targetPath[targetPath.length - 1] - (sourcePath[sourcePath.length - 1] < targetPath[targetPath.length - 1] ? 1 : 0)
        : targetPath[targetPath.length - 1] + (sourcePath[sourcePath.length - 1] < targetPath[targetPath.length - 1] ? 0 : 1)

    setSelectedPath((prev) => {
      if (!prev) return prev
      const isMovedSubtreeSelected =
        prev.length >= sourcePath.length && sourcePath.every((segment, index) => prev[index] === segment)
      if (!isMovedSubtreeSelected) return prev
      const next = [...prev]
      next[sourcePath.length - 1] = movedIndex
      return next
    })
  }, [onMoveNodeRelative])

  return {
    selectedPath,
    setSelectedPath,
    isPropertiesOpen,
    setIsPropertiesOpen,
    openPropertiesFor,
    closeProperties,
    handleNodeAction,
    handleNodeMove,
    handleNodeDropReorder,
  }
}
