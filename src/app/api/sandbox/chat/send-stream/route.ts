import { SESSIONS } from '../store'

export const runtime = 'nodejs'

type Msg = { role: 'user'|'assistant'; content: string }

export async function POST(req: Request) {
  const enc = new TextEncoder()
  try {
    const body = await req.json().catch(() => ({})) as { chatId?: string; history?: Msg[] }
    const chatId = (body.chatId || '').toString()
    const history = Array.isArray(body.history) ? body.history : []
    if (!chatId) return new Response(JSON.stringify({ ok: false, error: 'chatId obrigatório' }), { status: 400 })
    if (!history.length) return new Response(JSON.stringify({ ok: false, error: 'history vazio' }), { status: 400 })

    const sess = SESSIONS.get(chatId)
    if (!sess) return new Response(JSON.stringify({ ok: false, error: 'chat não encontrado' }), { status: 404 })
    sess.lastUsedAt = Date.now()

    const lines: string[] = ['You are a helpful assistant. Continue the conversation.', '', 'Conversation:']
    for (const m of history.slice(-12)) {
      lines.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    }
    lines.push('Assistant:')
    const prompt = lines.join('\n').slice(0, 6000)

    // Write a streaming runner script into the sandbox (handles partial deltas)
    const runner = `
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || '';
const q = query({ prompt, options: { model: 'claude-sonnet-4-5-20250929', pathToClaudeCodeExecutable: cli, includePartialMessages: true }});
for await (const msg of q) {
  if (msg.type === 'stream_event') {
    const ev = msg.event;
    if (ev && ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta' && ev.delta.text) {
      console.log(JSON.stringify({ type: 'delta', text: ev.delta.text }));
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
          // Start the process detached so we can stream logs
          const cmd: any = await (sess.sandbox as any).runCommand({
            cmd: 'node',
            args: ['agent-chat-stream.mjs', prompt],
            env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '' },
            detached: true,
          })
          // send a start event
          controller.enqueue(enc.encode('event: start\ndata: ok\n\n'))

          let stdoutBuf = ''
          let stderrBuf = ''
          for await (const log of cmd.logs()) {
            const chunk = String(log.data)
            if (log.stream === 'stdout') {
              stdoutBuf += chunk
              let idx
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
          if (stderrBuf) {
            const safe = JSON.stringify(stderrBuf)
            controller.enqueue(enc.encode(`event: stderr\ndata: ${safe}\n\n`))
          }
          controller.enqueue(enc.encode('event: end\ndata: done\n\n'))
          controller.close()
        } catch (e: any) {
          const safe = JSON.stringify(e?.message || String(e))
          controller.enqueue(enc.encode(`event: error\ndata: ${safe}\n\n`))
          controller.close()
        }
      },
      cancel: async () => {
        // noop; the sandbox process will exit once logs iterator finishes
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 })
  }
}

