import { NextResponse } from 'next/server'
import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { erpErrorResponse, erpFailure, parseErpBody } from '@/products/erp/server/erpApi'
import {
  listRecurrenceHistory,
  changeFinancialRecurrence,
} from '@/products/erp/server/erpRoutineRepository'
import { z } from 'zod'
export const runtime = 'nodejs'
export async function GET(request: Request) {
  try {
    const a = await resolveErpAccess('erp.configuracoes.gerenciar')
    if (!a) return erpFailure('Acesso negado.', 403)
    return NextResponse.json(
      await listRecurrenceHistory(
        a.tenantId,
        Number(new URL(request.url).searchParams.get('page') || 1),
      ),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    return erpErrorResponse(e)
  }
}
export async function PATCH(request: Request) {
  try {
    const a = await resolveErpAccess('erp.financeiro.gerenciar')
    if (!a) return erpFailure('Acesso negado.', 403)
    const body = await parseErpBody(
      request,
      z
        .object({
          id: z.string().regex(/^[1-9]\d*$/),
          action: z.enum(['pausar', 'retomar', 'encerrar']),
          expectedUpdatedAt: z.string().datetime({ offset: true }),
        })
        .strict(),
    )
    return NextResponse.json(
      await changeFinancialRecurrence({ ...body, tenantId: a.tenantId, actorId: a.sharedUserId }),
    )
  } catch (e) {
    return erpErrorResponse(e)
  }
}
