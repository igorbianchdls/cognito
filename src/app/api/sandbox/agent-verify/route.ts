import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'

export async function GET() {
  let sandbox: Sandbox | undefined
  try {
    // 1) Start sandbox (10 min timeout, Node 22, vCPUs=4)
    sandbox = await Sandbox.create({
      runtime: 'node22',
      resources: { vcpus: 4 },
      timeout: 600_000,
    })

    // 2) Install Claude Code CLI globally
    const installCLI = await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '-g', '@anthropic-ai/claude-code'],
      sudo: true,
    })
    const [cliOut, cliErr] = await Promise.all([
      installCLI.stdout().catch(() => ''),
      installCLI.stderr().catch(() => ''),
    ])
    if (installCLI.exitCode !== 0) {
      return Response.json({
        ok: false,
        step: 'install-cli',
        exitCode: installCLI.exitCode,
        stdout: cliOut,
        stderr: cliErr,
        error: 'Installing Claude Code CLI failed',
      }, { status: 500 })
    }

    // 3) Install @anthropic-ai/sdk locally
    const installSDK = await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '@anthropic-ai/sdk'],
    })
    const [sdkOut, sdkErr] = await Promise.all([
      installSDK.stdout().catch(() => ''),
      installSDK.stderr().catch(() => ''),
    ])
    if (installSDK.exitCode !== 0) {
      return Response.json({
        ok: false,
        step: 'install-sdk',
        exitCode: installSDK.exitCode,
        stdout: sdkOut,
        stderr: sdkErr,
        error: 'Installing Anthropic SDK failed',
      }, { status: 500 })
    }

    // 3.1) Install @anthropic-ai/claude-agent-sdk locally (import-only verification)
    const installAgent = await sandbox.runCommand({
      cmd: 'npm',
      args: ['install', '@anthropic-ai/claude-agent-sdk'],
    })
    const [agentOut, agentErr] = await Promise.all([
      installAgent.stdout().catch(() => ''),
      installAgent.stderr().catch(() => ''),
    ])
    if (installAgent.exitCode !== 0) {
      return Response.json({
        ok: false,
        step: 'install-agent-sdk',
        exitCode: installAgent.exitCode,
        stdout: agentOut,
        stderr: agentErr,
        error: 'Installing Claude Agent SDK failed',
      }, { status: 500 })
    }

    // 4) Check CLI version explicitly (optional but informative)
    const cliVersionProc = await sandbox.runCommand({
      cmd: 'npx',
      args: ['-y', '@anthropic-ai/claude-code', '--version'],
    })
  const [cliVerOut, cliVerErr] = await Promise.all([
    cliVersionProc.stdout().catch(() => ''),
    cliVersionProc.stderr().catch(() => ''),
  ])

    // 5) Write minimal verify scripts
    const verifyScript = `import Anthropic from '@anthropic-ai/sdk';\nconsole.log('SDK imported successfully');\nconsole.log('Anthropic SDK version:', Anthropic.VERSION);\nconsole.log('SDK is ready to use');\n`
    const agentImportScript = `import { query } from '@anthropic-ai/claude-agent-sdk';\nconsole.log('Agent SDK imported successfully');\n`
    await sandbox.writeFiles([
      { path: '/vercel/sandbox/verify.mjs', content: Buffer.from(verifyScript) },
      { path: '/vercel/sandbox/agent-verify.mjs', content: Buffer.from(agentImportScript) },
    ])

    // 6) Run verification
    const verifyRun = await sandbox.runCommand({
      cmd: 'node',
      args: ['verify.mjs'],
    })
    const [verOut, verErr] = await Promise.all([
      verifyRun.stdout().catch(() => ''),
      verifyRun.stderr().catch(() => ''),
    ])
    if (verifyRun.exitCode !== 0) {
      return Response.json({
        ok: false,
        step: 'verify',
        exitCode: verifyRun.exitCode,
        stdout: verOut,
        stderr: verErr,
        error: 'SDK verification failed',
      }, { status: 500 })
    }

    // 6.1) Run Agent SDK import verification
    const agentVerifyRun = await sandbox.runCommand({
      cmd: 'node',
      args: ['agent-verify.mjs'],
    })
    const [agentVerOut, agentVerErr] = await Promise.all([
      agentVerifyRun.stdout().catch(() => ''),
      agentVerifyRun.stderr().catch(() => ''),
    ])
    if (agentVerifyRun.exitCode !== 0) {
      return Response.json({
        ok: false,
        step: 'agent-verify',
        exitCode: agentVerifyRun.exitCode,
        stdout: agentVerOut,
        stderr: agentVerErr,
        error: 'Agent SDK import verification failed',
      }, { status: 500 })
    }

    return Response.json({
      ok: true,
      steps: {
        installCLI: { exitCode: installCLI.exitCode },
        installSDK: { exitCode: installSDK.exitCode },
        installAgent: { exitCode: installAgent.exitCode },
        verify: { exitCode: verifyRun.exitCode },
      },
      cliVersion: (cliVerOut || cliVerErr).trim(),
      verifyOutput: verOut.trim(),
      agentVerifyOutput: (agentVerOut || agentVerErr).trim(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: message }, { status: 500 })
  } finally {
    try { await sandbox?.stop() } catch {}
  }
}
