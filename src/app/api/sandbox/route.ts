import { Sandbox } from '@vercel/sandbox'
import { SESSIONS, genId, type ChatSession } from './chat/store'

export const runtime = 'nodejs'

type Msg = { role: 'user'|'assistant'; content: string }

export async function POST(req: Request) {
  const enc = new TextEncoder()
  const { action, ...payload } = await req.json().catch(() => ({})) as any
  if (!action || typeof action !== 'string') {
    return Response.json({ ok: false, error: 'action inválida' }, { status: 400 })
  }

  // Router for JSON actions
  if (action === 'chat-start') return chatStart()
  if (action === 'chat-send') return chatSend(payload as { chatId?: string; history?: Msg[] })
  if (action === 'chat-stop') return chatStop(payload as { chatId?: string })
  if (action === 'chat-send-stream') return chatSendStream(payload as { chatId?: string; history?: Msg[] })
  if (action === 'fs-list') return fsList(payload as { chatId?: string; path?: string })
  if (action === 'fs-read') return fsRead(payload as { chatId?: string; path?: string })

  return Response.json({ ok: false, error: `ação desconhecida: ${action}` }, { status: 400 })

  async function chatStart() {
    let sandbox: Sandbox | undefined
    const timeline: Array<{ name: string; ms: number; ok: boolean; exitCode?: number }> = []
    const t0 = Date.now()
    try {
      sandbox = await Sandbox.create({ runtime: 'node22', resources: { vcpus: 2 }, timeout: 600_000 })
      timeline.push({ name: 'create-sandbox', ms: Date.now() - t0, ok: true })
      const t1 = Date.now()
      const install = await sandbox.runCommand({ cmd: 'npm', args: ['install', '@anthropic-ai/claude-agent-sdk', '@anthropic-ai/claude-code'] })
      timeline.push({ name: 'install-local', ms: Date.now() - t1, ok: install.exitCode === 0, exitCode: install.exitCode })
      if (install.exitCode !== 0) {
        const [o, e] = await Promise.all([install.stdout().catch(() => ''), install.stderr().catch(() => '')])
        await sandbox.stop().catch(() => {})
        return Response.json({ ok: false, error: 'install failed', stdout: o, stderr: e, timeline }, { status: 500 })
      }
      const id = genId()
      const session: ChatSession = { id, sandbox, createdAt: Date.now(), lastUsedAt: Date.now(), mode: 'local' }
      SESSIONS.set(id, session)
      return Response.json({ ok: true, chatId: id, timeline })
    } catch (e) {
      if (sandbox) await sandbox.stop().catch(() => {})
      return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e), timeline }, { status: 500 })
    }
  }

  async function chatSend({ chatId, history }: { chatId?: string; history?: Msg[] }) {
    const timeline: Array<{ name: string; ms: number; ok: boolean; exitCode?: number }> = []
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    if (!Array.isArray(history) || !history.length) return Response.json({ ok: false, error: 'history vazio' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    sess.lastUsedAt = Date.now()
    const lines: string[] = ['You are a helpful assistant. Continue the conversation.', '', 'Conversation:']
    for (const m of history.slice(-12)) lines.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    lines.push('Assistant:')
    const prompt = lines.join('\n').slice(0, 6000)
    const t1 = Date.now()
    const runner = `
import { unstable_v2_prompt } from '@anthropic-ai/claude-agent-sdk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || '';
const options = {
  model: 'claude-sonnet-4-5-20250929',
  pathToClaudeCodeExecutable: cli,
  cwd: '/vercel/sandbox',
  additionalDirectories: ['/vercel/sandbox'],
  tools: { type: 'preset', preset: 'claude_code' },
  permissionMode: 'acceptEdits',
  maxThinkingTokens: 2048
};
const res = await unstable_v2_prompt(prompt, options);
if (res.type === 'result' && res.subtype === 'success') console.log(res.result ?? '');
else { console.log(''); process.exit(2); }
`.trim()
    await sess.sandbox.writeFiles([{ path: '/vercel/sandbox/agent-chat-run.mjs', content: Buffer.from(runner) }])
    timeline.push({ name: 'write-runner', ms: Date.now() - t1, ok: true })
    const t2 = Date.now()
    const run = await sess.sandbox.runCommand({ cmd: 'node', args: ['agent-chat-run.mjs', prompt], env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '' } })
    const [out, err] = await Promise.all([run.stdout().catch(() => ''), run.stderr().catch(() => '')])
    timeline.push({ name: 'run-prompt', ms: Date.now() - t2, ok: run.exitCode === 0, exitCode: run.exitCode })
    if (run.exitCode !== 0) return Response.json({ ok: false, error: 'run failed', stdout: out, stderr: err, timeline }, { status: 500 })
    return Response.json({ ok: true, reply: (out || '').trim(), timeline })
  }

  async function chatSendStream({ chatId, history }: { chatId?: string; history?: Msg[] }) {
    if (!chatId) return new Response(JSON.stringify({ ok: false, error: 'chatId obrigatório' }), { status: 400 })
    if (!Array.isArray(history) || !history.length) return new Response(JSON.stringify({ ok: false, error: 'history vazio' }), { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return new Response(JSON.stringify({ ok: false, error: 'chat não encontrado' }), { status: 404 })
    sess.lastUsedAt = Date.now()
    const lines: string[] = ['You are a helpful assistant. Continue the conversation.', '', 'Conversation:']
    for (const m of history.slice(-12)) lines.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    lines.push('Assistant:')
    const prompt = lines.join('\n').slice(0, 6000)
    const runner = `
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || '';
const options = {
  model: 'claude-sonnet-4-5-20250929',
  pathToClaudeCodeExecutable: cli,
  cwd: '/vercel/sandbox',
  additionalDirectories: ['/vercel/sandbox'],
  tools: { type: 'preset', preset: 'claude_code' },
  permissionMode: 'acceptEdits',
  includePartialMessages: true,
  maxThinkingTokens: 2048
};
const q = query({ prompt, options });
for await (const msg of q) {
  if (msg.type === 'stream_event') {
    const ev = msg.event;
    if (ev && ev.type === 'content_block_start' && ev.content_block && ev.content_block.type === 'reasoning') {
      console.log(JSON.stringify({ type: 'reasoning_start' }));
    }
    if (ev && ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta' && ev.delta.text) {
      console.log(JSON.stringify({ type: 'delta', text: ev.delta.text }));
    }
    if (ev && ev.type === 'content_block_delta' && ev.delta && (ev.delta.type === 'thinking_delta' || ev.delta.type === 'reasoning_delta') && ev.delta.text) {
      console.log(JSON.stringify({ type: 'reasoning_delta', text: ev.delta.text }));
    }
    if (ev && ev.type === 'content_block_stop') {
      console.log(JSON.stringify({ type: 'reasoning_end' }));
    }
  } else if (msg.type === 'result' && msg.subtype === 'success') {
    console.log(JSON.stringify({ type: 'final', text: msg.result ?? '' }));
  }
}
`.trim()
    await sess.sandbox.writeFiles([{ path: '/vercel/sandbox/agent-chat-stream.mjs', content: Buffer.from(runner) }])
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const cmd: any = await (sess.sandbox as any).runCommand({
            cmd: 'node', args: ['agent-chat-stream.mjs', prompt], env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '' }, detached: true,
          })
          controller.enqueue(enc.encode('event: start\ndata: ok\n\n'))
          let outBuf = ''; let errBuf = ''
          for await (const log of cmd.logs()) {
            const ch = String(log.data)
            if (log.stream === 'stdout') {
              outBuf += ch
              let idx
              while ((idx = outBuf.indexOf('\n')) >= 0) {
                const line = outBuf.slice(0, idx).trim(); outBuf = outBuf.slice(idx + 1)
                if (!line) continue
                controller.enqueue(enc.encode(`data: ${line}\n\n`))
              }
            } else {
              errBuf += ch
            }
          }
          if (errBuf) controller.enqueue(enc.encode(`event: stderr\ndata: ${JSON.stringify(errBuf)}\n\n`))
          controller.enqueue(enc.encode('event: end\ndata: done\n\n'))
          controller.close()
        } catch (e: any) {
          controller.enqueue(enc.encode(`event: error\ndata: ${JSON.stringify(e?.message || String(e))}\n\n`))
          controller.close()
        }
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } })
  }

  async function chatStop({ chatId }: { chatId?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    await sess.sandbox.stop().catch(() => {})
    SESSIONS.delete(chatId)
    return Response.json({ ok: true })
  }

  function validatePath(p?: string) {
    const base = '/vercel/sandbox'
    const path = (p || base).toString()
    if (!path.startsWith(base)) return { ok: false as const, error: 'path fora de /vercel/sandbox' }
    if (path.includes('..')) return { ok: false as const, error: 'path inválido' }
    return { ok: true as const, path }
  }

  async function fsList({ chatId, path }: { chatId?: string; path?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    const v = validatePath(path); if (!v.ok) return Response.json({ ok: false, error: v.error }, { status: 400 })
    const target = v.path
    // Node one‑liner to list entries ignoring node_modules and hidden heavy dirs
    const script = `
const fs = require('fs');
const p = process.argv[2];
try {
  const names = fs.readdirSync(p, { withFileTypes: true }).map(d=>({ name: d.name, type: d.isDirectory()?'dir':'file', path: require('path').join(p, d.name) }));
  const filtered = names.filter(e => !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '.cache');
  filtered.sort((a,b)=> a.type===b.type ? a.name.localeCompare(b.name) : (a.type==='dir'?-1:1));
  console.log(JSON.stringify(filtered));
} catch(e){ console.error(String(e.message||e)); process.exit(1); }
`
    const run = await sess.sandbox.runCommand({ cmd: 'node', args: ['-e', script, target] })
    const [out, err] = await Promise.all([run.stdout().catch(()=>''), run.stderr().catch(()=> '')])
    if (run.exitCode !== 0) return Response.json({ ok: false, error: err || out || 'falha ao listar' }, { status: 500 })
    let entries: Array<{ name: string; type: 'file'|'dir'; path: string }> = []
    try { entries = JSON.parse(out) } catch { return Response.json({ ok: false, error: 'json inválido' }, { status: 500 }) }
    return Response.json({ ok: true, path: target, entries })
  }

  async function fsRead({ chatId, path }: { chatId?: string; path?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    const v = validatePath(path); if (!v.ok) return Response.json({ ok: false, error: v.error }, { status: 400 })
    const target = v.path
    const script = `
const fs = require('fs');
const p = process.argv[2];
try {
  const buf = fs.readFileSync(p);
  const isBin = buf.some(b => b===0);
  if (isBin) console.log(JSON.stringify({ isBinary:true, content: buf.toString('base64') }));
  else console.log(JSON.stringify({ isBinary:false, content: buf.toString('utf8') }));
} catch(e){ console.error(String(e.message||e)); process.exit(1); }
`
    const run = await sess.sandbox.runCommand({ cmd: 'node', args: ['-e', script, target] })
    const [out, err] = await Promise.all([run.stdout().catch(()=>''), run.stderr().catch(()=> '')])
    if (run.exitCode !== 0) return Response.json({ ok: false, error: err || out || 'falha ao ler' }, { status: 500 })
    try {
      const parsed = JSON.parse(out)
      return Response.json({ ok: true, path: target, ...parsed })
    } catch {
      return Response.json({ ok: false, error: 'json inválido' }, { status: 500 })
    }
  }
}
