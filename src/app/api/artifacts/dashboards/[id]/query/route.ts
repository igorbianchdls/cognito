import { NextRequest } from 'next/server'

import { ArtifactToolError } from '@/products/artifacts/dashboard/persistence/dashboardArtifactsService'
import { executeDashboardQuery } from '@/products/artifacts/dashboard/query/dashboardQueryService'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const tenant = await resolveAuthTenant({ access: 'read' })
    if (!tenant) return Response.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
    const { id } = await context.params
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const result = await executeDashboardQuery({
      artifactId: id,
      tenantId: tenant.tenantId,
      query: String(payload.query || ''),
      filters: payload.filters && typeof payload.filters === 'object' && !Array.isArray(payload.filters)
        ? payload.filters as Record<string, unknown>
        : {},
      limit: Number(payload.limit || 1000),
    })
    return Response.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof ArtifactToolError) {
      return Response.json(
        { ok: false, code: error.code, error: error.message, details: error.details },
        { status: error.status },
      )
    }
    const message = error instanceof Error ? error.message : 'Falha ao executar consulta'
    const status = /not found/i.test(message) ? 409 : 500
    return Response.json({ ok: false, error: message }, { status })
  }
}
