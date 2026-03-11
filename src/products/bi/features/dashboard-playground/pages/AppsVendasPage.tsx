'use client'

import { useCallback, useState } from 'react'

import { DataProvider, useData } from '@/products/bi/json-render/context'
import {
  JsonEditorPanel,
  JsonPreviewPanel,
  ManagersPanel,
  PropertiesPanel,
  useDashboardVisualEditor,
  useDslTemplateEditor,
} from '@/products/bi/features/dashboard-editor'
import {
  refreshAppsVendasData,
  useAppsVendasBootstrap,
} from '@/products/bi/features/dashboard-playground/hooks/useAppsData'
import type { DateRange } from '@/products/bi/shared/types'
import { APPS_VENDAS_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsVendasTemplate'

function AppsVendasPlayground() {
  const { data, setData, getValueByPath } = useData()
  const [editModeEnabled, setEditModeEnabled] = useState(true)
  const [rightTab, setRightTab] = useState<'preview' | 'code'>('preview')
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
  } = useDslTemplateEditor(APPS_VENDAS_TEMPLATE_DSL)
  const visualEditor = useDashboardVisualEditor({
    onDuplicateNode: duplicateNode,
    onDeleteNode: deleteNode,
    onMoveNode: moveNode,
    onMoveNodeRelative: moveNodeRelative,
  })

  useAppsVendasBootstrap(setData)

  const handleAction = useCallback(
    (action: any) => {
      if (action?.type !== 'refresh_data') return

      const dateRange = getValueByPath('filters.dateRange', undefined) as DateRange | undefined
      void refreshAppsVendasData(setData, dateRange)
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
      <div className="md:col-span-4 min-h-0 h-full flex flex-col">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="inline-flex rounded-md border border-gray-300 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setRightTab('preview')}
              className={`rounded px-3 py-1.5 text-xs transition ${
                rightTab === 'preview'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => setRightTab('code')}
              className={`rounded px-3 py-1.5 text-xs transition ${
                rightTab === 'code'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Code
            </button>
          </div>
          {rightTab === 'preview' ? (
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500">Ações: Atualizar</div>
              <button
                type="button"
                onClick={() => setEditModeEnabled((prev) => !prev)}
                className={`rounded border px-2.5 py-1 text-xs transition ${
                  editModeEnabled
                    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {editModeEnabled ? 'Desativar edição' : 'Ativar edição'}
              </button>
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1">
          {rightTab === 'preview' ? (
            <JsonPreviewPanel
              className="min-h-0 h-full flex flex-col"
              hideHeader
              tree={tree}
              onAction={handleAction}
              visualEditor={{
                enabled: editModeEnabled,
                selectedPath: visualEditor.selectedPath,
                onNodeAction: visualEditor.handleNodeAction,
                onNodeMove: visualEditor.handleNodeMove,
                onNodeDropReorder: visualEditor.handleNodeDropReorder,
              }}
              propertiesPanel={
                editModeEnabled && visualEditor.isPropertiesOpen ? (
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
          ) : (
            <div className="h-full min-h-[420px] overflow-hidden rounded-md border border-gray-300 bg-white">
              <textarea
                value={dslText}
                readOnly
                spellCheck={false}
                className="h-full min-h-[420px] w-full resize-none border-0 bg-white p-4 font-mono text-xs text-gray-800 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AppsVendasPage() {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps — Vendas</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em Vendas com dados reais.</p>

        <DataProvider initialData={{ vendas: { dashboard: {}, kpis: {} } }}>
          <AppsVendasPlayground />
        </DataProvider>
      </div>
    </div>
  )
}
