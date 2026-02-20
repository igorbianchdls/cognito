import { dispatchOutboxEventById, processPendingOutbox } from '@/products/erp/backend/shared/events/outbox'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type MaybeBody = {
  id?: unknown
  limit?: unknown
}

function toPositiveInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.trunc(n)
}

async function handleDispatch(req: Request) {
  const url = new URL(req.url)
  let body: MaybeBody = {}
  const contentType = String(req.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('application/json')) {
    try {
      body = (await req.json()) as MaybeBody
    } catch {
      body = {}
    }
  }

  const id = toPositiveInt(body.id ?? url.searchParams.get('id'))
  if (id) {
    const result = await dispatchOutboxEventById(id)
    return Response.json({ success: true, mode: 'single', result })
  }

  const limit = toPositiveInt(body.limit ?? url.searchParams.get('limit')) ?? 20
  const result = await processPendingOutbox(limit)
  return Response.json({ success: true, mode: 'batch', ...result })
}

export async function POST(req: Request) {
  try {
    return await handleDispatch(req)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

export async function GET(req: Request) {
  try {
    return await handleDispatch(req)
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
