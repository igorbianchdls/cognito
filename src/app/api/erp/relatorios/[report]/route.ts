import { NextResponse } from 'next/server'

import { erpErrorResponse } from '@/products/erp/server/erpApi'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { listProfessionalReport } from '@/products/erp/server/erpProfessionalRepository'

export const runtime = 'nodejs'

export async function GET(request: Request, context: { params: Promise<{ report: string }> }) {
  const tenant = await resolveErpAccess('erp.relatorios.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const [{ report }, url] = await Promise.all([context.params, Promise.resolve(new URL(request.url))])
    const records = await listProfessionalReport({ tenantId: tenant.tenantId, report, from: url.searchParams.get('from') || undefined, to: url.searchParams.get('to') || undefined })
    return NextResponse.json({ records })
  } catch (error) { return erpErrorResponse(error) }
}

