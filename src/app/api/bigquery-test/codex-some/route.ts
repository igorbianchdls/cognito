import { mkdir } from 'node:fs/promises'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { Codex, type ThreadOptions } from '@openai/codex-sdk'

export const runtime = 'nodejs'
export const maxDuration = 120

type CodexSomeRequestBody = {
  message?: string
  threadId?: string | null
  model?: string
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function buildThreadOptions(model: string | undefined, workingDirectory: string): ThreadOptions {
  const options: ThreadOptions = {
    workingDirectory,
    skipGitRepoCheck: true,
    sandboxMode: 'read-only',
  }
  if (model && model.length > 0) {
    options.model = model
  }
  return options
}

function inheritProcessEnvWithTmpHome(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') env[key] = value
  }
  env.HOME = '/tmp'
  env.CODEX_HOME = '/tmp/.codex'
  return env
}

function getTargetTriple(): string | null {
  const { platform, arch } = process
  if (platform === 'linux' || platform === 'android') {
    if (arch === 'x64') return 'x86_64-unknown-linux-musl'
    if (arch === 'arm64') return 'aarch64-unknown-linux-musl'
    return null
  }
  if (platform === 'darwin') {
    if (arch === 'x64') return 'x86_64-apple-darwin'
    if (arch === 'arm64') return 'aarch64-apple-darwin'
    return null
  }
  if (platform === 'win32') {
    if (arch === 'x64') return 'x86_64-pc-windows-msvc'
    if (arch === 'arm64') return 'aarch64-pc-windows-msvc'
    return null
  }
  return null
}

function resolveCodexBinaryPath(): string | null {
  const triple = getTargetTriple()
  if (!triple) return null

  const binaryName = process.platform === 'win32' ? 'codex.exe' : 'codex'
  const directPath = join(process.cwd(), 'node_modules', '@openai', 'codex-sdk', 'vendor', triple, 'codex', binaryName)
  if (existsSync(directPath)) {
    return directPath
  }

  const pnpmDir = join(process.cwd(), 'node_modules', '.pnpm')
  if (!existsSync(pnpmDir)) {
    return null
  }

  try {
    const match = readdirSync(pnpmDir).find((name) => name.startsWith('@openai+codex-sdk@'))
    if (!match) {
      return null
    }
    const pnpmPath = join(
      pnpmDir,
      match,
      'node_modules',
      '@openai',
      'codex-sdk',
      'vendor',
      triple,
      'codex',
      binaryName
    )
    return existsSync(pnpmPath) ? pnpmPath : null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const apiKey = normalizeString(process.env.CODEX_API_KEY)
  if (!apiKey) {
    return json(
      {
        ok: false,
        error: 'CODEX_API_KEY não configurada no servidor.',
      },
      500
    )
  }

  let body: CodexSomeRequestBody = {}
  try {
    body = (await req.json()) as CodexSomeRequestBody
  } catch {
    body = {}
  }

  const message = normalizeString(body.message)
  const incomingThreadId = normalizeString(body.threadId)
  const model = normalizeString(body.model)

  if (!message) {
    return json(
      {
        ok: false,
        error: '`message` é obrigatória.',
      },
      400
    )
  }

  try {
    const workingDirectory = '/tmp/codex-some-workspace'
    await mkdir(workingDirectory, { recursive: true })
    const codexPathOverride = resolveCodexBinaryPath()
    if (!codexPathOverride) {
      return json(
        {
          ok: false,
          error: 'Binário do Codex SDK não encontrado no bundle deste deploy.',
          hint: 'Faça redeploy após ajustar outputFileTracingIncludes no next.config.ts.',
        },
        500
      )
    }

    const codex = new Codex({
      apiKey,
      baseUrl: normalizeString(process.env.OPENAI_BASE_URL) || undefined,
      env: inheritProcessEnvWithTmpHome(),
      codexPathOverride: codexPathOverride || undefined,
    })

    const threadOptions = buildThreadOptions(model || undefined, workingDirectory)
    const thread = incomingThreadId
      ? codex.resumeThread(incomingThreadId, threadOptions)
      : codex.startThread(threadOptions)

    const turn = await thread.run(message)
    const threadId = thread.id || incomingThreadId || null

    if (!threadId) {
      return json(
        {
          ok: false,
          error: 'Não foi possível obter threadId da conversa.',
        },
        500
      )
    }

    return json({
      ok: true,
      threadId,
      reply: turn.finalResponse || '',
      itemCount: turn.items.length,
      usage: turn.usage ?? null,
    })
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error)
    return json(
      {
        ok: false,
        error: messageText,
        hint: 'Verifique CODEX_API_KEY e permissões do ambiente.',
      },
      500
    )
  }
}
