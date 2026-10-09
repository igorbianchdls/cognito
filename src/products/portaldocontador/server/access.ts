import { ensureClerkTenantBootstrap } from "@/products/auth/server/clerkTenantBootstrap";
import { effectiveCapabilities } from "@/products/auth/server/accessPolicy";
import { runQuery } from "@/lib/postgres";
import { ErpDomainError } from "@/products/erp/shared/erpErrors";
import type { ErpAccessContext } from "@/products/erp/server/erpAccess";
import type {
  ErpAccessProfile,
  ErpCapability,
} from "@/products/erp/shared/professionalContracts";
import { normalizeTimeZone } from "@/products/erp/shared/businessDate";
import { clerkClient } from "@clerk/nextjs/server";
import {
  PORTAL_READ_CAPABILITIES,
  type PortalCompany,
} from "../shared/contracts";

export function portalCapabilities(
  role: string,
  capabilities: readonly string[],
): ErpCapability[] {
  return effectiveCapabilities(role, capabilities).filter((c) =>
    PORTAL_READ_CAPABILITIES.includes(c),
  );
}
export async function listPortalCompanies() {
  const identity = await ensureClerkTenantBootstrap();
  if (!identity)
    throw new ErpDomainError(
      "AUTH_REQUIRED",
      "Entre na sua conta para acessar o portal.",
      401,
    );
  const client = await clerkClient(),
    live = new Map<string, string>();
  for (let offset = 0; ; offset += 100) {
    const result = await client.users.getOrganizationMembershipList({
      userId: identity.clerkUserId,
      limit: 100,
      offset,
    });
    for (const membership of result.data)
      live.set(membership.organization.id, membership.id);
    if (offset + result.data.length >= result.totalCount) break;
    if (!result.data.length)
      throw new Error("Lista de vínculos Clerk incompleta.");
  }
  const verified = identity.memberships.filter(
    (m) =>
      m.clerkMembershipId &&
      m.clerkOrganizationId &&
      live.get(m.clerkOrganizationId) === m.clerkMembershipId,
  );
  if (!verified.length) return { companies: [] as PortalCompany[], identity };
  const rows = await runQuery<{
    id: string;
    name: string;
    clerk_organization_id: string;
    fuso_horario: string;
    role: string;
    perfil_acesso_id: ErpAccessProfile;
    capabilities: string[];
  }>(
    `
    SELECT e.id::text,e.name,e.clerk_organization_id,e.fuso_horario,m.role,m.perfil_acesso_id,
      COALESCE(array_agg(p.capability) FILTER(WHERE p.capability IS NOT NULL),ARRAY[]::text[]) AS capabilities
    FROM shared.usuarios_empresas m JOIN shared.empresas e ON e.id=m.empresa_id
    JOIN shared.usuarios u ON u.id=m.usuario_id
    LEFT JOIN shared.permissoes_perfil p ON p.perfil_acesso_id=m.perfil_acesso_id
    WHERE m.usuario_id=$1 AND m.empresa_id=ANY($2::bigint[]) AND m.status='active'
      AND NOT m.suspenso_localmente AND m.acesso_portal_contador AND e.status='active' AND u.status='active'
    GROUP BY e.id,m.role,m.perfil_acesso_id ORDER BY e.name,e.id`,
    [identity.sharedUserId, verified.map((m) => m.tenantId)],
  );
  const companies = rows
    .filter((r) =>
      verified.some(
        (m) =>
          m.tenantId === Number(r.id) &&
          m.clerkOrganizationId === r.clerk_organization_id,
      ),
    )
    .map((r) => ({
      id: Number(r.id),
      name: r.name,
      organizationId: r.clerk_organization_id,
      timeZone: normalizeTimeZone(r.fuso_horario),
      capabilities: portalCapabilities(r.role, r.capabilities),
    }));
  return { companies, identity, rows };
}
export async function resolvePortalAccess(
  companyId: number,
): Promise<{ company: PortalCompany; session: ErpAccessContext }> {
  const { companies, identity, rows } = await listPortalCompanies();
  const company = companies.find((c) => c.id === companyId),
    row = rows?.find((r) => Number(r.id) === companyId);
  const membership = identity.memberships.find((m) => m.tenantId === companyId);
  if (!company || !row || !membership)
    throw new ErpDomainError(
      "ACCESS_DENIED",
      "Você não tem acesso a esta empresa no portal.",
      403,
    );
  return {
    company,
    session: {
      ...identity,
      ...membership,
      authMode: "clerk",
      erpProfile: row.perfil_acesso_id,
      capabilities: company.capabilities,
      timeZone: company.timeZone,
    },
  };
}
export function requirePortalCapability(
  session: ErpAccessContext,
  ...capabilities: ErpCapability[]
) {
  if (!capabilities.every((c) => session.capabilities.includes(c)))
    throw new ErpDomainError(
      "ACCESS_DENIED",
      "Seu perfil não permite consultar esta área.",
      403,
    );
}
