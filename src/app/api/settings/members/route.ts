import { NextResponse } from 'next/server'

import { updateWorkspaceMember } from '@/products/auth/server/settingsRepository'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import type {
  AuthTenantRole,
} from '@/products/auth/shared/authContracts'
import type { WorkspaceMemberStatus } from '@/products/auth/shared/settingsContracts'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

const roles = new Set<AuthTenantRole>(['owner', 'admin', 'member', 'viewer'])
const statuses = new Set<WorkspaceMemberStatus>(['active', 'invited', 'suspended'])

export async function PATCH(request: Request) {
  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      role?: unknown
      status?: unknown
      userId?: unknown
    }
    const userId = Number(body.userId || 0)
    const role = typeof body.role === 'string' && roles.has(body.role as AuthTenantRole)
      ? (body.role as AuthTenantRole)
      : undefined
    const status = typeof body.status === 'string' && statuses.has(body.status as WorkspaceMemberStatus)
      ? (body.status as WorkspaceMemberStatus)
      : undefined

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Membro invalido.' }, { status: 400 })
    }

    const member = await updateWorkspaceMember({
      actorUserId: tenant.sharedUserId,
      tenantId: tenant.tenantId,
      values: { role, status, userId },
    })
    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel atualizar o membro.' },
      { status: 400 },
    )
  }
}
