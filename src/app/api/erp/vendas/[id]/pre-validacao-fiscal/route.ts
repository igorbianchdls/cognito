import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { preflightSaleFiscal } from '@/products/erp/server/erpProfessionalRepository'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const tenant = await resolveErpAccess('erp.vendas.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    const { id } = await context.params
    return NextResponse.json(await preflightSaleFiscal(tenant.tenantId, Number(id)))
  } catch (error) { return erpErrorResponse(error) }
}
