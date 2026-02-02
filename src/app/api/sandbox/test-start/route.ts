import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'

type Step = { name: string; ms: number; ok: boolean; exitCode?: number }

export async function POST(req: Request) {
  const steps: Step[] = []
  try {
    const url = new URL(req.url)
    const qsSim = url.searchParams.get('simulate') === '1' || url.searchParams.get('fake') === '1'
    const { snapshotId: providedId, simulate } = await req.json().catch(() => ({})) as { snapshotId?: string; simulate?: boolean }
    const snapshotIdRaw = (providedId || '').trim()
    const snapshotId = (snapshotIdRaw || process.env.SANDBOX_SNAPSHOT_ID || '').trim()
    const isSimulated = qsSim || simulate === true || (snapshotIdRaw && snapshotIdRaw.toLowerCase().startsWith('fake'))

    if (isSimulated) {
      steps.push({ name: 'simulate-create-from-snapshot', ms: 1, ok: true })
      return new Response(JSON.stringify({ ok: true, timeline: steps, mode: 'simulated' }), { status: 200 })
    }

    if (!snapshotId) {
      return new Response(JSON.stringify({ ok: false, error: 'missing snapshotId (body or SANDBOX_SNAPSHOT_ID). For dev, pass ?simulate=1 or body { simulate: true }' }), { status: 400 })
    }

    const t0 = Date.now()
    const sandbox = await Sandbox.create({ source: { type: 'snapshot', snapshotId } })
    steps.push({ name: 'create-from-snapshot', ms: Date.now() - t0, ok: true })

    try { await sandbox.stop() } catch {}
    return new Response(JSON.stringify({ ok: true, timeline: steps, mode: 'snapshot' }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e), timeline: steps }), { status: 500 })
  }
}
