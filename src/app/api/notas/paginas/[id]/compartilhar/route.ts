import { alterarCompartilhamento, obterCompartilhamento, type Convidado } from '@/products/notas/server/compartilhamento'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

/** GET — acesso geral, convidados e link público da página. */
export async function GET(_request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Página inválida.' })
  return responder('NOTAS_SHARE_GET_FAILED', () => obterCompartilhamento(ctx, id))
}

/** PATCH { acesso?, convidados?, publica? } — só quem criou a página. */
export async function PATCH(request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await corpo<{ acesso?: unknown; convidados?: unknown; publica?: unknown }>(request)
  const convidadosOk = body?.convidados === undefined || (Array.isArray(body.convidados) && body.convidados.every((c: Convidado) =>
    c && typeof c.user_id === 'string' && c.user_id.length <= 100 && (c.nivel === 'ver' || c.nivel === 'editar')))
  if (!UUID.test(id) || !body || !convidadosOk || (body.acesso !== undefined && body.acesso !== 'empresa' && body.acesso !== 'restrito')
    || (body.publica !== undefined && typeof body.publica !== 'boolean')) return json(400, { erro: 'Parâmetros inválidos.' })
  return responder('NOTAS_SHARE_UPDATE_FAILED', () => alterarCompartilhamento(ctx, id, body as never))
}
