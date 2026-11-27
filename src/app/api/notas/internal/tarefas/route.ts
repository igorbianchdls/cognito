import { NextResponse } from 'next/server'
import { tarefaDiaria } from '@/products/notas/server/notificacoes'
import { tickAllowed } from '@/products/inbox/server/tick'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Todo dia (Vercel Cron, com CRON_SECRET): lembretes de datas das bases e limpeza da lixeira com mais de 30 dias. */
async function handle(request: Request) {
  if (!tickAllowed(request.headers.get('authorization'))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 })
  try { return NextResponse.json(await tarefaDiaria()) }
  catch (error) {
    console.error(JSON.stringify({ scope: 'notas', code: 'NOTAS_DAILY_FAILED', message: (error as Error).message }))
    return NextResponse.json({ error: 'Falhou.' }, { status: 500 })
  }
}
export const GET = handle
export const POST = handle
