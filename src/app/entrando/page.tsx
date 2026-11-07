'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'

import { AuthTransition, AuthAlert } from '@/products/auth/frontend/components/AuthFormParts'

// When Clerk asks the user to pick an organization before finishing the sign-in (a "pending" session), it sends
// them here instead of to Clerk's own page. The user's company is chosen automatically and the sign-in continues.
export default function EnteringPage() {
  const router = useRouter()
  const clerk = useClerk()
  // The raw session, pending or not (the hooks treat a pending session as signed out).
  const isLoaded = clerk.loaded
  const session = clerk.session
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (!isLoaded || started.current) return
    started.current = true
    const run = async () => {
      if (!session) return router.replace('/sign-in')
      if (session.status !== 'pending') return router.replace('/onboarding')
      const memberships = await clerk.user?.getOrganizationMemberships()
      const organizationId = memberships?.data[0]?.organization.id
      if (!organizationId) {
        setError('Sua conta ainda não está ligada a uma empresa. Saia e entre de novo; se continuar, fale com o suporte da Otto.')
        return
      }
      await clerk.setActive({ session: session.id, organization: organizationId })
      router.replace('/onboarding')
    }
    run().catch(() => setError('Não foi possível concluir sua entrada. Tente entrar de novo.'))
  }, [clerk, isLoaded, router, session])

  return (
    <main className="grid min-h-dvh place-items-center bg-white px-6">
      <div className="w-full max-w-[420px]">
        {error ? (
          <>
            <AuthAlert message={error} />
            <button type="button" onClick={() => void clerk.signOut({ redirectUrl: '/sign-in' })} className="h-11 w-full rounded-md bg-[#104dff] text-sm font-semibold text-white hover:bg-[#0b3ee0]">Sair e entrar de novo</button>
          </>
        ) : <AuthTransition />}
      </div>
    </main>
  )
}
