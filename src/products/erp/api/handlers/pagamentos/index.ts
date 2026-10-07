import { withErpHttp } from '@/products/erp/api/http/handler'
import { ErpDomainError, erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { listErpPayments } from '@/products/erp/server/erpRepository'

 async function handleGET(request: Request) {
  const tenant = await resolveErpAccess('erp.financeiro.visualizar')
  if (!tenant) return erpFailure('Não autenticado.', 401)
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('tipo') === 'pagar' ? 'pagar' : 'receber'
    const accountId = Number(url.searchParams.get('conta_id'))
    if (!Number.isSafeInteger(accountId) || accountId <= 0) throw new ErpDomainError('INVALID_REFERENCE', 'Título financeiro de origem inválido.')
    const records = await listErpPayments({ tenantId: tenant.tenantId, type, accountId })
    return NextResponse.json({ records, total: records.length })
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/pagamentos","authentication":"session","maxBodyBytes":1048576})
