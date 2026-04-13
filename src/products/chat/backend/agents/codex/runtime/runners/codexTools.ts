import { codexAppFunctionTools } from '@/products/chat/backend/agents/codex/tools/schema/appTools'
import { CODEX_APP_TOOL_HANDLERS_SCRIPT } from '@/products/chat/backend/agents/codex/tools/handlers/appToolHandlersScript'
import { CODEX_APP_TOOL_DISPATCH_SCRIPT } from '@/products/chat/backend/agents/codex/tools/dispatch/appToolDispatchScript'

export function getOpenAIResponsesStreamRunnerScript(): string {
  return `
const prompt = process.argv[2] || '';
const modelId = process.env.AGENT_MODEL || 'gpt-5.4-mini';
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
const SAFE_PREFIXES = ['financeiro', 'vendas', 'compras', 'contas-a-pagar', 'contas-a-receber', 'crm', 'estoque', 'cadastros'];

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

function syncBufferedText(nextText, currentText, appendFn) {
  const incoming = String(nextText || '');
  const current = String(currentText || '');
  if (!incoming) return;
  if (!current) {
    appendFn(incoming);
    return;
  }
  if (incoming === current) return;
  if (incoming.startsWith(current)) {
    const missing = incoming.slice(current.length);
    if (missing) appendFn(missing);
    return;
  }
}

function extractAssistantTextFromOutputItem(item) {
  if (!item || typeof item !== 'object') return '';
  const itemType = String(item.type || '').toLowerCase();
  const itemRole = String(item.role || '').toLowerCase();
  const isAssistantMessage =
    itemRole === 'assistant' ||
    itemType === 'message' ||
    itemType === 'assistant' ||
    itemType === 'output_message';
  if (!isAssistantMessage) return '';

  const chunks = [];
  if (Array.isArray(item.content)) {
    for (const part of item.content) {
      if (!part || typeof part !== 'object') continue;
      const partType = String(part.type || '').toLowerCase();
      if (
        partType === 'output_text' ||
        partType === 'text' ||
        partType === 'input_text' ||
        partType === 'summary_text'
      ) {
        const txt = extractText(part);
        if (txt) chunks.push(txt);
      }
    }
  }

  if (!chunks.length) {
    const fallback = extractText(item);
    if (fallback) chunks.push(fallback);
  }

  return chunks.join('');
}

function extractReasoningTextFromOutputItem(item) {
  if (!item || typeof item !== 'object') return '';
  const chunks = [];
  const scanPart = (part) => {
    if (!part || typeof part !== 'object') return;
    const partType = String(part.type || '').toLowerCase();
    if (
      partType === 'reasoning' ||
      partType === 'reasoning_text' ||
      partType === 'reasoning_summary' ||
      partType === 'reasoning_summary_text' ||
      partType === 'summary'
    ) {
      const txt = extractText(part);
      if (txt) chunks.push(txt);
    }
  };

  if (Array.isArray(item.content)) {
    for (const part of item.content) scanPart(part);
  } else {
    scanPart(item);
  }

  return chunks.join('');
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

${CODEX_APP_TOOL_HANDLERS_SCRIPT}

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

function supportsNativeShellTool(model) {
  const m = String(model || '').toLowerCase().trim();
  return m.startsWith('gpt-5.1') || m.startsWith('gpt-5.2') || m.startsWith('gpt-5.4');
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
const appFunctionTools = ${JSON.stringify(codexAppFunctionTools)};
${CODEX_APP_TOOL_DISPATCH_SCRIPT}
const baseTools = [
  ...appFunctionTools,
  {
    type: 'function',
    name: 'Skill',
    description: 'Lista e lê skills na sandbox do chat. Procura em /vercel/sandbox/agent/skills (preferencial) e /vercel/sandbox/agents/skills (compatibilidade).',
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
  ...(nativeShellEnabled
    ? [{ type: 'shell' }]
    : [{
        type: 'function',
        name: 'shell',
        description: 'Executa comandos shell no sandbox do chat. Prefira comandos curtos e use caminhos dentro de /vercel/sandbox.',
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
      syncBufferedText(extractAssistantTextFromOutputItem(item), assistantText, appendAssistant);
      syncBufferedText(extractReasoningTextFromOutputItem(item), reasoningText, appendReasoning);
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
      const appToolResult = await callKnownAppToolByName(toolName, parsedArgs);
      if (appToolResult !== undefined) {
        result = appToolResult;
      } else if (toolName === 'Skill' || toolName === 'skill') {
        result = await callSkill(parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {});
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
