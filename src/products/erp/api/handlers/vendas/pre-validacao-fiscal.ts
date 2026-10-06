import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { preflightSaleFiscal } from '@/products/erp/server/erpProfessionalRepository'
import { fiscalEnvironmentSchema } from '@/products/erp/shared/fiscalContracts'

 async function handleGET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const { id } = await context.params
    const ambiente = fiscalEnvironmentSchema.parse(new URL(_request.url).searchParams.get('ambiente') || 'producao')
    return NextResponse.json(await preflightSaleFiscal(tenant.tenantId, Number(id), ambiente))
  } catch (error) { return erpErrorResponse(error) }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/vendas/[id]/pre-validacao-fiscal","authentication":"session","maxBodyBytes":1048576})
