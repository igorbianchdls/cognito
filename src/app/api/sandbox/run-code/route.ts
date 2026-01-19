import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'

type RunCodeBody = { code?: string }

export async function POST(req: Request) {
  let sandbox: Sandbox | undefined
  try {
    const body = (await req.json().catch(() => ({}))) as RunCodeBody
    const code = (body?.code ?? '').toString()

    if (!code) {
      return Response.json({ ok: false, error: 'Campo "code" é obrigatório.' }, { status: 400 })
    }
    if (code.length > 5000) {
      return Response.json({ ok: false, error: 'Código muito grande (máx. 5000 chars).' }, { status: 400 })
    }

    sandbox = await Sandbox.create()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
      const result = await sandbox.runCommand('node', ['-e', code], { signal: controller.signal as any })
      const [out, err] = await Promise.all([result.stdout().catch(() => ''), result.stderr().catch(() => '')])
      return Response.json({ ok: true, stdout: out ?? '', stderr: err ?? '' })
    } finally {
      clearTimeout(timeout)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ ok: false, error: message }, { status: 500 })
  } finally {
    try { await sandbox?.stop() } catch {}
  }
}

