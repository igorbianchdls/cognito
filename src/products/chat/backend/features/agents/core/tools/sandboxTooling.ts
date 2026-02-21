import { Sandbox } from '@vercel/sandbox'

type TimelineEntry = {
  name: string
  ms: number
  ok: boolean
  exitCode?: number
}

const APP_TOOLS_SKILL_MD = `---
name: App MCP Tools
description: Uso das tools genéricas via MCP (listar, criar, atualizar, deletar).
---

As tools disponíveis (apenas via MCP):
- listar(input: { resource: string, params?: object, actionSuffix?: string, method?: "GET"|"POST" })
- criar(input: { resource: string, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
- atualizar(input: { resource: string, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
- deletar(input: { resource: string, data?: object, actionSuffix?: string, method?: "GET"|"POST" })
- documento(input: { action: "gerar"|"status", tipo?: "proposta"|"os"|"fatura"|"contrato"|"nfse", origem_tipo?: string, origem_id?: number, dados?: object, documento_id?: number, template_id?: number, template_version_id?: number, idempotency_key?: string })

RECURSOS (resource) SUPORTADOS (use exatamente estes caminhos; não invente nomes):
- financeiro/contas-financeiras
- financeiro/categorias-despesa
- financeiro/categorias-receita
- financeiro/clientes
- financeiro/centros-custo
- financeiro/centros-lucro
- vendas/pedidos
- compras/pedidos
- contas-a-pagar
- contas-a-receber
- crm/contas
- crm/contatos
- crm/leads
- crm/oportunidades
- crm/atividades
- estoque/almoxarifados
- estoque/movimentacoes
- estoque/estoque-atual (somente listar)
- estoque/tipos-movimentacao (somente listar)

Regras:
- NUNCA use termos genéricos como "categoria" ou "despesa". Use os caminhos exatos, por exemplo "financeiro/categorias-despesa".
- Prefixe corretamente com o módulo (ex.: "financeiro/...").
- O "resource" não pode conter ".." e deve iniciar com um dos prefixos: financeiro, vendas, compras, contas-a-pagar, contas-a-receber, crm, estoque, cadastros.
- Contexto operacional padrão: B2B serviços como núcleo. Estoque é domínio separado e não deve ser acoplado automaticamente em todo fluxo comercial.
- Por padrão, listar usa actionSuffix="listar" e criar/atualizar/deletar usam seus sufixos homônimos.
- Para proposta/OS/NFSe/fatura/contrato, use a tool documento (action gerar/status), não CRUD de documentos.

Exemplos:
- Listar contas financeiras:
  { "tool": "listar", "args": { "resource": "financeiro/contas-financeiras", "params": { "limit": 50 } } }
- Listar categorias de despesa (não use "categoria" sozinho):
  { "tool": "listar", "args": { "resource": "financeiro/categorias-despesa", "params": { "q": "marketing" } } }
- Criar centro de custo:
  { "tool": "criar", "args": { "resource": "financeiro/centros-custo", "data": { "nome": "Marketing", "codigo": "CC-001" } } }
- Atualizar centro de custo:
  { "tool": "atualizar", "args": { "resource": "financeiro/centros-custo", "data": { "id": 123, "nome": "Marketing & Growth" } } }
- Deletar centro de custo:
  { "tool": "deletar", "args": { "resource": "financeiro/centros-custo", "data": { "id": 123 } } }

As chamadas são roteadas para /api/agent-tools/<resource>/<acao> usando as variáveis:
- $AGENT_BASE_URL
- $AGENT_TOOL_TOKEN
- $AGENT_CHAT_ID
`

const COMPOSIO_MCP_SCRIPT = `import { Composio } from '@composio/core';
import { ClaudeAgentSDKProvider } from '@composio/claude-agent-sdk';
import { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
let server = null;
try {
  const apiKey = process.env.COMPOSIO_API_KEY || '';
  const provider = new ClaudeAgentSDKProvider();
  const composio = new Composio({ apiKey, provider });
  const externalUserId = process.env.COMPOSIO_USER_ID || process.env.AGENT_CHAT_ID || ('composio-' + Date.now());
  const session = await composio.create(String(externalUserId), {
    toolkits: ['gmail'],
    tools: { gmail: ['GMAIL_FETCH_EMAILS'] },
    tags: ['readOnlyHint']
  });
  const tools = await session.tools();
  server = createSdkMcpServer({ name: 'composio', version: '1.0.0', tools });
} catch (e) {
  server = createSdkMcpServer({ name: 'composio', version: '1.0.0', tools: [] });
}
export const composioServer = server;
export default composioServer;
`

const ERP_MCP_SCRIPT = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

