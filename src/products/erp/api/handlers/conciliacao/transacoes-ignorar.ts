import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { erpErrorResponse, parseErpBody } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { setBankTransactionIgnored } from '@/products/erp/server/erpProfessionalRepository'

 async function handlePOST(request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const [{ id }, values] = await Promise.all([context.params, parseErpBody(request, z.object({ ignored: z.boolean().default(true) }))])
    return NextResponse.json({ record: await setBankTransactionIgnored({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, transactionId: Number(id), ignored: values.ignored }) })
  } catch (error) { return erpErrorResponse(error) }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/conciliacao/transacoes/[id]/ignorar","authentication":"session","maxBodyBytes":1048576})
