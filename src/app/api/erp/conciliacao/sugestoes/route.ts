import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { suggestBankReconciliations } from '@/products/erp/server/erpProfessionalRepository'

export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveErpAccess('erp.financeiro.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try { return NextResponse.json({ records: await suggestBankReconciliations(tenant.tenantId) }) }
  catch (error) { return erpErrorResponse(error) }
}

