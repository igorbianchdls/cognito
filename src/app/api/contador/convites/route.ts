import {
  portalResponse,
  portalBody,
  portalId,
} from "@/products/portaldocontador/api/http";
import {
  portalManager,
  listPortalInvitations,
  inviteAccountant,
  revokeAccountantInvitation,
} from "@/products/portaldocontador/server/invitations";
import {
  portalInvitationSchema,
  portalRevokeSchema,
} from "@/products/portaldocontador/shared/contracts";
import { ErpDomainError } from "@/products/erp/shared/erpErrors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const GET = (request: Request) =>
  portalResponse(async () =>
    Response.json({
      invitations: await listPortalInvitations(
        await portalManager(
          portalId(new URL(request.url).searchParams.get("companyId") || ""),
        ),
      ),
    }),
  );
function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new ErpDomainError("ACCESS_DENIED", "Origem não autorizada.", 403);
}
export const POST = (request: Request) =>
  portalResponse(async () => {
    checkOrigin(request);
    const { email, companyId } = portalInvitationSchema.parse(
      await portalBody(request),
    );
    const actor = await portalManager(companyId);
    return Response.json(
      { invitations: await inviteAccountant(actor, email) },
      { status: 201 },
    );
  });
export const DELETE = (request: Request) =>
  portalResponse(async () => {
    checkOrigin(request);
    const { invitationId, companyId } = portalRevokeSchema.parse(
      await portalBody(request),
    );
    const actor = await portalManager(companyId);
    return Response.json({
      invitations: await revokeAccountantInvitation(actor, invitationId),
    });
  });
