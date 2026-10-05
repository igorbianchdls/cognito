import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { undoBankReconciliation } from '@/products/erp/server/erpProfessionalRepository'

 async function handlePOST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const { id } = await context.params
    return NextResponse.json({ record: await undoBankReconciliation({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, transactionId: Number(id) }) })
  } catch (error) { return erpErrorResponse(error) }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/conciliacao/transacoes/[id]/desfazer","authentication":"session","maxBodyBytes":1048576})
