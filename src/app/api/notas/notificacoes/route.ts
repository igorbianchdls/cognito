import { listarNotificacoes, marcarLidas } from '@/products/notas/server/notificacoes'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — caixa de entrada da pessoa (menções, comentários, atribuições e lembretes). */
export async function GET() {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  return responder('NOTAS_INBOX_FAILED', () => listarNotificacoes(ctx))
}

/** PATCH { ids } ou { todas: true } — marcar como lidos. */
export async function PATCH(request: Request) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const body = await corpo<{ ids?: unknown; todas?: unknown }>(request)
  const ids = Array.isArray(body?.ids) && body.ids.length <= 100 && body.ids.every(i => typeof i === 'string' && UUID.test(i)) ? body.ids as string[] : null
  if (!body || (!ids && body.todas !== true)) return json(400, { erro: 'Parâmetros inválidos.' })
  return responder('NOTAS_INBOX_READ_FAILED', () => marcarLidas(ctx, ids ?? 'todas'))
}
