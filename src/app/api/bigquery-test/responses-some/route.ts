import { Sandbox } from '@vercel/sandbox'

export const runtime = 'nodejs'
export const maxDuration = 300

type ResponsesSomeRequestBody = {
  action?: 'start' | 'send-stream' | 'stop'
  sessionId?: string | null
  message?: string
  previousResponseId?: string | null
  model?: string
}

type ResponsesSomeSession = {
  id: string
  sandbox: Sandbox
  createdAt: number
  lastUsedAt: number
}

const SESSIONS = new Map<string, ResponsesSomeSession>()
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
  const sandbox = await Sandbox.create({
    runtime: 'node22',
    resources: { vcpus: 2 },
    timeout: 600_000,
  })
  timeline.push({ name: 'create-sandbox', ms: Date.now() - t0, ok: true })

  const t1 = Date.now()
  const prep = await sandbox.runCommand({
    cmd: 'node',
    args: [
      '-e',
      "require('fs').mkdirSync('/tmp/.codex',{recursive:true});require('fs').mkdirSync('/vercel/sandbox/responses-some',{recursive:true});console.log('ok')",
    ],
  })
  timeline.push({
    name: 'prepare-dirs',
    ms: Date.now() - t1,
    ok: prep.exitCode === 0,
    exitCode: prep.exitCode,
  })
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
  const session: ResponsesSomeSession = {
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
    return {
      session: existing,
      created: false,
      timeline: [] as Array<{ name: string; ms: number; ok: boolean; exitCode?: number }>,
    }
  }
  const created = await createSession()
  return { session: created.session, created: true, timeline: created.timeline }
}

function buildResponsesStreamRunnerScript() {
  return `
import { promises as fs } from 'node:fs';

const ROOT = '/vercel/sandbox/responses-some';
const REQUEST_PATH = ROOT + '/request.json';

await fs.mkdir(ROOT, { recursive: true });

const payload = JSON.parse(await fs.readFile(REQUEST_PATH, 'utf8'));
const apiKey = process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY || '';
if (!apiKey) {
  console.log(JSON.stringify({ type: 'error', error: 'OPENAI_API_KEY/CODEX_API_KEY ausente na sandbox.' }));
  process.exit(2);
}

const rawBase = String(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim();
const base = rawBase.replace(/\\/+$/, '');
const url = base.endsWith('/responses') ? base : base + '/responses';

const requestBody = {
  model: payload.model || 'gpt-5',
  input: [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: String(payload.message || ''),
        },
      ],
    },
  ],
  stream: true,
  reasoning: {
    effort: payload.reasoningEffort || 'medium',
    summary: 'auto',
  },
};
if (payload.previousResponseId) {
  requestBody.previous_response_id = payload.previousResponseId;
}

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + apiKey,
  },
  body: JSON.stringify(requestBody),
});

if (!res.ok || !res.body) {
  const text = await res.text().catch(() => '');
  console.log(JSON.stringify({ type: 'error', error: 'Responses API ' + res.status + ': ' + text.slice(0, 1200) }));
  process.exit(3);
}

let responseId = payload.previousResponseId || null;
let assistantText = '';
let reasoningText = '';
const eventCounts = {};
const unknownEventCounts = {};

function bump(counter, key) {
  const k = String(key || 'unknown');
  counter[k] = (counter[k] || 0) + 1;
}

function extractText(value, depth = 0) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  if (depth > 5) return '';
  const obj = value;
  const candidates = [
    obj.delta,
    obj.text,
    obj.summary_text,
    obj.output_text,
    obj.reasoning_text,
    obj.summary,
    obj.content,
    obj.reasoning,
    obj.message,
    obj.outputText,
    obj.value,
    obj.part,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c) return c;
  }
  for (const c of candidates) {
    if (c && typeof c === 'object') {
      const nested = extractText(c, depth + 1);
      if (nested) return nested;
    }
  }
  if (Array.isArray(obj.content)) {
    for (const part of obj.content) {
      const nested = extractText(part, depth + 1);
      if (nested) return nested;
    }
  }
  if (obj.response && typeof obj.response === 'object') {
    const nested = extractText(obj.response, depth + 1);
    if (nested) return nested;
  }
  return '';
}

function emit(type, data) {
  console.log(JSON.stringify({ type, ...data }));
}

function appendDelta(kind, delta, source) {
  const text = String(delta || '');
  if (!text) return;
  if (kind === 'assistant') {
    assistantText += text;
    emit('delta', { text, full: assistantText, source });
    return;
  }
  reasoningText += text;
  emit('reasoning_delta', { text, full: reasoningText, source });
}

function applyDone(kind, doneText, source) {
  const full = String(doneText || '');
  if (!full) return;
  if (kind === 'assistant') {
    if (!assistantText) {
      assistantText = full;
      emit('delta', { text: full, full: assistantText, source });
      return;
    }
    if (full.startsWith(assistantText)) {
      const missing = full.slice(assistantText.length);
      if (missing) emit('delta', { text: missing, full, source });
      assistantText = full;
      return;
    }
    if (assistantText !== full) {
      assistantText = full;
    }
    return;
  }
  if (!reasoningText) {
    reasoningText = full;
    emit('reasoning_delta', { text: full, full: reasoningText, source });
    return;
  }
  if (full.startsWith(reasoningText)) {
    const missing = full.slice(reasoningText.length);
    if (missing) emit('reasoning_delta', { text: missing, full, source });
    reasoningText = full;
    return;
  }
  if (reasoningText !== full) {
    reasoningText = full;
  }
}

function onEvent(eventName, dataRaw) {
  const data = String(dataRaw || '').trim();
  if (!data || data === '[DONE]') return;

  let ev = null;
  try {
    ev = JSON.parse(data);
  } catch {
    return;
  }
  if (!ev || typeof ev !== 'object') return;

  const type = String(ev.type || eventName || '');
  bump(eventCounts, type);

  if (type === 'response.created') {
    const id = ev?.response?.id || ev?.id || null;
    if (id) responseId = id;
    emit('response_created', { responseId });
    return;
  }

  if (type === 'response.output_text.delta') {
    const delta = extractText(ev.delta) || extractText(ev?.output_text?.delta) || extractText(ev);
    if (!delta) return;
    appendDelta('assistant', delta, type);
    return;
  }

  if (type === 'response.output_text.done') {
    const doneText = extractText(ev.text) || extractText(ev.output_text) || extractText(ev);
    if (!doneText) return;
    applyDone('assistant', doneText, type);
    return;
  }

  if (type === 'response.reasoning_summary_text.delta' || type === 'response.reasoning_text.delta') {
    const delta = extractText(ev.delta) || extractText(ev?.reasoning?.delta) || extractText(ev);
    if (!delta) return;
    appendDelta('reasoning', delta, type);
    return;
  }

  if (type === 'response.reasoning_summary_text.done' || type === 'response.reasoning_text.done') {
    const doneText = extractText(ev.text) || extractText(ev.reasoning_text) || extractText(ev);
    if (!doneText) return;
    applyDone('reasoning', doneText, type);
    return;
  }

  if (type === 'response.completed') {
    const id = ev?.response?.id || ev?.id || responseId || null;
    if (id) responseId = id;
    emit('completed', {
      responseId,
      usage: ev?.response?.usage ?? ev?.usage ?? null,
    });
    return;
  }

  if (type === 'error') {
    emit('error', { error: ev?.error?.message || ev?.message || 'stream error' });
    process.exit(4);
  }

  if (type.includes('reasoning')) {
    const maybe = extractText(ev);
    if (maybe) {
      appendDelta('reasoning', maybe, type);
      return;
    }
  }

  if (type.includes('output_text') && type.includes('delta')) {
    const maybe = extractText(ev);
    if (maybe) {
      appendDelta('assistant', maybe, type);
      return;
    }
  }

  bump(unknownEventCounts, type);
}

function parseFrame(frame) {
  const lines = frame.split('\\n');
  let eventName = 'message';
  const dataLines = [];
  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  }
  if (!dataLines.length) return;
  onEvent(eventName, dataLines.join('\\n'));
}

const decoder = new TextDecoder();
let buffer = '';
for await (const chunk of res.body) {
  buffer += decoder.decode(chunk, { stream: true }).replace(/\\r/g, '');
  let idx = -1;
  while ((idx = buffer.indexOf('\\n\\n')) >= 0) {
    const frame = buffer.slice(0, idx);
    buffer = buffer.slice(idx + 2);
    if (!frame.trim()) continue;
    parseFrame(frame);
  }
}
buffer += decoder.decode().replace(/\\r/g, '');
if (buffer.trim()) parseFrame(buffer);

emit('stream_stats', {
  eventCounts,
  unknownEventCounts,
  assistantChars: assistantText.length,
  reasoningChars: reasoningText.length,
});

emit('final', {
  responseId: responseId || null,
  text: assistantText || '',
  reasoningText: reasoningText || '',
});
`.trim()
}

