import { NextResponse } from 'next/server'
import { limpar } from '@/products/analytics/server/gravacoes'
import { tickAllowed } from '@/products/inbox/server/tick'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Todo dia (Vercel Cron, com CRON_SECRET): apaga eventos com mais de ~2 anos e gravações com mais de 30 dias. */
async function handle(request: Request) {
  if (!tickAllowed(request.headers.get('authorization'))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 })
  try { return NextResponse.json((await limpar())[0]?.r ?? {}) }
  catch (error) {
    console.error(JSON.stringify({ scope: 'analytics', code: 'ANALYTICS_CLEANUP_FAILED', message: (error as Error).message }))
    return NextResponse.json({ error: 'Falhou.' }, { status: 500 })
  }
}
export const GET = handle
export const POST = handle
