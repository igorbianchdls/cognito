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
import { APPS_METAADS_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsMetaAdsTemplate'

function AppsMetaAdsPlayground() {
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
  } = useDslTemplateEditor(APPS_METAADS_TEMPLATE_DSL)

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

export default function AppsMetaAdsPage() {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps — Meta Ads</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em performance de mídia paga (Meta Ads) com dados simulados DTC.</p>

        <DataProvider initialData={{ trafegopago: { dashboard: {}, kpis: {} }, filters: {} }}>
          <AppsMetaAdsPlayground />
        </DataProvider>
      </div>
    </div>
  )
}

