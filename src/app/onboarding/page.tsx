import { redirect } from 'next/navigation'

import { ensureClerkTenantBootstrap } from '@/products/auth/server/clerkTenantBootstrap'
import { AuthOnboardingForm } from '@/products/auth/frontend/components/AuthOnboardingForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getDefaultCompanyName(email: string) {
  const domain = email.split('@')[1]?.split('.')[0] || ''
  if (!domain || ['gmail', 'hotmail', 'outlook', 'icloud', 'yahoo'].includes(domain.toLowerCase())) return ''
  return domain.replace(/(^|-|_)([a-z])/g, (_, prefix: string, letter: string) => `${prefix ? ' ' : ''}${letter.toUpperCase()}`).trim()
}

export default async function OnboardingPage() {
  const state = await ensureClerkTenantBootstrap()
  if (!state) redirect('/sign-in')
  if (!state.needsOnboarding) redirect('/integracoes')

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-950">
      <AuthOnboardingForm
        email={state.email}
        defaultCompanyName={getDefaultCompanyName(state.email)}
      />
    </main>
  )
}
