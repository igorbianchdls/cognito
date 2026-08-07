import { NextResponse } from 'next/server'
import { z } from 'zod'

import { listAiConnections, updateAiConnection } from '@/products/ai-platform/server/aiAdminRepository'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'

export const runtime = 'nodejs'

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  writeEnabled: z.boolean().optional(),
  status: z.enum(['active', 'suspended', 'revoked']).optional(),
}).refine((value) => value.writeEnabled !== undefined || value.status !== undefined, 'Nenhuma alteracao informada.')

export async function GET() {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try { return NextResponse.json({ records: await listAiConnections(tenant.tenantId) }) }
  catch (error) { return erpErrorResponse(error) }
}

export async function PATCH(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const values = await parseErpBody(request, updateSchema)
    return NextResponse.json({ record: await updateAiConnection({ tenantId: tenant.tenantId, ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}
