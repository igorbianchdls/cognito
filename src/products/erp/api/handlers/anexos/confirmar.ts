import { NextResponse } from 'next/server'
import { z } from 'zod'
import { confirmAttachment } from '../../../server/erpAttachments'
import { ErpDomainError } from '../../../shared/erpErrors'
import { resolveErpApiSession } from '../../http/access'
import { parseErpBody } from '../../http/responses'
import { withErpHttp } from '../../http/handler'

// Confirma que o arquivo chegou ao armazenamento; só então o anexo aparece no documento.
type Context = { params: Promise<{ id: string }> }
async function handlePOST(request: Request, context: Context) {
  const current = await resolveErpApiSession()
  if (!current) throw new ErpDomainError('AUTH_REQUIRED', 'Entre na sua conta para acessar o ERP.', 401)
  const id = Number((await context.params).id)
  if (!Number.isInteger(id) || id <= 0) throw new ErpDomainError('NOT_FOUND', 'Anexo não encontrado.', 404)
  const body = await parseErpBody(request, z.object({ values: z.object({ hash_sha256: z.string().regex(/^[a-f0-9]{64}$/).optional() }).strict().default({}) }).strict())
  return NextResponse.json(await confirmAttachment(current.tenantId, id, body.values.hash_sha256))
}
export const POST = withErpHttp(handlePOST, { operation: 'POST /api/erp/anexos/[id]/confirmar' })
