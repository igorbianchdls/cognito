import { createClerkOnboardingTenant } from '@/products/auth/server/clerkTenantBootstrap'
import { isOnboardingSegment, isOnboardingStartArea, startAreaHref } from '@/products/auth/shared/onboarding'

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
    // Segment and start area are optional; unknown values are ignored rather than stored.
    const segment = isOnboardingSegment(payload.segment) ? payload.segment : undefined
    const startArea = isOnboardingStartArea(payload.startArea) ? payload.startArea : undefined
    const state = await createClerkOnboardingTenant(companyName, {
      ...(segment ? { segment } : {}),
      ...(startArea ? { startArea } : {}),
    })

    if (!state) {
      return Response.json(
        { ok: false, code: 'auth_required', error: 'Sua sessão expirou. Entre novamente para continuar.' },
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
      startHref: startAreaHref(startArea),
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Não foi possível criar sua empresa. Tente novamente.' },
      { status: 400 },
    )
  }
}
