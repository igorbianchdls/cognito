import { randomUUID } from 'node:crypto'
import { z, ZodError } from 'zod'
import { TablesError } from '@/products/tables/shared/contracts'
import { AppsError } from '../shared/contracts'
import { openPublic, publicTables, visitorOrigin } from '../server/access'
import { tablesRequestSchema } from '../server/tablesSource'

// Visitor endpoints of public apps: no login. The signed token from /runtime is the credential.
export async function publicAppsHandler(request: Request, context: { params: Promise<{ slug: string; action: string }> }) {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex', 'X-Correlation-Id': randomUUID() }
  const json = (data: unknown, status = 200) => Response.json(data, { status, headers })
  try {
    const { slug, action } = await context.params
    // Vercel puts the client address first in x-forwarded-for.
    const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'desconhecido'
    const origin = visitorOrigin(ip, slug)
    if (action === 'runtime' && request.method === 'GET') return json(await openPublic(slug, origin))
    if (action === 'tabelas' && request.method === 'POST') {
      const from = request.headers.get('origin')
      if (request.headers.get('sec-fetch-site') === 'cross-site' || from && from !== new URL(request.url).origin) throw new AppsError('INVALID_ORIGIN', 'Atualize a página e tente novamente.', 403)
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) throw new AppsError('INVALID_BODY', 'Envie dados JSON.', 415)
      const text = await request.text()
      if (text.length > 64_000) throw new AppsError('BODY_TOO_LARGE', 'Os dados são grandes demais.', 413)
      const { token, ...input } = tablesRequestSchema.extend({ token: z.string().max(4000) }).strict().parse(JSON.parse(text))
      return json(await publicTables(slug, token, input, origin))
    }
    throw new AppsError('NOT_FOUND', 'Recurso não encontrado.', 404)
  } catch (error) {
    if (error instanceof AppsError || error instanceof TablesError) return json({ error: { code: error.code, message: error.message } }, error.status)
    if (error instanceof ZodError || error instanceof SyntaxError) return json({ error: { code: 'INVALID_INPUT', message: 'Confira os dados enviados.' } }, 400)
    const code = (error as { code?: string })?.code
    if (['23514', '23503', '23505', '22007', '22008', '22P02'].includes(code ?? '')) return json({ error: { code: 'INVALID_VALUE', message: 'Um dos valores não é compatível com o campo.' } }, 422)
    if (['40001', '40P01', '55P03'].includes(code ?? '')) return json({ error: { code: 'BUSY', message: 'Tente novamente em instantes.' } }, 409)
    console.error('apps_public_request_failed', { code: code ?? 'INTERNAL', correlationId: headers['X-Correlation-Id'] })
    return json({ error: { code: 'UNAVAILABLE', message: 'Não foi possível concluir. Tente novamente.' } }, 503)
  }
}
