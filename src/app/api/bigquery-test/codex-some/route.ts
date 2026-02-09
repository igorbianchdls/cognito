import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'
export const maxDuration = 300

type CodexSomeRequestBody = {
  action?: 'start' | 'send' | 'stop'
  sessionId?: string | null
  message?: string
  threadId?: string | null
  model?: string
}

type CodexSomeSession = {
  id: string
  sandbox: Sandbox
  createdAt: number
  lastUsedAt: number
}

const SESSIONS = new Map<string, CodexSomeSession>()
const SESSION_TTL_MS = 30 * 60 * 1000

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

function genId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

function parseLastJsonLine(raw: string): any | null {
  const lines = String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i])
    } catch {
      // keep searching
    }
  }
  return null
}

async function cleanupExpiredSessions() {
  const now = Date.now()
  for (const [id, session] of SESSIONS.entries()) {
    if (now - session.lastUsedAt <= SESSION_TTL_MS) continue
    try {
      await session.sandbox.stop()
    } catch {
      // ignore cleanup errors
    } finally {
      SESSIONS.delete(id)
    }
  }
}

async function createSession() {
  const timeline: Array<{ name: string; ms: number; ok: boolean; exitCode?: number }> = []
  const t0 = Date.now()
  const sandbox = await Sandbox.create({ runtime: 'node22', resources: { vcpus: 2 }, timeout: 600_000 })
  timeline.push({ name: 'create-sandbox', ms: Date.now() - t0, ok: true })

  const t1 = Date.now()
  const install = await sandbox.runCommand({ cmd: 'npm', args: ['install', '@openai/codex-sdk'] })
  const installStdout = await install.stdout().catch(() => '')
  const installStderr = await install.stderr().catch(() => '')
  timeline.push({ name: 'install-codex-sdk', ms: Date.now() - t1, ok: install.exitCode === 0, exitCode: install.exitCode })

  if (install.exitCode !== 0) {
    try {
      await sandbox.stop()
    } catch {
      // ignore
    }
    throw new Error(
      `Falha ao instalar @openai/codex-sdk na sandbox. stdout: ${installStdout}\nstderr: ${installStderr}`
    )
  }

  const t2 = Date.now()
  const prep = await sandbox.runCommand({
    cmd: 'node',
    args: [
      '-e',
      "require('fs').mkdirSync('/tmp/.codex',{recursive:true});require('fs').mkdirSync('/vercel/sandbox/codex-some/workspace',{recursive:true});console.log('ok')",
    ],
  })
  timeline.push({ name: 'prepare-dirs', ms: Date.now() - t2, ok: prep.exitCode === 0, exitCode: prep.exitCode })
  if (prep.exitCode !== 0) {
    const prepOut = await prep.stdout().catch(() => '')
    const prepErr = await prep.stderr().catch(() => '')
    try {
      await sandbox.stop()
    } catch {
      // ignore
    }
    throw new Error(`Falha ao preparar diretórios na sandbox. stdout: ${prepOut}\nstderr: ${prepErr}`)
  }

  const id = genId()
  const session: CodexSomeSession = {
    id,
    sandbox,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
  }
  SESSIONS.set(id, session)
  return { session, timeline }
}

async function getOrCreateSession(sessionId: string | null) {
  if (sessionId && SESSIONS.has(sessionId)) {
    const existing = SESSIONS.get(sessionId)!
    existing.lastUsedAt = Date.now()
    return { session: existing, created: false, timeline: [] as Array<{ name: string; ms: number; ok: boolean; exitCode?: number }> }
  }
  const created = await createSession()
  return { session: created.session, created: true, timeline: created.timeline }
}

