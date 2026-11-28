import { comPropriedade } from '@/products/analytics/server/http'
import { pessoa, pessoas } from '@/products/analytics/server/motor'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET ?propriedade&busca&coorte&pagina: as pessoas (visitantes e usuários identificados); com &id, o perfil e a linha do tempo. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams
  return comPropriedade('pessoas', q.get('propriedade'), (db, id) => q.get('id')
    ? pessoa(db, id, q.get('id')!.slice(0, 200))
    : pessoas(db, id, { busca: q.get('busca')?.slice(0, 100) || undefined, coorte: /^[0-9a-f-]{36}$/i.test(q.get('coorte') ?? '') ? q.get('coorte')! : undefined, pagina: Number(q.get('pagina') ?? 0) || 0 }))
}
