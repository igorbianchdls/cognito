import { z } from 'zod'
import { parseErpBody } from '@/products/erp/server/erpApi'
import { serviceOrderCreateSchema } from '@/products/erp/shared/professionalContracts'
import { erpVersionSchema } from '@/products/erp/shared/erpTransport'
import { createServiceOrder } from '@/products/erp/server/erpProfessionalRepository'
import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { getServiceOrder } from '@/products/erp/server/erpProfessionalRepository'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const { id } = await context.params
    return NextResponse.json(await getServiceOrder(tenant.tenantId, Number(id)))
  } catch (error) { return erpErrorResponse(error) }
}

export async function PATCH(request:Request,context:{params:Promise<{id:string}>}) {
  try {const tenant=await resolveErpAccess('erp.vendas.gerenciar');if(!tenant)return erpFailure('Acesso negado.',403)
    const body=await parseErpBody(request,z.object({expectedVersion:erpVersionSchema,values:serviceOrderCreateSchema}).strict())
    const id=z.coerce.number().int().positive().parse((await context.params).id)
    return NextResponse.json({record:await createServiceOrder({tenantId:tenant.tenantId,actorId:tenant.sharedUserId,orderId:id,expectedVersion:body.expectedVersion,values:body.values})})
  }catch(error){return erpErrorResponse(error)}
}