async function executeResponsesStreamTurn(params: {
  sessionId: string
  sandbox: Sandbox
  message: string
  previousResponseId: string
  model: string
  createdSession: boolean
  apiKey: string
}) {
  const enc = new TextEncoder()
  const payload = JSON.stringify({
    message: params.message,
    previousResponseId: params.previousResponseId || null,
    model: params.model || null,
  })
  const runner = buildResponsesStreamRunnerScript()

  await params.sandbox.writeFiles([
    {
      path: '/vercel/sandbox/responses-some/request.json',
      content: Buffer.from(payload),
    },
    {
      path: '/vercel/sandbox/responses-some/run-stream.mjs',
      content: Buffer.from(runner),
    },
  ])

  const sandboxEnv: Record<string, string> = {
    OPENAI_API_KEY: params.apiKey,
    CODEX_API_KEY: params.apiKey,
  }
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
          args: ['responses-some/run-stream.mjs'],
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
          enc.encode(
            `event: error\ndata: ${JSON.stringify(
              error instanceof Error ? error.message : String(error)
            )}\n\n`
          )
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

  const apiKey = normalizeString(
    process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY
  )
  if (!apiKey) {
    return json(
      { ok: false, error: 'OPENAI_API_KEY (ou CODEX_API_KEY) não configurada no servidor.' },
      500
    )
  }

  let body: ResponsesSomeRequestBody = {}
  try {
    body = (await req.json()) as ResponsesSomeRequestBody
  } catch {
    body = {}
  }

  const action = normalizeString(body.action || 'send-stream') as
    | 'start'
    | 'send-stream'
    | 'stop'
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
  const previousResponseId = normalizeString(body.previousResponseId)
  const model = normalizeString(body.model)

  if (!message) {
    return json({ ok: false, error: '`message` é obrigatória.' }, 400)
  }

  try {
    const sessionResult = await getOrCreateSession(incomingSessionId || null)
    const session = sessionResult.session
    session.lastUsedAt = Date.now()

    return await executeResponsesStreamTurn({
      sessionId: session.id,
      sandbox: session.sandbox,
      message,
      previousResponseId: sessionResult.created ? '' : previousResponseId,
      model,
      createdSession: sessionResult.created,
      apiKey,
    })
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error)
    return json({ ok: false, error: messageText }, 500)
  }
}
