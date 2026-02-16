'use client'

import { useCallback, useState } from 'react'
import type { JsonTree } from '@/products/apps/shared/types'

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

  return {
    jsonText,
    parseError,
    tree,
    setJsonText,
    setTree,
    onChangeText,
    onFormat,
    onReset,
  }
}
