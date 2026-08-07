import { NextResponse } from 'next/server'

import { listAiExecutions } from '@/products/ai-platform/server/aiAdminRepository'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { erpErrorResponse } from '@/products/erp/server/erpApi'

export const runtime = 'nodejs'

export async function GET() {
  const tenant = await resolveErpAccess('erp.configuracoes.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    return NextResponse.json({ records: await listAiExecutions(tenant.tenantId) })
  } catch (error) {
    return erpErrorResponse(error)
  }
}
