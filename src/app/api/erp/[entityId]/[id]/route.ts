import { NextResponse } from 'next/server'
import { z } from 'zod'

import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { deactivateErpEntityRecord, getErpEntityRecord, updateErpEntityRecord } from '@/products/erp/server/erpRepository'
import { getErpModuleCapability, isErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ entityId: string; id: string }> }

const updateSchema = z.object({
  values: z.record(z.string(), z.unknown()).default({}),
  expectedVersion: z.coerce.number().int().positive(),
})
const deleteSchema = z.object({ expectedVersion: z.coerce.number().int().positive() })

export async function GET(_request: Request, context: RouteContext) {
  const { entityId, id } = await context.params
  if (!isErpConnectedModuleId(entityId)) return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'read'))
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    return NextResponse.json({ record: await getErpEntityRecord({ tenantId: tenant.tenantId, entityId, id }) })
  } catch (error) { return erpErrorResponse(error) }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { entityId, id } = await context.params
  if (!isErpConnectedModuleId(entityId)) return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'manage'))
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = await parseErpBody(request, updateSchema)
    const record = await updateErpEntityRecord({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      entityId, id, values: body.values, expectedVersion: body.expectedVersion })
    return NextResponse.json({ record })
  } catch (error) { return erpErrorResponse(error) }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { entityId, id } = await context.params
  if (!isErpConnectedModuleId(entityId)) return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  const tenant = await resolveErpAccess(getErpModuleCapability(entityId, 'manage'))
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = await parseErpBody(request, deleteSchema)
    const record = await deactivateErpEntityRecord({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      entityId, id, expectedVersion: body.expectedVersion })
    return NextResponse.json({ record })
  } catch (error) { return erpErrorResponse(error) }
}
