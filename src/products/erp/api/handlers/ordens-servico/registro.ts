import { withErpHttp } from '@/products/erp/api/http/handler'
import { z } from 'zod'
import { parseErpBody } from '@/products/erp/api/http/responses'
import { serviceOrderCreateSchema } from '@/products/erp/shared/professionalContracts'
import { erpVersionSchema } from '@/products/erp/shared/erpTransport'
import { createServiceOrder } from '@/products/erp/server/erpProfessionalRepository'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { getServiceOrder } from '@/products/erp/server/erpProfessionalRepository'

 async function handleGET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const { id } = await context.params
    return NextResponse.json(await getServiceOrder(tenant.tenantId, Number(id)))
  } catch (error) { return erpErrorResponse(error) }
}

 async function handlePATCH(request:Request,context:{params:Promise<{id:string}>}) {
  try {const tenant=await resolveErpAccess('erp.vendas.gerenciar');if(!tenant)return erpFailure('Acesso negado.',403)
    const body=await parseErpBody(request,z.object({expectedVersion:erpVersionSchema,values:serviceOrderCreateSchema}).strict())
    const id=z.coerce.number().int().positive().parse((await context.params).id)
    return NextResponse.json({record:await createServiceOrder({tenantId:tenant.tenantId,actorId:tenant.sharedUserId,orderId:id,expectedVersion:body.expectedVersion,values:body.values})})
  }catch(error){return erpErrorResponse(error)}
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/ordens-servico/[id]","authentication":"session","maxBodyBytes":1048576})
export const PATCH = withErpHttp(handlePATCH, {"operation":"PATCH /api/erp/ordens-servico/[id]","authentication":"session","maxBodyBytes":1048576})
