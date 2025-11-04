import { inngest } from '@/app/workflows/inngest/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const res = await inngest.send({
      name: 'app/bigquery-test/demo',
      data: {
        email: 'tester@example.com',
        message: 'Disparo via GET em /api/bigquery-test/workflow/trigger',
        nonce: Math.random().toString(36).slice(2),
        ts: new Date().toISOString(),
      },
    })
    return Response.json({ ok: true, eventIds: res.ids })
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const res = await inngest.send({
      name: 'app/bigquery-test/demo',
      data: {
        email: body?.email ?? 'post@example.com',
        message: body?.message ?? 'Disparo via POST',
        nonce: body?.nonce ?? Math.random().toString(36).slice(2),
        ts: new Date().toISOString(),
      },
    })
    return Response.json({ ok: true, eventIds: res.ids })
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

