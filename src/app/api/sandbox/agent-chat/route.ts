import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(req: Request) {
  let sandbox: Sandbox | undefined
  try {
    const body = await req.json().catch(() => ({})) as { history?: ChatMessage[] }
    const history = Array.isArray(body.history) ? body.history.slice(-10) : []
    if (!history.length) {
      return Response.json({ ok: false, error: 'history vazio' }, { status: 400 })
    }
    const apiKey = process.env.ANTHROPIC_API_KEY || ''
    if (!apiKey) {
      return Response.json({ ok: false, error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
    }

    // Compose a simple chat transcript prompt
    const lines: string[] = [
      'You are a helpful assistant. Continue the conversation concisely.',
      '',
      'Conversation:'
    ]
    for (const m of history) {
      const who = m.role === 'user' ? 'User' : 'Assistant'
      lines.push(`${who}: ${m.content}`)
    }
    lines.push('Assistant:')
    const promptText = lines.join('\n').slice(0, 4000)

    // Start sandbox
    sandbox = await Sandbox.create({ runtime: 'node22', resources: { vcpus: 2 }, timeout: 300_000 })

    // Install CLI global
    const installCLI = await sandbox.runCommand({ cmd: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'], sudo: true })
    if (installCLI.exitCode !== 0) {
      const [o, e] = await Promise.all([installCLI.stdout().catch(() => ''), installCLI.stderr().catch(() => '')])
      return Response.json({ ok: false, step: 'install-cli', exitCode: installCLI.exitCode, stdout: o, stderr: e, error: 'Installing Claude Code CLI failed' }, { status: 500 })
    }

    // Install Agent SDK local
    const installAgent = await sandbox.runCommand({ cmd: 'npm', args: ['install', '@anthropic-ai/claude-agent-sdk'] })
    if (installAgent.exitCode !== 0) {
      const [o, e] = await Promise.all([installAgent.stdout().catch(() => ''), installAgent.stderr().catch(() => '')])
      return Response.json({ ok: false, step: 'install-agent', exitCode: installAgent.exitCode, stdout: o, stderr: e, error: 'Installing Claude Agent SDK failed' }, { status: 500 })
    }

    // Resolve global CLI path
    const npmRoot = await sandbox.runCommand({ cmd: 'npm', args: ['root', '-g'] })
    const [rootOut] = await Promise.all([npmRoot.stdout().catch(() => '')])
    const cliPath = `${(rootOut || '').trim()}/@anthropic-ai/claude-code/cli.js`

    const runnerScript = `
import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk';
const cli = ${JSON.stringify(cliPath)};
const prompt = process.argv[2] || '';
const res = await unstable_v2_prompt(prompt, { model: 'claude-sonnet-4-5-20250929', pathToClaudeCodeExecutable: cli });
if (res.type === 'result' && res.subtype === 'success') {
  console.log(res.result ?? '');
} else {
  console.log('');
  process.exit(2);
}
`.trim()

    await sandbox.writeFiles([
      { path: '/vercel/sandbox/agent-chat.mjs', content: Buffer.from(runnerScript) },
    ])

    const run = await sandbox.runCommand({ cmd: 'node', args: ['agent-chat.mjs', promptText], env: { ANTHROPIC_API_KEY: apiKey } })
    const [out, err] = await Promise.all([run.stdout().catch(() => ''), run.stderr().catch(() => '')])
    if (run.exitCode !== 0) {
      return Response.json({ ok: false, step: 'chat', exitCode: run.exitCode, stdout: out, stderr: err, error: 'Chat run failed' }, { status: 500 })
    }
    return Response.json({ ok: true, reply: (out || '').trim() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: message }, { status: 500 })
  } finally {
    try { await sandbox?.stop() } catch {}
  }
}

