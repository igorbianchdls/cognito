import { NextResponse } from 'next/server'
import { z } from 'zod'

import { erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { setBankTransactionIgnored } from '@/products/erp/server/erpProfessionalRepository'

export const runtime = 'nodejs'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const [{ id }, values] = await Promise.all([context.params, parseErpBody(request, z.object({ ignored: z.boolean().default(true) }))])
    return NextResponse.json({ record: await setBankTransactionIgnored({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, transactionId: Number(id), ignored: values.ignored }) })
  } catch (error) { return erpErrorResponse(error) }
}

