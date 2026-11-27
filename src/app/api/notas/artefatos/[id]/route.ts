import { lerArtefato } from '@/products/notas/server/artefatos'
import { contexto, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — o artefato com o HTML atual (a tela mostra numa moldura isolada). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Artefato inválido.' })
  return responder('NOTAS_ARTIFACT_FAILED', () => lerArtefato(ctx, id))
}
