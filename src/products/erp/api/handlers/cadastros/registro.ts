import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { erpUpdateEnvelopeSchema, erpVersionSchema } from '@/products/erp/shared/erpTransport'

import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { deactivateErpEntityRecord, getErpEntityRecord, updateErpEntityRecord } from '@/products/erp/server/erpRepository'
import { getErpModuleCapability, isErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

type RouteContext = { params: Promise<{ entityId: string; id: string }> }

const updateSchema = erpUpdateEnvelopeSchema
const deleteSchema = z.object({ expectedVersion: erpVersionSchema }).strict()

 async function handleGET(_request: Request, context: RouteContext) {
  const { entityId, id } = await context.params
  if (!isErpConnectedModuleId(entityId)) return erpFailure('Modulo ERP nao encontrado.', 404)
  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'read'))
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    return NextResponse.json({ record: await getErpEntityRecord({ tenantId: tenant.tenantId, entityId, id }) })
  } catch (error) { return erpErrorResponse(error) }
}

 async function handlePATCH(request: Request, context: RouteContext) {
  const { entityId, id } = await context.params
  if (!isErpConnectedModuleId(entityId)) return erpFailure('Modulo ERP nao encontrado.', 404)
  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'manage'))
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await parseErpBody(request, updateSchema)
    const record = await updateErpEntityRecord({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      entityId, id, values: body.values, expectedVersion: body.expectedVersion })
    return NextResponse.json({ record })
  } catch (error) { return erpErrorResponse(error) }
}

 async function handleDELETE(request: Request, context: RouteContext) {
  const { entityId, id } = await context.params
  if (!isErpConnectedModuleId(entityId)) return erpFailure('Modulo ERP nao encontrado.', 404)
  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'manage'))
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await parseErpBody(request, deleteSchema)
    const record = await deactivateErpEntityRecord({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      entityId, id, expectedVersion: body.expectedVersion })
    return NextResponse.json({ record })
  } catch (error) { return erpErrorResponse(error) }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/[entityId]/[id]","authentication":"session","maxBodyBytes":1048576})
export const PATCH = withErpHttp(handlePATCH, {"operation":"PATCH /api/erp/[entityId]/[id]","authentication":"session","maxBodyBytes":1048576})
export const DELETE = withErpHttp(handleDELETE, {"operation":"DELETE /api/erp/[entityId]/[id]","authentication":"session","maxBodyBytes":1048576})
