import { withErpHttp } from '@/products/erp/api/http/handler'
import { erpFailure } from '@/products/erp/api/http/responses'
import { NextResponse } from 'next/server'
import { resolveErpApiAccess as resolveErpAccess } from '@/products/erp/api/http/access'
import { getCustomerCreditSummary } from '@/products/erp/server/erpCommercialRules'

// Resumo de crédito do cliente (em aberto, vencido, limite, disponível) para quem vê o cadastro: o vendedor confere
// antes de vender, sem acesso aos títulos do financeiro.
async function handleGET(request: Request) {
  const tenant = await resolveErpAccess('erp.cadastros.visualizar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  const id = Number(new URL(request.url).searchParams.get('cliente_id'))
  if (!Number.isSafeInteger(id) || id <= 0) return erpFailure('Cliente inválido.', 400)
  const credito = await getCustomerCreditSummary(tenant.tenantId, id)
  if (!credito) return erpFailure('Cliente não encontrado.', 404)
  return NextResponse.json({ credito })
}

export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/catalogos/credito-cliente', authentication: 'session', maxBodyBytes: 1048576 })
