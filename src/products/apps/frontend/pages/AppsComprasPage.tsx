'use client'

import { useCallback } from 'react'

import { DataProvider, useData } from '@/products/apps/bi/json-render/context'
import JsonEditorPanel from '@/products/apps/frontend/components/JsonEditorPanel'
import JsonPreviewPanel from '@/products/apps/frontend/components/JsonPreviewPanel'
import ManagersPanel from '@/products/apps/frontend/components/ManagersPanel'
import {
  refreshAppsComprasData,
  useAppsComprasBootstrap,
} from '@/products/apps/frontend/hooks/useAppsData'
import useJsonTemplateEditor from '@/products/apps/frontend/hooks/useJsonTemplateEditor'
import type { DateRange } from '@/products/apps/shared/types'
import { APPS_COMPRAS_TEMPLATE_TEXT } from '@/products/apps/shared/templates/appsComprasTemplate'

function AppsComprasPlayground() {
  const { setData, getValueByPath } = useData()
  const {
    jsonText,
    parseError,
    tree,
    setJsonText,
    setTree,
    onChangeText,
    onFormat,
    onReset,
  } = useJsonTemplateEditor(APPS_COMPRAS_TEMPLATE_TEXT)

  useAppsComprasBootstrap(setData)

  const handleAction = useCallback(
    (action: any) => {
      if (action?.type !== 'refresh_data') return

      const dateRange = getValueByPath('filters.dateRange', undefined) as DateRange | undefined
      void refreshAppsComprasData(setData, dateRange)
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
      />
      <JsonPreviewPanel tree={tree} onAction={handleAction} />
    </div>
  )
}

export default function AppsComprasPage() {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps — Compras</h1>
        <p className="text-sm text-gray-600 mb-6">Template focado em Compras com dados reais.</p>

        <DataProvider initialData={{ compras: { dashboard: {}, kpis: {} } }}>
          <AppsComprasPlayground />
        </DataProvider>
      </div>
    </div>
  )
}
