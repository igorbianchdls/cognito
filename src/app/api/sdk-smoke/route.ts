export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET() {
  try {
    const { execFile } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const { join } = await import('node:path')

    const run = promisify(execFile)
    const scriptPath = join(process.cwd(), 'scripts', 'claude-v2-smoke.mjs')

    const { stdout } = await run(process.execPath, [scriptPath], {
      env: { ...process.env }
    })

    return Response.json({ text: stdout.trim() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sdk-smoke] error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
