import { NextResponse } from 'next/server'
import { commissionReport } from '../../../server/erpCommercialRepository'
import { commissionReportSchema } from '../../../shared/commercialPolicyContracts'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiAccess } from '../../http/access'
import { withErpHttp } from '../../http/handler'

// Relatório de comissões: valor, liberado, pago e a pagar por vendedor e por item de venda.
async function handleGET(request: Request) {
  const access = await resolveErpApiAccess('erp.vendas.visualizar'), params = new URL(request.url).searchParams
  const parsed = commissionReportSchema.safeParse({
    inicio: params.get('inicio'), fim: params.get('fim'),
    ...(params.get('vendedor_id') ? { vendedor_id: Number(params.get('vendedor_id')) } : {}),
    pagina: Number(params.get('page') || 1), por_pagina: Number(params.get('pageSize') || 50),
  })
  if (!parsed.success) throw new ErpDomainError('VALIDATION_ERROR', 'Informe início e fim no formato AAAA-MM-DD.', 422, parsed.error.flatten())
  return NextResponse.json(await commissionReport(access.tenantId, parsed.data))
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/comissoes' })
