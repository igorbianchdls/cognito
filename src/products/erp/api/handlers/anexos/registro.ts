import { NextResponse } from 'next/server'
import { attachmentDownload, removeAttachment } from '../../../server/erpAttachments'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiSession } from '../../http/access'
import { withErpHttp } from '../../http/handler'

// GET: link assinado de 60 segundos para baixar o anexo. DELETE: remove o anexo (sem apagar o histórico).
// A permissão é a do documento do anexo, conferida no banco (erp.anexo_acessivel / erp.remover_anexo).
type Context = { params: Promise<{ id: string }> }
async function readId(context: Context) {
  const id = Number((await context.params).id)
  if (!Number.isInteger(id) || id <= 0) throw new ErpDomainError('NOT_FOUND', 'Anexo não encontrado.', 404)
  return id
}
async function session() {
  const current = await resolveErpApiSession()
  if (!current) throw new ErpDomainError('AUTH_REQUIRED', 'Entre na sua conta para acessar o ERP.', 401)
  return current
}

async function handleGET(_request: Request, context: Context) {
  const current = await session()
  return NextResponse.json(await attachmentDownload(current.tenantId, await readId(context)), { headers: { 'Cache-Control': 'no-store' } })
}
async function handleDELETE(_request: Request, context: Context) {
  const current = await session()
  return NextResponse.json(await removeAttachment(current.tenantId, await readId(context)))
}

export const GET = withErpHttp(handleGET, { operation: 'GET /api/erp/anexos/[id]' })
export const DELETE = withErpHttp(handleDELETE, { operation: 'DELETE /api/erp/anexos/[id]' })
