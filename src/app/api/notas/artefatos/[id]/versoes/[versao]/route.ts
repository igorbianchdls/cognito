import { restaurarVersaoArtefato, versaoArtefato } from '@/products/notas/server/artefatos'
import { contexto, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string; versao: string }> }
async function ler(params: Params['params']) {
  const { id, versao } = await params
  const n = Number(versao)
  return UUID.test(id) && Number.isInteger(n) && n > 0 ? { id, n } : null
}

/** GET — o HTML de uma versão (para ver antes de restaurar). */
export async function GET(_request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const alvo = await ler(params)
  if (!alvo) return json(400, { erro: 'Versão inválida.' })
  return responder('NOTAS_ARTIFACT_VERSION_FAILED', () => versaoArtefato(ctx, alvo.id, alvo.n))
}

/** POST — restaura a versão (vira uma versão nova; nada se perde). */
export async function POST(_request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const alvo = await ler(params)
  if (!alvo) return json(400, { erro: 'Versão inválida.' })
  return responder('NOTAS_ARTIFACT_RESTORE_FAILED', () => restaurarVersaoArtefato(ctx, alvo.id, alvo.n))
}
