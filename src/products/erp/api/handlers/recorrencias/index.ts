import { withErpHttp } from '@/products/erp/api/http/handler'
import { NextResponse } from 'next/server'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { erpErrorResponse, erpFailure, parseErpBody } from '@/products/erp/api/http/responses'
import {
  listRecurrenceHistory,
  listFinancialRecurrences,
  changeFinancialRecurrence,
} from '@/products/erp/server/erpRoutineRepository'
import { z } from 'zod'
 async function handleGET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    const financialOnly = params.get('scope') === 'financial'
    const a = await resolveErpAccess(financialOnly ? 'erp.financeiro.gerenciar' : 'erp.configuracoes.gerenciar')
    if (!a) return erpFailure('Acesso negado.', 403)
    return NextResponse.json(
      await (financialOnly ? listFinancialRecurrences : listRecurrenceHistory)(
        a.tenantId,
        Number(params.get('page') || 1),
      ),
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (e) {
    return erpErrorResponse(e)
  }
}
 async function handlePATCH(request: Request) {
  try {
    const a = await resolveErpAccess('erp.financeiro.gerenciar')
    if (!a) return erpFailure('Acesso negado.', 403)
    const body = await parseErpBody(
      request,
      z
        .object({
          id: z.string().regex(/^[1-9]\d*$/),
          action: z.enum(['editar', 'pausar', 'retomar', 'encerrar']),
          expectedUpdatedAt: z.string().datetime({ offset: true }),
          values: z.object({
            descricao: z.string().trim().min(1).max(200),
            termino_tipo: z.enum(['data', 'ocorrencias', 'indeterminado']),
            termino_em: z.string().optional(),
            quantidade_ocorrencias: z.number().int().min(1).max(366).optional(),
          }).strict().optional(),
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

export const GET = withErpHttp(handleGET, {"operation":"GET /api/erp/recorrencias","authentication":"session","maxBodyBytes":1048576})
export const PATCH = withErpHttp(handlePATCH, {"operation":"PATCH /api/erp/recorrencias","authentication":"session","maxBodyBytes":1048576})