export async function POST(req: Request) {
  await cleanupExpiredSessions()

  const apiKey = normalizeString(process.env.CODEX_API_KEY)
  if (!apiKey) {
    return json({ ok: false, error: 'CODEX_API_KEY não configurada no servidor.' }, 500)
  }

  let body: CodexSomeRequestBody = {}
  try {
    body = (await req.json()) as CodexSomeRequestBody
  } catch {
    body = {}
  }

  const action = normalizeString(body.action || 'send') as 'start' | 'send' | 'stop'
  const incomingSessionId = normalizeString(body.sessionId)

  if (action === 'start') {
    try {
      const created = await createSession()
      return json({
        ok: true,
        sessionId: created.session.id,
        created: true,
        timeline: created.timeline,
      })
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error)
      return json({ ok: false, error: messageText }, 500)
    }
  }

  if (action === 'stop') {
    if (!incomingSessionId) {
      return json({ ok: false, error: '`sessionId` é obrigatório para stop.' }, 400)
    }
    const session = SESSIONS.get(incomingSessionId)
    if (!session) {
      return json({ ok: true, stopped: false, sessionId: incomingSessionId })
    }
    try {
      await session.sandbox.stop()
    } catch {
      // ignore
    } finally {
      SESSIONS.delete(incomingSessionId)
    }
    return json({ ok: true, stopped: true, sessionId: incomingSessionId })
  }

  const message = normalizeString(body.message)
  const threadId = normalizeString(body.threadId)
  const model = normalizeString(body.model)

  if (!message) {
    return json({ ok: false, error: '`message` é obrigatória.' }, 400)
  }

  try {
    const sessionResult = await getOrCreateSession(incomingSessionId || null)
    const session = sessionResult.session
    session.lastUsedAt = Date.now()
    const effectiveThreadId = sessionResult.created ? '' : threadId

    const payload = JSON.stringify({
      message,
      threadId: effectiveThreadId || null,
      model: model || null,
    })

    const runner = `
import { promises as fs } from 'node:fs';
import { Codex } from '@openai/codex-sdk';

const ROOT = '/vercel/sandbox/codex-some';
const WORKDIR = '/vercel/sandbox/codex-some/workspace';
const CODEX_HOME = '/tmp/.codex';
const REQUEST_PATH = ROOT + '/request.json';

await fs.mkdir(ROOT, { recursive: true });
await fs.mkdir(WORKDIR, { recursive: true });
await fs.mkdir(CODEX_HOME, { recursive: true });

const payload = JSON.parse(await fs.readFile(REQUEST_PATH, 'utf8'));
const apiKey = process.env.CODEX_API_KEY || '';
if (!apiKey) {
  console.log(JSON.stringify({ ok: false, error: 'CODEX_API_KEY ausente na sandbox.' }));
  process.exit(2);
}

const env = { ...process.env, HOME: '/tmp', CODEX_HOME };
const codex = new Codex({ apiKey, env });
const threadOptions = {
  workingDirectory: WORKDIR,
  skipGitRepoCheck: true,
  sandboxMode: 'read-only',
};
if (payload.model) threadOptions.model = payload.model;

const thread = payload.threadId
  ? codex.resumeThread(payload.threadId, threadOptions)
  : codex.startThread(threadOptions);

const turn = await thread.run(payload.message || '');
console.log(JSON.stringify({
  ok: true,
  threadId: thread.id || null,
  reply: turn.finalResponse || '',
  itemCount: Array.isArray(turn.items) ? turn.items.length : 0,
  usage: turn.usage ?? null,
}));
`.trim()

    await session.sandbox.writeFiles([
      { path: '/vercel/sandbox/codex-some/request.json', content: Buffer.from(payload) },
      { path: '/vercel/sandbox/codex-some/run.mjs', content: Buffer.from(runner) },
    ])

    const tRun = Date.now()
    const sandboxEnv: Record<string, string> = { CODEX_API_KEY: apiKey }
    const baseUrl = normalizeString(process.env.OPENAI_BASE_URL)
    if (baseUrl) sandboxEnv.OPENAI_BASE_URL = baseUrl
    const run = await session.sandbox.runCommand({
      cmd: 'node',
      args: ['codex-some/run.mjs'],
      env: sandboxEnv,
    })
    const stdout = await run.stdout().catch(() => '')
    const stderr = await run.stderr().catch(() => '')
    const parsed = parseLastJsonLine(stdout)

    if (run.exitCode !== 0) {
      return json(
        {
          ok: false,
          sessionId: session.id,
          error: parsed?.error || 'Falha ao executar Codex na sandbox.',
          stdout,
          stderr,
          exitCode: run.exitCode,
          timeline: [...sessionResult.timeline, { name: 'run-codex', ms: Date.now() - tRun, ok: false, exitCode: run.exitCode }],
        },
        500
      )
    }

    if (!parsed || parsed.ok !== true) {
      return json(
        {
          ok: false,
          sessionId: session.id,
          error: parsed?.error || 'Resposta inválida da sandbox.',
          stdout,
          stderr,
          timeline: [...sessionResult.timeline, { name: 'run-codex', ms: Date.now() - tRun, ok: false, exitCode: run.exitCode ?? 1 }],
        },
        500
      )
    }

    return json({
      ok: true,
      sessionId: session.id,
      threadId: parsed.threadId || null,
      reply: parsed.reply || '',
      itemCount: parsed.itemCount ?? 0,
      usage: parsed.usage ?? null,
      createdSession: sessionResult.created,
      timeline: [...sessionResult.timeline, { name: 'run-codex', ms: Date.now() - tRun, ok: true, exitCode: run.exitCode }],
    })
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error)
    return json({ ok: false, error: messageText }, 500)
  }
}
