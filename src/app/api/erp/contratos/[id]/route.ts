import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveErpAccess } from "@/products/erp/server/erpAccess";
import {
  erpErrorResponse,
  erpFailure,
  parseErpBody,
} from "@/products/erp/server/erpApi";
import {
  getSalesContract,
  reviseSalesContract,
} from "@/products/erp/server/erpSalesContracts";
import {
  erpDateSchema,
  erpMoneySchema,
  erpVersionSchema,
} from "@/products/erp/shared/erpTransport";
export const dynamic = "force-dynamic";
const changeSchema = z
  .object({
    expectedVersion: erpVersionSchema,
    inicio: erpDateSchema,
    motivo: z.string().trim().min(1).max(1000),
    itens: z
      .array(
        z
          .object({
            id: z.string().regex(/^[1-9]\d*$/),
            quantidade: z.coerce.number().positive(),
            valor_unitario: erpMoneySchema,
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const tenant = await resolveErpAccess("erp.vendas.visualizar");
    if (!tenant) return erpFailure("Acesso negado.", 403);
    const id = z.coerce
      .number()
      .int()
      .positive()
      .parse((await context.params).id);
    return NextResponse.json(await getSalesContract(tenant.tenantId, id));
  } catch (error) {
    return erpErrorResponse(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const tenant = await resolveErpAccess("erp.vendas.gerenciar");
    if (!tenant) return erpFailure("Acesso negado.", 403);
    const id = z.coerce
        .number()
        .int()
        .positive()
        .parse((await context.params).id),
      values = await parseErpBody(request, changeSchema);
    return NextResponse.json(
      await reviseSalesContract({
        tenantId: tenant.tenantId,
        actorId: tenant.sharedUserId,
        id,
        ...values,
      }),
    );
  } catch (error) {
    return erpErrorResponse(error);
  }
}
