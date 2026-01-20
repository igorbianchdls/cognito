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

    // Write a streaming runner script into the sandbox (handles partial deltas + reasoning + tools)
    const runner = `
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || '';
// Define subagents (programáticos)
const agents = {
  sqlAnalyst: {
    description: 'Analisa esquemas e escreve SQL (BigQuery) com segurança',
    tools: ['Read','Grep','Glob','Write','Edit'],
    prompt: 'Você é um analista SQL cuidadoso. Prefira SQL parametrizado, explique joins e filtros, valide nomes de tabelas/colunas antes de usar. Evite consultas caras sem necessidade.',
    model: 'inherit'
  },
  uiScaffold: {
    description: 'Cria/expande páginas HTML/CSS/JS simples (scaffold de UI)',
    tools: ['Read','Write','Edit'],
    prompt: 'Crie artefatos web mínimos e incrementais. Use HTML semântico, CSS leve e JS simples. Mantenha mudanças pequenas e testáveis.',
    model: 'inherit'
  },
  dataCleaner: {
    description: 'Limpa/normaliza dados CSV/JSON e gera saídas limpas',
    tools: ['Read','Write','Edit','Grep','Glob'],
    prompt: 'Faça limpeza de dados de forma segura: preservar colunas, normalizar formatos, remover linhas inválidas documentando critérios. Explique as transformações aplicadas.',
    model: 'inherit'
  }
};
const options = {
  model: 'claude-sonnet-4-5-20250929',
  pathToClaudeCodeExecutable: cli,
  cwd: '/vercel/sandbox',
  additionalDirectories: ['/vercel/sandbox'],
  tools: { type: 'preset', preset: 'claude_code' },
  permissionMode: 'acceptEdits',
  includePartialMessages: true,
  maxThinkingTokens: 2048,
  agents,
  hooks: {
    SubagentStart: [{ hooks: [async (input) => {
      try { console.log(JSON.stringify({ type: 'subagent_start', name: (input && (input as any).agent_name) || '' })); } catch {}
      return {};
    }]}],
    SubagentStop: [{ hooks: [async (input) => {
      try { console.log(JSON.stringify({ type: 'subagent_stop', name: (input && (input as any).agent_name) || '' })); } catch {}
      return {};
    }]}],
    PreToolUse: [{ hooks: [async (input) => {
      try { console.log(JSON.stringify({ type: 'tool_start', tool_name: input.tool_name, input: input.tool_input })); } catch {}
      return {};
    }]}],
    PostToolUse: [{ hooks: [async (input) => {
      try { console.log(JSON.stringify({ type: 'tool_done', tool_name: input.tool_name, output: input.tool_response })); } catch {}
      return {};
    }]}],
    PostToolUseFailure: [{ hooks: [async (input) => {
      try { console.log(JSON.stringify({ type: 'tool_error', tool_name: input.tool_name, error: input.error, is_interrupt: input.is_interrupt })); } catch {}
      return {};
    }]}],
  }
};
const q = query({ prompt, options });
// Emit list of available agents for UI palette
try { console.log(JSON.stringify({ type: 'agents_list', agents: Object.keys(agents) })); } catch {}
const toolInputBuffers = {};
const toolMeta = {};
for await (const msg of q) {
  if (msg.type === 'stream_event') {
    const ev = msg.event;
    // Assistant visible text
    if (ev && ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta' && (ev.delta.text || ev.delta.text === '')) {
      const t = ev.delta.text ?? '';
      if (t) console.log(JSON.stringify({ type: 'delta', text: t }));
    }
    // Thinking blocks
    if (ev && ev.type === 'content_block_start' && ev.content_block && ev.content_block.type === 'thinking') {
      console.log(JSON.stringify({ type: 'reasoning_start' }));
    }
    if (ev && ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'thinking_delta') {
      const t = (ev.delta.thinking ?? ev.delta.text ?? ev.delta.content ?? '').toString();
      if (t) console.log(JSON.stringify({ type: 'reasoning_delta', text: t }));
    }
    // Tool input streaming: tool_use start/delta/stop
    if (ev && ev.type === 'content_block_start' && ev.content_block && ev.content_block.type === 'tool_use') {
      const idx = typeof ev.index === 'number' ? ev.index : 0;
      toolInputBuffers[idx] = '';
      toolMeta[idx] = { id: ev.content_block && ev.content_block.id, name: ev.content_block && ev.content_block.name };
      console.log(JSON.stringify({ type: 'tool_input_start', index: idx, id: toolMeta[idx].id, name: toolMeta[idx].name }));
    }
    if (ev && ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'input_json_delta' && typeof ev.delta.partial_json === 'string') {
      const idx = typeof ev.index === 'number' ? ev.index : 0;
      const part = ev.delta.partial_json;
      toolInputBuffers[idx] = (toolInputBuffers[idx] || '') + part;
      console.log(JSON.stringify({ type: 'tool_input_delta', index: idx, partial: part }));
    }
    if (ev && ev.type === 'content_block_stop') {
      const idx = typeof ev.index === 'number' ? ev.index : 0;
      if (Object.prototype.hasOwnProperty.call(toolInputBuffers, idx)) {
        const raw = toolInputBuffers[idx];
        let parsed = undefined;
        try { parsed = JSON.parse(raw); } catch {}
        const meta = toolMeta[idx] || {};
        console.log(JSON.stringify({ type: 'tool_input_done', index: idx, id: meta.id, name: meta.name, input: parsed, raw }));
        delete toolInputBuffers[idx];
        delete toolMeta[idx];
      }
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
