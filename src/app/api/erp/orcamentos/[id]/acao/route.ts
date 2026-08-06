import { NextResponse } from 'next/server'

import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { runQuoteAction } from '@/products/erp/server/erpProfessionalRepository'
import { quoteActionSchema } from '@/products/erp/shared/professionalContracts'

export const runtime = 'nodejs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const [{ id }, values] = await Promise.all([context.params, parseErpBody(request, quoteActionSchema)])
    return NextResponse.json({ result: await runQuoteAction({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, quoteId: Number(id), ...values }) })
  } catch (error) { return erpErrorResponse(error) }
}
