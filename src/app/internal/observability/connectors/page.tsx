import { currentUser } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'

import ConnectorsObservabilityPage from '@/products/observability/frontend/features/connectors/pages/ConnectorsObservabilityPage'
import type { ConnectorsObservabilityTab } from '@/products/observability/frontend/features/connectors/pages/ConnectorsObservabilityPage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function parseAllowlist(value: string | undefined) {
  return new Set(
    String(value || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

function parseTab(value: string | string[] | undefined): ConnectorsObservabilityTab {
  const tab = Array.isArray(value) ? value[0] : value
  return tab === 'providers' ? 'providers' : 'connections'
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string | string[] }>
}) {
  const allowlist = parseAllowlist(process.env.OBSERVABILITY_ADMIN_EMAILS)

  if (allowlist.size > 0) {
    const user = await currentUser()
    const emails = user?.emailAddresses.map((email) => email.emailAddress.toLowerCase()) || []
    if (!emails.some((email) => allowlist.has(email))) {
      notFound()
    }
  }

  const params = await searchParams
  return <ConnectorsObservabilityPage activeTab={parseTab(params?.tab)} />
}
