import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { importErpBankStatement } from '@/products/erp/server/erpBankImportRepository'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const tenant = await resolveErpAccess('erp.financeiro.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  try {
    const body = (await request.json()) as { accountId?: number | string; fileName?: string; content?: string }
    const result = await importErpBankStatement({
      tenantId: tenant.tenantId,
      actorId: tenant.sharedUserId,
      accountId: Number(body.accountId),
      fileName: String(body.fileName || 'extrato.ofx'),
      content: String(body.content || ''),
    })
    return NextResponse.json(result, { status: result.reused ? 200 : 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel importar o OFX.' }, { status: 400 })
  }
}
