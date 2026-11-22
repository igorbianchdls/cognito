import { NextResponse } from 'next/server'
import { runTick, tickAllowed } from '@/products/inbox/server/tick'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Every minute from the database (pg_cron + pg_net): wakes automations, sends scheduled work, retries webhooks. */
async function handle(request: Request) {
  if (!tickAllowed(request.headers.get('authorization'))) return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 })
  return NextResponse.json(await runTick())
}
export const GET = handle
export const POST = handle
