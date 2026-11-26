import { obterVersao, restaurarVersao } from '@/products/notas/server/versoes'
import { contexto, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string; versao: string }> }

/** GET — uma versão com o conteúdo (para ver antes de restaurar). */
export async function GET(_request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id, versao } = await params
  if (!UUID.test(id) || !UUID.test(versao)) return json(400, { erro: 'Versão inválida.' })
  return responder('NOTAS_VERSION_GET_FAILED', () => obterVersao(ctx, id, versao))
}

/** POST — restaura a página para esta versão (a atual fica guardada no histórico). */
export async function POST(_request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id, versao } = await params
  if (!UUID.test(id) || !UUID.test(versao)) return json(400, { erro: 'Versão inválida.' })
  return responder('NOTAS_VERSION_RESTORE_FAILED', () => restaurarVersao(ctx, id, versao))
}
