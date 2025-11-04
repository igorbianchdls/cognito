import { inngest } from '@/app/workflows/inngest/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const res = await inngest.send({
      name: 'app/hello',
      data: { source: 'api/inngest/test', at: new Date().toISOString() },
    })
    return Response.json({ ok: true, eventIds: res.ids })
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

