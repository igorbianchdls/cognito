import { SESSIONS, type ChatSession } from '../store'

export const runtime = 'nodejs'

type Msg = { role: 'user'|'assistant'; content: string }

export async function POST(req: Request) {
  const timeline: Array<{ name: string; ms: number; ok: boolean; exitCode?: number; note?: string }> = []
  const t0 = Date.now()
  try {
    const body = await req.json().catch(() => ({})) as { chatId?: string; history?: Msg[] }
    const chatId = (body.chatId || '').toString()
    const history = Array.isArray(body.history) ? body.history : []
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    if (!history.length) return Response.json({ ok: false, error: 'history vazio' }, { status: 400 })

    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    sess.lastUsedAt = Date.now()

    const lines: string[] = ['You are a helpful assistant. Continue the conversation.', '', 'Conversation:']
    for (const m of history.slice(-12)) {
      lines.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    }
    lines.push('Assistant:')
    const prompt = lines.join('\n').slice(0, 6000)
    timeline.push({ name: 'build-transcript', ms: Date.now() - t0, ok: true })

    const t1 = Date.now()
    const runner = `
import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || '';
const res = await unstable_v2_prompt(prompt, { model: 'claude-sonnet-4-5-20250929', pathToClaudeCodeExecutable: cli });
if (res.type === 'result' && res.subtype === 'success') {
  console.log(res.result ?? '');
} else {
  console.log('');
  process.exit(2);
}
`.trim()
    await sess.sandbox.writeFiles([{ path: '/vercel/sandbox/agent-chat-run.mjs', content: Buffer.from(runner) }])
    timeline.push({ name: 'write-runner', ms: Date.now() - t1, ok: true })

    const t2 = Date.now()
    const run = await sess.sandbox.runCommand({ cmd: 'node', args: ['agent-chat-run.mjs', prompt], env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '' } })
    const [out, err] = await Promise.all([run.stdout().catch(() => ''), run.stderr().catch(() => '')])
    timeline.push({ name: 'run-prompt', ms: Date.now() - t2, ok: run.exitCode === 0, exitCode: run.exitCode })
    if (run.exitCode !== 0) {
      return Response.json({ ok: false, reply: '', stderr: err, stdout: out, timeline, error: 'run failed' }, { status: 500 })
    }
    return Response.json({ ok: true, reply: (out || '').trim(), timeline })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: message, timeline }, { status: 500 })
  }
}

