import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure, parseErpBody, erpErrorResponse as erpFailureResponse } from "@/products/erp/api/http/responses"
import { bankImportBody } from '../../contracts/bankImport'
import { NextResponse } from 'next/server'

import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { importErpBankStatement } from '@/products/erp/server/erpBankImportRepository'

 async function handlePOST(request: Request) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const body = await parseErpBody(request, bankImportBody)
    const result = await importErpBankStatement({
      tenantId: tenant.tenantId,
      actorId: tenant.sharedUserId,
      accountId: Number(body.accountId),
      fileName: String(body.fileName || 'extrato.ofx'),
      content: String(body.content || ''),
    })
    return NextResponse.json(result, { status: result.reused ? 200 : 201 })
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export const POST = withErpHttp(handlePOST, {"operation":"POST /api/erp/bancos/importar-ofx","authentication":"session","maxBodyBytes":4194304})
