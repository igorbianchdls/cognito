import { arvore } from '@/products/notas/server/paginas'
import { contexto, responder } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — páginas da barra lateral, favoritos e recentes. */
export async function GET() {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  return responder('NOTAS_TREE_FAILED', () => arvore(ctx))
}
