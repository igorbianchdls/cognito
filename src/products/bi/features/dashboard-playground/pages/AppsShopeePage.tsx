'use client'

import { useCallback } from 'react'

import { DataProvider } from '@/products/bi/json-render/context'
import {
  JsonEditorPanel,
  JsonPreviewPanel,
  ManagersPanel,
  PropertiesPanel,
  useDashboardVisualEditor,
  useDslTemplateEditor,
} from '@/products/bi/features/dashboard-editor'
import { APPS_SHOPEE_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsShopeeTemplate'

function AppsShopeePlayground() {
  const {
    dslText,
    jsonText,
    parseError,
    tree,
    setJsonText,
    setTree,
    onChangeText,
    onFormat,
    onReset,
    duplicateNode,
    deleteNode,
    moveNode,
    moveNodeRelative,
    setNodeProp,
    replaceNodeProps,
  } = useDslTemplateEditor(APPS_SHOPEE_TEMPLATE_DSL)

  const visualEditor = useDashboardVisualEditor({
    onDuplicateNode: duplicateNode,
    onDeleteNode: deleteNode,
    onMoveNode: moveNode,
    onMoveNodeRelative: moveNodeRelative,
  })

  const handleAction = useCallback((action: any) => {
    if (action?.type !== 'refresh_data') return
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
      <JsonEditorPanel
        title="DSL"
        jsonText={dslText}
        parseError={parseError}
        onChangeText={onChangeText}
        onFormat={onFormat}
        onReset={onReset}
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

export default function AppsShopeePage() {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps — Shopee</h1>
        <p className="text-sm text-gray-600 mb-6">Dashboard completo de e-commerce para Shopee.</p>

        <DataProvider initialData={{ ecommerce: { dashboard: {}, kpis: {} }, filters: { plataforma: 'shopee' } }}>
          <AppsShopeePlayground />
        </DataProvider>
      </div>
    </div>
  )
}
