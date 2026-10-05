import { withErpHttp } from '@/products/erp/api/http/handler'
import { z } from 'zod'
import { erpVersionSchema } from '@/products/erp/shared/erpTransport'
import { parseErpBody } from '@/products/erp/api/http/responses'
import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { cancelErpSale } from '@/products/erp/server/erpRepository'

type RouteContext = {
  params: Promise<{ id: string }>
}

 async function handlePOST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const saleId = Number(id)
  if (!Number.isInteger(saleId) || saleId <= 0) {
    return erpFailure('Venda invalida.', 400)
  }

  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) {
    return erpFailure('Acesso negado.', 403)
  }

  try {
    const action = await parseErpBody(request,z.object({values:z.object({expectedVersion:erpVersionSchema,motivo:z.string().max(1000).optional()}).strict()}).strict())
    const body = action
    const result = await cancelErpSale({
      actorId: tenant.sharedUserId,
      expectedVersion: action.values.expectedVersion,
      id: saleId,
      reason: typeof body.values?.motivo === 'string' ? body.values.motivo : null,
      tenantId: tenant.tenantId,
    })

    return NextResponse.json(result)
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/vendas/[id]/cancelar","authentication":"session","maxBodyBytes":1048576})
