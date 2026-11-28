import { comPropriedade } from '@/products/analytics/server/http'
import { apagarGravacao, gravarPedaco, lerGravacao, listarGravacoes, MAX_PEDACO, pedacoSchema } from '@/products/analytics/server/gravacoes'
import { entrada, responder } from '@/products/analytics/server/publico'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export function OPTIONS(request: Request) { return responder(204, request.headers.get('origin')) }

/** Público (otto.js com a gravação ligada): um pedaço da gravação da sessão. */
export async function POST(request: Request) {
  const e = await entrada(request, MAX_PEDACO, 90)
  if (e instanceof Response) return e
  if (!e.site.replay_sample) return responder(403, e.origin, { erro: 'A gravação está desligada neste site.' })
  const p = pedacoSchema.safeParse(e.corpo)
  if (!p.success) return responder(400, e.origin, { erro: 'Gravação inválida.' })
  try { await gravarPedaco(e.site, p.data) } catch (error) {
    console.error(JSON.stringify({ scope: 'analytics', code: 'REPLAY_FAILED', message: (error as Error).message }))
    return responder(503, e.origin, { erro: 'Indisponível.' })
  }
  return responder(202, e.origin, { gravado: true })
}

/** GET ?propriedade (&pessoa, &pagina): a lista; com &sessao, a gravação inteira para o reprodutor. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams
  return comPropriedade('gravacoes', q.get('propriedade'), (db, id) => q.get('sessao')
    ? lerGravacao(db, id, q.get('sessao')!.slice(0, 100))
    : listarGravacoes(db, id, { pessoa: q.get('pessoa')?.slice(0, 200) || undefined, pagina: Number(q.get('pagina') ?? 0) || 0 }))
}

/** DELETE ?propriedade&sessao: apaga a gravação (quem pode alterar). */
export async function DELETE(request: Request) {
  const q = new URL(request.url).searchParams
  return comPropriedade('gravacoes', q.get('propriedade'), (db, id) => apagarGravacao(db, id, (q.get('sessao') ?? '').slice(0, 100)))
}
