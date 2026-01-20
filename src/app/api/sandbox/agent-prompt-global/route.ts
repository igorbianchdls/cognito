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

    sandbox = await Sandbox.create({ runtime: 'node22', resources: { vcpus: 2 }, timeout: 300_000 })

    // Install CLI globally with sudo and Agent SDK locally
    const installCLI = await sandbox.runCommand({ cmd: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'], sudo: true })
    if (installCLI.exitCode !== 0) {
      const [o, e] = await Promise.all([installCLI.stdout().catch(() => ''), installCLI.stderr().catch(() => '')])
      return Response.json({ ok: false, step: 'install-cli', exitCode: installCLI.exitCode, stdout: o, stderr: e, error: 'Global CLI install failed' }, { status: 500 })
    }
    const installAgent = await sandbox.runCommand({ cmd: 'npm', args: ['install', '@anthropic-ai/claude-agent-sdk'] })
    if (installAgent.exitCode !== 0) {
      const [o, e] = await Promise.all([installAgent.stdout().catch(() => ''), installAgent.stderr().catch(() => '')])
      return Response.json({ ok: false, step: 'install-agent', exitCode: installAgent.exitCode, stdout: o, stderr: e, error: 'Agent SDK install failed' }, { status: 500 })
    }

    // Resolve global root using sudo as well
    const rootProc = await sandbox.runCommand({ cmd: 'npm', args: ['root', '-g'], sudo: true })
    const [rootOut] = await Promise.all([rootProc.stdout().catch(() => '')])
    const globalRoot = (rootOut || '').trim()
    const cliPath = `${globalRoot}/@anthropic-ai/claude-code/cli.js`

    const script = `
import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk';
const cli = ${JSON.stringify(cliPath)};
const prompt = process.argv[2] || 'What is 2 + 2?';
const res = await unstable_v2_prompt(prompt, { model: 'claude-sonnet-4-5-20250929', pathToClaudeCodeExecutable: cli });
if (res.type === 'result' && res.subtype === 'success') {
  console.log(res.result ?? '');
} else {
  console.log('');
  process.exit(2);
}
`.trim()
    await sandbox.writeFiles([{ path: '/vercel/sandbox/run-global.mjs', content: Buffer.from(script) }])

    const run = await sandbox.runCommand({ cmd: 'node', args: ['run-global.mjs', prompt], env: { ANTHROPIC_API_KEY: apiKey } })
    const [out, err] = await Promise.all([run.stdout().catch(() => ''), run.stderr().catch(() => '')])
    if (run.exitCode !== 0) {
      return Response.json({ ok: false, step: 'run-global', exitCode: run.exitCode, stdout: out, stderr: err, error: 'Prompt failed (global CLI)' }, { status: 500 })
    }
    return Response.json({ ok: true, text: (out || '').trim() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: message }, { status: 500 })
  } finally {
    try { await sandbox?.stop() } catch {}
  }
}

