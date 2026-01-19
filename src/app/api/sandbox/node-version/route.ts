import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'

export async function GET() {
  let sandbox: Sandbox | undefined
  try {
    sandbox = await Sandbox.create()

    const result = await sandbox.runCommand('node', ['-v'])
    const out = await result.stdout()

    return new Response(out, {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=utf-8' }
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  } finally {
    try { await sandbox?.stop() } catch {}
  }
}

