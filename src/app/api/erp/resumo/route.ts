import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { getErpOverview } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveErpAccess('erp.relatorios.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try {
    return NextResponse.json(await getErpOverview(tenant.tenantId))
  } catch (error) {
    return erpFailureResponse(error)
  }
}
