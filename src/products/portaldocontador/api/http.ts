import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { runWithErpDatabaseContext } from "@/lib/erpDatabaseContext";
import { resolvePortalAccess } from "../server/access";
import { ErpDomainError } from "@/products/erp/shared/erpErrors";
import type { ErpAccessContext } from "@/products/erp/server/erpAccess";
import type { PortalCompany } from "../shared/contracts";

export function portalId(value: string) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new ErpDomainError(
      "VALIDATION_ERROR",
      "Identificador inválido.",
      422,
    );
  return Number(value);
}
export async function portalResponse(invoke: () => Promise<Response>) {
  const correlationId = randomUUID();
  try {
    const response = await invoke(),
      headers = new Headers(response.headers);
    headers.set("Cache-Control", "private, no-store");
    headers.set("x-correlation-id", correlationId);
    headers.set("X-Content-Type-Options", "nosniff");
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    const known = error instanceof ErpDomainError,
      invalid = error instanceof ZodError;
    if (!known && !invalid)
      console.error(
        JSON.stringify({
          scope: "portaldocontador",
          correlationId,
          code: "INTERNAL_ERROR",
        }),
      );
    return Response.json(
      {
        error: {
          code: known
            ? error.code
            : invalid
              ? "VALIDATION_ERROR"
              : "INTERNAL_ERROR",
          message: known
            ? error.message
            : invalid
              ? "Confira os filtros e dados informados."
              : "Não foi possível carregar o portal. Tente novamente.",
        },
      },
      {
        status: known ? error.status : invalid ? 422 : 500,
        headers: {
          "Cache-Control": "private, no-store",
          "x-correlation-id": correlationId,
        },
      },
    );
  }
}
export function withPortalCompany(
  invoke: (
    request: Request,
    access: { company: PortalCompany; session: ErpAccessContext },
    params: Record<string, string>,
  ) => Promise<Response>,
) {
  return (
    request: Request,
    context: { params: Promise<Record<string, string>> },
  ) =>
    portalResponse(async () => {
      if (request.method !== "GET" && request.method !== "HEAD")
        throw new ErpDomainError(
          "READ_ONLY",
          "O portal permite consultas e downloads.",
          405,
        );
      const params = await context.params,
        access = await resolvePortalAccess(portalId(params.empresaId));
      return runWithErpDatabaseContext(
        {
          tenantId: access.session.tenantId,
          userId: access.session.sharedUserId,
          timeZone: access.session.timeZone,
          readOnly: true,
          portalContador: true,
          statementTimeoutMs: 10000,
        },
        () => invoke(request, access, params),
      );
    });
}
export async function portalBody(request: Request) {
  if (
    !/^application\/json(?:\s*;|$)/i.test(
      request.headers.get("content-type") || "",
    )
  )
    throw new ErpDomainError(
      "UNSUPPORTED_MEDIA_TYPE",
      "Envie os dados como JSON.",
      415,
    );
  const reader = request.body?.getReader();
  if (!reader)
    throw new ErpDomainError(
      "VALIDATION_ERROR",
      "Informe os dados da operação.",
      422,
    );
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        throw new ErpDomainError(
          "REQUEST_TOO_LARGE",
          "Dados acima do limite permitido.",
          413,
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new ErpDomainError(
      "VALIDATION_ERROR",
      "Informe um JSON válido.",
      422,
    );
  }
}
