import ms from 'ms'
import { Sandbox } from '@vercel/sandbox'

async function main() {
  const sandbox = await Sandbox.create({
    resources: { vcpus: 4 },
    // Timeout in milliseconds: ms('10m') = 600000
    // Defaults to 5 minutes. The maximum is 5 hours for Pro/Enterprise, and 45 minutes for Hobby.
    timeout: ms('10m'),
    runtime: 'node22',
  })

  console.log(`Sandbox created: ${sandbox.sandboxId}`)
  console.log(`Installing Claude Code CLI...`)

  // Install Claude Code CLI globally
  const installCLI = await sandbox.runCommand({
    cmd: 'npm',
    args: ['install', '-g', '@anthropic-ai/claude-code'],
    stderr: process.stderr,
    stdout: process.stdout,
    sudo: true,
  })
  if (installCLI.exitCode != 0) {
    console.log('installing Claude Code CLI failed')
    process.exit(1)
  }
  console.log(`\u2713 Claude Code CLI installed`)

  console.log(`Installing Anthropic SDK...`)
  // Install @anthropic-ai/sdk in the working directory
  const installSDK = await sandbox.runCommand({
    cmd: 'npm',
    args: ['install', '@anthropic-ai/sdk'],
    stderr: process.stderr,
    stdout: process.stdout,
  })
  if (installSDK.exitCode != 0) {
    console.log('installing Anthropic SDK failed')
    process.exit(1)
  }
  console.log(`\u2713 Anthropic SDK installed`)

  console.log(`Verifying SDK connection...`)
  // Create a simple script to verify the SDK can be imported
  const verifyScript = `
import Anthropic from '@anthropic-ai/sdk';
console.log('SDK imported successfully');
console.log('Anthropic SDK version:', Anthropic.VERSION);
console.log('SDK is ready to use');
`
  await sandbox.writeFiles([
    {
      path: '/vercel/sandbox/verify.mjs',
      content: Buffer.from(verifyScript),
    },
  ])

  // Run the verification script
  const verifyRun = await sandbox.runCommand({
    cmd: 'node',
    args: ['verify.mjs'],
    stderr: process.stderr,
    stdout: process.stdout,
  })
  if (verifyRun.exitCode != 0) {
    console.log('SDK verification failed')
    process.exit(1)
  }
  console.log(`\u2713 Anthropic SDK is properly connected`)
  console.log(`\nSuccess! Both Claude Code CLI and Anthropic SDK are installed and ready to use.`)

  // Stop the sandbox
  await sandbox.stop()
  console.log(`Sandbox stopped`)
}

main().catch(console.error)

