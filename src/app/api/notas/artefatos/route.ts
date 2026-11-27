import { listarArtefatos } from '@/products/notas/server/artefatos'
import { contexto, responder } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — os artefatos que a pessoa vê (a aba Artefatos): ?busca=, ?filtro=todos|meus|equipe, ?ordem=recentes|nome. */
export async function GET(request: Request) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const q = new URL(request.url).searchParams
  const filtro = q.get('filtro'), ordem = q.get('ordem')
  return responder('NOTAS_ARTIFACTS_FAILED', () => listarArtefatos(ctx, {
    busca: q.get('busca') ?? undefined, limite: 200,
    filtro: filtro === 'meus' || filtro === 'equipe' ? filtro : 'todos', ordem: ordem === 'nome' ? 'nome' : 'recentes',
  }))
}
