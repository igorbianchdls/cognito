'use client'

import { useCallback, useMemo, useState } from 'react'

import { DataProvider } from '@/products/bi/json-render/context'
import JsonEditorPanel from '@/products/bi/features/dashboard-editor/components/JsonEditorPanel'
import JsonPreviewPanel from '@/products/bi/features/dashboard-editor/components/JsonPreviewPanel'
import { parseGoogleAdsDslToTree } from '@/products/bi/features/dashboard-playground/parsers/googleAdsDslParser'
import { APPS_GOOGLEADS_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsGoogleAdsTemplate'

function AppsGoogleAdsPlayground() {
  const [dslText, setDslText] = useState(APPS_GOOGLEADS_TEMPLATE_DSL)

  const { tree, parseError } = useMemo(() => {
    try {
      return {
        tree: parseGoogleAdsDslToTree(dslText),
        parseError: null as string | null,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        tree: [],
        parseError: message,
      }
    }
  }, [dslText])

  const handleFormatDsl = useCallback(() => {
    // DSL has custom syntax; keep raw text without auto-format.
    setDslText((current) => current)
  }, [])

  const handleResetDsl = useCallback(() => {
    setDslText(APPS_GOOGLEADS_TEMPLATE_DSL)
  }, [])

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
        onFormat={handleFormatDsl}
        onReset={handleResetDsl}
        showFormatButton={false}
      />
      <JsonPreviewPanel
        tree={tree}
        onAction={handleAction}
        actionHint="Ações: Atualizar"
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

