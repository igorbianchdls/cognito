import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { ErpDomainError, erpErrorResponse, parseErpBody } from '@/products/erp/server/erpApi'
import {
  applyAdvance,
  createAdvance,
  createRenegotiation,
  getInstallmentComposition,
  listAdvances,
  listInstallmentApplications,
  listInstallmentRenegotiations,
  makePayableEffective,
  replaceFinancialAllocations,
  reverseAdvanceApplication,
  reverseRenegotiation,
} from '@/products/erp/server/erpFinanceRepository'
import { erpCreateEnvelopeSchema, readErpIdempotencyKey } from '@/products/erp/shared/erpTransport'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

type Context = { params: Promise<{ operation: string }> }
const numberId = (value: unknown, label: string) => {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new ErpDomainError('INVALID_REFERENCE', `${label} invalido.`)
  return parsed
}

export async function GET(request: Request, context: Context) {
  try {
    const tenant = await resolveErpAccess('erp.financeiro.visualizar')
    if (!tenant) throw new ErpDomainError('ACCESS_DENIED', 'Acesso negado.', 403)
    const operation = (await context.params).operation
    const params = new URL(request.url).searchParams
    if (operation === 'composicao') {
      const lado = params.get('lado')
      if (lado !== 'receber' && lado !== 'pagar') throw new ErpDomainError('VALIDATION_ERROR', 'Lado financeiro invalido.')
      return NextResponse.json(await getInstallmentComposition(tenant.tenantId, lado, numberId(params.get('parcela_id'), 'Parcela')))
    }
    if (operation === 'adiantamentos') {
      return NextResponse.json({ records: await listAdvances(tenant.tenantId, {
        lado: params.get('lado') || undefined,
        entidadeId: params.get('entidade_id') ? numberId(params.get('entidade_id'), 'Entidade') : undefined,
      }) })
    }
    if (operation === 'aplicacoes') {
      const lado = params.get('lado')
      if (lado !== 'receber' && lado !== 'pagar') throw new ErpDomainError('VALIDATION_ERROR', 'Lado financeiro invalido.')
      return NextResponse.json({ records: await listInstallmentApplications(tenant.tenantId, lado, numberId(params.get('parcela_id'), 'Parcela')) })
    }
    if (operation === 'renegociacoes') {
      const lado = params.get('lado')
      if (lado !== 'receber' && lado !== 'pagar') throw new ErpDomainError('VALIDATION_ERROR', 'Lado financeiro invalido.')
      return NextResponse.json({ records: await listInstallmentRenegotiations(tenant.tenantId, lado, numberId(params.get('parcela_id'), 'Parcela')) })
    }
    throw new ErpDomainError('NOT_FOUND', 'Operacao financeira nao encontrada.', 404)
  } catch (error) {
    return erpErrorResponse(error)
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const operation = (await context.params).operation
    const capability = operation.startsWith('reverter-') ? 'erp.financeiro.estornar' : 'erp.financeiro.gerenciar'
    const tenant = await resolveErpAccess(capability)
    if (!tenant) throw new ErpDomainError('ACCESS_DENIED', 'Acesso negado.', 403)
    const body = await parseErpBody(request, erpCreateEnvelopeSchema)
    const values = body.values || {}
    const base = { tenantId: tenant.tenantId, actorId: tenant.sharedUserId, values }
    if (operation === 'adiantamentos') return NextResponse.json(await createAdvance({ ...base, idempotencyKey: readErpIdempotencyKey(request.headers, true) }), { status: 201 })
    if (operation === 'aplicar-adiantamento') return NextResponse.json(await applyAdvance({ ...base, idempotencyKey: readErpIdempotencyKey(request.headers, true) }), { status: 201 })
    if (operation === 'reverter-aplicacao') return NextResponse.json(await reverseAdvanceApplication({ ...base, applicationId: numberId(values.aplicacao_id, 'Aplicacao'), idempotencyKey: readErpIdempotencyKey(request.headers, true) }), { status: 201 })
    if (operation === 'efetivar-previsao') return NextResponse.json(await makePayableEffective({ tenantId: tenant.tenantId, actorId: tenant.sharedUserId, payableId: numberId(values.conta_id, 'Conta') }))
    if (operation === 'rateios') {
      const lado = values.lado
      if (lado !== 'receber' && lado !== 'pagar') throw new ErpDomainError('VALIDATION_ERROR', 'Lado financeiro invalido.')
      return NextResponse.json(await replaceFinancialAllocations({ ...base, financialSide: lado, titleId: numberId(values.conta_id, 'Conta') }))
    }
    if (operation === 'renegociar') return NextResponse.json(await createRenegotiation({ ...base, idempotencyKey: readErpIdempotencyKey(request.headers, true) }), { status: 201 })
    if (operation === 'reverter-renegociacao') return NextResponse.json(await reverseRenegotiation({ ...base, agreementId: numberId(values.renegociacao_id, 'Renegociacao') }))
    throw new ErpDomainError('NOT_FOUND', 'Operacao financeira nao encontrada.', 404)
  } catch (error) {
    return erpErrorResponse(error)
  }
}
