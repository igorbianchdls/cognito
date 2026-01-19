import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  let sandbox: Sandbox | undefined
  try {
    const { searchParams } = new URL(req.url)
    const prompt = (searchParams.get('prompt') ?? 'What is 2 + 2?').toString()
    const apiKey = process.env.ANTHROPIC_API_KEY || ''
    if (!apiKey) {
      return Response.json({ ok: false, error: 'ANTHROPIC_API_KEY não configurada' }, { status: 500 })
    }

    // 1) Start sandbox
    sandbox = await Sandbox.create({
      runtime: 'node22',
      resources: { vcpus: 2 },
      timeout: 300_000,
    })

    // 2) Install Claude Code CLI (global)
    const installCLI = await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '-g', '@anthropic-ai/claude-code'],
      sudo: true,
    })
    if (installCLI.exitCode !== 0) {
      const [o, e] = await Promise.all([installCLI.stdout().catch(() => ''), installCLI.stderr().catch(() => '')])
      return Response.json({ ok: false, step: 'install-cli', exitCode: installCLI.exitCode, stdout: o, stderr: e, error: 'Installing Claude Code CLI failed' }, { status: 500 })
    }

    // 3) Install Claude Agent SDK (local)
    const installAgent = await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '@anthropic-ai/claude-agent-sdk'],
    })
    if (installAgent.exitCode !== 0) {
      const [o, e] = await Promise.all([installAgent.stdout().catch(() => ''), installAgent.stderr().catch(() => '')])
      return Response.json({ ok: false, step: 'install-agent', exitCode: installAgent.exitCode, stdout: o, stderr: e, error: 'Installing Claude Agent SDK failed' }, { status: 500 })
    }

    // 4) Write script to run a single prompt
    const agentScript = `
import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || 'What is 2 + 2?';
const res = await unstable_v2_prompt(prompt, { model: 'claude-sonnet-4-5-20250929', pathToClaudeCodeExecutable: cli });
if (res.type === 'result' && res.subtype === 'success') {
  console.log(res.result ?? '');
} else {
  console.log('');
  process.exit(2);
}
`.trim()
    await sandbox.writeFiles([
      { path: '/vercel/sandbox/agent-prompt.mjs', content: Buffer.from(agentScript) },
    ])

    // 5) Run the script with API key
    const run = await sandbox.runCommand({
      cmd: 'node',
      args: ['agent-prompt.mjs', prompt],
      env: { ANTHROPIC_API_KEY: apiKey },
    })
    const [out, err] = await Promise.all([run.stdout().catch(() => ''), run.stderr().catch(() => '')])
    if (run.exitCode !== 0) {
      return Response.json({ ok: false, step: 'prompt', exitCode: run.exitCode, stdout: out, stderr: err, error: 'Prompt run failed' }, { status: 500 })
    }

    return Response.json({ ok: true, text: (out || '').trim() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: message }, { status: 500 })
  } finally {
    try { await sandbox?.stop() } catch {}
  }
}
