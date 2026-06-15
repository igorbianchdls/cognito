import { NextResponse } from 'next/server'

import { updateWorkspace } from '@/products/auth/server/settingsRepository'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function PATCH(request: Request) {
  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { name?: unknown; slug?: unknown }
    const workspace = await updateWorkspace({
      tenantId: tenant.tenantId,
      values: {
        name: String(body.name || ''),
        slug: String(body.slug || ''),
      },
    })
    return NextResponse.json(workspace)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel atualizar o workspace.' },
      { status: 400 },
    )
  }
}
