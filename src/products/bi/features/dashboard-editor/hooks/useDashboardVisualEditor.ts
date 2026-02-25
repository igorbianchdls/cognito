'use client'

import { useCallback, useState } from 'react'
import type { JsonNodePath, NodeMenuAction } from '@/products/bi/features/dashboard-editor/types/editor-types'

type UseDashboardVisualEditorArgs = {
  onDuplicateNode: (path: JsonNodePath) => void
  onDeleteNode: (path: JsonNodePath) => void
}

export default function useDashboardVisualEditor({
  onDuplicateNode,
  onDeleteNode,
}: UseDashboardVisualEditorArgs) {
  const [selectedPath, setSelectedPath] = useState<JsonNodePath | null>(null)
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false)

  const openPropertiesFor = useCallback((path: JsonNodePath) => {
    setSelectedPath(path)
    setIsPropertiesOpen(true)
  }, [])

  const closeProperties = useCallback(() => {
    setIsPropertiesOpen(false)
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

  return {
    selectedPath,
    setSelectedPath,
    isPropertiesOpen,
    setIsPropertiesOpen,
    openPropertiesFor,
    closeProperties,
    handleNodeAction,
  }
}
