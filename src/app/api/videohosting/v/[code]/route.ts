import { embedConfig } from '@/products/videohosting/server/embed'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const cors = (origin: string | null) => ({ 'access-control-allow-origin': origin ?? '*', 'access-control-allow-methods': 'GET, OPTIONS', vary: 'origin', 'cache-control': 'private, max-age=60' })
const hostOf = (v: string | null) => { try { return v ? new URL(v).host.toLowerCase() : null } catch { return null } }

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request.headers.get('origin')) })
}

/** Public: the player on a page asks for its video. The page's host must be one of the allowed domains. */
export async function GET(request: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params
  const origin = request.headers.get('origin')
  if (!/^[0-9a-f]{16}$/.test(code)) return Response.json({ erro: 'Código inválido.' }, { status: 400, headers: cors(origin) })
  const host = hostOf(origin) ?? hostOf(request.headers.get('referer'))
  try {
    const result = await embedConfig(code, host, new URL(request.url).host.toLowerCase())
    return Response.json(result.status === 200 ? result.config : { erro: result.erro }, { status: result.status, headers: cors(origin) })
  } catch (error) {
    console.error(JSON.stringify({ scope: 'videohosting', code: 'EMBED_FAILED', message: (error as Error).message }))
    return Response.json({ erro: 'Indisponível.' }, { status: 503, headers: cors(origin) })
  }
}
