import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'

type Step = { name: string; ms: number; ok: boolean; exitCode?: number }

export async function POST(req: Request) {
  const steps: Step[] = []
  const t0 = Date.now()
  try {
    const url = new URL(req.url)
    const open = url.searchParams.get('open') === '1'
    const adminSecret = req.headers.get('x-admin-secret') || ''
    const expected = process.env.ADMIN_SNAPSHOT_SECRET || ''
    if (!open) {
      if (!expected || adminSecret !== expected) {
        return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 })
      }
    }

    const body = await req.json().catch(() => ({})) as { installDeps?: boolean; seed?: boolean }
    const doInstall = body.installDeps !== false
    const doSeed = body.seed !== false

    const sandbox = await Sandbox.create({ runtime: 'node22', resources: { vcpus: 2 }, timeout: 1_800_000 })
    steps.push({ name: 'create-sandbox', ms: Date.now() - t0, ok: true })

    if (doInstall) {
      const t1 = Date.now()
      const install = await sandbox.runCommand({ cmd: 'npm', args: ['install', '@anthropic-ai/claude-agent-sdk', '@anthropic-ai/claude-code', 'zod', '@composio/core', '@composio/claude-agent-sdk'] })
      steps.push({ name: 'npm-install', ms: Date.now() - t1, ok: install.exitCode === 0, exitCode: install.exitCode })
      if (install.exitCode !== 0) {
        const [o, e] = await Promise.all([install.stdout().catch(() => ''), install.stderr().catch(() => '')])
        try { await sandbox.stop() } catch {}
        return new Response(JSON.stringify({ ok: false, error: 'install failed', stdout: o, stderr: e, timeline: steps }), { status: 500 })
      }
    }

    if (doSeed) {
      try {
        const t2 = Date.now()
        const mk1 = await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.claude/skills/Tools',{recursive:true});`] })
        steps.push({ name: 'mkdir-claude-skills', ms: Date.now() - t2, ok: mk1.exitCode === 0, exitCode: mk1.exitCode })
        const t3 = Date.now()
        const mk2 = await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp',{recursive:true});`] })
        steps.push({ name: 'mkdir-mcp', ms: Date.now() - t3, ok: mk2.exitCode === 0, exitCode: mk2.exitCode })
      } catch {}
    }

    const t4 = Date.now()
    const snap = await sandbox.snapshot()
    steps.push({ name: 'snapshot', ms: Date.now() - t4, ok: Boolean(snap?.snapshotId) })
    // Snapshot auto-stops the sandbox
    return new Response(JSON.stringify({ ok: true, snapshotId: (snap as any)?.snapshotId || null, timeline: steps, mode: open ? 'open' : 'protected' }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e), timeline: steps }), { status: 500 })
  }
}
