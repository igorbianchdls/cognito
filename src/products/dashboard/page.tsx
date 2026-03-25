'use client'

import { useState } from 'react'

import { DataProvider } from '@/products/bi/json-render/context'
import { APPS_THEME_OPTIONS } from '@/products/bi/shared/themeOptions'
import { DashboardThemeModal } from '@/products/dashboard/theme-modal'
import { DashboardWorkspace } from '@/products/dashboard/workspace/DashboardWorkspace'

export default function DashboardPage() {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [draftThemeName, setDraftThemeName] = useState('dark')
  const [appliedThemeName, setAppliedThemeName] = useState('dark')
  const [themeModalBaseName, setThemeModalBaseName] = useState('dark')

  return (
    <DataProvider initialData={{ ui: {}, filters: {}, dashboard: {} }}>
      <>
        <DashboardWorkspace
          appliedThemeName={appliedThemeName}
          onOpenTheme={() => {
            setThemeModalBaseName(appliedThemeName)
            setDraftThemeName(appliedThemeName)
            setIsThemeModalOpen(true)
          }}
        />
        <DashboardThemeModal
          isOpen={isThemeModalOpen}
          onClose={() => {
            setDraftThemeName(themeModalBaseName)
            setAppliedThemeName(themeModalBaseName)
            setIsThemeModalOpen(false)
          }}
          onConfirm={() => {
            setAppliedThemeName(draftThemeName)
            setIsThemeModalOpen(false)
          }}
          onRevert={() => {
            setDraftThemeName(themeModalBaseName)
            setAppliedThemeName(themeModalBaseName)
          }}
          onSelect={(themeName) => {
            setDraftThemeName(themeName)
            setAppliedThemeName(themeName)
          }}
          selectedTheme={draftThemeName}
          revertDisabled={draftThemeName === themeModalBaseName}
          themes={APPS_THEME_OPTIONS}
        />
      </>
    </DataProvider>
  )
}
