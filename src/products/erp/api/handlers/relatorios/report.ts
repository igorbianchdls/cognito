import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from "@/products/erp/api/http/responses"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/api/http/responses'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { listProfessionalReport } from '@/products/erp/server/erpProfessionalRepository'

 async function handleGET(request: Request, context: { params: Promise<{ report: string }> }) {
  const tenant = await resolveErpAccess('erp.relatorios.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const [{ report }, url] = await Promise.all([context.params, Promise.resolve(new URL(request.url))])
    const records = await listProfessionalReport({ tenantId: tenant.tenantId, report, from: url.searchParams.get('from') || undefined, to: url.searchParams.get('to') || undefined })
    return NextResponse.json({ records })
  } catch (error) { return erpErrorResponse(error) }
}

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/relatorios/[report]","authentication":"session","maxBodyBytes":1048576})
