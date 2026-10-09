import { NextResponse } from "next/server";

import { updateWorkspaceMember } from "@/products/auth/server/settingsRepository";
import { resolveAuthTenant } from "@/products/auth/server/authTenantResolver";
import type { AuthTenantRole } from "@/products/auth/shared/authContracts";
import type { WorkspaceMemberStatus } from "@/products/auth/shared/settingsContracts";
import type { ErpAccessProfile } from "@/products/erp/shared/professionalContracts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const roles = new Set<AuthTenantRole>(["owner", "admin", "member", "viewer"]);
const statuses = new Set<WorkspaceMemberStatus>([
  "active",
  "invited",
  "suspended",
]);

export async function PATCH(request: Request) {
  const tenant = await resolveAuthTenant({ access: "manage" });
  if (!tenant) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      portalAccess?: unknown;
      role?: unknown;
      status?: unknown;
      userId?: unknown;
      profileId?: unknown;
      reason?: unknown;
      sellerId?: unknown;
      salesScope?: unknown;
      maxDiscountPercent?: unknown;
    };
    if (
      body.portalAccess !== undefined &&
      typeof body.portalAccess !== "boolean"
    )
      return NextResponse.json(
        { error: "Acesso ao portal inválido." },
        { status: 400 },
      );
    const userId = Number(body.userId || 0);
    const role =
      typeof body.role === "string" && roles.has(body.role as AuthTenantRole)
        ? (body.role as AuthTenantRole)
        : undefined;
    const status =
      typeof body.status === "string" &&
      statuses.has(body.status as WorkspaceMemberStatus)
        ? (body.status as WorkspaceMemberStatus)
        : undefined;
    if (
      (body.role !== undefined && role === undefined) ||
      (body.status !== undefined && status === undefined)
    ) {
      return NextResponse.json(
        { error: "Papel ou estado invalido." },
        { status: 400 },
      );
    }

    if (
      body.salesScope !== undefined &&
      body.salesScope !== "todas" &&
      body.salesScope !== "proprias"
    ) {
      return NextResponse.json(
        { error: "Escopo de vendas invalido." },
        { status: 400 },
      );
    }

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "Membro invalido." }, { status: 400 });
    }

    const member = await updateWorkspaceMember({
      actorUserId: tenant.sharedUserId,
      tenantId: tenant.tenantId,
      values: {
        role,
        status,
        userId,
        portalAccess: body.portalAccess as boolean | undefined,
        profileId:
          typeof body.profileId === "string"
            ? (body.profileId as ErpAccessProfile)
            : undefined,
        reason: typeof body.reason === "string" ? body.reason : undefined,
        sellerId:
          body.sellerId === undefined
            ? undefined
            : body.sellerId === null
              ? null
              : Number(body.sellerId),
        salesScope:
          body.salesScope === "todas" || body.salesScope === "proprias"
            ? body.salesScope
            : undefined,
        maxDiscountPercent:
          body.maxDiscountPercent === undefined
            ? undefined
            : body.maxDiscountPercent === null || body.maxDiscountPercent === ""
              ? null
              : Number(body.maxDiscountPercent),
      },
    });
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o membro.",
      },
      { status: 400 },
    );
  }
}
