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

export function getOpenAIResponsesStreamRunnerScript(): string {
  return `
const prompt = process.argv[2] || '';
const modelId = process.env.AGENT_MODEL || 'gpt-5.1';
const apiKey = process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY || '';
const baseAppUrl = process.env.AGENT_BASE_URL || '';
const toolToken = process.env.AGENT_TOOL_TOKEN || '';
const chatId = process.env.AGENT_CHAT_ID || '';
const tenantId = process.env.AGENT_TENANT_ID || '1';

if (!apiKey) {
  console.log(JSON.stringify({ type: 'error', error: 'OPENAI_API_KEY/CODEX_API_KEY ausente na sandbox.' }));
  process.exit(2);
}

const rawBase = String(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').trim();
const base = rawBase.replace(/\\/+$/, '');
const url = base.endsWith('/responses') ? base : (base + '/responses');

let responseId = null;
let assistantText = '';
let reasoningText = '';
let reasoningStarted = false;
const SAFE_PREFIXES = ['financeiro', 'vendas', 'compras', 'contas-a-pagar', 'contas-a-receber', 'estoque', 'cadastros'];

function emit(type, extra) {
  console.log(JSON.stringify({ type, ...(extra || {}) }));
}

function extractText(value, depth = 0) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object' || depth > 5) return '';
  const obj = value;
  const candidates = [
    obj.delta,
    obj.text,
    obj.summary_text,
    obj.output_text,
    obj.reasoning_text,
    obj.summary,
    obj.content,
    obj.message,
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

function appendAssistant(delta) {
  const text = String(delta || '');
  if (!text) return;
  assistantText += text;
  emit('delta', { text });
}

function appendReasoning(delta) {
  const text = String(delta || '');
  if (!text) return;
  if (!reasoningStarted) {
    reasoningStarted = true;
    emit('reasoning_start', {});
  }
  reasoningText += text;
  emit('reasoning_delta', { text });
}

function isSafeResource(resource) {
  try {
    if (!resource || typeof resource !== 'string') return false;
    if (resource.includes('..')) return false;
    const clean = resource.replace(/^\\/+|\\/+$/g, '');
    return SAFE_PREFIXES.some((p) => clean === p || clean.startsWith(p + '/'));
  } catch {
    return false;
  }
}

function parseJsonMaybe(raw) {
  if (typeof raw !== 'string') return raw;
  try { return JSON.parse(raw); } catch { return raw; }
}

function buildAgentToolsUrl(resource, suffix) {
  const cleanRes = String(resource || '').replace(/^\\/+|\\/+$/g, '');
  const cleanSuf = String(suffix || '').replace(/^\\/+|\\/+$/g, '');
  return (baseAppUrl || '') + '/api/agent-tools/' + cleanRes + '/' + cleanSuf;
}

async function callChatAction(action, payload) {
  if (!baseAppUrl || !chatId) {
    return { success: false, error: 'configuração ausente para sandbox tools (AGENT_BASE_URL/AGENT_CHAT_ID)' };
  }
  const url = (baseAppUrl || '').replace(/\\/+$/, '') + '/api/chat';
  const headers = { 'content-type': 'application/json' };
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, chatId, ...(payload || {}) }),
  });
  const raw = await res.text().catch(() => '');
  let data = {};
  try { data = JSON.parse(raw); } catch {}
  if (!res.ok) {
    return { success: false, status: res.status, error: data?.error || raw || res.statusText || ('erro em ' + action) };
  }
  return data;
}

async function callCrud(args) {
  if (!baseAppUrl || !toolToken || !chatId) {
    return { success: false, error: 'configuração ausente para tool crud (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)' };
  }
  const action = String(args?.action || 'listar').toLowerCase();
  const resource = String(args?.resource || args?.path || '');
  if (!isSafeResource(resource)) {
    return { success: false, error: 'recurso não permitido', resource };
  }
  const method = String(args?.method || 'POST').toUpperCase();
  let suffix = String(args?.actionSuffix || '').trim();
  if (!suffix) {
    if (action === 'criar') suffix = 'criar';
    else if (action === 'atualizar') suffix = 'atualizar';
    else if (action === 'deletar') suffix = 'deletar';
    else suffix = 'listar';
  }
  const urlTool = buildAgentToolsUrl(resource, suffix);
  const payload = action === 'listar' ? (args?.params || {}) : (args?.data || {});
  const headers = {
    'content-type': 'application/json',
    authorization: 'Bearer ' + toolToken,
    'x-chat-id': chatId,
    'x-tenant-id': tenantId,
  };
  const init = method === 'GET'
    ? { method, headers }
    : { method, headers, body: JSON.stringify(payload || {}) };
  const resTool = await fetch(urlTool, init);
  const raw = await resTool.text().catch(() => '');
  let data = {};
  try { data = JSON.parse(raw); } catch {}
  const out = (data && (data.result !== undefined ? data.result : data)) || {};
  if (!resTool.ok) {
    return { success: false, status: resTool.status, error: out?.error || out?.message || raw || resTool.statusText || 'erro na tool crud' };
  }
  return out;
}

async function callWorkspace(args) {
  if (!baseAppUrl || !toolToken || !chatId) {
    return { success: false, error: 'configuração ausente para tool workspace (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)' };
  }
  const urlTool = (baseAppUrl || '').replace(/\\/+$/, '') + '/api/agent-tools/workspace/crud';
  const headers = {
    'content-type': 'application/json',
    authorization: 'Bearer ' + toolToken,
    'x-chat-id': chatId,
    'x-tenant-id': tenantId,
  };
  const resTool = await fetch(urlTool, { method: 'POST', headers, body: JSON.stringify(args || {}) });
  const raw = await resTool.text().catch(() => '');
  let data = {};
  try { data = JSON.parse(raw); } catch {}
  const out = (data && (data.result !== undefined ? data.result : data)) || {};
  if (!resTool.ok) {
    return { success: false, status: resTool.status, error: out?.error || out?.message || raw || resTool.statusText || 'erro na tool workspace' };
  }
  return out;
}

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const k = Math.floor(n);
  return k > 0 ? k : fallback;
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while (idx <= haystack.length) {
    const found = haystack.indexOf(needle, idx);
    if (found < 0) break;
    count += 1;
    idx = found + needle.length;
  }
  return count;
}

function replaceFirst(haystack, needle, replacement) {
  const idx = haystack.indexOf(needle);
  if (idx < 0) return { replaced: false, value: haystack };
  return {
    replaced: true,
    value: haystack.slice(0, idx) + replacement + haystack.slice(idx + needle.length),
  };
}

function buildUnifiedUpdateDiff(beforeText, afterText) {
  const before = String(beforeText || '').replace(/\\r\\n/g, '\\n');
  const after = String(afterText || '').replace(/\\r\\n/g, '\\n');
  const beforeLines = before.length ? before.split('\\n') : [];
  const afterLines = after.length ? after.split('\\n') : [];
  const header = '@@ -1,' + beforeLines.length + ' +1,' + afterLines.length + ' @@';
  const minus = beforeLines.map((ln) => '-' + ln).join('\\n');
  const plus = afterLines.map((ln) => '+' + ln).join('\\n');
  if (minus && plus) return header + '\\n' + minus + '\\n' + plus;
  if (minus) return header + '\\n' + minus;
  if (plus) return header + '\\n' + plus;
  return header;
}

function normalizeSandboxFilePath(rawPath) {
  const value = String(rawPath || '').trim();
  if (!value) return '';
  if (value.startsWith('/vercel/sandbox')) return value;
  if (value.startsWith('/')) return value;
  return '/vercel/sandbox/' + value.replace(/^\/+/, '');
}

async function callRead(args) {
  const filePathRaw = typeof args?.file_path === 'string'
    ? args.file_path.trim()
    : (typeof args?.path === 'string' ? args.path.trim() : '');
  const filePath = normalizeSandboxFilePath(filePathRaw);
  if (!filePath) return { success: false, error: 'file_path é obrigatório para Read' };

  const offset = parsePositiveInt(args?.offset, 1);
  const limitRaw = parsePositiveInt(args?.limit, 0);
  const limit = limitRaw > 0 ? Math.min(limitRaw, 10000) : 0;

  const run = await callChatAction('fs-read', { path: filePath });
  if (!run || run.ok === false) {
    return {
      success: false,
      file_path: filePath,
      error: run?.error || 'falha ao ler arquivo',
    };
  }

  const rawContent = typeof run?.content === 'string' ? run.content : '';
  const isBinary = Boolean(run?.isBinary);
  if (isBinary) {
    return {
      success: true,
      file_path: String(run?.path || filePath),
      is_binary: true,
      content: rawContent,
      content_encoding: 'base64',
    };
  }

  const lines = rawContent.replace(/\\r\\n/g, '\\n').split('\\n');
  const totalLines = lines.length;
  const start = Math.max(1, offset);
  const end = limit > 0 ? Math.min(totalLines + 1, start + limit) : (totalLines + 1);
  const sliced = (start <= totalLines) ? lines.slice(start - 1, end - 1) : [];

  return {
    success: true,
    file_path: String(run?.path || filePath),
    is_binary: false,
    content: sliced.join('\\n'),
    offset: start,
    limit: limit || null,
    total_lines: totalLines,
    returned_lines: sliced.length,
  };
}

async function callEdit(args) {
  const filePathRaw = typeof args?.file_path === 'string'
    ? args.file_path.trim()
    : (typeof args?.path === 'string' ? args.path.trim() : '');
  const filePath = normalizeSandboxFilePath(filePathRaw);
  const oldString = typeof args?.old_string === 'string' ? args.old_string : '';
  const hasNewString = typeof args?.new_string === 'string';
  const newString = hasNewString ? args.new_string : '';
  const replaceAll = Boolean(args?.replace_all);

  if (!filePath) return { success: false, error: 'file_path é obrigatório para Edit' };
  if (!oldString) return { success: false, file_path: filePath, error: 'old_string é obrigatório para Edit' };
  if (!hasNewString) return { success: false, file_path: filePath, error: 'new_string deve ser string (pode ser vazio)' };
  if (oldString === newString) {
    return { success: false, file_path: filePath, error: 'new_string deve ser diferente de old_string' };
  }

  const read = await callChatAction('fs-read', { path: filePath });
  if (!read || read.ok === false) {
    return { success: false, file_path: filePath, error: read?.error || 'falha ao ler arquivo para Edit' };
  }
  if (read?.isBinary) {
    return { success: false, file_path: String(read?.path || filePath), error: 'Edit suporta apenas arquivos de texto' };
  }

  const current = typeof read?.content === 'string' ? read.content : '';
  const matches = countOccurrences(current, oldString);
  if (!matches) {
    return { success: false, file_path: String(read?.path || filePath), error: 'old_string não encontrado no arquivo' };
  }
  if (!replaceAll && matches > 1) {
    return {
      success: false,
      file_path: String(read?.path || filePath),
      error: 'old_string encontrado múltiplas vezes; use replace_all=true ou torne old_string mais específico',
      matches,
    };
  }

  let next = current;
  let replacements = 0;
  if (replaceAll) {
    next = current.split(oldString).join(newString);
    replacements = matches;
  } else {
    const changed = replaceFirst(current, oldString, newString);
    next = changed.value;
    replacements = changed.replaced ? 1 : 0;
  }
  if (next === current || replacements === 0) {
    return { success: false, file_path: String(read?.path || filePath), error: 'nenhuma alteração foi aplicada' };
  }

  const targetPath = String(read?.path || filePath);
  const diff = buildUnifiedUpdateDiff(current, next);
  const patch = await callChatAction('fs-apply-patch', {
    operation: {
      type: 'update_file',
      path: targetPath,
      diff,
    },
  });
  if (!patch || patch.ok === false) {
    return {
      success: false,
      file_path: targetPath,
      error: patch?.error || patch?.output || 'falha ao aplicar edição via fs-apply-patch',
    };
  }

  return {
    success: true,
    file_path: targetPath,
    replacements,
    status: String(patch?.status || 'completed'),
    output: String(patch?.output || 'Edição aplicada com sucesso.'),
  };
}

function supportsNativeShellTool(model) {
  const m = String(model || '').toLowerCase().trim();
  return m.startsWith('gpt-5.1') || m.startsWith('gpt-5.2');
}

function supportsNativeApplyPatchTool(model) {
  const m = String(model || '').toLowerCase().trim();
  if (!m) return false;
  return m.startsWith('gpt-') || m.startsWith('o1') || m.startsWith('o3') || m.startsWith('o4');
}

async function callShell(args) {
  const command = typeof args?.command === 'string' ? args.command : '';
  if (!command.trim()) return { success: false, error: 'command é obrigatório para shell tool' };
  const cwdRaw = typeof args?.cwd === 'string' ? args.cwd.trim() : '';
  const cwd = cwdRaw || '/vercel/sandbox';
  const run = await callChatAction('sandbox-shell', { command, cwd });
  if (!run || run.ok === false) {
    return { success: false, error: run?.error || 'falha ao executar shell' };
  }
  return {
    success: Boolean(run.success),
    exit_code: Number(run.exit_code ?? 1),
    stdout: String(run.stdout || ''),
    stderr: String(run.stderr || ''),
    cwd: String(run.cwd || cwd),
  };
}

async function callApplyPatch(args) {
  const operation = (args && typeof args === 'object' && args.operation)
    ? args.operation
    : args;
  if (!operation || typeof operation !== 'object') {
    return { success: false, status: 'failed', output: 'operation inválida para apply_patch' };
  }
  const run = await callChatAction('fs-apply-patch', { operation });
  if (!run || run.ok === false) {
    return {
      success: false,
      status: 'failed',
      output: String(run?.output || run?.error || 'falha ao aplicar patch'),
    };
  }
  return {
    success: Boolean(run.success),
    status: run.status || (run.success ? 'completed' : 'failed'),
    output: String(run.output || (run.success ? 'Patch aplicado com sucesso.' : 'Falha ao aplicar patch')),
  };
}

function normalizeToolCallItem(item) {
  if (!item || typeof item !== 'object') return null;
  const itemType = String(item.type || '');
  const callId = String(item.call_id || item.id || '');

  if (itemType === 'function_call' || itemType === 'tool_call') {
    const name = String(item.name || item.tool_name || '');
    if (!name) return null;
    const argsRaw = item.arguments ?? item.input ?? item.arguments_json ?? '{}';
    return {
      name,
      call_id: callId,
      call_type: 'function_call',
      arguments: typeof argsRaw === 'string' ? argsRaw : JSON.stringify(argsRaw || {}),
    };
  }

  if (itemType === 'shell_call') {
    const argsRaw = item.arguments ?? item.input ?? {
      command: item.command || '',
      cwd: item.cwd || '/vercel/sandbox',
    };
    return {
      name: 'shell',
      call_id: callId,
      call_type: 'shell_call',
      arguments: typeof argsRaw === 'string' ? argsRaw : JSON.stringify(argsRaw || {}),
    };
  }

  if (itemType === 'apply_patch_call') {
    const argsRaw = item.operation ?? item.input ?? {};
    return {
      name: 'apply_patch',
      call_id: callId,
      call_type: 'apply_patch_call',
      arguments: typeof argsRaw === 'string' ? argsRaw : JSON.stringify(argsRaw || {}),
    };
  }

  return null;
}

function extractToolCallsFromResponse(responsePayload, fallbackCalls) {
  const calls = [];
  const output = Array.isArray(responsePayload?.output) ? responsePayload.output : [];
  for (const item of output) {
    const normalized = normalizeToolCallItem(item);
    if (normalized) calls.push(normalized);
  }
  if (calls.length > 0) return calls;
  return Array.isArray(fallbackCalls) ? fallbackCalls : [];
}

function onEvent(eventName, dataRaw) {
  const data = String(dataRaw || '').trim();
  if (!data || data === '[DONE]') return;
  let ev = null;
  try { ev = JSON.parse(data); } catch { return; }
  if (!ev || typeof ev !== 'object') return;

  const type = String(ev.type || eventName || '');
  if (type === 'response.created') {
    responseId = ev?.response?.id || ev?.id || responseId;
    return;
  }
  if (type === 'response.output_text.delta') {
    appendAssistant(extractText(ev.delta) || extractText(ev?.output_text?.delta) || extractText(ev));
    return;
  }
  if (type === 'response.output_text.done') {
    const doneText = extractText(ev.text) || extractText(ev.output_text) || extractText(ev);
    if (doneText && doneText.startsWith(assistantText)) {
      const missing = doneText.slice(assistantText.length);
      if (missing) appendAssistant(missing);
    }
    return;
  }
  if (type === 'response.reasoning_summary_text.delta' || type === 'response.reasoning_text.delta') {
    appendReasoning(extractText(ev.delta) || extractText(ev.reasoning) || extractText(ev));
    return;
  }
  if (type === 'response.reasoning_summary_text.done' || type === 'response.reasoning_text.done') {
    const doneText = extractText(ev.text) || extractText(ev.reasoning_text) || extractText(ev);
    if (doneText && doneText.startsWith(reasoningText)) {
      const missing = doneText.slice(reasoningText.length);
      if (missing) appendReasoning(missing);
    }
    return;
  }
  if (type === 'error') {
    emit('error', { error: ev?.error?.message || ev?.message || 'stream error' });
    process.exit(4);
  }
  return ev;
}

const decoder = new TextDecoder();
const nativeShellEnabled = supportsNativeShellTool(modelId);
const nativeApplyPatchEnabled = supportsNativeApplyPatchTool(modelId);
let enableApplyPatch = nativeApplyPatchEnabled;
const baseTools = [
  {
    type: 'function',
    name: 'crud',
    description: 'Tool ERP para listar/criar/atualizar/deletar recursos canônicos. Use action="listar" com filtros em params/data para pedidos como pendentes/vencidas. Use somente resources ERP válidos e com hífen (nunca underscore).',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['listar', 'criar', 'atualizar', 'deletar'],
          description: 'Operação principal do ERP.'
        },
        resource: {
          type: 'string',
          description: 'Resource ERP canônico (exatos): financeiro/contas-financeiras, financeiro/categorias-despesa, financeiro/categorias-receita, financeiro/clientes, financeiro/centros-custo, financeiro/centros-lucro, vendas/pedidos, compras/pedidos, contas-a-pagar, contas-a-receber.'
        },
        params: {
          type: 'object',
          additionalProperties: true,
          description: 'Filtros/parâmetros de consulta (normalmente com action="listar").'
        },
        data: {
          type: 'object',
          additionalProperties: true,
          description: 'Payload para criar/atualizar/deletar quando necessário.'
        },
        actionSuffix: {
          type: 'string',
          description: 'Sufixo de rota opcional. Padrões: listar|criar|atualizar|deletar. Só use customizado se tiver certeza do endpoint.'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST'],
          description: 'Método HTTP opcional para bridge de rota.'
        },
      },
      required: ['action', 'resource'],
      additionalProperties: true,
    },
  },
  {
    type: 'function',
    name: 'workspace',
    description: 'Tool de workspace (email/drive). action="request" chama rotas permitidas de email/drive; action="read_file" lê arquivo do Drive por file_id. Casos comuns: listar inboxes, listar emails, ler email por id, baixar anexo, listar drive e pastas.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['request', 'read_file'],
          description: 'request: operações email/drive por resource. read_file: leitura de conteúdo de arquivo do Drive usando file_id.'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'DELETE'],
          description: 'Método HTTP para action=request.'
        },
        resource: {
          type: 'string',
          description: 'Resource permitido para action=request: email/inboxes, email/messages, email/messages/{id}, email/messages/{id}/attachments/{attachmentId}, drive, drive/folders, drive/folders/{id}, drive/files/{id}, drive/files/{id}/download, drive/files/prepare-upload, drive/files/complete-upload.'
        },
        params: {
          type: 'object',
          additionalProperties: true,
          description: 'Query params para action=request. Em email/messages (lista) e email/messages/{id}, normalmente incluir inboxId.'
        },
        data: {
          type: 'object',
          additionalProperties: true,
          description: 'Body para action=request quando method for POST/DELETE.'
        },
        file_id: {
          type: 'string',
          description: 'UUID do arquivo no Drive para action=read_file.'
        },
        mode: {
          type: 'string',
          enum: ['auto', 'text', 'binary'],
          description: 'Modo de leitura em action=read_file.'
        },
      },
      required: ['action'],
      additionalProperties: true,
    },
  },
  {
    type: 'function',
    name: 'Read',
    description: 'Lê arquivo na sandbox do chat (padrão Claude SDK).',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Caminho absoluto em /vercel/sandbox ou relativo ao workspace.',
        },
        offset: {
          type: 'integer',
          description: 'Linha inicial (1-based). Opcional.',
        },
        limit: {
          type: 'integer',
          description: 'Quantidade de linhas a retornar. Opcional.',
        },
      },
      required: ['file_path'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'Edit',
    description: 'Substitui texto exato em arquivo (padrão Claude SDK), aplicando gravação via fs-apply-patch.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Caminho absoluto em /vercel/sandbox ou relativo ao workspace.',
        },
        old_string: {
          type: 'string',
          description: 'Trecho exato a ser substituído.',
        },
        new_string: {
          type: 'string',
          description: 'Novo trecho (deve ser diferente de old_string).',
        },
        replace_all: {
          type: 'boolean',
          description: 'Quando true, substitui todas as ocorrências. Padrão: false.',
        },
      },
      required: ['file_path', 'old_string', 'new_string'],
      additionalProperties: false,
    },
  },
  ...(nativeShellEnabled
    ? [{ type: 'shell' }]
    : [{
        type: 'function',
        name: 'shell',
        description: 'Executa comandos no sandbox do chat. Use somente caminhos dentro de /vercel/sandbox.',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Comando bash a executar.'
            },
            cwd: {
              type: 'string',
              description: 'Diretório de trabalho (padrão: /vercel/sandbox).'
            },
          },
          required: ['command'],
          additionalProperties: false,
        },
      }]),
];

let previousResponseId = null;
let nextInput = prompt;
let turn = 0;
let done = false;

while (!done && turn < 10) {
  turn += 1;
  const tools = enableApplyPatch ? [...baseTools, { type: 'apply_patch' }] : baseTools;
  const requestBody = {
    model: modelId,
    input: nextInput,
    stream: true,
    reasoning: { effort: 'medium', summary: 'concise' },
    tools,
    previous_response_id: previousResponseId || undefined,
  };

  const turnRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!turnRes.ok || !turnRes.body) {
    const text = await turnRes.text().catch(() => '');
    if (enableApplyPatch && /apply_patch/i.test(text) && /invalid|unsupported|unknown|not supported|tool/i.test(text)) {
      enableApplyPatch = false;
      continue;
    }
    emit('error', { error: 'Responses API ' + turnRes.status + ': ' + text.slice(0, 1200) });
    process.exit(3);
  }

  let buffer = '';
  let completedResponse = null;
  const fallbackToolCalls = [];

  function parseFrameTurn(frame) {
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
    const raw = dataLines.join('\\n');
    const ev = onEvent(eventName, raw);
    if (!ev || typeof ev !== 'object') return;
    const type = String(ev.type || eventName || '');
    if (type === 'response.created') {
      responseId = ev?.response?.id || ev?.id || responseId;
      return;
    }
    if (type === 'response.completed') {
      completedResponse = ev?.response || ev || null;
      responseId = ev?.response?.id || ev?.id || responseId;
      return;
    }
    if (type === 'response.output_item.done') {
      const item = ev?.item;
      const normalized = normalizeToolCallItem(item);
      if (normalized) fallbackToolCalls.push(normalized);
      return;
    }
  }

  for await (const chunk of turnRes.body) {
    buffer += decoder.decode(chunk, { stream: true }).replace(/\\r/g, '');
    let idx = -1;
    while ((idx = buffer.indexOf('\\n\\n')) >= 0) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      if (!frame.trim()) continue;
      parseFrameTurn(frame);
    }
  }
  buffer += decoder.decode().replace(/\\r/g, '');
  if (buffer.trim()) parseFrameTurn(buffer);

  previousResponseId = responseId || completedResponse?.id || previousResponseId;
  const toolCalls = extractToolCallsFromResponse(completedResponse, fallbackToolCalls);
  if (!toolCalls.length) {
    done = true;
    break;
  }

  const outputs = [];
  let callIdx = 0;
  for (const toolCall of toolCalls) {
    const index = callIdx++;
    const toolName = String(toolCall?.name || '');
    const callType = String(toolCall?.call_type || 'function_call');
    const rawArgs = typeof toolCall?.arguments === 'string' ? toolCall.arguments : JSON.stringify(toolCall?.arguments || {});
    const parsedArgs = parseJsonMaybe(rawArgs);
    const callId = String(toolCall?.call_id || ('call-' + index + '-' + Date.now()));
    emit('tool_input_start', { index, name: toolName, call_id: callId });
    if (rawArgs) emit('tool_input_delta', { index, partial: rawArgs });
    emit('tool_input_done', { index, name: toolName, call_id: callId, input: parsedArgs, raw: rawArgs });
    try {
      let result = null;
      if (toolName === 'crud') {
        result = await callCrud(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'workspace') {
        result = await callWorkspace(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'Read' || toolName === 'read') {
        result = await callRead(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'Edit' || toolName === 'edit') {
        result = await callEdit(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'shell') {
        result = await callShell(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'apply_patch') {
        result = await callApplyPatch(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else {
        result = { success: false, error: 'tool desconhecida: ' + toolName };
      }
      emit('tool_done', { index, call_id: callId, tool_name: toolName, output: result });
      if (callType === 'shell_call') {
        const success = Boolean(result?.success);
        const stdout = typeof result?.stdout === 'string' ? result.stdout : '';
        const stderr = typeof result?.stderr === 'string' ? result.stderr : '';
        const outputText = stdout || (success ? '' : stderr || String(result?.error || 'falha no shell'));
        outputs.push({
          type: 'shell_call_output',
          call_id: callId,
          status: success ? 'completed' : 'failed',
          output: outputText,
        });
      } else if (callType === 'apply_patch_call') {
        const ok = Boolean(result?.success);
        outputs.push({
          type: 'apply_patch_call_output',
          call_id: callId,
          status: ok ? 'completed' : 'failed',
          output: String(result?.output || (ok ? 'Patch aplicado.' : 'Falha ao aplicar patch.')),
        });
      } else {
        outputs.push({ type: 'function_call_output', call_id: callId, output: JSON.stringify(result ?? {}) });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      emit('tool_error', { index, call_id: callId, tool_name: toolName, error: msg });
      if (callType === 'shell_call') {
        outputs.push({
          type: 'shell_call_output',
          call_id: callId,
          status: 'failed',
          output: msg,
        });
      } else if (callType === 'apply_patch_call') {
        outputs.push({
          type: 'apply_patch_call_output',
          call_id: callId,
          status: 'failed',
          output: msg,
        });
      } else {
        outputs.push({ type: 'function_call_output', call_id: callId, output: JSON.stringify({ success: false, error: msg }) });
      }
    }
  }

  nextInput = outputs;
}

if (reasoningStarted) emit('reasoning_end', {});
emit('final', { text: assistantText, responseId });
`.trim();
}
