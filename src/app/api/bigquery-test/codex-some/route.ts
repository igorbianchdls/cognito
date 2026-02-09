import { mkdir } from 'node:fs/promises'
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

    const codex = new Codex({
      apiKey,
      baseUrl: normalizeString(process.env.OPENAI_BASE_URL) || undefined,
      env: inheritProcessEnvWithTmpHome(),
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
