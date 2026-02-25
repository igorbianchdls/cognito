'use client'

import { useCallback, useState } from 'react'
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

function parseTemplate(text: string): JsonTree {
  try {
    return JSON.parse(text) as JsonTree
  } catch {
    return null
  }
}

export default function useJsonTemplateEditor(initialTemplateText: string) {
  const [jsonText, setJsonText] = useState<string>(initialTemplateText)
  const [parseError, setParseError] = useState<string | null>(null)
  const [tree, setTree] = useState<JsonTree>(() => parseTemplate(initialTemplateText))

  const replaceTree = useCallback((nextTree: JsonTree) => {
    setTree(nextTree)
    setJsonText(nextTree == null ? '' : JSON.stringify(nextTree, null, 2))
    setParseError(null)
  }, [])

  const onChangeText = useCallback((nextText: string) => {
    setJsonText(nextText)

    try {
      setTree(JSON.parse(nextText) as JsonTree)
      setParseError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON'
      setParseError(message)
    }
  }, [])

  const onFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText)
      setJsonText(JSON.stringify(parsed, null, 2))
      setParseError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON'
      setParseError(message)
    }
  }, [jsonText])

  const onReset = useCallback(() => {
    setJsonText(initialTemplateText)
    setTree(parseTemplate(initialTemplateText))
    setParseError(null)
  }, [initialTemplateText])

  const duplicateNode = useCallback((path: JsonNodePath) => {
    setTree((prev) => {
      const next = duplicateNodeAtPath(prev, path)
      if (next !== prev) {
        setJsonText(next == null ? '' : JSON.stringify(next, null, 2))
        setParseError(null)
      }
      return next
    })
  }, [])

  const deleteNode = useCallback((path: JsonNodePath) => {
    setTree((prev) => {
      const next = deleteNodeAtPath(prev, path)
      if (next !== prev) {
        setJsonText(next == null ? '' : JSON.stringify(next, null, 2))
        setParseError(null)
      }
      return next
    })
  }, [])

  const moveNode = useCallback((path: JsonNodePath, direction: NodeMoveDirection) => {
    const next = moveNodeAtPath(tree, path, direction)
    if (next === tree) return false
    replaceTree(next)
    return true
  }, [replaceTree, tree])

  const moveNodeRelative = useCallback((
    sourcePath: JsonNodePath,
    targetPath: JsonNodePath,
    placement: NodeDropPlacement,
  ) => {
    const next = moveNodeRelativeToPath(tree, sourcePath, targetPath, placement)
    if (next === tree) return false
    replaceTree(next)
    return true
  }, [replaceTree, tree])

  const setNodeProp = useCallback((path: JsonNodePath, propPath: string, value: unknown) => {
    setTree((prev) => {
      const next = setNodePropByPath(prev, path, propPath, value)
      if (next !== prev) {
        setJsonText(next == null ? '' : JSON.stringify(next, null, 2))
        setParseError(null)
      }
      return next
    })
  }, [])

  const replaceNodeProps = useCallback((path: JsonNodePath, props: Record<string, any>) => {
    setTree((prev) => {
      const next = replaceNodePropsInTree(prev, path, props)
      if (next !== prev) {
        setJsonText(next == null ? '' : JSON.stringify(next, null, 2))
        setParseError(null)
      }
      return next
    })
  }, [])

  return {
    jsonText,
    parseError,
    tree,
    setJsonText,
    setTree,
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
