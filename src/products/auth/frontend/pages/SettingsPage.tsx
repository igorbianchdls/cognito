'use client'

import PageContainer from '@/components/layout/PageContainer'
import { AppShell } from '@/products/plataforma/frontend/shell/AppShell'
import { CategoriaConfig } from '@/products/plataforma/frontend/empresa/CategoriaConfig'
import SettingsPanel from '@/products/auth/frontend/components/SettingsPanel'
import type { SettingsState } from '@/products/auth/shared/settingsContracts'

type SettingsPageProps = {
  initialState: SettingsState
}

export default function SettingsPage({ initialState }: SettingsPageProps) {
  return (
    <AppShell insetClassName="h-svh overflow-hidden bg-slate-100">
        <PageContainer className="h-auto min-h-0 flex-1 overflow-y-auto bg-slate-100">
          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3"><a href="/whatsapp" className="text-sm font-medium text-emerald-700 underline">Conectar WhatsApp Business</a></div>
            <CategoriaConfig />
            <SettingsPanel initialState={initialState} variant="page" />
          </main>
        </PageContainer>
    </AppShell>
  )
}
