import { NextResponse } from 'next/server'
import { z } from 'zod'
import { listPaymentMethods, savePaymentMethod } from '../../../server/erpPaymentMethods'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

// Formas de pagamento e configuração do cartão (conta da maquininha). POST cria; POST com id + expectedVersion edita.
const bodySchema = z.object({
  id: z.number().int().positive().optional(), expectedVersion: z.number().int().positive().optional(),
  values: z.object({
    nome: z.string().trim().min(1).max(80), tipo: z.string(), status: z.enum(['ativo', 'inativo']).optional(),
    taxa_percentual: z.number().min(0).max(100).optional(), taxa_fixa: z.number().min(0).max(1e6).optional(),
    prazo_repasse_dias: z.number().int().min(0).max(365).optional(), repasse: z.enum(['unico', 'parcelado']).optional(),
    conta_maquininha_id: z.number().int().positive().nullable().optional(), conta_destino_id: z.number().int().positive().nullable().optional(),
    categoria_taxa_id: z.number().int().positive().nullable().optional(), adquirente_id: z.number().int().positive().nullable().optional(),
  }).strict(),
}).strict()

async function handleGET() {
  const access = await resolveErpApiAccess('erp.financeiro.visualizar')
  return NextResponse.json({ records: await listPaymentMethods(access.tenantId) })
}
async function handlePOST(request: Request) {
  const access = await resolveErpApiAccess('erp.financeiro.gerenciar')
  const body = await parseErpBody(request, bodySchema)
  return NextResponse.json(await savePaymentMethod({ tenantId: access.tenantId, actorId: access.sharedUserId, id: body.id, expectedVersion: body.expectedVersion, values: body.values }),
    { status: body.id ? 200 : 201 })
}
export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/financeiro/formas-pagamento' })
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/financeiro/formas-pagamento' })
