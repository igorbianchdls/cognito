import { NextResponse } from 'next/server'

import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { deactivateErpEntityRecord, getErpEntityRecord, updateErpEntityRecord } from '@/products/erp/server/erpRepository'
import { isErpConnectedModuleId } from '@/products/erp/server/erpModuleRegistry'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ entityId: string; id: string }> }

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Nao foi possivel atualizar o registro.'
  return NextResponse.json(
    { error: message.replace(/^CONFLITO_VERSAO:\s*/, '') },
    { status: message.startsWith('CONFLITO_VERSAO:') ? 409 : message === 'Registro nao encontrado.' ? 404 : 400 },
  )
}

export async function GET(_request: Request, context: RouteContext) {
  const { entityId, id } = await context.params
  if (!isErpConnectedModuleId(entityId)) return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })
  try {
    return NextResponse.json({ record: await getErpEntityRecord({ tenantId: tenant.tenantId, entityId, id }) })
  } catch (error) { return errorResponse(error) }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { entityId, id } = await context.params
  if (!isErpConnectedModuleId(entityId)) return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({})) as { values?: Record<string, unknown>; expectedVersion?: number }
    if (!Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) <= 0) {
      return NextResponse.json({ error: 'Versao do registro e obrigatoria.' }, { status: 400 })
    }
    const record = await updateErpEntityRecord({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      entityId, id, values: body.values || {}, expectedVersion: Number(body.expectedVersion) })
    return NextResponse.json({ record })
  } catch (error) { return errorResponse(error) }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { entityId, id } = await context.params
  if (!isErpConnectedModuleId(entityId)) return NextResponse.json({ error: 'Modulo ERP nao encontrado.' }, { status: 404 })
  const tenant = await resolveAuthTenant({ access: 'manage' })
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = await request.json().catch(() => ({})) as { expectedVersion?: number }
    if (!Number.isInteger(body.expectedVersion) || Number(body.expectedVersion) <= 0) {
      return NextResponse.json({ error: 'Versao do registro e obrigatoria.' }, { status: 400 })
    }
    const record = await deactivateErpEntityRecord({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId,
      entityId, id, expectedVersion: Number(body.expectedVersion) })
    return NextResponse.json({ record })
  } catch (error) { return errorResponse(error) }
}
