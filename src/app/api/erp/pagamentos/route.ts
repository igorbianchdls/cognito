import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { listErpPayments } from '@/products/erp/server/erpRepository'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const tenant = await resolveErpAccess('erp.financeiro.visualizar')
  if (!tenant) return erpFailure('Nao autenticado.', 401)
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('tipo') === 'pagar' ? 'pagar' : 'receber'
    const accountId = Number(url.searchParams.get('conta_id'))
    if (!Number.isInteger(accountId) || accountId <= 0) throw new Error('Conta financeira de origem invalida.')
    const records = await listErpPayments({ tenantId: tenant.tenantId, type, accountId })
    return NextResponse.json({ records, total: records.length })
  } catch (error) {
    return erpFailureResponse(error)
  }
}
