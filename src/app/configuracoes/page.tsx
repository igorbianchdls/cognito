import { redirect } from 'next/navigation'

import { getSettingsState } from '@/products/auth/server/settingsRepository'
import { getClerkTenantBootstrapState } from '@/products/auth/server/authTenantResolver'
import SettingsPage from '@/products/auth/frontend/pages/SettingsPage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ConfiguracoesPage() {
  const bootstrap = await getClerkTenantBootstrapState()
  if (!bootstrap) redirect('/sign-in')
  if (bootstrap.needsOnboarding || !bootstrap.activeTenant) redirect('/onboarding')

  const settings = await getSettingsState({
    sharedUserId: bootstrap.sharedUserId,
    tenantId: bootstrap.activeTenant.tenantId,
  })

  return <SettingsPage initialState={settings} />
}
