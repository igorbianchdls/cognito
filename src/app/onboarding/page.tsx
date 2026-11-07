import { redirect } from 'next/navigation'

import { ensureClerkTenantBootstrap } from '@/products/auth/server/clerkTenantBootstrap'
import { getTenantStartHref } from '@/products/auth/server/onboardingPreferences'
import { OnboardingProvider, OnboardingSteps, OnboardingWizard } from '@/products/auth/frontend/components/AuthOnboardingWizard'
import { AuthLayout } from '@/products/auth/frontend/components/AuthLayout'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getDefaultCompanyName(email: string) {
  const domain = email.split('@')[1]?.split('.')[0] || ''
  if (!domain || ['gmail', 'hotmail', 'outlook', 'icloud', 'yahoo', 'live', 'bol', 'uol'].includes(domain.toLowerCase())) return ''
  return domain.replace(/(^|-|_)([a-z])/g, (_, prefix: string, letter: string) => `${prefix ? ' ' : ''}${letter.toUpperCase()}`).trim()
}

// Where everyone lands after signing in. New accounts go through the three onboarding steps; accounts that already
// have a company go to the page it chose to start on (or come back to the team step right after creating it).
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ etapa?: string }> }) {
  const { etapa } = await searchParams
  const state = await ensureClerkTenantBootstrap()
  if (!state) redirect('/sign-in')

  if (!state.needsOnboarding) {
    const tenant = state.activeTenant
    const startHref = tenant ? await getTenantStartHref(tenant.tenantId) : '/erp'
    const canInvite = Boolean(tenant && ['owner', 'admin'].includes(tenant.role))
    if (etapa !== 'equipe' || !canInvite || !tenant) redirect(startHref)
    return (
      <OnboardingProvider initialStep={3}>
        <AuthLayout mode="onboarding" aside={<OnboardingSteps />}>
          <OnboardingWizard email={state.email} companyName={tenant.tenantName} startHref={startHref} />
        </AuthLayout>
      </OnboardingProvider>
    )
  }

  return (
    <OnboardingProvider initialStep={1}>
      <AuthLayout mode="onboarding" aside={<OnboardingSteps />}>
        <OnboardingWizard email={state.email} defaultCompanyName={getDefaultCompanyName(state.email)} />
      </AuthLayout>
    </OnboardingProvider>
  )
}
