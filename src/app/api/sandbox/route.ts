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
  if (action === 'chat-slash') return chatSlash(payload as { chatId?: string; prompt?: string })
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
      // Seed default Skills into /vercel/sandbox/.claude/skills
      const t2 = Date.now()
      // Ensure skill directories exist
      const mk = await sandbox.runCommand({ cmd: 'node', args: ['-e', `
const fs=require('fs');
fs.mkdirSync('/vercel/sandbox/.claude/skills/web-scaffold', { recursive: true });
fs.mkdirSync('/vercel/sandbox/.claude/skills/bq-analyst', { recursive: true });
` ] })
      timeline.push({ name: 'mkdir-skills', ms: Date.now() - t2, ok: mk.exitCode === 0, exitCode: mk.exitCode })
      const skills: { path: string; content: Buffer }[] = []
      const webSkill = `---\nname: Web Scaffold\ndescription: Create or extend a minimal website skeleton (HTML/CSS/JS) inside the project sandbox.\n---\n\nYou are a Skill that helps scaffold simple web projects.\n\nGuidelines:\n- Create files under /vercel/sandbox (cwd).\n- Prefer minimal HTML in index.html and lightweight CSS/JS.\n- If asked to add a component, generate a simple self-contained HTML section and CSS.\n- Use the agent tools (Write/Edit) to modify files.\n- Keep changes small and incremental.\n\nExamples:\n- Create index.html with header, main section and footer.\n- Add styles.css with a neutral palette.\n- Add script.js with a small interactivity snippet.\n`;
      const bqSkill = `---\nname: BigQuery Analyst\ndescription: Analyze and propose BigQuery SQL queries based on dataset structure.\n---\n\nYou are a Skill that assists with BigQuery queries.\n\nGuidelines:\n- Ask for or read available table names and schemas when necessary.\n- Propose parameterized SQL and explain joins and filters.\n- When user requests, write files (e.g., queries/analysis.sql).\n- Keep queries safe and scoped.\n`;
      skills.push({ path: '/vercel/sandbox/.claude/skills/web-scaffold/SKILL.md', content: Buffer.from(webSkill, 'utf8') })
      skills.push({ path: '/vercel/sandbox/.claude/skills/bq-analyst/SKILL.md', content: Buffer.from(bqSkill, 'utf8') })
      const t3 = Date.now()
      await sandbox.writeFiles(skills)
      timeline.push({ name: 'seed-skills', ms: Date.now() - t3, ok: true })
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
const fs = require('fs');
// Define subagents (programáticos)
const agents = {
  sqlAnalyst: {
    description: 'Analisa esquemas e escreve SQL (BigQuery) com segurança',
    tools: ['Read','Grep','Glob','Write','Edit'],
    prompt: 'Você é um analista SQL cuidadoso. Prefira SQL parametrizado, explique joins e filtros, valide nomes de tabelas/colunas antes de usar. Evite consultas caras sem necessidade.' ,
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
  settingSources: ['project'],
  allowedTools: ['Skill','Read','Write','Edit','Grep','Glob','Bash'],
  agents,
  hooks: {
    SubagentStart: [{ hooks: [async (input) => {
      try {
        const nm = (input && (input.agent_name || input.agentName || input.name)) || '';
        console.log(JSON.stringify({ type: 'subagent_start', name: nm }));
      } catch {}
      return {};
    }]}],
    SubagentStop: [{ hooks: [async (input) => {
      try {
        const nm = (input && (input.agent_name || input.agentName || input.name)) || '';
        console.log(JSON.stringify({ type: 'subagent_stop', name: nm }));
      } catch {}
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
// Try to resume an existing SDK session (V1) to enable real slash commands
let resumeId = null;
try {
  const raw = fs.readFileSync('/vercel/sandbox/.session/session.json','utf8');
  const parsed = JSON.parse(raw);
  if (parsed && parsed.sessionId) resumeId = parsed.sessionId;
} catch {}
const q = query({ prompt, options: Object.assign({}, options, resumeId ? { resume: resumeId, continue: true } : {}) });
// Emit list of available agents for UI palette
try { console.log(JSON.stringify({ type: 'agents_list', agents: Object.keys(agents) })); } catch {}
// Emit slash commands available from SDK
try {
  const cmds = await q.supportedCommands();
  console.log(JSON.stringify({ type: 'slash_commands', commands: cmds }));
} catch {}
const toolInputBuffers = {};
const toolMeta = {};
for await (const msg of q) {
  // Capture system init to persist sessionId and possibly slash_commands
  if (msg && msg.type === 'system' && msg.subtype === 'init') {
    try {
      const sid = msg.session_id || null;
      if (sid) {
        fs.mkdirSync('/vercel/sandbox/.session', { recursive: true });
        fs.writeFileSync('/vercel/sandbox/.session/session.json', JSON.stringify({ sessionId: sid }));
      }
      if (Array.isArray(msg.slash_commands)) {
        console.log(JSON.stringify({ type: 'slash_commands', commands: (msg.slash_commands || []).map((n)=>({ name: n })) }));
      }
    } catch {}
  }
  if (msg.type === 'stream_event') {
    const ev = msg.event;
    // Start of thinking block
    if (ev && ev.type === 'content_block_start' && ev.content_block && ev.content_block.type === 'thinking') {
      console.log(JSON.stringify({ type: 'reasoning_start' }));
    }
    // Visible assistant text deltas
    if (ev && ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta' && (ev.delta.text || ev.delta.text === '')) {
      const t = ev.delta.text ?? '';
      if (t) console.log(JSON.stringify({ type: 'delta', text: t }));
    }
    // Thinking deltas (field may be 'thinking' or sometimes 'text')
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
    // End of block
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
    try {
      await sess.sandbox.runCommand({ cmd: 'node', args: ['-e', `
try { require('fs').unlinkSync('/vercel/sandbox/.session/session.json'); } catch {}
` ] })
    } catch {}
    await sess.sandbox.stop().catch(() => {})
    SESSIONS.delete(chatId)
    return Response.json({ ok: true })
  }

  async function chatSlash({ chatId, prompt }: { chatId?: string; prompt?: string }) {
    const enc = new TextEncoder()
    if (!chatId) return new Response(JSON.stringify({ ok: false, error: 'chatId obrigatório' }), { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return new Response(JSON.stringify({ ok: false, error: 'chat não encontrado' }), { status: 404 })
    const slash = (prompt || '').toString().trim()
    if (!slash || !slash.startsWith('/')) return new Response(JSON.stringify({ ok: false, error: 'prompt deve começar com /' }), { status: 400 })
    sess.lastUsedAt = Date.now()

    // Runner specialized for slash commands (no transcript), streaming system events
    const runner = `
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || '';
const fs = require('fs');
// Define subagents (programáticos)
const agents = {
  sqlAnalyst: {
    description: 'Analisa esquemas e escreve SQL (BigQuery) com segurança',
    tools: ['Read','Grep','Glob','Write','Edit'],
    prompt: 'Você é um analista SQL cuidadoso. Prefira SQL parametrizado, explique joins e filtros, valide nomes de tabelas/colunas antes de usar. Evite consultas caras sem necessidade.' ,
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
const baseOptions = {
  model: 'claude-sonnet-4-5-20250929',
  pathToClaudeCodeExecutable: cli,
  cwd: '/vercel/sandbox',
  additionalDirectories: ['/vercel/sandbox'],
  tools: { type: 'preset', preset: 'claude_code' },
  permissionMode: 'acceptEdits',
  includePartialMessages: true,
  maxThinkingTokens: 2048,
  settingSources: ['project'],
  allowedTools: ['Skill','Read','Write','Edit','Grep','Glob','Bash'],
  agents,
  // For slash commands, constrain to a single turn
  maxTurns: 1,
};
// Try to resume an existing SDK session (V1) to keep history/context
let resumeId = null;
try {
  const raw = fs.readFileSync('/vercel/sandbox/.session/session.json','utf8');
  const parsed = JSON.parse(raw);
  if (parsed && parsed.sessionId) resumeId = parsed.sessionId;
} catch {}
const q = query({ prompt, options: Object.assign({}, baseOptions, resumeId ? { resume: resumeId, continue: true } : {}) });
// Emit list of available agents for UI palette
try { console.log(JSON.stringify({ type: 'agents_list', agents: Object.keys(agents) })); } catch {}
// Emit slash commands available from SDK
try {
  const cmds = await q.supportedCommands();
  console.log(JSON.stringify({ type: 'slash_commands', commands: cmds }));
} catch {}
for await (const msg of q) {
  if (msg && msg.type === 'system') {
    try {
      // Persist new session id on /clear or fresh init
      if (msg.subtype === 'init' && (msg as any).session_id) {
        const sid = (msg as any).session_id;
        fs.mkdirSync('/vercel/sandbox/.session', { recursive: true });
        fs.writeFileSync('/vercel/sandbox/.session/session.json', JSON.stringify({ sessionId: sid }));
      }
      // Forward compact boundaries and other system notices
      const out = { type: 'system', subtype: (msg as any).subtype } as any;
      if (Array.isArray((msg as any).slash_commands)) out.slash_commands = (msg as any).slash_commands;
      if ((msg as any).compact_metadata) out.compact_metadata = (msg as any).compact_metadata;
      console.log(JSON.stringify(out));
    } catch {}
  } else if (msg.type === 'stream_event') {
    const ev = (msg as any).event;
    if (ev && ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta' && (ev.delta.text || ev.delta.text === '')) {
      const t = ev.delta.text ?? '';
      if (t) console.log(JSON.stringify({ type: 'delta', text: t }));
    }
  } else if (msg.type === 'result' && msg.subtype === 'success') {
    console.log(JSON.stringify({ type: 'final', text: (msg as any).result ?? '' }));
  }
}
`.trim()

    await sess.sandbox.writeFiles([{ path: '/vercel/sandbox/agent-slash-stream.mjs', content: Buffer.from(runner) }])

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const cmd: any = await (sess.sandbox as any).runCommand({
            cmd: 'node',
            args: ['agent-slash-stream.mjs', slash],
            env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '' },
            detached: true,
          })
          controller.enqueue(enc.encode('event: start\ndata: ok\n\n'))
          let outBuf = ''
          let errBuf = ''
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
const p = process.env.TARGET_PATH;
try {
  const names = fs.readdirSync(p, { withFileTypes: true }).map(d=>({ name: d.name, type: d.isDirectory()?'dir':'file', path: require('path').join(p, d.name) }));
  // Show .claude explicitly; still hide other hidden entries and heavy dirs
  const filtered = names.filter(e => (e.name === '.claude' || !e.name.startsWith('.')) && e.name !== 'node_modules' && e.name !== '.cache');
  filtered.sort((a,b)=> a.type===b.type ? a.name.localeCompare(b.name) : (a.type==='dir'?-1:1));
  console.log(JSON.stringify(filtered));
} catch(e){ console.error(String(e.message||e)); process.exit(1); }
`
    const run = await sess.sandbox.runCommand({ cmd: 'node', args: ['-e', script], env: { TARGET_PATH: target } })
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
const p = process.env.TARGET_PATH;
try {
  const buf = fs.readFileSync(p);
  const isBin = buf.some(b => b===0);
  if (isBin) console.log(JSON.stringify({ isBinary:true, content: buf.toString('base64') }));
  else console.log(JSON.stringify({ isBinary:false, content: buf.toString('utf8') }));
} catch(e){ console.error(String(e.message||e)); process.exit(1); }
`
    const run = await sess.sandbox.runCommand({ cmd: 'node', args: ['-e', script], env: { TARGET_PATH: target } })
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
