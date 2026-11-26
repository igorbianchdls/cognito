import { lixeira } from '@/products/notas/server/paginas'
import { contexto, responder } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — páginas na lixeira. */
export async function GET() {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  return responder('NOTAS_TRASH_FAILED', () => lixeira(ctx))
}
