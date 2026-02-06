// Runners for Claude Agent SDK used by /api/chat streaming endpoints

export function getChatStreamRunnerScript(): string {
  return `
import { query } from '@anthropic-ai/claude-agent-sdk';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const cli = require.resolve('@anthropic-ai/claude-code/cli.js');
const prompt = process.argv[2] || '';

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

let appToolsServerERP = null;
let appToolsServerComposio = null;
try {
  const mod4 = await import('file:///vercel/sandbox/.mcp/ERP.mjs');
  // @ts-ignore
  appToolsServerERP = (mod4 && (mod4.default || mod4.mcpERPServer)) || null;
} catch {}
const mcpServers = {};
if (appToolsServerERP) { mcpServers['ERP'] = appToolsServerERP; }
try {
  if ((process.env.MCP_COMPOSIO_ENABLED || '') === '1') {
    const modC = await import('file:///vercel/sandbox/.mcp/composio.mjs');
    // @ts-ignore
    appToolsServerComposio = (modC && (modC.default || modC.composioServer)) || null;
    if (appToolsServerComposio) { mcpServers['composio'] = appToolsServerComposio; }
  }
} catch {}
// Build allowed tools list: ERP tools + all Composio tools
const allowedToolsList = [];
if (appToolsServerERP) {
  allowedToolsList.push('mcp__ERP__crud');
  allowedToolsList.push('mcp__ERP__workspace');
}
try {
  if (appToolsServerComposio && Array.isArray(appToolsServerComposio.tools)) {
    for (const t of appToolsServerComposio.tools) {
      const nm = (t && (t.name || (t.tool && t.tool.name))) || null;
      if (nm) allowedToolsList.push('mcp__composio__' + nm);
    }
  }
} catch {}
const modelId = process.env.AGENT_MODEL || 'claude-haiku-4-5-20251001';
const options = {
  model: modelId,
  pathToClaudeCodeExecutable: cli,
  cwd: '/vercel/sandbox',
  additionalDirectories: ['/vercel/sandbox'],
  // No preset; disable all tools
  tools: [],
  permissionMode: 'bypassPermissions',
  includePartialMessages: true,
  maxThinkingTokens: 2048,
  settingSources: ['project'],
  // Allow ERP tools and Composio router tools
  allowedTools: allowedToolsList,
  // Register only the ERP MCP server
  mcpServers: Object.keys(mcpServers).length ? mcpServers : undefined,
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

// Stateless mode: no session resume/continue.
const q = query({ prompt, options });

// Surface agents and slash commands early
try { console.log(JSON.stringify({ type: 'agents_list', agents: Object.keys(agents) })); } catch {}
try { const cmds = await q.supportedCommands(); console.log(JSON.stringify({ type: 'slash_commands', commands: cmds })); } catch {}

const toolInputBuffers = {};
const toolMeta = {};

for await (const msg of q) {
  if (msg && msg.type === 'system' && msg.subtype === 'init') {
    try {
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
          } else if (meta && (meta.name === 'criarCliente' || meta.name === 'criar_cliente') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/clientes/criar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_cliente', output: out }));
          } else if (meta && (meta.name === 'criarFornecedor' || meta.name === 'criar_fornecedor') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/fornecedores/criar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_fornecedor', output: out }));
          } else if (meta && (meta.name === 'criarCentroCusto' || meta.name === 'criar_centro_custo') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/centros-custo/criar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_centro_custo', output: out }));
          } else if (meta && (meta.name === 'criarCentroLucro' || meta.name === 'criar_centro_lucro') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/centros-lucro/criar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_centro_lucro', output: out }));
          } else if (meta && (meta.name === 'criarCategoriaDespesa' || meta.name === 'criar_categoria_despesa') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/categorias-despesa/criar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_categoria_despesa', output: out }));
          } else if (meta && (meta.name === 'criarCategoriaReceita' || meta.name === 'criar_categoria_receita') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/categorias-receita/criar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_categoria_receita', output: out }));
          } else if (meta && (meta.name === 'criarContaFinanceira' || meta.name === 'criar_conta_financeira') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/contas-financeiras/criar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_conta_financeira', output: out }));
          } else if (meta && (meta.name === 'deletarCliente' || meta.name === 'deletar_cliente') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/clientes/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_cliente', output: out }));
          } else if (meta && (meta.name === 'deletarFornecedor' || meta.name === 'deletar_fornecedor') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/fornecedores/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_fornecedor', output: out }));
          } else if (meta && (meta.name === 'deletarCentroCusto' || meta.name === 'deletar_centro_custo') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/centros-custo/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_centro_custo', output: out }));
          } else if (meta && (meta.name === 'deletarCentroLucro' || meta.name === 'deletar_centro_lucro') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/centros-lucro/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_centro_lucro', output: out }));
          } else if (meta && (meta.name === 'deletarCategoriaDespesa' || meta.name === 'deletar_categoria_despesa') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/categorias-despesa/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_categoria_despesa', output: out }));
          } else if (meta && (meta.name === 'deletarCategoriaReceita' || meta.name === 'deletar_categoria_receita') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/categorias-receita/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_categoria_receita', output: out }));
          } else if (meta && (meta.name === 'deletarContaFinanceira' || meta.name === 'deletar_conta_financeira') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/financeiro/contas-financeiras/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_conta_financeira', output: out }));
          } else if (meta && (meta.name === 'deletarVenda' || meta.name === 'deletar_venda') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/vendas/pedidos/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_venda', output: out }));
          } else if (meta && (meta.name === 'deletarCompra' || meta.name === 'deletar_compra') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/compras/pedidos/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_compra', output: out }));
          } else if (meta && (meta.name === 'deletarContaPagar' || meta.name === 'deletar_conta_pagar') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/contas-a-pagar/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_conta_pagar', output: out }));
          } else if (meta && (meta.name === 'deletarContaReceber' || meta.name === 'deletar_conta_receber') && base && token && chatId && parsed) {
            const url = (base || '') + '/api/agent-tools/contas-a-receber/deletar';
            const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(parsed) });
            const data = await res.json().catch(() => ({}));
            const out = (data && (data.result !== undefined ? data.result : data)) || {};
            console.log(JSON.stringify({ type: 'tool_done', tool_name: 'deletar_conta_receber', output: out }));
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
            } else if ((toolName === 'criarCliente' || toolName === 'criar_cliente') && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/financeiro/clientes/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_cliente', output: out }));
            } else if ((toolName === 'criarFornecedor' || toolName === 'criar_fornecedor') && base && token && chatId) {
              const url = (base || '') + '/api/agent-tools/financeiro/fornecedores/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_fornecedor', output: out }));
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
            } else if (toolName === 'criarCentroCusto' || toolName === 'criar_centro_custo') {
              const url = (base || '') + '/api/agent-tools/financeiro/centros-custo/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_centro_custo', output: out }));
            } else if (toolName === 'criarCentroLucro' || toolName === 'criar_centro_lucro') {
              const url = (base || '') + '/api/agent-tools/financeiro/centros-lucro/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_centro_lucro', output: out }));
            } else if (toolName === 'criarCategoriaDespesa' || toolName === 'criar_categoria_despesa') {
              const url = (base || '') + '/api/agent-tools/financeiro/categorias-despesa/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_categoria_despesa', output: out }));
            } else if (toolName === 'criarCategoriaReceita' || toolName === 'criar_categoria_receita') {
              const url = (base || '') + '/api/agent-tools/financeiro/categorias-receita/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_categoria_receita', output: out }));
            } else if (toolName === 'criarContaFinanceira' || toolName === 'criar_conta_financeira') {
              const url = (base || '') + '/api/agent-tools/financeiro/contas-financeiras/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_conta_financeira', output: out }));
            } else if (toolName === 'criarVenda' || toolName === 'criar_venda') {
              const url = (base || '') + '/api/agent-tools/vendas/pedidos/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_venda', output: out }));
            } else if (toolName === 'criarCompra' || toolName === 'criar_compra') {
              const url = (base || '') + '/api/agent-tools/compras/pedidos/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_compra', output: out }));
            } else if (toolName === 'criarContaPagar' || toolName === 'criar_conta_pagar') {
              const url = (base || '') + '/api/agent-tools/contas-a-pagar/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_conta_pagar', output: out }));
            } else if (toolName === 'criarContaReceber' || toolName === 'criar_conta_receber') {
              const url = (base || '') + '/api/agent-tools/contas-a-receber/criar';
              const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });
              const data = await res.json().catch(() => ({}));
              const out = (data && (data.result !== undefined ? data.result : data)) || {};
              console.log(JSON.stringify({ type: 'tool_done', tool_name: 'criar_conta_receber', output: out }));
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

const agents = { uiScaffold: { description:'UI scaffold', tools:['Read','Write','Edit'], prompt:'Crie artefatos web mínimos.', model:'inherit' } };
const modelId = process.env.AGENT_MODEL || 'claude-haiku-4-5-20251001';
const baseOptions = {
  model: modelId,
  pathToClaudeCodeExecutable: cli,
  cwd: '/vercel/sandbox',
  additionalDirectories: ['/vercel/sandbox'],
  // No preset; disable all tools
  tools: [],
  permissionMode: 'bypassPermissions',
  includePartialMessages: true,
  maxThinkingTokens: 1024,
  settingSources: ['project'],
  // No tools allowed
  allowedTools: [],
  agents,
  maxTurns: 1,
};
const q = query({ prompt, options: baseOptions });
try { const cmds = await q.supportedCommands(); console.log(JSON.stringify({ type: 'slash_commands', commands: cmds })); } catch {}
for await (const msg of q) {
  if (msg && msg.type === 'system' && msg.subtype === 'init') {
    // no-op
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
