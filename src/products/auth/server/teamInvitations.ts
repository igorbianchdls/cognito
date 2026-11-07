import { withTransaction } from "@/lib/postgres";
import { ClerkApiError, createClerkTeamInvitation } from "@/products/auth/server/clerkOrganizationClient";
import type { AuthTenantContext } from "@/products/auth/shared/authContracts";
import type { TeamInviteResult, TeamInviteRole } from "@/products/auth/shared/onboarding";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function appOrigin() {
  return new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.CHATGPTPLUGIN_BASE_URL ||
      "https://cognito-seven.vercel.app",
  ).origin;
}

/**
 * Invites people to the actor's company. Each email is handled on its own: one that is already a member, invalid or
 * refused by Clerk does not stop the others. Accepting goes through Otto's sign-up page with the invitation ticket.
 */
export async function inviteTeamMembers(
  actor: AuthTenantContext,
  invites: Array<{ email: string; role: TeamInviteRole }>,
): Promise<TeamInviteResult[]> {
  if (!actor.clerkOrganizationId) throw new Error("Esta empresa ainda não está pronta para receber convites.");
  const members = await withTransaction(async (client) => {
    const result = await client.query(
      `SELECT lower(u.email::text) AS email FROM shared.usuarios u
       JOIN shared.usuarios_empresas m ON m.usuario_id = u.id
       WHERE m.empresa_id = $1 AND m.status = 'active'`,
      [actor.tenantId],
    );
    return new Set(result.rows.map((row) => String(row.email)));
  });

  const results: TeamInviteResult[] = [];
  const seen = new Set<string>();
  for (const invite of invites) {
    const email = invite.email.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    if (!EMAIL.test(email)) { results.push({ email, ok: false, error: "E-mail inválido." }); continue; }
    if (members.has(email)) { results.push({ email, ok: false, error: "Já faz parte da equipe." }); continue; }
    try {
      await createClerkTeamInvitation({
        organizationId: actor.clerkOrganizationId,
        clerkUserId: actor.clerkUserId,
        email,
        role: invite.role === "admin" ? "admin" : "member",
        redirectUrl: `${appOrigin()}/sign-up`,
      });
      results.push({ email, ok: true });
    } catch (error) {
      const duplicate = error instanceof ClerkApiError && /already|duplicate|pending/i.test(error.message);
      results.push({ email, ok: false, error: duplicate ? "Já existe um convite pendente." : "Não foi possível enviar o convite." });
    }
  }
  return results;
}
