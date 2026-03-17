'use client'

import { useState } from 'react'

import { DataProvider } from '@/products/bi/json-render/context'
import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import { APPS_VENDAS_TEMPLATE_DSL } from '@/products/bi/shared/templates/appsVendasTemplate'
import { DashboardThemeModal } from '@/products/dashboard/theme-modal'
import { DashboardWorkspace } from '@/products/dashboard/workspace/DashboardWorkspace'

export default function DashboardPage() {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [draftThemeName, setDraftThemeName] = useState('dark')
  const [appliedThemeName, setAppliedThemeName] = useState('dark')

  return (
    <DataProvider initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <>
        <DashboardWorkspace
          baseDsl={APPS_VENDAS_TEMPLATE_DSL}
          appliedThemeName={appliedThemeName}
          onOpenTheme={() => {
            setDraftThemeName(appliedThemeName)
            setIsThemeModalOpen(true)
          }}
        />
        <DashboardThemeModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          onConfirm={() => {
            setAppliedThemeName(draftThemeName)
            setIsThemeModalOpen(false)
          }}
          onSelect={setDraftThemeName}
          selectedTheme={draftThemeName}
          themes={APPS_THEME_OPTIONS}
        />
      </>
    </DataProvider>
  )
}
