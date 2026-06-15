import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

import {
  normalizeFullName,
  updateSharedUserProfile,
} from '@/products/auth/server/settingsRepository'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

function splitFullName(value: string) {
  const parts = value.split(' ').filter(Boolean)
  const firstName = parts.shift() || value
  const lastName = parts.join(' ') || undefined
  return { firstName, lastName }
}

export async function PATCH(request: Request) {
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) {
    return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  }

  const authState = await auth()
  if (!authState.userId || authState.userId !== tenant.clerkUserId) {
    return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { fullName?: unknown }
    const fullName = normalizeFullName(String(body.fullName || ''))
    const client = await clerkClient()
    await client.users.updateUser(authState.userId, splitFullName(fullName))
    const profile = await updateSharedUserProfile({
      avatarUrl: tenant.avatarUrl,
      fullName,
      sharedUserId: tenant.sharedUserId,
    })
    return NextResponse.json(profile)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Nao foi possivel atualizar o perfil.' },
      { status: 400 },
    )
  }
}
