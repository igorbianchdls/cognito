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
const SAFE_PREFIXES = ['financeiro', 'vendas', 'compras', 'contas-a-pagar', 'contas-a-receber', 'crm', 'estoque', 'cadastros', 'documentos'];

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
  if (!resTool.ok) {
    return { success: false, status: resTool.status, error: out?.error || out?.message || raw || resTool.statusText || ('erro na tool ' + label) };
  }
  return out;
}

async function callDrive(args) {
  return callScopedTool('/api/agent-tools/drive', args, 'drive');
}

async function callEmail(args) {
  return callScopedTool('/api/agent-tools/email', args, 'email');
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

function isSandboxAbsolutePath(filePath) {
  const p = String(filePath || '').trim();
  if (!p) return false;
  if (!p.startsWith('/vercel/sandbox')) return false;
  if (p.includes('..')) return false;
  return true;
}

const SKILL_ROOTS = ['/vercel/sandbox/agent/skills', '/vercel/sandbox/agents/skills'];

function isSkillAbsolutePath(filePath) {
  const p = String(filePath || '').trim();
  if (!isSandboxAbsolutePath(p)) return false;
  for (const root of SKILL_ROOTS) {
    if (p === root || p.startsWith(root + '/')) return true;
  }
  return false;
}

function normalizeSkillRelativePath(value) {
  let v = String(value || '').trim();
  if (!v) return '';
  if (v.includes('..')) return '';
  while (v.startsWith('/')) v = v.slice(1);
  return v;
}

function isMissingPathError(err) {
  const e = String(err || '').toLowerCase();
  return e.includes('enoent')
    || e.includes('no such file')
    || e.includes('not found')
    || e.includes('arquivo não encontrado')
    || e.includes('nao encontrado')
    || e.includes('não existe')
    || e.includes('nao existe');
}

async function callSkill(args) {
  const action = String(
    args?.action
      || ((args?.path || args?.file_path || args?.skill_name) ? 'read' : 'list')
  ).toLowerCase().trim();

  if (action === 'list') {
    const roots = [];
    const collected = [];
    for (const root of SKILL_ROOTS) {
      const run = await callChatAction('fs-list', { path: root });
      if (run && run.ok === true && Array.isArray(run.entries)) {
        roots.push({ path: root, ok: true, entries: run.entries.length });
        for (const entry of run.entries) {
          if (!entry || typeof entry !== 'object') continue;
          if (String(entry.type || '') !== 'file') continue;
          const name = String(entry.name || '');
          const path = String(entry.path || '');
          if (!name || !path) continue;
          collected.push({ name, path });
        }
      } else {
        roots.push({ path: root, ok: false, error: String(run?.error || 'pasta de skills indisponível') });
      }
    }
    const unique = new Map();
    for (const file of collected) {
      if (!unique.has(file.path)) unique.set(file.path, file);
    }
    const files = Array.from(unique.values()).sort((a, b) => a.path.localeCompare(b.path));
    return { success: true, action: 'list', roots, files, count: files.length };
  }

  if (action !== 'read') {
    return { success: false, error: 'action inválida para Skill. Use list ou read.' };
  }

  const offset = parsePositiveInt(args?.offset, 1);
  const limitRaw = parsePositiveInt(args?.limit, 0);
  const limit = limitRaw > 0 ? Math.min(limitRaw, 10000) : 0;

  const candidates = [];
  const rawPath = typeof args?.file_path === 'string'
    ? args.file_path
    : (typeof args?.path === 'string' ? args.path : '');

  if (rawPath && rawPath.trim()) {
    const given = rawPath.trim();
    if (given.startsWith('/')) {
      if (!isSkillAbsolutePath(given)) {
        return {
          success: false,
          error: 'file_path fora da pasta de skills. Use /vercel/sandbox/agent/skills/... ou /vercel/sandbox/agents/skills/...',
          file_path: given,
        };
      }
      candidates.push(given);
    } else {
      const rel = normalizeSkillRelativePath(given);
      if (!rel) return { success: false, error: 'path relativo inválido para Skill.' };
      for (const root of SKILL_ROOTS) candidates.push(root + '/' + rel);
    }
  }

  const rawSkillName = typeof args?.skill_name === 'string' ? args.skill_name.trim() : '';
  if (rawSkillName) {
    const name = normalizeSkillRelativePath(rawSkillName);
    if (!name) return { success: false, error: 'skill_name inválido.' };
    const hasMd = name.toLowerCase().endsWith('.md');
    for (const root of SKILL_ROOTS) {
      if (hasMd) {
        candidates.push(root + '/' + name);
      } else {
        candidates.push(root + '/' + name + '.md');
        candidates.push(root + '/' + name + '/SKILL.md');
      }
    }
  }

  if (!candidates.length) {
    return { success: false, error: 'para Skill.read, informe path/file_path ou skill_name' };
  }

  const uniqueCandidates = [];
  const seen = new Set();
  for (const c of candidates) {
    if (!seen.has(c)) {
      seen.add(c);
      uniqueCandidates.push(c);
    }
  }

  const attempts = [];
  for (const filePath of uniqueCandidates) {
    const run = await callChatAction('fs-read', { path: filePath });
    if (!run || run.ok !== true) {
      attempts.push({ path: filePath, error: String(run?.error || 'falha ao ler skill') });
      continue;
    }

    const rawContent = typeof run?.content === 'string' ? run.content : '';
    const isBinary = Boolean(run?.isBinary);
    if (isBinary) {
      return {
        success: true,
        action: 'read',
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
      action: 'read',
      file_path: String(run?.path || filePath),
      is_binary: false,
      content: sliced.join('\\n'),
      offset: start,
      limit: limit || null,
      total_lines: totalLines,
      returned_lines: sliced.length,
    };
  }

  const nonMissing = attempts.filter((a) => !isMissingPathError(a.error));
  return {
    success: false,
    action: 'read',
    error: nonMissing.length
      ? 'falha ao ler skill'
      : 'skill não encontrada',
    attempts,
  };
}

async function callRead(args) {
  const filePath = typeof args?.file_path === 'string'
    ? args.file_path.trim()
    : (typeof args?.path === 'string' ? args.path.trim() : '');
  if (!filePath) return { success: false, error: 'file_path é obrigatório para Read' };

  const offset = parsePositiveInt(args?.offset, 1);
  const limitRaw = parsePositiveInt(args?.limit, 0);
  const limit = limitRaw > 0 ? Math.min(limitRaw, 10000) : 0;

  const run = await callChatAction('fs-read', { path: filePath });
  if (!run || run.ok !== true) {
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
  const filePath = typeof args?.file_path === 'string'
    ? args.file_path.trim()
    : (typeof args?.path === 'string' ? args.path.trim() : '');
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
  if (!read || read.ok !== true) {
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
  if (!patch || patch.ok !== true) {
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

async function callWrite(args) {
  const filePath = typeof args?.file_path === 'string'
    ? args.file_path.trim()
    : (typeof args?.path === 'string' ? args.path.trim() : '');
  const hasContent = typeof args?.content === 'string';
  const content = hasContent ? args.content : '';

  if (!filePath) return { success: false, error: 'file_path é obrigatório para Write' };
  if (!isSandboxAbsolutePath(filePath)) {
    return { success: false, file_path: filePath, error: 'file_path deve começar com /vercel/sandbox' };
  }
  if (!hasContent) return { success: false, file_path: filePath, error: 'content deve ser string (pode ser vazio)' };

  const read = await callChatAction('fs-read', { path: filePath });
  let operation = null;

  if (read && read.ok === true) {
    if (read?.isBinary) {
      return { success: false, file_path: String(read?.path || filePath), error: 'Write suporta apenas arquivos de texto' };
    }
    const current = typeof read?.content === 'string' ? read.content : '';
    if (current === content) {
      return {
        success: true,
        file_path: String(read?.path || filePath),
        status: 'completed',
        output: 'Nenhuma alteração necessária; conteúdo já está atualizado.',
      };
    }
    operation = {
      type: 'update_file',
      path: String(read?.path || filePath),
      diff: buildUnifiedUpdateDiff(current, content),
    };
  } else {
    const err = String(read?.error || '');
    const missing = /enoent|no such file|not found|arquivo não encontrado|não existe/i.test(err);
    if (!missing) {
      return { success: false, file_path: filePath, error: err || 'falha ao verificar arquivo antes do Write' };
    }
    operation = {
      type: 'create_file',
      path: filePath,
      diff: buildUnifiedUpdateDiff('', content),
    };
  }

  const patch = await callChatAction('fs-apply-patch', { operation });
  if (!patch || patch.ok !== true) {
    return {
      success: false,
      file_path: String(operation?.path || filePath),
      error: patch?.error || patch?.output || 'falha ao aplicar escrita via fs-apply-patch',
    };
  }
  return {
    success: true,
    file_path: String(operation?.path || filePath),
    status: String(patch?.status || 'completed'),
    output: String(patch?.output || 'Write aplicado com sucesso.'),
  };
}

async function callDelete(args) {
  const filePath = typeof args?.file_path === 'string'
    ? args.file_path.trim()
    : (typeof args?.path === 'string' ? args.path.trim() : '');
  if (!filePath) return { success: false, error: 'file_path é obrigatório para Delete' };
  if (!isSandboxAbsolutePath(filePath)) {
    return { success: false, file_path: filePath, error: 'file_path deve começar com /vercel/sandbox' };
  }

  const patch = await callChatAction('fs-apply-patch', {
    operation: {
      type: 'delete_file',
      path: filePath,
    },
  });
  if (!patch || patch.ok !== true) {
    return {
      success: false,
      file_path: filePath,
      error: patch?.error || patch?.output || 'falha ao remover arquivo via fs-apply-patch',
    };
  }
  return {
    success: true,
    file_path: filePath,
    status: String(patch?.status || 'completed'),
    output: String(patch?.output || 'Delete aplicado com sucesso.'),
  };
}

function supportsNativeShellTool(model) {
  const m = String(model || '').toLowerCase().trim();
  return m.startsWith('gpt-5.1') || m.startsWith('gpt-5.2');
}

async function callShell(args) {
  const command = typeof args?.command === 'string' ? args.command : '';
  if (!command.trim()) return { success: false, error: 'command é obrigatório para shell tool' };
  const cwdRaw = typeof args?.cwd === 'string' ? args.cwd.trim() : '';
  const cwd = cwdRaw || '/vercel/sandbox';
  const run = await callChatAction('sandbox-shell', { command, cwd });
  if (!run || run.ok !== true) {
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
  return {
    success: false,
    status: 'failed',
    output: 'tool apply_patch desativada',
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
          description: 'Resource ERP canônico (exatos): financeiro/contas-financeiras, financeiro/categorias-despesa, financeiro/categorias-receita, financeiro/clientes, financeiro/centros-custo, financeiro/centros-lucro, vendas/pedidos, compras/pedidos, contas-a-pagar, contas-a-receber, crm/contas, crm/contatos, crm/leads, crm/oportunidades, crm/atividades, estoque/almoxarifados, estoque/movimentacoes, estoque/estoque-atual, estoque/tipos-movimentacao, documentos/templates, documentos/template-versions, documentos/documentos.'
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
    name: 'drive',
    description: 'Tool de Drive. action="request" chama rotas permitidas de Drive; action="read_file" lê conteúdo (inclui extração de texto para PDF quando possível); action="get_file_url" retorna signed_url por file_id.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['request', 'read_file', 'get_file_url', 'get_drive_file_url'],
          description: 'request: operações por resource Drive. read_file: leitura textual/binária por file_id. get_file_url/get_drive_file_url: URL assinada por file_id.'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'DELETE'],
          description: 'Método HTTP para action=request.'
        },
        resource: {
          type: 'string',
          description: 'Resource permitido para action=request: drive, drive/folders, drive/folders/{id}, drive/files/{id}, drive/files/{id}/download, drive/files/prepare-upload, drive/files/complete-upload.'
        },
        params: {
          type: 'object',
          additionalProperties: true,
          description: 'Query params para action=request.'
        },
        data: {
          type: 'object',
          additionalProperties: true,
          description: 'Body para action=request quando method for POST/DELETE.'
        },
        file_id: {
          type: 'string',
          description: 'UUID do arquivo no Drive para action=read_file e action=get_file_url.'
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
    name: 'email',
    description: 'Tool de Email. action="request" opera inbox/messages; action="send" envia email completo com anexos por URL/base64.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['request', 'send', 'send_email'],
          description: 'request: operações por resource de email. send/send_email: envia email.'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'DELETE'],
          description: 'Método HTTP para action=request.'
        },
        resource: {
          type: 'string',
          description: 'Resource permitido para action=request: email/inboxes, email/messages, email/messages/{id}, email/messages/{id}/attachments/{attachmentId}.'
        },
        params: {
          type: 'object',
          additionalProperties: true,
          description: 'Query params para action=request. Em email/messages, normalmente incluir inboxId.'
        },
        data: {
          type: 'object',
          additionalProperties: true,
          description: 'Body para action=request quando method for POST/DELETE.'
        },
        inbox_id: {
          type: 'string',
          description: 'Inbox para action=send.'
        },
        to: {
          type: 'array',
          items: { type: 'string' },
          description: 'Destinatários para action=send.'
        },
        cc: {
          type: 'array',
          items: { type: 'string' },
          description: 'CC opcional para action=send.'
        },
        bcc: {
          type: 'array',
          items: { type: 'string' },
          description: 'BCC opcional para action=send.'
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels opcionais para action=send.'
        },
        subject: {
          type: 'string',
          description: 'Assunto para action=send.'
        },
        text: {
          type: 'string',
          description: 'Corpo texto para action=send.'
        },
        html: {
          type: 'string',
          description: 'Corpo HTML para action=send.'
        },
        attachments: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: true,
            properties: {
              filename: { type: 'string' },
              contentType: { type: 'string' },
              contentDisposition: { type: 'string' },
              contentId: { type: 'string' },
              content: { type: 'string' },
              url: { type: 'string' },
            },
          },
          description: 'Lista de anexos para action=send. Cada item pode ter url ou content(base64), além de filename/contentType.'
        },
        attachment_url: {
          type: 'string',
          description: 'Atalho para 1 anexo por URL em action=send.'
        },
        signed_url: {
          type: 'string',
          description: 'Alias de attachment_url para action=send.'
        },
        filename: {
          type: 'string',
          description: 'Nome do arquivo para attachment_url em action=send.'
        },
        content_type: {
          type: 'string',
          description: 'MIME type para attachment_url em action=send.'
        },
      },
      required: ['action'],
      additionalProperties: true,
    },
  },
  {
    type: 'function',
    name: 'Read',
    description: 'Lê arquivo na sandbox do chat (padrão Claude SDK). file_path deve sempre começar com /vercel/sandbox.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Caminho absoluto obrigatório, iniciando com /vercel/sandbox.',
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
    name: 'Skill',
    description: 'Lista e lê skills dentro das pastas /vercel/sandbox/agent/skills (preferencial) e /vercel/sandbox/agents/skills (compatibilidade).',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'read'],
          description: 'list: lista arquivos de skill. read: lê um arquivo de skill.',
        },
        path: {
          type: 'string',
          description: 'Caminho do arquivo de skill (absoluto dentro de /vercel/sandbox/.../skills ou relativo à pasta de skills).',
        },
        file_path: {
          type: 'string',
          description: 'Alias de path.',
        },
        skill_name: {
          type: 'string',
          description: 'Nome da skill para leitura (ex.: TESTE-1). Resolve para <name>.md e <name>/SKILL.md.',
        },
        offset: {
          type: 'integer',
          description: 'Linha inicial (1-based) para action=read.',
        },
        limit: {
          type: 'integer',
          description: 'Quantidade de linhas para action=read.',
        },
      },
      required: ['action'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'Edit',
    description: 'Substitui texto exato em arquivo (padrão Claude SDK), aplicando gravação via fs-apply-patch. file_path deve sempre começar com /vercel/sandbox.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Caminho absoluto obrigatório, iniciando com /vercel/sandbox.',
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
  {
    type: 'function',
    name: 'Write',
    description: 'Cria ou sobrescreve arquivo texto via fs-apply-patch. file_path deve sempre começar com /vercel/sandbox.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Caminho absoluto obrigatório, iniciando com /vercel/sandbox.',
        },
        content: {
          type: 'string',
          description: 'Conteúdo completo do arquivo (pode ser vazio).',
        },
      },
      required: ['file_path', 'content'],
      additionalProperties: false,
    },
  },
  {
    type: 'function',
    name: 'Delete',
    description: 'Remove arquivo via fs-apply-patch. file_path deve sempre começar com /vercel/sandbox.',
    parameters: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Caminho absoluto obrigatório, iniciando com /vercel/sandbox.',
        },
      },
      required: ['file_path'],
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
  const tools = baseTools;
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
      } else if (toolName === 'drive') {
        result = await callDrive(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'email') {
        result = await callEmail(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'Read' || toolName === 'read') {
        result = await callRead(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'Skill' || toolName === 'skill') {
        result = await callSkill(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'Edit' || toolName === 'edit') {
        result = await callEdit(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'Write' || toolName === 'write') {
        result = await callWrite(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
      } else if (toolName === 'Delete' || toolName === 'delete') {
        result = await callDelete(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
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
