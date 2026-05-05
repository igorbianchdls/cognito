export const AGENTSDK_ERP_MCP_HANDLERS_SCRIPT = `const SAFE_PREFIXES = ['financeiro', 'vendas', 'compras', 'contas-a-pagar', 'contas-a-receber', 'crm', 'estoque', 'cadastros'];
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
    } else if (
      action === 'cancelar' ||
      action === 'baixar' ||
      action === 'estornar' ||
      action === 'reabrir' ||
      action === 'aprovar' ||
      action === 'concluir' ||
      action === 'marcar_como_recebido' ||
      action === 'marcar_recebimento_parcial'
    ) {
      const suffixes = (args && args.actionSuffix)
        ? [String(args.actionSuffix)]
        : (
          action === 'cancelar'
            ? ['cancelar', 'atualizar']
            : [String(action), 'atualizar']
        );
      const payloadIn = (args && args.data) || {};
      for (const suf of suffixes) {
        const body = suf === 'atualizar'
          ? {
              ...payloadIn,
              ...(payloadIn && payloadIn.status !== undefined
                ? {}
                : {
                    status:
                      action === 'cancelar' ? 'cancelado'
                      : action === 'aprovar' ? 'aprovado'
                      : action === 'concluir' ? 'concluido'
                      : action === 'marcar_como_recebido' ? 'recebido'
                      : action === 'marcar_recebimento_parcial' ? 'recebimento_parcial'
                      : undefined,
                  }),
            }
          : payloadIn;
        const { ok, out, status, rawText, statusText } = await doFetch(suf, body);
        if (ok) return { content: [ { type: 'text', text: JSON.stringify(out) } ] };
        const payloadErr = { success:false, error: (out?.error || out?.message || rawText || statusText || ('falha ao ' + action)), status, ...(out?.code ? { code: out.code } : {}), ...(out?.meta ? { meta: out.meta } : { meta: { tool:'crud', status } }) };
        return { content: [ { type: 'text', text: JSON.stringify(payloadErr) } ] };
      }
      return { content: [{ type: 'text', text: JSON.stringify({ success:false, error: ('falha ao ' + action) }) }] };
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
async function callArtifactRead(args){ return callScopedTool('/api/agent-tools/artifact-read', args, 'artifact_read'); }
async function callArtifactWrite(args){ return callScopedTool('/api/agent-tools/artifact-write', args, 'artifact_write'); }
async function callArtifactPatch(args){ return callScopedTool('/api/agent-tools/artifact-patch', args, 'artifact_patch'); }
async function callSqlExecution(args){ return callScopedTool('/api/agent-tools/sql-execution', args, 'sql_execution'); }
async function callEcommerce(args){ return callScopedTool('/api/agent-tools/ecommerce', args, 'ecommerce'); }
async function callMarketing(args){ return callScopedTool('/api/agent-tools/marketing', args, 'marketing'); }
`;
