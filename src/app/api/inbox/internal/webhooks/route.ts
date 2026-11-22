import { NextResponse } from 'next/server'
import { appDb } from '@/products/inbox/server/db'
import { mediaStore } from '@/products/inbox/server/media'
import { retryPending } from '@/products/inbox/server/webhooks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Daily job (vercel.json): Meta webhooks that failed are processed again; old processed ones are forgotten. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'Tarefa não configurada.' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Acesso negado.' }, { status: 401 })
  try {
    return NextResponse.json(await retryPending({ service: appDb.service, storeMedia: mediaStore(appDb.service) }, 200))
  } catch {
    return NextResponse.json({ error: 'Falha ao reprocessar os avisos da Meta.' }, { status: 503 })
  }
}
