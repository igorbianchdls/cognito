'use client'

import { useCallback } from 'react'

import { DataProvider, useData } from '@/products/apps/bi/json-render/context'
import JsonEditorPanel from '@/products/apps/frontend/components/JsonEditorPanel'
import JsonPreviewPanel from '@/products/apps/frontend/components/JsonPreviewPanel'
import {
  refreshAppsHomeData,
  useAppsHomeBootstrap,
} from '@/products/apps/frontend/hooks/useAppsData'
import useJsonTemplateEditor from '@/products/apps/frontend/hooks/useJsonTemplateEditor'
import type { DateRange } from '@/products/apps/shared/types'
import { APPS_HOME_TEMPLATE_TEXT } from '@/products/apps/shared/templates/appsHomeTemplate'

const INITIAL_APPS_HOME_DATA = {
  revenue: 125000,
  growth: 0.15,
  salesByMonth: [
    { month: 'Jan', total: 12000 },
    { month: 'Fev', total: 18000 },
    { month: 'Mar', total: 15000 },
    { month: 'Abr', total: 22000 },
    { month: 'Mai', total: 17500 },
  ],
  categoryShare: [
    { category: 'A', value: 0.35 },
    { category: 'B', value: 0.25 },
    { category: 'C', value: 0.2 },
    { category: 'D', value: 0.12 },
    { category: 'E', value: 0.08 },
  ],
  financeiro: { dashboard: {} },
  vendas: { dashboard: {} },
  compras: { dashboard: {} },
}

function AppsHomePlayground() {
  const { data, setData, getValueByPath } = useData()
  const { jsonText, parseError, tree, onChangeText, onFormat, onReset } =
    useJsonTemplateEditor(APPS_HOME_TEMPLATE_TEXT)

  useAppsHomeBootstrap(setData)

  const handleAction = useCallback(
    (action: any) => {
      if (action?.type === 'refresh_data') {
        const dateRange = getValueByPath('filters.dateRange', undefined) as DateRange | undefined
        void refreshAppsHomeData(setData, dateRange)
        return
      }

      if (action?.type === 'export_report') {
        alert('Exportar para PDF (stub)')
        return
      }

      console.warn('Unhandled action:', action)
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
        dataPreview={data}
      />
      <JsonPreviewPanel
        tree={tree}
        onAction={handleAction}
        actionHint="Ações: Atualizar / Exportar PDF"
      />
    </div>
  )
}

export default function AppsHomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps (JSON Render)</h1>
        <p className="text-sm text-gray-600 mb-6">Edite o JSON à esquerda e veja o render à direita.</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <a href="/apps/financeiro" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">Financeiro</a>
          <a href="/apps/vendas" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">Vendas</a>
          <a href="/apps/compras" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">Compras</a>
          <a href="/apps/estoque" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">Estoque</a>
          <a href="/apps/crm" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">CRM</a>
          <a href="/apps/documentos" className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">Documentos</a>
        </div>

        <DataProvider initialData={INITIAL_APPS_HOME_DATA}>
          <AppsHomePlayground />
        </DataProvider>
      </div>
    </div>
  )
}
