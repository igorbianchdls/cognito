export const ERP_MCP_SCRIPT = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
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
    const outWithMeta = (data && data.result !== undefined && out && typeof out === 'object' && !Array.isArray(out))
      ? { ...out, ...(data?.meta !== undefined && out?.meta === undefined ? { meta: data.meta } : {}) }
      : out;
    return { ok: res.ok, out: outWithMeta, status: res.status, rawText: raw, statusText: (res.statusText || '') };
  };

  try {
    if (action === 'listar') {
      const suffix = (args && args.actionSuffix) || 'listar';
      const { ok, out, status, rawText, statusText } = await doFetch(suffix, (args && args.params) || {});
      const payload = ok ? out : { success:false, error: (out?.error || out?.message || rawText || statusText || 'erro ao listar'), status, ...(out?.code ? { code: out.code } : {}), ...(out?.meta ? { meta: out.meta } : { meta: { tool:'crud', status } }) };
      return { content: [ { type: 'text', text: JSON.stringify(payload) } ] };
    } else if (action === 'criar') {
      const suffix = (args && args.actionSuffix) || 'criar';
      const { ok, out, status, rawText, statusText } = await doFetch(suffix, (args && args.data) || {});
      const payload = ok ? out : { success:false, error: (out?.error || out?.message || rawText || statusText || 'erro ao criar'), status, ...(out?.code ? { code: out.code } : {}), ...(out?.meta ? { meta: out.meta } : { meta: { tool:'crud', status } }) };
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
        const payloadErr = { success:false, error: (out?.error || out?.message || rawText || statusText || 'falha ao deletar'), status, ...(out?.code ? { code: out.code } : {}), ...(out?.meta ? { meta: out.meta } : { meta: { tool:'crud', status } }) };
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
    const outWithMeta = (data && data.result !== undefined && out && typeof out === 'object' && !Array.isArray(out))
      ? { ...out, ...(data?.meta !== undefined && out?.meta === undefined ? { meta: data.meta } : {}) }
      : out;
    if (!res.ok) {
      const err = { success:false, status:res.status, error:(out?.error || out?.message || raw || res.statusText || (label + ' error')), ...(out?.code ? { code: out.code } : {}), ...(out?.meta ? { meta: out.meta } : { meta: { tool: label, status: res.status } }) };
      return { content: [{ type:'text', text: JSON.stringify(err) }] };
    }
    return { content: [{ type:'text', text: JSON.stringify(outWithMeta) }] };
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
    tool('crud','Tool ERP canônica para listar/criar/atualizar/deletar recursos de negócio. Use somente resource canônico (com hífen, nunca underscore). Resources suportados: financeiro/contas-financeiras, financeiro/categorias-despesa, financeiro/categorias-receita, financeiro/clientes, financeiro/centros-custo, financeiro/centros-lucro, vendas/pedidos, compras/pedidos, contas-a-pagar, contas-a-receber, crm/contas, crm/contatos, crm/leads, crm/oportunidades, crm/atividades, estoque/almoxarifados, estoque/movimentacoes, estoque/estoque-atual, estoque/tipos-movimentacao. Para consultas, prefira action=\"listar\" com filtros em params (e data quando necessário).', {
      action: z.enum(['listar','criar','atualizar','deletar']),
      resource: z.string().optional(),
      path: z.string().optional(),
      params: z.any().optional(),
      data: z.any().optional(),
      actionSuffix: z.string().optional(),
      method: z.enum(['GET','POST']).optional(),
    }, async (args) => callBridge({ action: args.action, args })),
    tool('documento','Gera e consulta documentos operacionais (OS/proposta/NFSe/fatura/contrato), retornando PDF. Com save_to_drive=true, tenta salvar no Drive e retornar metadados do arquivo; sem isso, retorna o PDF inline.', {
      action: z.enum(['gerar','status']),
      tipo: z.enum(['proposta','os','fatura','contrato','nfse']).optional(),
      origem_tipo: z.string().optional(),
      origem_id: z.number().int().optional(),
      titulo: z.string().optional(),
      dados: z.any().optional(),
      save_to_drive: z.boolean().optional(),
      drive: z.object({
        workspace_id: z.string().optional(),
        folder_id: z.string().optional(),
        file_name: z.string().optional(),
      }).optional(),
      template_id: z.number().int().optional(),
      template_version_id: z.number().int().optional(),
      idempotency_key: z.string().optional(),
      documento_id: z.number().int().optional(),
      tenant_id: z.number().int().optional(),
    }, async (args) => callDocumento(args)),
    tool('drive','Tool de Drive para listar/gerenciar arquivos e pastas, obter URL assinada, ler conteúdo e fazer upload. Prefira resource=\"drive/files/upload-base64\" quando já tiver conteúdo em base64 (ex.: saída de documento); use prepare-upload/complete-upload para fluxos binários/externos.', {
      action: z.enum(['request','read_file','get_file_url','get_drive_file_url']).default('request'),
      method: z.enum(['GET','POST','DELETE']).optional(),
      resource: z.string().optional(),
      params: z.any().optional(),
      data: z.any().optional(),
      file_id: z.string().optional(),
      workspace_id: z.string().optional(),
      folder_id: z.string().optional(),
      file_name: z.string().optional(),
      mime: z.string().optional(),
      content_base64: z.string().optional(),
      storage_path: z.string().optional(),
      mode: z.enum(['auto','text','binary']).optional(),
    }, async (args) => callDrive(args)),
    tool('email','Tool de Email para consultar inbox/messages e enviar emails. Prefira anexar por drive_file_id/drive_file_ids (backend resolve URL assinada); use URL/base64 (attachments/attachment_url) como fallback.', {
      action: z.enum(['request','send','send_email']).default('request'),
      method: z.enum(['GET','POST','DELETE']).optional(),
      resource: z.string().optional(),
      params: z.any().optional(),
      data: z.any().optional(),
      inbox_id: z.string().optional(),
      inboxId: z.string().optional(),
      to: z.union([z.string(), z.array(z.string())]).optional(),
      cc: z.union([z.string(), z.array(z.string())]).optional(),
      bcc: z.union([z.string(), z.array(z.string())]).optional(),
      labels: z.any().optional(),
      subject: z.string().optional(),
      text: z.string().optional(),
      html: z.string().optional(),
      attachments: z.any().optional(),
      drive_file_id: z.string().optional(),
      drive_file_ids: z.array(z.string()).optional(),
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
