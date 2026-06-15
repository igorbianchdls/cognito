'use client'

import { useEffect, useMemo, useState } from 'react'

function parseTenantId(value: unknown): number | null {
  const parsed = Number.parseInt(String(value || '').trim(), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

type BootstrapMembership = {
  tenantId?: unknown
}

function resolveBrowserTenantId(): number | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const queryTenant = parseTenantId(params.get('tenantId') || params.get('tenant_id'))
    if (queryTenant) return queryTenant

    const storedTenant = parseTenantId(window.localStorage.getItem('cognito:tenantId'))
    if (storedTenant) return storedTenant
  }

  return parseTenantId(process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID)
}

export default function useCurrentIntegrationTenant(): number {
  const initialTenantId = useMemo(() => resolveBrowserTenantId(), [])
  const [tenantId, setTenantId] = useState(initialTenantId || 0)

  useEffect(() => {
    let cancelled = false

    async function loadBootstrapTenant() {
      try {
        const response = await fetch('/api/auth/bootstrap')
        const payload = await response.json().catch(() => ({}))
        if (!response.ok || payload?.ok === false) {
          if (response.status === 401 && typeof window !== 'undefined') {
            window.location.assign('/sign-in')
          }
          return
        }

        if (payload?.needsOnboarding && typeof window !== 'undefined') {
          window.location.assign('/onboarding')
          return
        }

        const activeTenantId = parseTenantId(payload?.activeTenant?.tenantId)
        const membershipTenantIds = Array.isArray(payload?.memberships)
          ? payload.memberships
              .map((membership: BootstrapMembership) => parseTenantId(membership?.tenantId))
              .filter((id: number | null): id is number => Boolean(id))
          : []
        const initialTenantAllowed = initialTenantId
          ? membershipTenantIds.includes(initialTenantId)
          : false

        if (!cancelled && activeTenantId && (!initialTenantId || !initialTenantAllowed)) {
          setTenantId(activeTenantId)
          window.localStorage.setItem('cognito:tenantId', String(activeTenantId))
        }
      } catch {
        if (!cancelled) setTenantId(initialTenantId || 0)
      }
    }

    void loadBootstrapTenant()
    return () => {
      cancelled = true
    }
  }, [initialTenantId])

  return tenantId
}
