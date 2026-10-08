import { NextResponse } from 'next/server'
import { z } from 'zod'
import { applyLaunchRules, bankBalanceCheck, deleteLaunchRule, listLaunchRules, saveLaunchRule } from '../../../server/erpBankRules'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

// Regras de lançamento do extrato (GET lista; POST cria/edita; DELETE ?id= exclui; POST ?aplicar=1 aplica às
// transações pendentes) e conferência de saldo (GET ?saldo_conta=<id>).
const ruleSchema = z.object({ values: z.object({
  id: z.number().int().positive().optional(), nome: z.string().trim().max(120).optional(),
  conta_financeira_id: z.number().int().positive().nullable().optional(), descricao_contem: z.string().trim().min(3).max(120),
  tipo_transacao: z.enum(['credito', 'debito']), categoria_id: z.number().int().positive(), entidade_id: z.number().int().positive(),
  ativo: z.boolean().optional(),
}).strict() }).strict()

async function handleGET(request: Request) {
  const access = await resolveErpApiAccess('erp.financeiro.visualizar'), params = new URL(request.url).searchParams
  const account = Number(params.get('saldo_conta'))
  if (params.has('saldo_conta')) {
    if (!Number.isInteger(account) || account <= 0) throw new ErpDomainError('VALIDATION_ERROR', 'Conta financeira inválida.', 422)
    return NextResponse.json(await bankBalanceCheck(access.tenantId, account))
  }
  return NextResponse.json({ records: await listLaunchRules(access.tenantId) })
}

async function handlePOST(request: Request) {
  const access = await resolveErpApiAccess('erp.financeiro.gerenciar'), params = new URL(request.url).searchParams
  if (params.get('aplicar') === '1') {
    const account = Number(params.get('conta'))
    return NextResponse.json(await applyLaunchRules({ tenantId: access.tenantId, actorId: access.sharedUserId, accountId: Number.isInteger(account) && account > 0 ? account : undefined }))
  }
  const body = await parseErpBody(request, ruleSchema)
  const { id, ...values } = body.values
  return NextResponse.json(await saveLaunchRule({ tenantId: access.tenantId, actorId: access.sharedUserId, id, values }), { status: id ? 200 : 201 })
}

async function handleDELETE(request: Request) {
  const access = await resolveErpApiAccess('erp.financeiro.gerenciar')
  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!Number.isInteger(id) || id <= 0) throw new ErpDomainError('NOT_FOUND', 'Regra não encontrada.', 404)
  return NextResponse.json(await deleteLaunchRule({ tenantId: access.tenantId, actorId: access.sharedUserId, id }))
}

export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/conciliacao/lancamentos' })
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/conciliacao/lancamentos' })
export const DELETE = withErpHttp(handleDELETE, { operation: 'DELETE /api/erp/conciliacao/lancamentos' })
