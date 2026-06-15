import { NextResponse } from 'next/server'

import { getSettingsState } from '@/products/auth/server/settingsRepository'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) {
    return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  }

  try {
    const settings = await getSettingsState({
      sharedUserId: tenant.sharedUserId,
      tenantId: tenant.tenantId,
    })
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel carregar configuracoes.' },
      { status: 400 },
    )
  }
}
