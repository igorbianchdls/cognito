import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { runServiceOrderAction } from '@/products/erp/server/erpProfessionalRepository'
import { serviceOrderActionSchema } from '@/products/erp/shared/professionalContracts'

 async function handlePOST(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const [{ id }, values] = await Promise.all([context.params, parseErpBody(request, serviceOrderActionSchema)])
    return NextResponse.json({ result: await runServiceOrderAction({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, orderId: Number(id), ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/ordens-servico/[id]/acao","authentication":"session","maxBodyBytes":1048576})
