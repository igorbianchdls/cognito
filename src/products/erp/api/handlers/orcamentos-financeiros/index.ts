import { NextResponse } from 'next/server'
import { z } from 'zod'
import { budgetVsActual, getBudget, listBudgets, saveBudget } from '../../../server/erpBudget'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

// Orçamento financeiro anual. GET lista (ou ?id= detalhe; ?id=&comparar=1&ate_mes= orçado × realizado).
// POST cria ou, com id + expectedVersion, edita; linhas com mes 0 distribuem o valor anual nos 12 meses;
// copiar_realizado_de + reajuste_percentual monta o orçamento a partir do realizado de um ano.
const line = z.object({ categoria_id: z.number().int().positive(), centro_custo_id: z.number().int().positive().nullable().optional(),
  mes: z.number().int().min(0).max(12), valor: z.number().min(0).max(1e12) }).strict()
const bodySchema = z.object({
  id: z.number().int().positive().optional(), expectedVersion: z.number().int().positive().optional(),
  values: z.object({ ano: z.number().int(), nome: z.string().trim().min(1).max(120), status: z.enum(['rascunho', 'aprovado']).optional(),
    linhas: z.array(line).max(5000).optional(), copiar_realizado_de: z.number().int().min(2000).max(2100).optional(),
    reajuste_percentual: z.number().min(-100).max(1000).optional() }).strict(),
}).strict()

async function handleGET(request: Request) {
  const access = await resolveErpApiAccess('erp.financeiro.visualizar'), params = new URL(request.url).searchParams
  if (!params.has('id')) return NextResponse.json({ records: await listBudgets(access.tenantId) })
  const id = Number(params.get('id'))
  if (!Number.isInteger(id) || id <= 0) throw new ErpDomainError('NOT_FOUND', 'Orçamento não encontrado.', 404)
  if (params.get('comparar') === '1') return NextResponse.json(await budgetVsActual(access.tenantId, id, Number(params.get('ate_mes')) || undefined))
  return NextResponse.json(await getBudget(access.tenantId, id))
}
async function handlePOST(request: Request) {
  const access = await resolveErpApiAccess('erp.financeiro.gerenciar')
  const body = await parseErpBody(request, bodySchema)
  return NextResponse.json(await saveBudget({ tenantId: access.tenantId, actorId: access.sharedUserId, id: body.id, expectedVersion: body.expectedVersion, values: body.values }),
    { status: body.id ? 200 : 201 })
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/orcamentos-financeiros' })
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/orcamentos-financeiros' })
