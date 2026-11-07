import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { inviteTeamMembers } from '@/products/auth/server/teamInvitations'
import { TEAM_INVITE_LIMIT, type TeamInviteRole } from '@/products/auth/shared/onboarding'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Team invitations sent from onboarding. Only owners and admins of the active company can invite.
export async function POST(req: Request) {
  const origin = req.headers.get('origin')
  if (origin && origin !== new URL(req.url).origin) {
    return Response.json({ ok: false, error: 'Origem não autorizada.' }, { status: 403 })
  }
  const actor = await resolveAuthTenant({ access: 'manage' })
  if (!actor) return Response.json({ ok: false, error: 'Apenas quem administra a empresa pode convidar pessoas.' }, { status: 403 })

  const payload = (await req.json().catch(() => ({}))) as { invites?: unknown }
  const invites = (Array.isArray(payload.invites) ? payload.invites : [])
    .map((item) => item as { email?: unknown; role?: unknown })
    .map((item) => ({ email: String(item.email ?? '').trim(), role: (item.role === 'admin' ? 'admin' : 'member') as TeamInviteRole }))
    .filter((item) => item.email)
    .slice(0, TEAM_INVITE_LIMIT)
  if (!invites.length) return Response.json({ ok: false, error: 'Informe pelo menos um e-mail.' }, { status: 400 })

  try {
    const results = await inviteTeamMembers(actor, invites)
    return Response.json({ ok: true, results })
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Não foi possível enviar os convites.' }, { status: 400 })
  }
}
