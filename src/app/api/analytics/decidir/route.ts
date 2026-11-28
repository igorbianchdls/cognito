import { z } from 'zod'
import { parseAgent } from '@/products/analytics/server/capture'
import { flagsDoVisitante } from '@/products/analytics/server/flags'
import { doServidor } from '@/products/analytics/server/pg'
import { entrada, responder } from '@/products/analytics/server/publico'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const corpo = z.object({ k: z.string(), d: z.string().min(1).max(100), u: z.string().max(200).nullish(), url: z.string().max(2000).nullish(), lang: z.string().max(20).nullish() }).strict()

export function OPTIONS(request: Request) { return responder(204, request.headers.get('origin')) }

/**
 * Público (otto.js, ao carregar): as flags do visitante e o que o site ligou (autocaptura, gravação com a amostra já
 * sorteada para esta sessão fica com o script). POST text/plain {k, d, u?, url?, lang?}.
 */
export async function POST(request: Request) {
  const e = await entrada(request, 8 * 1024, 60)
  if (e instanceof Response) return e
  const p = corpo.safeParse(e.corpo)
  if (!p.success) return responder(400, e.origin, { erro: 'Dados inválidos.' })
  const agente = parseAgent(request.headers.get('user-agent') ?? '')
  let pagina: string | null = null
  try { pagina = p.data.url ? new URL(p.data.url).pathname : null } catch { /* sem página */ }
  try {
    const flags = await doServidor(db => flagsDoVisitante(db, e.site.id, { distinct_id: p.data.d, user_id: p.data.u, pais: request.headers.get('x-vercel-ip-country'),
      aparelho: agente.device, navegador: agente.browser, sistema: agente.os, idioma: p.data.lang?.slice(0, 2) ?? null, pagina }))
    return responder(200, e.origin, { flags, autocaptura: e.site.autocapture, gravacao: { amostra: e.site.replay_sample, mascarar: e.site.replay_mask_text } })
  } catch (error) {
    console.error(JSON.stringify({ scope: 'analytics', code: 'DECIDE_FAILED', message: (error as Error).message }))
    return responder(200, e.origin, { flags: {}, autocaptura: e.site.autocapture, gravacao: { amostra: 0, mascarar: true } })
  }
}
