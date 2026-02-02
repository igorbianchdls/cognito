import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'

type Step = { name: string; ms: number; ok: boolean; exitCode?: number }

export async function POST(req: Request) {
  const steps: Step[] = []
  try {
    const { snapshotId: providedId } = await req.json().catch(() => ({})) as { snapshotId?: string }
    const snapshotId = (providedId || process.env.SANDBOX_SNAPSHOT_ID || '').trim()
    if (!snapshotId) {
      return new Response(JSON.stringify({ ok: false, error: 'missing snapshotId (body or SANDBOX_SNAPSHOT_ID)' }), { status: 400 })
    }

    const t0 = Date.now()
    const sandbox = await Sandbox.create({ source: { type: 'snapshot', snapshotId } })
    steps.push({ name: 'create-from-snapshot', ms: Date.now() - t0, ok: true })

    const results: Record<string, any> = {}

    // Node version
    const t1 = Date.now()
    const nodeV = await sandbox.runCommand({ cmd: 'node', args: ['-v'] })
    const nodeOut = await nodeV.stdout().catch(() => '')
    steps.push({ name: 'check-node', ms: Date.now() - t1, ok: nodeV.exitCode === 0, exitCode: nodeV.exitCode })
    results.node = (nodeV.exitCode === 0) ? (nodeOut || '').trim() : null

    // Resolve Claude Code CLI
    const t2 = Date.now()
    const resolveCli = await sandbox.runCommand({ cmd: 'node', args: ['-e', `console.log(require.resolve('@anthropic-ai/claude-code/cli.js'))`] })
    const cliOut = await resolveCli.stdout().catch(() => '')
    steps.push({ name: 'check-claude-code', ms: Date.now() - t2, ok: resolveCli.exitCode === 0, exitCode: resolveCli.exitCode })
    results.claudeCodeResolved = resolveCli.exitCode === 0
    results.claudeCodePath = (resolveCli.exitCode === 0) ? (cliOut || '').trim() : null

    // FS check
    const t3 = Date.now()
    const fsCheck = await sandbox.runCommand({ cmd: 'node', args: ['-e', `const fs=require('fs');console.log(fs.existsSync('/vercel/sandbox/.claude'));`] })
    const fsOut = await fsCheck.stdout().catch(() => '')
    steps.push({ name: 'check-fs', ms: Date.now() - t3, ok: fsCheck.exitCode === 0, exitCode: fsCheck.exitCode })
    results.fsReady = ((fsOut || '').trim() === 'true')

    try { await sandbox.stop() } catch {}
    return new Response(JSON.stringify({ ok: true, checks: results, timeline: steps }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e), timeline: steps }), { status: 500 })
  }
}

