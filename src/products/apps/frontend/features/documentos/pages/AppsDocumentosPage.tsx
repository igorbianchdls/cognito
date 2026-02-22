'use client'

import { useCallback } from 'react'

import { DataProvider, useData } from '@/products/apps/bi/json-render/context'
import JsonEditorPanel from '@/products/apps/frontend/components/JsonEditorPanel'
import JsonPreviewPanel from '@/products/apps/frontend/components/JsonPreviewPanel'
import ManagersPanel from '@/products/apps/frontend/components/ManagersPanel'
import DocumentosPdfExportButton from '@/products/apps/frontend/features/documentos/components/DocumentosPdfExportButton'
import {
  refreshAppsDocumentosData,
  useAppsDocumentosBootstrap,
} from '@/products/apps/frontend/hooks/useAppsData'
import useJsonTemplateEditor from '@/products/apps/frontend/hooks/useJsonTemplateEditor'
import type { DateRange } from '@/products/apps/shared/types'
import { APPS_DOCUMENTOS_TEMPLATE_TEXT } from '@/products/apps/shared/templates/appsDocumentosTemplate'

const INITIAL_APPS_DOCUMENTOS_DATA = {
  documentos: {
    dashboard: {},
    kpis: {},
  },
}

function AppsDocumentosPlayground() {
  const { data, setData, getValueByPath } = useData()
  const {
    jsonText,
    parseError,
    tree,
    setJsonText,
    setTree,
    onChangeText,
    onFormat,
    onReset,
  } = useJsonTemplateEditor(APPS_DOCUMENTOS_TEMPLATE_TEXT)

  useAppsDocumentosBootstrap(setData)

  const handleAction = useCallback(
    (action: any) => {
      if (action?.type !== 'refresh_data') return

      const dateRange = getValueByPath('filters.dateRange', undefined) as DateRange | undefined
      void refreshAppsDocumentosData(setData, dateRange)
    },
    [getValueByPath, setData],
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
      <JsonEditorPanel
        jsonText={jsonText}
        parseError={parseError}
        onChangeText={onChangeText}
        onFormat={onFormat}
        onReset={onReset}
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
        actionHint="Ações: Atualizar / Baixar PDF"
        toolbar={(
          <DocumentosPdfExportButton
            templateJson={jsonText}
            sampleData={data}
            disabled={Boolean(parseError) || !tree}
          />
        )}
      />
    </div>
  )
}

export default function AppsDocumentosPage() {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps — Documentos</h1>
        <p className="text-sm text-gray-600 mb-6">Editor JSON para templates e dashboards do domínio Documentos.</p>

        <DataProvider initialData={INITIAL_APPS_DOCUMENTOS_DATA}>
          <AppsDocumentosPlayground />
        </DataProvider>
      </div>
    </div>
  )
}
