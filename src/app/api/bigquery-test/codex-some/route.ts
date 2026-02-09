import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'
export const maxDuration = 300

type CodexSomeRequestBody = {
  action?: 'start' | 'send' | 'send-stream' | 'stop'
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

function buildStreamRunnerScript() {
  return `
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
  console.log(JSON.stringify({ type: 'error', error: 'CODEX_API_KEY ausente na sandbox.' }));
  process.exit(2);
}

const env = { ...process.env, HOME: '/tmp', CODEX_HOME };
const codex = new Codex({
  apiKey,
  env,
  config: {
    show_raw_agent_reasoning: true,
  },
});
const threadOptions = {
  workingDirectory: WORKDIR,
  skipGitRepoCheck: true,
  sandboxMode: 'read-only',
};
if (payload.model) threadOptions.model = payload.model;

const thread = payload.threadId
  ? codex.resumeThread(payload.threadId, threadOptions)
  : codex.startThread(threadOptions);

const { events } = await thread.runStreamed(payload.message || '');

const agentBuffers = {};
const reasoningBuffers = {};
let finalText = '';
let finalUsage = null;

function upsertFromSnapshot(store, id, current) {
  const key = String(id || 'default');
  const next = String(current || '');
  const prev = String(store[key] || '');
  let chunk = '';
  if (next.startsWith(prev)) chunk = next.slice(prev.length);
  else if (next !== prev) chunk = next;
  store[key] = next;
  return { chunk, full: next };
}

function pickString(value) {
  if (typeof value === 'string' && value) return value;
  if (!value || typeof value !== 'object') return '';
  const obj = value;
  const candidates = [
    obj.delta,
    obj.text,
    obj.content_delta,
    obj.output_text_delta,
    obj.textDelta,
    obj.summaryTextDelta,
    obj.reasoning,
    obj.value,
    obj.chunk,
    obj.partial,
    obj.message,
    obj.content,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate) return candidate;
  }
  if (obj.delta && typeof obj.delta === 'object') {
    const nested = pickString(obj.delta);
    if (nested) return nested;
  }
  if (obj.params && typeof obj.params === 'object') {
    const nested = pickString(obj.params);
    if (nested) return nested;
  }
  return '';
}

const AGENT_DELTA_TYPES = new Set([
  'agent_message_delta',
  'agent_message_content_delta',
]);
const AGENT_DELTA_METHODS = new Set([
  'item/agentMessage/delta',
]);
const AGENT_PRIMARY_ID = '__agent__';
const REASONING_DELTA_TYPES = new Set([
  'agent_reasoning_delta',
  'reasoning_content_delta',
  'reasoning_raw_content_delta',
  'agent_reasoning_raw_content_delta',
]);
const REASONING_DELTA_METHODS = new Set([
  'item/reasoning/textDelta',
  'item/reasoning/summaryTextDelta',
  'item/reasoning/summaryPartAdded',
]);
const REASONING_PRIMARY_ID = '__reasoning__';

for await (const ev of events) {
  const evType = String(ev?.type || '');
  const evMethod = String(ev?.method || '');

  if (evType === 'thread.started') {
    console.log(JSON.stringify({ type: 'thread_started', threadId: ev.thread_id || null }));
    continue;
  }

  if (AGENT_DELTA_TYPES.has(evType) || AGENT_DELTA_METHODS.has(evMethod)) {
    const delta = pickString(ev);
    if (!delta) continue;
    const id = ev?.id || ev?.item_id || ev?.params?.item_id || ev?.params?.id || AGENT_PRIMARY_ID;
    const prev = String(agentBuffers[id] || '');
    const next = prev + delta;
    agentBuffers[id] = next;
    finalText = next;
    console.log(JSON.stringify({ type: 'delta', text: delta, full: next }));
    continue;
  }

  if (REASONING_DELTA_TYPES.has(evType) || REASONING_DELTA_METHODS.has(evMethod)) {
    const delta = pickString(ev);
    if (!delta) continue;
    const id = ev?.id || ev?.item_id || ev?.params?.item_id || ev?.params?.id || REASONING_PRIMARY_ID;
    const prev = String(reasoningBuffers[id] || '');
    const next = prev + delta;
    reasoningBuffers[id] = next;
    console.log(JSON.stringify({ type: 'reasoning_delta', text: delta, full: next }));
    continue;
  }

  if (evType === 'item.started' || evType === 'item.updated' || evType === 'item.completed') {
    const item = ev.item;
    if (!item) continue;

    if (item.type === 'agent_message') {
      const result = upsertFromSnapshot(agentBuffers, AGENT_PRIMARY_ID, item.text || '');
      if (result.chunk) console.log(JSON.stringify({ type: 'delta', text: result.chunk, full: result.full }));
      finalText = result.full;
      continue;
    }

    if (item.type === 'reasoning') {
      const result = upsertFromSnapshot(reasoningBuffers, REASONING_PRIMARY_ID, item.text || '');
      if (result.chunk) console.log(JSON.stringify({ type: 'reasoning_delta', text: result.chunk, full: result.full }));
      continue;
    }
  }

  if (evType === 'turn.completed') {
    finalUsage = ev.usage ?? ev?.params?.usage ?? null;
    console.log(JSON.stringify({ type: 'usage', usage: finalUsage }));
    continue;
  }

  if (evType === 'turn.failed') {
    console.log(JSON.stringify({ type: 'error', error: ev?.error?.message || ev?.params?.error?.message || 'turn failed' }));
    process.exit(3);
  }

  if (evType === 'error' || evType === 'stream_error') {
    console.log(JSON.stringify({ type: 'error', error: ev.message || ev?.params?.message || 'stream error' }));
    process.exit(4);
  }
}

if (!finalText) {
  const candidates = Object.values(agentBuffers).map((value) => String(value || ''));
  candidates.sort((a, b) => b.length - a.length);
  finalText = candidates[0] || '';
}

console.log(JSON.stringify({
  type: 'final',
  threadId: thread.id || null,
  text: finalText || '',
  usage: finalUsage,
}));
`.trim()
}

function buildJsonRunnerScript() {
  return `
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
const codex = new Codex({
  apiKey,
  env,
  config: {
    show_raw_agent_reasoning: true,
  },
});
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
}

async function executeJsonTurn(params: {
  sessionId: string
  sandbox: Sandbox
  message: string
  threadId: string
  model: string
  timelineSeed: Array<{ name: string; ms: number; ok: boolean; exitCode?: number }>
  apiKey: string
}) {
  const effectiveThreadId = params.threadId
  const payload = JSON.stringify({
    message: params.message,
    threadId: effectiveThreadId || null,
    model: params.model || null,
  })

  const runner = buildJsonRunnerScript()
  await params.sandbox.writeFiles([
    { path: '/vercel/sandbox/codex-some/request.json', content: Buffer.from(payload) },
    { path: '/vercel/sandbox/codex-some/run.mjs', content: Buffer.from(runner) },
  ])

  const tRun = Date.now()
  const sandboxEnv: Record<string, string> = { CODEX_API_KEY: params.apiKey }
  const baseUrl = normalizeString(process.env.OPENAI_BASE_URL)
  if (baseUrl) sandboxEnv.OPENAI_BASE_URL = baseUrl
  const run = await params.sandbox.runCommand({
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
        sessionId: params.sessionId,
        error: parsed?.error || 'Falha ao executar Codex na sandbox.',
        stdout,
        stderr,
        exitCode: run.exitCode,
        timeline: [...params.timelineSeed, { name: 'run-codex', ms: Date.now() - tRun, ok: false, exitCode: run.exitCode }],
      },
      500
    )
  }

  if (!parsed || parsed.ok !== true) {
    return json(
      {
        ok: false,
        sessionId: params.sessionId,
        error: parsed?.error || 'Resposta inválida da sandbox.',
        stdout,
        stderr,
        timeline: [...params.timelineSeed, { name: 'run-codex', ms: Date.now() - tRun, ok: false, exitCode: run.exitCode ?? 1 }],
      },
      500
    )
  }

  return json({
    ok: true,
    sessionId: params.sessionId,
    threadId: parsed.threadId || null,
    reply: parsed.reply || '',
    itemCount: parsed.itemCount ?? 0,
    usage: parsed.usage ?? null,
    timeline: [...params.timelineSeed, { name: 'run-codex', ms: Date.now() - tRun, ok: true, exitCode: run.exitCode }],
  })
}

async function executeStreamTurn(params: {
  sessionId: string
  sandbox: Sandbox
  message: string
  threadId: string
  model: string
  createdSession: boolean
  apiKey: string
}) {
  const enc = new TextEncoder()
  const payload = JSON.stringify({
    message: params.message,
    threadId: params.threadId || null,
    model: params.model || null,
  })
  const runner = buildStreamRunnerScript()

  await params.sandbox.writeFiles([
    { path: '/vercel/sandbox/codex-some/request.json', content: Buffer.from(payload) },
    { path: '/vercel/sandbox/codex-some/run-stream.mjs', content: Buffer.from(runner) },
  ])

  const sandboxEnv: Record<string, string> = { CODEX_API_KEY: params.apiKey }
  const baseUrl = normalizeString(process.env.OPENAI_BASE_URL)
  if (baseUrl) sandboxEnv.OPENAI_BASE_URL = baseUrl

  const stream = new ReadableStream<Uint8Array>({
    start: async (controller) => {
      try {
        controller.enqueue(
          enc.encode(
            `event: meta\ndata: ${JSON.stringify({
              ok: true,
              sessionId: params.sessionId,
              createdSession: params.createdSession,
            })}\n\n`
          )
        )

        const cmd: any = await (params.sandbox as any).runCommand({
          cmd: 'node',
          args: ['codex-some/run-stream.mjs'],
          env: sandboxEnv,
          detached: true,
        })

        controller.enqueue(enc.encode('event: start\ndata: ok\n\n'))

        let stdoutBuf = ''
        let stderrBuf = ''

        for await (const log of cmd.logs()) {
          const chunk = String(log.data || '')
          if (log.stream === 'stdout') {
            stdoutBuf += chunk
            let idx = -1
            while ((idx = stdoutBuf.indexOf('\n')) >= 0) {
              const line = stdoutBuf.slice(0, idx).trim()
              stdoutBuf = stdoutBuf.slice(idx + 1)
              if (!line) continue
              controller.enqueue(enc.encode(`data: ${line}\n\n`))
            }
          } else {
            stderrBuf += chunk
          }
        }

        if (stdoutBuf.trim()) {
          controller.enqueue(enc.encode(`data: ${stdoutBuf.trim()}\n\n`))
          stdoutBuf = ''
        }

        if (stderrBuf) {
          controller.enqueue(enc.encode(`event: stderr\ndata: ${JSON.stringify(stderrBuf)}\n\n`))
        }
        controller.enqueue(enc.encode('event: end\ndata: done\n\n'))
        controller.close()
      } catch (error) {
        controller.enqueue(
          enc.encode(`event: error\ndata: ${JSON.stringify(error instanceof Error ? error.message : String(error))}\n\n`)
        )
        controller.close()
      }
    },
    cancel: async () => {
      // no-op
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
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

  const action = normalizeString(body.action || 'send') as 'start' | 'send' | 'send-stream' | 'stop'
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

    if (action === 'send-stream') {
      return await executeStreamTurn({
        sessionId: session.id,
        sandbox: session.sandbox,
        message,
        threadId: effectiveThreadId,
        model,
        createdSession: sessionResult.created,
        apiKey,
      })
    }

    return await executeJsonTurn({
      sessionId: session.id,
      sandbox: session.sandbox,
      message,
      threadId: effectiveThreadId,
      model,
      timelineSeed: sessionResult.timeline,
      apiKey,
    })
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error)
    return json({ ok: false, error: messageText }, 500)
  }
}
