import { createClerkOnboardingTenant } from '@/products/auth/server/clerkTenantBootstrap'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function getCompanyName(payload: Record<string, unknown>) {
  return String(payload.companyName ?? payload.company_name ?? '').trim()
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const companyName = getCompanyName(payload)
    const state = await createClerkOnboardingTenant(companyName)

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
      { ok: false, error: error instanceof Error ? error.message : 'Erro ao concluir onboarding.' },
      { status: 400 },
    )
  }
}
