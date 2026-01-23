// Runners for Claude Agent SDK used by /api/chat streaming endpoints

export function getChatStreamRunnerScript(): string {
  return `
import { query } from '@anthropic-ai/claude-agent-sdk';
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

let appToolsServer = null;
let appToolsServerExtra = null;
let appToolsServerFinance = null;
try {
  const mod = await import('file:///vercel/sandbox/.mcp/app-tools.mjs');
  // @ts-ignore
  appToolsServer = (mod && (mod.default || mod.appToolsServer)) || null;
} catch {}
try {
  const mod2 = await import('file:///vercel/sandbox/.mcp/app-tools-extra.mjs');
  // @ts-ignore
  appToolsServerExtra = (mod2 && (mod2.default || mod2.appToolsServerExtra)) || null;
} catch {}
try {
  const mod3 = await import('file:///vercel/sandbox/.mcp/app-tools-finance.mjs');
  // @ts-ignore
  appToolsServerFinance = (mod3 && (mod3.default || mod3.appToolsServerFinance)) || null;
} catch {}
const extraAllowed = [];
if (appToolsServer) {
  extraAllowed.push(
    'mcp__app-tools__get_weather',
    'mcp__app-tools__echo_text',
    'mcp__app-tools__buscar_fornecedor',
    'mcp__app-tools__get_contas_pagar',
    'mcp__app-tools__get_contas_receber',
  );
}
if (appToolsServerExtra) {
  extraAllowed.push(
    'mcp__app-tools-extra__get_vendas',
    'mcp__app-tools-extra__get_compras',
  );
}
if (appToolsServerFinance) {
  extraAllowed.push(
    'mcp__app-tools-finance__get_contas_financeiras',
    'mcp__app-tools-finance__get_categorias_despesa',
    'mcp__app-tools-finance__get_categorias_receita',
    'mcp__app-tools-finance__get_clientes',
    'mcp__app-tools-finance__get_centros_custo',
    'mcp__app-tools-finance__get_centros_lucro',
  );
}
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
  mcpServers: (appToolsServer || appToolsServerExtra || appToolsServerFinance) ? Object.fromEntries([
    ...(appToolsServer ? [[ 'app-tools', appToolsServer ]] : []),
    ...(appToolsServerExtra ? [[ 'app-tools-extra', appToolsServerExtra ]] : []),
    ...(appToolsServerFinance ? [[ 'app-tools-finance', appToolsServerFinance ]] : []),
  ]) : undefined,
  agents,
  // Emit standard tool lifecycle events so UI can render tool-specific components (e.g., get_weather)
  hooks: {
    SubagentStart: [{ hooks: [async (input) => { try { const nm = (input && (input.agent_name || input.agentName || input.name)) || ''; console.log(JSON.stringify({ type: 'subagent_start', name: nm })); } catch {} return {}; }]}],
    SubagentStop: [{ hooks: [async (input) => { try { const nm = (input && (input.agent_name || input.agentName || input.name)) || ''; console.log(JSON.stringify({ type: 'subagent_stop', name: nm })); } catch {} return {}; }]}],
    PreToolUse: [{ hooks: [async (input) => { try { console.log(JSON.stringify({ type: 'tool_start', tool_name: input.tool_name, input: input.tool_input })); } catch {} return {}; }]}],
    PostToolUse: [{ hooks: [async (input) => { try { console.log(JSON.stringify({ type: 'tool_done', tool_name: input.tool_name, output: input.tool_response })); } catch {} return {}; }]}],
    PostToolUseFailure: [{ hooks: [async (input) => { try { console.log(JSON.stringify({ type: 'tool_error', tool_name: input.tool_name, error: input.error, is_interrupt: input.is_interrupt })); } catch {} return {}; }]}],
  },
};

// Try to resume a previous session to preserve state
let resumeId = null;
try {
  const raw = fs.readFileSync('/vercel/sandbox/.session/session.json','utf8');
  const parsed = JSON.parse(raw);
  if (parsed && parsed.sessionId) resumeId = parsed.sessionId;
} catch {}

// Start query stream (simple prompt)
const q = query({ prompt, options: Object.assign({}, options, resumeId ? { resume: resumeId, continue: true } : {}) });

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
            } else if (toolName === 'getContasPagar' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/contas-a-pagar/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getContasPagar', output: out }));
            } else if (toolName === 'getContasReceber' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/contas-a-receber/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getContasReceber', output: out }));
            } else if (toolName === 'getVendas' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/vendas/pedidos/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getVendas', output: out }));
            } else if (toolName === 'getCompras' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/compras/pedidos/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getCompras', output: out }));
            } else if (toolName === 'getContasFinanceiras' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/financeiro/contas-financeiras/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getContasFinanceiras', output: out }));
            } else if (toolName === 'getCategoriasDespesa' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/financeiro/categorias-despesa/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getCategoriasDespesa', output: out }));
            } else if (toolName === 'getCategoriasReceita' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/financeiro/categorias-receita/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getCategoriasReceita', output: out }));
            } else if (toolName === 'getClientes' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/financeiro/clientes/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getClientes', output: out }));
            } else if (toolName === 'getCentrosCusto' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/financeiro/centros-custo/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getCentrosCusto', output: out }));
            } else if (toolName === 'getCentrosLucro' && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/financeiro/centros-lucro/listar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'getCentrosLucro', output: out }));
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
