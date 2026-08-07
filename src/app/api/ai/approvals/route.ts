import { NextResponse } from 'next/server'
import { z } from 'zod'

import { decideAiApproval, listAiApprovals } from '@/products/ai-platform/server/aiAdminRepository'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'

export const runtime = 'nodejs'

const decisionSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().trim().max(1000).nullable().optional(),
})

export async function GET() {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try { return NextResponse.json({ records: await listAiApprovals(tenant.tenantId) }) }
  catch (error) { return erpErrorResponse(error) }
}

export async function PATCH(request: Request) {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const values = await parseErpBody(request, decisionSchema)
    return NextResponse.json({ record: await decideAiApproval({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}
