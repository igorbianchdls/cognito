export const CODEX_APP_TOOL_HANDLERS_SCRIPT = `
function buildAgentToolsUrl(resource, suffix) {
  const cleanRes = String(resource || '').replace(/^\\/+|\\/+$/g, '');
  const cleanSuf = String(suffix || '').replace(/^\\/+|\\/+$/g, '');
  return (baseAppUrl || '') + '/api/agent-tools/' + cleanRes + '/' + cleanSuf;
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
    else if (action === 'cancelar') suffix = 'cancelar';
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
  const outWithMeta = (
    data &&
    data.result !== undefined &&
    out &&
    typeof out === 'object' &&
    !Array.isArray(out)
  )
    ? { ...out, ...(data?.meta !== undefined && out?.meta === undefined ? { meta: data.meta } : {}) }
    : out;
  if (!resTool.ok) {
    return {
      success: false,
      status: resTool.status,
      error: out?.error || out?.message || raw || resTool.statusText || 'erro na tool crud',
      ...(out?.code ? { code: out.code } : {}),
      ...(out?.meta ? { meta: out.meta } : { meta: { tool: 'crud', status: resTool.status } }),
    };
  }
  return outWithMeta;
}

async function callScopedTool(path, args, label) {
  if (!baseAppUrl || !toolToken || !chatId) {
    return { success: false, error: 'configuração ausente para tool ' + label + ' (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)' };
  }
  const urlTool = (baseAppUrl || '').replace(/\\/+$/, '') + path;
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
  const outWithMeta = (
    data &&
    data.result !== undefined &&
    out &&
    typeof out === 'object' &&
    !Array.isArray(out)
  )
    ? { ...out, ...(data?.meta !== undefined && out?.meta === undefined ? { meta: data.meta } : {}) }
    : out;
  if (!resTool.ok) {
    return {
      success: false,
      status: resTool.status,
      error: out?.error || out?.message || raw || resTool.statusText || ('erro na tool ' + label),
      ...(out?.code ? { code: out.code } : {}),
      ...(out?.meta ? { meta: out.meta } : { meta: { tool: label, status: resTool.status } }),
    };
  }
  return outWithMeta;
}

async function callDrive(args) {
  return callScopedTool('/api/agent-tools/drive', args, 'drive');
}

async function callEmail(args) {
  return callScopedTool('/api/agent-tools/email', args, 'email');
}

async function callDocumento(args) {
  return callScopedTool('/api/agent-tools/documento', args, 'documento');
}
`.trim()
