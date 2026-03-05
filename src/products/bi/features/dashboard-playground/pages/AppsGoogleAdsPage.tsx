'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { DataProvider } from '@/products/bi/json-render/context'
import JsonEditorPanel from '@/products/bi/features/dashboard-editor/components/JsonEditorPanel'
import JsonPreviewPanel from '@/products/bi/features/dashboard-editor/components/JsonPreviewPanel'
import ManagersPanel from '@/products/bi/features/dashboard-editor/components/ManagersPanel'
import PropertiesPanel from '@/products/bi/features/dashboard-editor/components/PropertiesPanel'
import useDashboardVisualEditor from '@/products/bi/features/dashboard-editor/hooks/useDashboardVisualEditor'
import {
  deleteNodeAtPath,
  duplicateNodeAtPath,
  moveNodeAtPath,
  moveNodeRelativeToPath,
  replaceNodeProps as replaceNodePropsInTree,
  setNodePropByPath,
} from '@/products/bi/features/dashboard-editor/lib/jsonTreeOps'
import { parseGoogleAdsDslToTree } from '@/products/bi/features/dashboard-playground/parsers/googleAdsDslParser'
import { APPS_GOOGLEADS_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsGoogleAdsTemplate'
import type { JsonTree } from '@/products/bi/shared/types'
import type {
  JsonNodePath,
  NodeDropPlacement,
  NodeMoveDirection,
} from '@/products/bi/features/dashboard-editor/types/editor-types'

function AppsGoogleAdsPlayground() {
  const [dslText, setDslText] = useState(APPS_GOOGLEADS_TEMPLATE_DSL)
  const [tree, setTree] = useState<JsonTree>([])

  const { parsedTree, parseError } = useMemo(() => {
    try {
      return {
        parsedTree: parseGoogleAdsDslToTree(dslText),
        parseError: null as string | null,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        parsedTree: null as JsonTree,
        parseError: message,
      }
    }
  }, [dslText])

  useEffect(() => {
    if (!parseError && parsedTree) {
      setTree(parsedTree)
    }
  }, [parseError, parsedTree])

  const handleResetDsl = useCallback(() => {
    setDslText(APPS_GOOGLEADS_TEMPLATE_DSL)
    try {
      setTree(parseGoogleAdsDslToTree(APPS_GOOGLEADS_TEMPLATE_DSL))
    } catch {
      // ignore: template constant should always be valid
    }
  }, [])

  const jsonText = useMemo(() => (tree == null ? '' : JSON.stringify(tree, null, 2)), [tree])

  const setJsonText = useCallback((nextText: string) => {
    try {
      const parsed = JSON.parse(nextText) as JsonTree
      setTree(parsed)
    } catch {
      // ManagersPanel always writes valid JSON from internal changes.
    }
  }, [])

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

  const visualEditor = useDashboardVisualEditor({
    onDuplicateNode: duplicateNode,
    onDeleteNode: deleteNode,
    onMoveNode: moveNode,
    onMoveNodeRelative: moveNodeRelative,
  })

  const handleAction = useCallback((action: any) => {
    if (action?.type !== 'refresh_data') return
    // trafegopago charts consultam dataQuery diretamente; o datePicker atualiza filtros no DataProvider
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
      <JsonEditorPanel
        title="DSL"
        jsonText={dslText}
        parseError={parseError}
        onChangeText={setDslText}
        onReset={handleResetDsl}
        showFormatButton={false}
        extra={
          <ManagersPanel
            jsonText={jsonText}
            setJsonText={setJsonText}
            setTree={setTree}
            disabled={Boolean(parseError)}
          />
        }
      />
      <JsonPreviewPanel
        tree={tree}
        onAction={handleAction}
        actionHint="Ações: Atualizar"
        visualEditor={{
          enabled: true,
          selectedPath: visualEditor.selectedPath,
          onNodeAction: visualEditor.handleNodeAction,
          onNodeMove: visualEditor.handleNodeMove,
          onNodeDropReorder: visualEditor.handleNodeDropReorder,
        }}
        propertiesPanel={
          visualEditor.isPropertiesOpen ? (
            <PropertiesPanel
              tree={tree}
              selectedPath={visualEditor.selectedPath}
              isOpen={visualEditor.isPropertiesOpen}
              onClose={visualEditor.closeProperties}
              onSetNodeProp={setNodeProp}
              onReplaceNodeProps={replaceNodeProps}
            />
          ) : null
        }
      />
    </div>
  )
}

export default function AppsGoogleAdsPage() {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps — Google Ads</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em performance de mídia paga (Google Ads) com dados simulados DTC.</p>

        <DataProvider initialData={{ trafegopago: { dashboard: {}, kpis: {} }, filters: {} }}>
          <AppsGoogleAdsPlayground />
        </DataProvider>
      </div>
    </div>
  )
}

