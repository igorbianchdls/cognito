import { Sandbox } from '@vercel/sandbox'
import { SESSIONS, genId, type ChatSession } from '../store'

export const runtime = 'nodejs'

export async function POST() {
  let sandbox: Sandbox | undefined
  const timeline: Array<{ name: string; ms: number; ok: boolean; exitCode?: number; note?: string }> = []
  const t0 = Date.now()
  try {
    sandbox = await Sandbox.create({ runtime: 'node22', resources: { vcpus: 2 }, timeout: 1_800_000 })
    timeline.push({ name: 'create-sandbox', ms: Date.now() - t0, ok: true })

    const t1 = Date.now()
    const install = await sandbox.runCommand({ cmd: 'npm', args: ['install', '@anthropic-ai/claude-agent-sdk', '@anthropic-ai/claude-code'] })
    const [o, e] = await Promise.all([install.stdout().catch(() => ''), install.stderr().catch(() => '')])
    timeline.push({ name: 'install-local', ms: Date.now() - t1, ok: install.exitCode === 0, exitCode: install.exitCode })
    if (install.exitCode !== 0) {
      await sandbox.stop().catch(() => {})
      return Response.json({ ok: false, error: 'install failed', stdout: o, stderr: e, timeline }, { status: 500 })
    }

    const id = genId()
    const session: ChatSession = { id, sandbox, createdAt: Date.now(), lastUsedAt: Date.now(), mode: 'local' }
    SESSIONS.set(id, session)

    return Response.json({ ok: true, chatId: id, timeline })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (sandbox) await sandbox.stop().catch(() => {})
    return Response.json({ ok: false, error: message, timeline }, { status: 500 })
  }
}
