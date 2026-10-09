import type { SQLClient } from "@/lib/postgres";

/** Aplicação única do convite local; aceitação e vínculo podem chegar em qualquer ordem. */
export async function applyPortalInvitations(
  client: Pick<SQLClient, "query">,
  companyId: number,
) {
  await client.query("SELECT id FROM shared.empresas WHERE id=$1 FOR UPDATE", [
    companyId,
  ]);
  const candidates = await client.query(
    `SELECT i.id,i.created_at,i.convidado_por,m.usuario_id,m.created_at AS member_created,m.role,m.perfil_acesso_id,m.metadata
    FROM shared.convites_empresa i JOIN shared.usuarios u ON lower(u.email::text)=lower(i.email::text)
    JOIN shared.usuarios_empresas m ON m.empresa_id=i.empresa_id AND m.usuario_id=u.id
    WHERE i.empresa_id=$1 AND i.acesso_portal_contador AND i.status='accepted'
      AND i.metadata->>'portalAccessApplied' IS DISTINCT FROM 'true'
      AND u.status='active' AND u.clerk_user_id IS NOT NULL AND u.metadata->>'emailVerified'='true'
      AND m.status='active' AND NOT m.suspenso_localmente AND m.clerk_membership_id IS NOT NULL
      AND m.clerk_organization_id=i.clerk_organization_id FOR UPDATE OF i,m`,
    [companyId],
  );
  for (const row of candidates.rows) {
    const metadata = (row.metadata || {}) as Record<string, unknown>;
    await client.query(
      "SELECT set_config('app.shared_actor_id',$1,true),set_config('app.shared_source','portal_invitation',true)",
      [String(row.convidado_por || "")],
    );
    // Uma escolha local posterior tem prioridade, inclusive a escolha de negar acesso.
    if (metadata.portalAccessManaged !== true) {
      const newMember =
        new Date(String(row.member_created)) >=
          new Date(String(row.created_at)) &&
        !metadata.accessRoleManaged &&
        !["owner", "admin"].includes(String(row.role));
      await client.query(
        `UPDATE shared.usuarios_empresas SET acesso_portal_contador=true,
        role=CASE WHEN $3 THEN 'viewer' ELSE role END,perfil_acesso_id=CASE WHEN $3 THEN 'contador' ELSE perfil_acesso_id END,
        metadata=metadata||jsonb_build_object('portalAccessManaged',true,'portalAccessManagedAt',now())||CASE WHEN $3 THEN jsonb_build_object('accessRoleManaged',true) ELSE '{}'::jsonb END,
        updated_at=now() WHERE empresa_id=$1 AND usuario_id=$2`,
        [companyId, row.usuario_id, newMember],
      );
    }
    await client.query(
      "UPDATE shared.convites_empresa SET metadata=metadata||jsonb_build_object('portalAccessApplied',true,'portalAccessAppliedAt',now()),updated_at=now() WHERE id=$1",
      [row.id],
    );
  }
}
