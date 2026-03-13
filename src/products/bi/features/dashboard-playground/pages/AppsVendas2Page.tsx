'use client'

import { useState } from 'react'
import { Editor } from '@monaco-editor/react'

import { DataProvider } from '@/products/bi/json-render/context'
import {
  JsonEditorPanel,
  JsonPreviewPanel,
  ManagersPanel,
  PropertiesPanel,
  useDashboardVisualEditor,
  useDslTemplateEditor,
} from '@/products/bi/features/dashboard-editor'
import { APPS_VENDAS2_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsVendas2Template'

function AppsVendas2Playground() {
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
  } = useDslTemplateEditor(APPS_VENDAS2_TEMPLATE_DSL)
  const visualEditor = useDashboardVisualEditor({
    onDuplicateNode: duplicateNode,
    onDeleteNode: deleteNode,
    onMoveNode: moveNode,
    onMoveNodeRelative: moveNodeRelative,
  })

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
          ) : null}
        </div>

        <div className="min-h-0 flex-1">
          {rightTab === 'preview' ? (
            <JsonPreviewPanel
              className="min-h-0 h-full flex flex-col"
              hideHeader
              tree={tree}
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
              <Editor
                height="100%"
                language="html"
                value={dslText}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  insertSpaces: true,
                  wordWrap: 'on',
                  lineHeight: 22,
                  fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
                  smoothScrolling: true,
                  padding: { top: 16, bottom: 16 },
                }}
                theme="vs-light"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AppsVendas2Page() {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps — Vendas 2</h1>
        <p className="text-sm text-gray-600 mb-6">Template de teste com tabs no sidebar.</p>

        <DataProvider initialData={{ ui: { activeTab: 'resumo' } }}>
          <AppsVendas2Playground />
        </DataProvider>
      </div>
    </div>
  )
}
