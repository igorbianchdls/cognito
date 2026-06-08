'use client'

import { useMemo } from 'react'

const DEFAULT_TENANT_ID = 1

function parseTenantId(value: unknown): number | null {
  const parsed = Number.parseInt(String(value || '').trim(), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function resolveBrowserTenantId(): number {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const queryTenant = parseTenantId(params.get('tenantId') || params.get('tenant_id'))
    if (queryTenant) return queryTenant

    const storedTenant = parseTenantId(window.localStorage.getItem('cognito:tenantId'))
    if (storedTenant) return storedTenant
  }

  return parseTenantId(process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID) || DEFAULT_TENANT_ID
}

export default function useCurrentIntegrationTenant(): number {
  return useMemo(() => resolveBrowserTenantId(), [])
}
