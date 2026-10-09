import { runQuery, withTransaction } from "@/lib/postgres";
import { resolveAuthTenant } from "@/products/auth/server/authTenantResolver";
import {
  createClerkAccountantInvitation,
  revokeClerkInvitation,
} from "@/products/auth/server/clerkOrganizationClient";
import {
  enqueueClerkOperation,
  processClerkOperation,
} from "@/products/auth/server/clerkOutbox";
import { applyPortalInvitations } from "@/products/auth/server/portalInvitationAccess";
import { ErpDomainError } from "@/products/erp/shared/erpErrors";
import type { AuthTenantContext } from "@/products/auth/shared/authContracts";
import type { PortalInvitation } from "../shared/contracts";
import { clerkClient } from "@clerk/nextjs/server";

export async function portalManager(companyId: number) {
  const actor = await resolveAuthTenant({
    access: "manage",
    requestedTenantId: companyId,
  });
  if (!actor?.clerkOrganizationId)
    throw new ErpDomainError(
      "ACCESS_DENIED",
      "Somente administradores podem gerenciar convites.",
      403,
    );
  const live = await (
    await clerkClient()
  ).organizations.getOrganizationMembershipList({
    organizationId: actor.clerkOrganizationId,
    userId: [actor.clerkUserId],
    limit: 1,
  });
  if (
    !actor.clerkMembershipId ||
    !live.data.some((m) => m.id === actor.clerkMembershipId)
  )
    throw new ErpDomainError(
      "ACCESS_DENIED",
      "Seu vínculo com esta empresa não está ativo.",
      403,
    );
  return actor;
}
async function lockManager(
  client: Parameters<Parameters<typeof withTransaction>[0]>[0],
  actor: AuthTenantContext,
) {
  await client.query("SELECT id FROM shared.empresas WHERE id=$1 FOR UPDATE", [
    actor.tenantId,
  ]);
  const result = await client.query(
    `SELECT m.usuario_id FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id
    WHERE m.empresa_id=$1 AND m.usuario_id=$2 AND m.role IN ('owner','admin') AND m.status='active' AND NOT m.suspenso_localmente AND e.status='active' AND u.status='active'`,
    [actor.tenantId, actor.sharedUserId],
  );
  if (!result.rows.length)
    throw new ErpDomainError(
      "ACCESS_DENIED",
      "A autorização de administrador foi revogada.",
      403,
    );
  await client.query(
    "SELECT set_config('app.shared_actor_id',$1,true),set_config('app.shared_source','portal_invitations',true)",
    [String(actor.sharedUserId)],
  );
}
export async function listPortalInvitations(
  actor: AuthTenantContext,
): Promise<PortalInvitation[]> {
  const rows = await runQuery<{
    id: string;
    email: string;
    status: string;
    expira_em: string | null;
    sync_pending: boolean;
  }>(
    `SELECT i.id::text,i.email::text,
    CASE WHEN i.status='pending' AND i.expira_em<now() THEN 'expired' ELSE i.status END AS status,i.expira_em,
    EXISTS(SELECT 1 FROM shared.eventos_webhook w WHERE w.provedor='clerk_outbox' AND w.entidade_id=i.clerk_organization_id||':invitation:'||i.clerk_invitation_id AND w.status IN ('pending','failed','processing')) AS sync_pending
    FROM shared.convites_empresa i WHERE i.empresa_id=$1 AND i.metadata->>'portalInvitationManaged'='true' ORDER BY i.id DESC LIMIT 100`,
    [actor.tenantId],
  );
  return rows.map((r) => ({
    id: Number(r.id),
    email: r.email,
    status: r.status,
    expiresAt: r.expira_em,
    syncPending: r.sync_pending,
  }));
}
export async function inviteAccountant(
  actor: AuthTenantContext,
  email: string,
) {
  const requestedAt = await withTransaction(async (client) => {
    await lockManager(client, actor);
    const existing = await client.query(
      `SELECT u.id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id WHERE m.empresa_id=$1 AND lower(u.email::text)=lower($2)`,
      [actor.tenantId, email],
    );
    if (existing.rows.length)
      throw new ErpDomainError(
        "MEMBER_EXISTS",
        "Este usuário já é membro. Libere o portal nas configurações de membros.",
        409,
      );
    const pending = await client.query(
      "SELECT id FROM shared.convites_empresa WHERE empresa_id=$1 AND lower(email::text)=lower($2) AND status='pending' AND (expira_em IS NULL OR expira_em>now())",
      [actor.tenantId, email],
    );
    if (pending.rows.length)
      throw new ErpDomainError(
        "INVITATION_EXISTS",
        "Já existe um convite pendente para este e-mail.",
        409,
      );
    // Horário do banco, anterior à chamada externa. O vínculo pode chegar pelo
    // webhook antes que a resposta do Clerk e o convite sejam persistidos aqui.
    const result = await client.query(
      "SELECT clock_timestamp() AS requested_at",
    );
    const value = result.rows[0].requested_at;
    return (
      value instanceof Date ? value : new Date(String(value))
    ).toISOString();
  });
  const origin = new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      process.env.CHATGPTPLUGIN_BASE_URL ||
      "https://cognito-seven.vercel.app",
  ).origin;
  const invitation = await createClerkAccountantInvitation({
    organizationId: actor.clerkOrganizationId!,
    clerkUserId: actor.clerkUserId,
    email,
    redirectUrl: origin + "/contador",
  });
  try {
    await withTransaction(async (client) => {
      await lockManager(client, actor);
      await client.query(
        `INSERT INTO shared.convites_empresa(empresa_id,email,role,perfil_acesso_id,status,convidado_por,clerk_organization_id,clerk_invitation_id,expira_em,acesso_portal_contador,metadata)
        VALUES($1,$2,'viewer','contador','pending',$3,$4,$5,$6,true,jsonb_build_object('portalInvitationManaged',true,'portalRequestedAt',$7::text))
        ON CONFLICT(clerk_invitation_id) DO UPDATE SET role='viewer',perfil_acesso_id='contador',convidado_por=$3,
        acesso_portal_contador=CASE WHEN shared.convites_empresa.metadata->>'portalRevokedLocally'='true' THEN false ELSE true END,
        metadata=shared.convites_empresa.metadata||jsonb_build_object('portalInvitationManaged',true,'portalRequestedAt',$7::text),updated_at=now()`,
        [
          actor.tenantId,
          email,
          actor.sharedUserId,
          actor.clerkOrganizationId,
          invitation.id,
          invitation.expires_at
            ? new Date(invitation.expires_at).toISOString()
            : null,
          requestedAt,
        ],
      );
      await applyPortalInvitations(client, actor.tenantId);
    });
  } catch (error) {
    await revokeClerkInvitation({
      organizationId: actor.clerkOrganizationId!,
      invitationId: invitation.id,
    }).catch(() => undefined);
    throw error;
  }
  return listPortalInvitations(actor);
}
export async function revokeAccountantInvitation(
  actor: AuthTenantContext,
  id: number,
) {
  const operationId = await withTransaction(async (client) => {
    await lockManager(client, actor);
    const result = await client.query(
      `UPDATE shared.convites_empresa SET status='revoked',acesso_portal_contador=false,
      metadata=metadata||'{"portalRevokedLocally":true}'::jsonb,updated_at=now()
      WHERE empresa_id=$1 AND id=$2 AND status='pending' AND metadata->>'portalInvitationManaged'='true'
      RETURNING clerk_invitation_id`,
      [actor.tenantId, id],
    );
    if (!result.rows.length)
      throw new ErpDomainError(
        "INVITATION_NOT_PENDING",
        "O convite não está pendente. Para remover um acesso aceito, altere o membro.",
        409,
      );
    return enqueueClerkOperation(client, {
      type: "invitation_revoke",
      organizationId: actor.clerkOrganizationId!,
      invitationId: String(result.rows[0].clerk_invitation_id),
    });
  });
  await processClerkOperation(operationId);
  return listPortalInvitations(actor);
}
