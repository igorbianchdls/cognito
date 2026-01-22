// Runners for Claude Agent SDK used by /api/chat streaming endpoints

export function getChatStreamRunnerScript(): string {
  return `
import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || '';
const fs = require('fs');

// Programmatic subagents (example set)
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

// MCP test tools server (guarded init)
let testToolsServer: any = null;
try {
  testToolsServer = createSdkMcpServer({
    name: 'test-tools',
    version: '1.0.0',
    tools: [
      tool('get_weather', 'Retorna temperatura (mock) para uma cidade', { city: z.string().optional() }, async (args) => {
        const city = (args && (args as any).city) || 'Local';
        return { content: [{ type: 'text', text: 'Temperatura em ' + city + ': 25°C' }] };
      }),
      tool('echo_text', 'Repete o texto enviado', { text: z.string() }, async (args) => {
        const t = (args && (args as any).text) || '';
        return { content: [{ type: 'text', text: String(t) }] };
      }),
    ],
  });
} catch (e) {
  try { console.log(JSON.stringify({ type: 'stderr', data: 'MCP init failed: ' + String(e?.message || e) })); } catch {}
}

const extraAllowed = testToolsServer ? ['mcp__test-tools__get_weather', 'mcp__test-tools__echo_text'] : [];
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
  allowedTools: ['Skill','Read','Write','Edit','Grep','Glob','Bash'].concat(extraAllowed),
  mcpServers: testToolsServer ? { 'test-tools': testToolsServer } : undefined,
  agents,
};

// Try to resume a previous session to preserve state
let resumeId = null;
try {
  const raw = fs.readFileSync('/vercel/sandbox/.session/session.json','utf8');
  const parsed = JSON.parse(raw);
  if (parsed && parsed.sessionId) resumeId = parsed.sessionId;
} catch {}

// Start query stream (MCP requires streaming input)
async function* generateMessages() {
  yield { type: 'user' as const, message: { role: 'user' as const, content: prompt } };
}
const q = query({ prompt: generateMessages(), options: Object.assign({}, options, resumeId ? { resume: resumeId, continue: true } : {}) });

// Surface agents and slash commands early
try { console.log(JSON.stringify({ type: 'agents_list', agents: Object.keys(agents) })); } catch {}
try { const cmds = await q.supportedCommands(); console.log(JSON.stringify({ type: 'slash_commands', commands: cmds })); } catch {}

const toolInputBuffers = {};
const toolMeta = {};

for await (const msg of q) {
  if (msg && msg.type === 'system' && msg.subtype === 'init') {
    try {
      const sid = msg.session_id || null;
      if (sid) {
        fs.mkdirSync('/vercel/sandbox/.session', { recursive: true });
        fs.writeFileSync('/vercel/sandbox/.session/session.json', JSON.stringify({ sessionId: sid }));
      }
      if (Array.isArray(msg.slash_commands)) {
        console.log(JSON.stringify({ type: 'slash_commands', commands: (msg.slash_commands || []).map((n)=>({ name:n })) }));
      }
    } catch {}
  }
  if (msg.type === 'stream_event') {
    const ev = msg.event;
    if (ev && ev.type === 'content_block_start' && ev.content_block && ev.content_block.type === 'thinking') {
      console.log(JSON.stringify({ type: 'reasoning_start' }));
    }
    if (ev && ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta' && (ev.delta.text || ev.delta.text === '')) {
      const t = ev.delta.text ?? '';
      if (t) console.log(JSON.stringify({ type: 'delta', text: t }));
    }
    if (ev && ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'thinking_delta') {
      const t = (ev.delta.thinking ?? ev.delta.text ?? ev.delta.content ?? '').toString();
      if (t) console.log(JSON.stringify({ type: 'reasoning_delta', text: t }));
    }
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
        // Bridge custom tool calls to backend endpoints
        try {
          const base = process.env.AGENT_BASE_URL || '';
          const token = process.env.AGENT_TOOL_TOKEN || '';
          const chatId = process.env.AGENT_CHAT_ID || '';
          // 1) Direct call when tool name matches
          if (meta && meta.name === 'buscarFornecedor' && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/contas-a-pagar/buscar-fornecedor';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'buscarFornecedor', output: out }));
          }
          // 2) Generic Tools Skill: { tool: 'buscarFornecedor', args: {...} }
          else if (meta && meta.name === 'Tools' && parsed && typeof parsed === 'object' && (parsed.tool || (parsed.name))) {
            const toolName = String((parsed.tool || parsed.name) || '');
            const args = (parsed.args !== undefined ? parsed.args : parsed.input !== undefined ? parsed.input : {})
            if (toolName === 'buscarFornecedor' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/contas-a-pagar/buscar-fornecedor';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'buscarFornecedor', output: out }));
            }
          }
        } catch (e) {
          try { console.log(JSON.stringify({ type: 'tool_error', tool_name: String((toolMeta[idx] && toolMeta[idx].name) || 'buscarFornecedor'), error: String(e?.message || e) })); } catch {}
        }
        delete toolInputBuffers[idx];
        delete toolMeta[idx];
      }
      console.log(JSON.stringify({ type: 'reasoning_end' }));
    }
  } else if (msg.type === 'result' && msg.subtype === 'success') {
    console.log(JSON.stringify({ type: 'final', text: msg.result ?? '' }));
  }
}
`.trim();
}

export function getSlashStreamRunnerScript(): string {
  return `
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || '';
const fs = require('fs');

const agents = { uiScaffold: { description:'UI scaffold', tools:['Read','Write','Edit'], prompt:'Crie artefatos web mínimos.', model:'inherit' } };
const baseOptions = {
  model: 'claude-sonnet-4-5-20250929',
  pathToClaudeCodeExecutable: cli,
  cwd: '/vercel/sandbox',
  additionalDirectories: ['/vercel/sandbox'],
  tools: { type: 'preset', preset: 'claude_code' },
  permissionMode: 'acceptEdits',
  includePartialMessages: true,
  maxThinkingTokens: 1024,
  settingSources: ['project'],
  allowedTools: ['Skill','Read','Write','Edit','Grep','Glob','Bash'],
  agents,
  maxTurns: 1,
};
let resumeId = null;
try { const raw = fs.readFileSync('/vercel/sandbox/.session/session.json','utf8'); const parsed = JSON.parse(raw); if (parsed && parsed.sessionId) resumeId = parsed.sessionId; } catch {}
const q = query({ prompt, options: Object.assign({}, baseOptions, resumeId ? { resume: resumeId, continue: true } : {}) });
try { const cmds = await q.supportedCommands(); console.log(JSON.stringify({ type: 'slash_commands', commands: cmds })); } catch {}
for await (const msg of q) {
  if (msg && msg.type === 'system' && msg.subtype === 'init') {
    try { const sid = msg.session_id || null; if (sid) { fs.mkdirSync('/vercel/sandbox/.session',{recursive:true}); fs.writeFileSync('/vercel/sandbox/.session/session.json', JSON.stringify({ sessionId: sid })); } } catch {}
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
`.trim();
}
