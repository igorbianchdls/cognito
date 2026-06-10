import { ensureClerkTenantBootstrap } from '@/products/auth/server/clerkTenantBootstrap'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const state = await ensureClerkTenantBootstrap()
    if (!state) {
      return Response.json(
        { ok: false, code: 'auth_required', error: 'Usuario nao autenticado.' },
        { status: 401 },
      )
    }

    return Response.json({
      ok: true,
      user: {
        clerkUserId: state.clerkUserId,
        sharedUserId: state.sharedUserId,
        email: state.email,
        fullName: state.fullName,
        avatarUrl: state.avatarUrl,
      },
      memberships: state.memberships,
      activeTenant: state.activeTenant,
      needsOnboarding: state.needsOnboarding,
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao carregar auth bootstrap.' },
      { status: 500 },
    )
  }
}
