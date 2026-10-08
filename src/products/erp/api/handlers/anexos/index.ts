import { NextResponse } from 'next/server'
import { z } from 'zod'
import { ATTACHMENT_DOCUMENTS, listAttachments, prepareAttachmentUpload } from '../../../server/erpAttachments'
import { ErpDomainError } from '../../../shared/erpErrors'
import type { ErpCapability } from '../../../shared/professionalContracts'
import { resolveErpApiAccess } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

// Anexos de um documento. GET ?documento=&registro_id= lista; POST prepara o envio (devolve o link assinado
// para o navegador enviar o arquivo) e depois o cliente confirma em /api/erp/anexos/[id]/confirmar.
const documentSchema = z.enum(ATTACHMENT_DOCUMENTS)
const readCapability: Record<z.infer<typeof documentSchema>, ErpCapability> = {
  conta_pagar: 'erp.financeiro.visualizar', conta_receber: 'erp.financeiro.visualizar', pagamento: 'erp.financeiro.visualizar',
  venda: 'erp.vendas.visualizar', compra: 'erp.compras.visualizar', contrato: 'erp.vendas.visualizar', ordem_servico: 'erp.vendas.visualizar',
}
const writeCapability: Record<z.infer<typeof documentSchema>, ErpCapability> = {
  conta_pagar: 'erp.financeiro.gerenciar', conta_receber: 'erp.financeiro.gerenciar', pagamento: 'erp.financeiro.baixar',
  venda: 'erp.vendas.gerenciar', compra: 'erp.compras.gerenciar', contrato: 'erp.vendas.gerenciar', ordem_servico: 'erp.vendas.gerenciar',
}
const prepareSchema = z.object({ values: z.object({
  documento: documentSchema, registro_id: z.number().int().positive(), nome: z.string().trim().min(1).max(200),
  mime_type: z.string().trim().max(100), tamanho: z.number().int().positive(), finalidade: z.string().trim().max(40).optional(),
}).strict() }).strict()

async function handleGET(request: Request) {
  const params = new URL(request.url).searchParams
  const documento = documentSchema.safeParse(params.get('documento')), registroId = Number(params.get('registro_id'))
  if (!documento.success || !Number.isInteger(registroId) || registroId <= 0) throw new ErpDomainError('VALIDATION_ERROR', 'Informe o documento e o registro.', 422)
  const access = await resolveErpApiAccess(readCapability[documento.data])
  return NextResponse.json({ records: await listAttachments(access.tenantId, documento.data, registroId) })
}

async function handlePOST(request: Request) {
  const body = await parseErpBody(request, prepareSchema)
  const access = await resolveErpApiAccess(writeCapability[body.values.documento])
  return NextResponse.json(await prepareAttachmentUpload({
    tenantId: access.tenantId, documento: body.values.documento, registroId: body.values.registro_id, nome: body.values.nome,
    mimeType: body.values.mime_type, tamanho: body.values.tamanho, finalidade: body.values.finalidade,
  }), { status: 201 })
}

export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/anexos' })
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/anexos' })