const SAFE_PREFIXES = ['financeiro', 'vendas', 'compras', 'contas-a-pagar', 'contas-a-receber', 'crm', 'estoque', 'cadastros'];
function isSafeResource(res){ try { if (!res || typeof res !== 'string') return false; if (res.includes('..')) return false; const clean = res.replace(/^\\/+|\\/+$/g,''); return SAFE_PREFIXES.some(p=> clean === p || clean.startsWith(p + '/')); } catch { return false } }
function buildUrl(base, res, suffix){ const cleanRes = String(res || '').replace(/^\\/+|\\/+$/g,''); const cleanSuf = String(suffix || '').replace(/^\\/+|\\/+$/g,''); return (base || '') + '/api/agent-tools/' + cleanRes + '/' + cleanSuf; }

async function callBridge({ action, args }){
  const base = process.env.AGENT_BASE_URL || '';
  const token = process.env.AGENT_TOOL_TOKEN || '';
  const chatId = process.env.AGENT_CHAT_ID || '';
  if (!base || !token || !chatId) {
    return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'configuração ausente', action }) }] };
  }
  const resPath = (args && (args.resource || args.path || args.endpoint)) || '';
  if (!isSafeResource(resPath)) {
    return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'recurso não permitido', resource: String(resPath) }) }] };
  }
  const method = (args && args.method && typeof args.method === 'string' ? args.method.toUpperCase() : 'POST');
  const headers = { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId, 'x-tenant-id': (process.env.AGENT_TENANT_ID || '1') };
  const doFetch = async (suffix, bodyObj) => {
    const url = buildUrl(base, resPath, suffix);
    const init = method === 'GET' ? { method, headers } : { method, headers, body: JSON.stringify(bodyObj || {}) };
    const res = await fetch(url, init);
    let raw = '';
    try { raw = await res.text(); } catch {}
    let data = {};
    try { data = JSON.parse(raw); } catch {}
    const out = (data && (data.result !== undefined ? data.result : data)) || {};
    return { ok: res.ok, out, status: res.status, rawText: raw, statusText: (res.statusText || '') };
  };

  try {
    if (action === 'listar') {
      const suffix = (args && args.actionSuffix) || 'listar';
      const { ok, out, status, rawText, statusText } = await doFetch(suffix, (args && args.params) || {});
      const payload = ok ? out : { success:false, error: (out?.error || out?.message || rawText || statusText || 'erro ao listar'), status };
      return { content: [ { type: 'text', text: JSON.stringify(payload) } ] };
    } else if (action === 'criar') {
      const suffix = (args && args.actionSuffix) || 'criar';
      const { ok, out, status, rawText, statusText } = await doFetch(suffix, (args && args.data) || {});
      const payload = ok ? out : { success:false, error: (out?.error || out?.message || rawText || statusText || 'erro ao criar'), status };
      return { content: [ { type: 'text', text: JSON.stringify(payload) } ] };
    } else if (action === 'atualizar') {
      const suffixes = (args && args.actionSuffix) ? [String(args.actionSuffix)] : ['atualizar','editar','update','edit'];
      const payloadIn = (args && args.data) || {};
      for (const suf of suffixes) {
        const { ok, out } = await doFetch(suf, payloadIn);
        if (ok) return { content: [ { type: 'text', text: JSON.stringify(out) } ] };
      }
      return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'falha ao atualizar' }) }] };
    } else if (action === 'deletar') {
      const suffixes = (args && args.actionSuffix) ? [String(args.actionSuffix)] : ['deletar','delete'];
      const payloadIn = (args && args.data) || {};
      for (const suf of suffixes) {
        const { ok, out, status, rawText, statusText } = await doFetch(suf, payloadIn);
        if (ok) return { content: [ { type: 'text', text: JSON.stringify(out) } ] };
        const payloadErr = { success:false, error: (out?.error || out?.message || rawText || statusText || 'falha ao deletar'), status };
        return { content: [ { type: 'text', text: JSON.stringify(payloadErr) } ] };
      }
      return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'falha ao deletar' }) }] };
    }
    return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'ação desconhecida', action }) }] };
  } catch(e) {
    return { content: [{ type: 'text', text: JSON.stringify({ success:false, error: String(e?.message || e) }) }] };
  }
}

