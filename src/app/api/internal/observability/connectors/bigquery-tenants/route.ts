import { currentUser } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'

import { getTenantBigQueryObservabilitySnapshot } from '@/products/observability/server/connectorsObservabilityRepository'

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

async function assertObservabilityAdmin() {
  const allowlist = parseAllowlist(process.env.OBSERVABILITY_ADMIN_EMAILS)
  if (allowlist.size === 0) return

  const user = await currentUser()
  const emails = user?.emailAddresses.map((email) => email.emailAddress.toLowerCase()) || []
  if (!emails.some((email) => allowlist.has(email))) {
    throw new Error('Acesso interno nao autorizado.')
  }
}

export async function GET(req: NextRequest) {
  try {
    await assertObservabilityAdmin()
    const limit = Number(req.nextUrl.searchParams.get('limit') || 200)
    const snapshot = await getTenantBigQueryObservabilitySnapshot({ tenantLimit: limit })
    return Response.json({ ok: true, ...snapshot })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar BigQuery por tenant.'
    return Response.json(
      { ok: false, error: message },
      { status: message.includes('nao autorizado') ? 404 : 500 },
    )
  }
}
