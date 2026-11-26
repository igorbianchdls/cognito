import { buscar } from '@/products/notas/server/paginas'
import { contexto, responder } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET ?q= — busca no título e no conteúdo. */
export async function GET(request: Request) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  return responder('NOTAS_SEARCH_FAILED', () => buscar(ctx, new URL(request.url).searchParams.get('q') ?? ''))
}