async function callScopedTool(path,args,label){
  const base = process.env.AGENT_BASE_URL || '';
  const token = process.env.AGENT_TOOL_TOKEN || '';
  const chatId = process.env.AGENT_CHAT_ID || '';
  if (!base || !token || !chatId) {
    return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'configuração ausente', tool:label }) }] };
  }
  try {
    const url = (base || '') + path;
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId, 'x-tenant-id': (process.env.AGENT_TENANT_ID || '1') }, body: JSON.stringify(args || {}) });
    let raw = '';
    try { raw = await res.text(); } catch {}
    let data = {};
    try { data = JSON.parse(raw); } catch {}
    const out = (data && (data.result !== undefined ? data.result : data)) || {};
    if (!res.ok) {
      const err = { success:false, status:res.status, error:(out?.error || out?.message || raw || res.statusText || (label + ' error')) };
      return { content: [{ type:'text', text: JSON.stringify(err) }] };
    }
    return { content: [{ type:'text', text: JSON.stringify(out) }] };
  } catch(e) {
    return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:String(e?.message || e) }) }] };
  }
}
async function callDrive(args){ return callScopedTool('/api/agent-tools/drive', args, 'drive'); }
async function callEmail(args){ return callScopedTool('/api/agent-tools/email', args, 'email'); }
async function callDocumento(args){ return callScopedTool('/api/agent-tools/documento', args, 'documento'); }

export const mcpERPServer = createSdkMcpServer({
  name: 'ERP',
  version: '1.0.0',
  tools: [
    tool('crud','Executa ações CRUD genéricas', {
      action: z.enum(['listar','criar','atualizar','deletar']),
      resource: z.string().optional(),
      path: z.string().optional(),
      params: z.any().optional(),
      data: z.any().optional(),
      actionSuffix: z.string().optional(),
      method: z.enum(['GET','POST']).optional(),
    }, async (args) => callBridge({ action: args.action, args })),
    tool('documento','Gera e consulta documentos operacionais (OS/proposta/NFSe/fatura/contrato)', {
      action: z.enum(['gerar','status']),
      tipo: z.enum(['proposta','os','fatura','contrato','nfse']).optional(),
      origem_tipo: z.string().optional(),
      origem_id: z.number().int().optional(),
      titulo: z.string().optional(),
      dados: z.any().optional(),
      template_id: z.number().int().optional(),
      template_version_id: z.number().int().optional(),
      idempotency_key: z.string().optional(),
      documento_id: z.number().int().optional(),
      tenant_id: z.number().int().optional(),
    }, async (args) => callDocumento(args)),
    tool('drive','Acessa operações de Drive', {
      action: z.enum(['request','read_file','get_file_url','get_drive_file_url']).default('request'),
      method: z.enum(['GET','POST','DELETE']).optional(),
      resource: z.string().optional(),
      params: z.any().optional(),
      data: z.any().optional(),
      file_id: z.string().optional(),
      mode: z.enum(['auto','text','binary']).optional(),
    }, async (args) => callDrive(args)),
    tool('email','Acessa operações de Email', {
      action: z.enum(['request','send','send_email']).default('request'),
      method: z.enum(['GET','POST','DELETE']).optional(),
      resource: z.string().optional(),
      params: z.any().optional(),
      data: z.any().optional(),
      inbox_id: z.string().optional(),
      inboxId: z.string().optional(),
      to: z.any().optional(),
      cc: z.any().optional(),
      bcc: z.any().optional(),
      labels: z.any().optional(),
      subject: z.string().optional(),
      text: z.string().optional(),
      html: z.string().optional(),
      attachments: z.any().optional(),
      attachment_url: z.string().optional(),
      signed_url: z.string().optional(),
      filename: z.string().optional(),
      content_type: z.string().optional(),
      content_disposition: z.string().optional(),
      content_id: z.string().optional(),
    }, async (args) => callEmail(args)),
  ]
});
export default mcpERPServer;
`

export async function seedAppToolsSkillInSandbox(sandbox: Sandbox, timeline?: TimelineEntry[]) {
  const t0 = Date.now()
  const mkdir = await sandbox.runCommand({
    cmd: 'node',
    args: ['-e', "require('fs').mkdirSync('/vercel/sandbox/.claude/skills/Tools', { recursive: true });"],
  })
  timeline?.push({ name: 'mkdir-skills-tools', ms: Date.now() - t0, ok: mkdir.exitCode === 0, exitCode: mkdir.exitCode })
  if (mkdir.exitCode !== 0) return
  await sandbox.writeFiles([
    {
      path: '/vercel/sandbox/.claude/skills/Tools/SKILL.md',
      content: Buffer.from(APP_TOOLS_SKILL_MD),
    },
  ])
}

export async function seedMcpServersInSandbox(sandbox: Sandbox) {
  await sandbox.runCommand({
    cmd: 'node',
    args: ['-e', "require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });"],
  })
  await sandbox.writeFiles([
    { path: '/vercel/sandbox/.mcp/composio.mjs', content: Buffer.from(COMPOSIO_MCP_SCRIPT) },
    { path: '/vercel/sandbox/.mcp/ERP.mjs', content: Buffer.from(ERP_MCP_SCRIPT) },
  ])
}
