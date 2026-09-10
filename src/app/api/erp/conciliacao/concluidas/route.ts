import { erpFailure } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { listCompletedBankReconciliations } from '@/products/erp/server/erpProfessionalRepository'

export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveErpAccess('erp.financeiro.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  try { return NextResponse.json({ records: await listCompletedBankReconciliations(tenant.tenantId) }) }
  catch (error) { return erpErrorResponse(error) }
}
