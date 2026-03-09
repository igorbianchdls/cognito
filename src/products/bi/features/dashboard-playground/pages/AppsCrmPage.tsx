'use client'

import { useCallback } from 'react'

import { DataProvider, useData } from '@/products/bi/json-render/context'
import JsonEditorPanel from '@/products/bi/features/dashboard-editor/components/JsonEditorPanel'
import JsonPreviewPanel from '@/products/bi/features/dashboard-editor/components/JsonPreviewPanel'
import ManagersPanel from '@/products/bi/features/dashboard-editor/components/ManagersPanel'
import PropertiesPanel from '@/products/bi/features/dashboard-editor/components/PropertiesPanel'
import useDashboardVisualEditor from '@/products/bi/features/dashboard-editor/hooks/useDashboardVisualEditor'
import {
  refreshAppsCrmData,
  useAppsCrmBootstrap,
} from '@/products/bi/features/dashboard-playground/hooks/useAppsData'
import useDslTemplateEditor from '@/products/bi/features/dashboard-editor/hooks/useDslTemplateEditor'
import type { DateRange } from '@/products/bi/shared/types'
import { APPS_CRM_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsCrmTemplate'

function AppsCrmPlayground() {
  const { data, setData, getValueByPath } = useData()
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
  } = useDslTemplateEditor(APPS_CRM_TEMPLATE_DSL)
  const visualEditor = useDashboardVisualEditor({
    onDuplicateNode: duplicateNode,
    onDeleteNode: deleteNode,
    onMoveNode: moveNode,
    onMoveNodeRelative: moveNodeRelative,
  })

  useAppsCrmBootstrap(setData)

  const handleAction = useCallback(
    (action: any) => {
      if (action?.type !== 'refresh_data') return

      const dateRange = getValueByPath('filters.dateRange', undefined) as DateRange | undefined
      void refreshAppsCrmData(setData, dateRange)
    },
    [getValueByPath, setData],
  )

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
        dataPreview={data}
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

export default function AppsCrmPage() {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps — CRM</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em CRM com dados reais.</p>

        <DataProvider initialData={{ crm: { dashboard: {}, kpis: {} } }}>
          <AppsCrmPlayground />
        </DataProvider>
      </div>
    </div>
  )
}
