'use client'

import { useCallback, useMemo, useState } from 'react'
import type { JsonTree } from '@/products/bi/shared/types'
import type {
  JsonNodePath,
  NodeDropPlacement,
  NodeMoveDirection,
} from '@/products/bi/features/dashboard-editor/types/editor-types'
import {
  deleteNodeAtPath,
  duplicateNodeAtPath,
  moveNodeAtPath,
  moveNodeRelativeToPath,
  replaceNodeProps as replaceNodePropsInTree,
  setNodePropByPath,
} from '@/products/bi/features/dashboard-editor/lib/jsonTreeOps'
import { parseDashboardTemplateDslToTree } from '@/products/bi/features/dashboard-playground/parsers/dashboardTemplateDslParser'

function parseDsl(text: string): { tree: JsonTree; parseError: string | null } {
  try {
    return {
      tree: parseDashboardTemplateDslToTree(text),
      parseError: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { tree: [], parseError: message }
  }
}

export default function useDslTemplateEditor(initialTemplateDsl: string) {
  const initial = useMemo(() => parseDsl(initialTemplateDsl), [initialTemplateDsl])
  const [dslText, setDslText] = useState<string>(initialTemplateDsl)
  const [parseError, setParseError] = useState<string | null>(initial.parseError)
  const [tree, setTree] = useState<JsonTree>(initial.tree)

  const replaceTree = useCallback((nextTree: JsonTree) => {
    setTree(nextTree)
  }, [])

  const onChangeText = useCallback((nextText: string) => {
    setDslText(nextText)
    const parsed = parseDsl(nextText)
    if (parsed.parseError) {
      setParseError(parsed.parseError)
      return
    }
    setParseError(null)
    setTree(parsed.tree)
  }, [])

  const onFormat = useCallback(() => {
    // DSL has custom syntax; keep as-is.
    setDslText((current) => current)
  }, [])

  const onReset = useCallback(() => {
    const parsed = parseDsl(initialTemplateDsl)
    setDslText(initialTemplateDsl)
    setParseError(parsed.parseError)
    setTree(parsed.tree)
  }, [initialTemplateDsl])

  const duplicateNode = useCallback((path: JsonNodePath) => {
    setTree((prev) => duplicateNodeAtPath(prev, path))
  }, [])

  const deleteNode = useCallback((path: JsonNodePath) => {
    setTree((prev) => deleteNodeAtPath(prev, path))
  }, [])

  const moveNode = useCallback((path: JsonNodePath, direction: NodeMoveDirection) => {
    let moved = false
    setTree((prev) => {
      const next = moveNodeAtPath(prev, path, direction)
      moved = next !== prev
      return next
    })
    return moved
  }, [])

  const moveNodeRelative = useCallback((
    sourcePath: JsonNodePath,
    targetPath: JsonNodePath,
    placement: NodeDropPlacement,
  ) => {
    let moved = false
    setTree((prev) => {
      const next = moveNodeRelativeToPath(prev, sourcePath, targetPath, placement)
      moved = next !== prev
      return next
    })
    return moved
  }, [])

  const setNodeProp = useCallback((path: JsonNodePath, propPath: string, value: unknown) => {
    setTree((prev) => setNodePropByPath(prev, path, propPath, value))
  }, [])

  const replaceNodeProps = useCallback((path: JsonNodePath, props: Record<string, any>) => {
    setTree((prev) => replaceNodePropsInTree(prev, path, props))
  }, [])

  const jsonText = useMemo(() => (tree == null ? '' : JSON.stringify(tree, null, 2)), [tree])

  const setJsonText = useCallback((nextText: string) => {
    try {
      const parsed = JSON.parse(nextText) as JsonTree
      setTree(parsed)
    } catch {
      // Managers panel writes valid JSON from object updates.
    }
  }, [])

  return {
    dslText,
    parseError,
    tree,
    setTree,
    jsonText,
    setJsonText,
    replaceTree,
    duplicateNode,
    deleteNode,
    moveNode,
    moveNodeRelative,
    setNodeProp,
    replaceNodeProps,
    onChangeText,
    onFormat,
    onReset,
  }
}
