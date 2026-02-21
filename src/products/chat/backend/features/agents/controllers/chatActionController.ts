import { Sandbox } from '@vercel/sandbox'
import { runQuery } from '@/lib/postgres'
import { getChatStreamRunnerScript, getSlashStreamRunnerScript } from '@/products/chat/backend/features/agents/claudecode/runtime/runners/claudeCodeRunnerScripts'
import { getOpenAIResponsesStreamRunnerScript } from '@/products/chat/backend/features/agents/codex/runtime/runners/codexRunnerScripts'
import { generateAgentToken, setAgentToken } from '@/products/chat/backend/features/agents/auth/agentTokenStore'
import { buildClaudeSystemPrompt } from '@/products/chat/backend/features/agents/claudecode/prompts/claudeCodeSystemPrompt'
import { buildOpenAiSystemPrompt } from '@/products/chat/backend/features/agents/codex/prompts/codexSystemPrompt'
import { loadDashboardSkillMarkdown } from '@/products/chat/backend/features/agents/skills/dashboardSkill'
import { resolveComposioUserIdFromRequest } from '@/products/chat/backend/features/agents/core/context/resolveComposioUserId'
import { seedAppToolsSkillInSandbox, seedMcpServersInSandbox } from '@/products/chat/backend/features/agents/core/tools/sandboxTooling'
import { APPS_VENDAS_TEMPLATE_TEXT } from '@/products/apps/shared/templates/appsVendasTemplate'
import { APPS_COMPRAS_TEMPLATE_TEXT } from '@/products/apps/shared/templates/appsComprasTemplate'

export const runtime = 'nodejs'

type Msg = { role: 'user'|'assistant'; content: string }
type ChatProvider = 'claude-agent' | 'openai-responses'

// Simple in-memory session store
type ChatSession = { id: string; sandbox: Sandbox; createdAt: number; lastUsedAt: number; agentToken?: string; agentTokenExp?: number; composioEnabled?: boolean; model?: string; composioUserId?: string; provider?: ChatProvider }
const SESSIONS = new Map<string, ChatSession>()
const OPENAI_SANDBOXES = new Map<string, { sandbox: Sandbox; createdAt: number; lastUsedAt: number }>()
const genId = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
const DASHBOARD_SKILL_PATH = '/vercel/sandbox/agent/skills/dashboard.md'
const DASHBOARD_SKILL_MD = loadDashboardSkillMarkdown()

function inferProviderFromModel(model?: string): ChatProvider {
  const raw = (model || '').toString().trim().toLowerCase()
  if (!raw) return 'claude-agent'
  if (raw.startsWith('gpt-') || raw.startsWith('o1') || raw.startsWith('o3') || raw.startsWith('o4')) return 'openai-responses'
  if (raw.includes('gpt') || raw.includes('openai')) return 'openai-responses'
  return 'claude-agent'
}

function normalizeProvider(rawProvider?: string, rawModel?: string): ChatProvider {
  const p = (rawProvider || '').toString().trim().toLowerCase()
  if (p === 'openai' || p === 'openai-responses' || p === 'responses') return 'openai-responses'
  if (p === 'claude' || p === 'claude-agent' || p === 'anthropic') return 'claude-agent'
  return inferProviderFromModel(rawModel)
}

function normalizeModel(provider: ChatProvider, rawModel?: string): string {
  const raw = (rawModel || '').toString().trim().toLowerCase()
  if (provider === 'openai-responses') {
    const openaiMap: Record<string, string> = {
      'gpt-5': 'gpt-5',
      'gpt5': 'gpt-5',
      'gpt-5.1': 'gpt-5.1',
      'gpt5.1': 'gpt-5.1',
      'gpt-5.2': 'gpt-5.2',
      'gpt5.2': 'gpt-5.2',
      'gpt-5-mini': 'gpt-5-mini',
      'gpt5-mini': 'gpt-5-mini',
      'gpt5mini': 'gpt-5-mini',
      'gpt-5-nano': 'gpt-5-nano',
      'gpt5-nano': 'gpt-5-nano',
      'gpt5nano': 'gpt-5-nano',
    }
    return openaiMap[raw] || 'gpt-5.1'
  }
  const claudeMap: Record<string, string> = {
    'sonnet': 'claude-sonnet-4-5-20251001',
    'sonnet-4.5': 'claude-sonnet-4-5-20251001',
    'claude-sonnet-4-5-20251001': 'claude-sonnet-4-5-20251001',
    'haiku': 'claude-haiku-4-5-20251001',
    'haiku-4.5': 'claude-haiku-4-5-20251001',
    'claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',
  }
  return claudeMap[raw] || 'claude-haiku-4-5-20251001'
}

async function ensureDashboardSkillInSandbox(sandbox: Sandbox, opts?: { ensureOpenAiDir?: boolean }) {
  try {
    const mkdirScript = opts?.ensureOpenAiDir
      ? "const fs=require('fs');fs.mkdirSync('/vercel/sandbox/openai-chat',{recursive:true});fs.mkdirSync('/vercel/sandbox/agent/skills',{recursive:true});console.log('ok')"
      : "const fs=require('fs');fs.mkdirSync('/vercel/sandbox/agent/skills',{recursive:true});console.log('ok')"
    await sandbox.runCommand({ cmd: 'node', args: ['-e', mkdirScript] })
  } catch {}
  try {
    await sandbox.writeFiles([
      {
        path: DASHBOARD_SKILL_PATH,
        content: Buffer.from(DASHBOARD_SKILL_MD),
      },
    ])
  } catch {}
}

async function getOrCreateOpenAiSandbox(chatId: string): Promise<Sandbox> {
  async function ensureOpenAiSkillsScaffold(sandbox: Sandbox) {
    await ensureDashboardSkillInSandbox(sandbox, { ensureOpenAiDir: true })
  }

  const existing = OPENAI_SANDBOXES.get(chatId)
  if (existing) {
    existing.lastUsedAt = Date.now()
    await ensureOpenAiSkillsScaffold(existing.sandbox)
    return existing.sandbox
  }
  const sandbox = await Sandbox.create({ runtime: 'node22', resources: { vcpus: 2 }, timeout: 1_800_000 })
  await ensureOpenAiSkillsScaffold(sandbox)
  OPENAI_SANDBOXES.set(chatId, { sandbox, createdAt: Date.now(), lastUsedAt: Date.now() })
  return sandbox
}

export async function POST(req: Request) {
  const enc = new TextEncoder()
  const { action, ...payload } = await req.json().catch(() => ({})) as any
  const origin = (() => { try { return new URL((req as any).url).origin } catch { return process.env.NEXT_PUBLIC_BASE_URL || '' } })()
  if (!action || typeof action !== 'string') {
    return Response.json({ ok: false, error: 'action inválida' }, { status: 400 })
  }

  if (action === 'chat-start') return chatStart(payload as { chatId?: string })
  if (action === 'chat-stop') return chatStop(payload as { chatId?: string })
  if (action === 'chat-send-stream') return chatSendStream(payload as { chatId?: string; history?: Msg[]; clientMessageId?: string })
  if (action === 'chat-slash') return chatSlash(payload as { chatId?: string; prompt?: string })
  if (action === 'fs-list') return fsList(payload as { chatId?: string; path?: string })
  if (action === 'fs-read') return fsRead(payload as { chatId?: string; path?: string })
  if (action === 'fs-write') return fsWrite(payload as { chatId?: string; path?: string; content?: string })
  if (action === 'fs-apply-patch') return fsApplyPatch(payload as { chatId?: string; operation?: any })
  if (action === 'sandbox-shell') return sandboxShell(payload as { chatId?: string; command?: string; cwd?: string })
  if (action === 'mcp-toggle') return mcpToggle(payload as { chatId?: string; enabled?: boolean })
  if (action === 'model-set') return modelSet(payload as { chatId?: string; model?: string; provider?: string })
  if (action === 'chat-status') return chatStatus(payload as { chatId?: string })
  if (action === 'chat-snapshot') return chatSnapshot(payload as { chatId?: string })

  return Response.json({ ok: false, error: `ação desconhecida: ${action}` }, { status: 400 })

  async function chatStart(params?: { chatId?: string }) {
    let sandbox: Sandbox | undefined
    const timeline: Array<{ name: string; ms: number; ok: boolean; exitCode?: number }> = []
    const t0 = Date.now()
    try {
      // Decide chat id upfront and prefer per-chat snapshot
      const proposed = (params && typeof params.chatId === 'string' && params.chatId.trim()) ? params.chatId.trim() : null
      const id = proposed || genId()
      const existing = SESSIONS.get(id)
      if (existing) {
        existing.lastUsedAt = Date.now()
        // Ensure agent token remains valid for tool bridge calls.
        if (!existing.agentToken || !existing.agentTokenExp || existing.agentTokenExp <= (Date.now() + 60_000)) {
          const { token, exp } = generateAgentToken(1800, id)
          existing.agentToken = token
          existing.agentTokenExp = exp
          setAgentToken(id, token, exp)
        }
        const provider = normalizeProvider(existing.provider, existing.model)
        existing.provider = provider
        existing.model = normalizeModel(provider, existing.model || (provider === 'openai-responses' ? 'gpt-5.1' : 'claude-haiku-4-5-20251001'))
        await ensureDashboardSkillInSandbox(existing.sandbox)
        timeline.push({ name: 'reuse-existing-session', ms: Date.now() - t0, ok: true })
        return Response.json({ ok: true, chatId: id, reused: true, startupMode: 'reused' as const, timeline })
      }
      let existingModel = ''

      let usedChatSnapshot = false
      try {
        const rows = await runQuery<{ snapshot_id: string | null; model: string | null }>(`SELECT snapshot_id, model FROM chat.chats WHERE id = $1`, [id])
        const snap = (rows && rows[0] && rows[0].snapshot_id) || null
        existingModel = (rows && rows[0] && rows[0].model) ? String(rows[0].model).trim() : ''
        if (snap && typeof snap === 'string' && snap.trim()) {
          const tSnap = Date.now()
          try {
            sandbox = await Sandbox.create({ source: { type: 'snapshot', snapshotId: snap.trim() }, resources: { vcpus: 2 }, timeout: 1_800_000 })
            timeline.push({ name: 'create-from-chat-snapshot', ms: Date.now() - tSnap, ok: true })
            usedChatSnapshot = true
          } catch (e) {
            timeline.push({ name: 'create-from-chat-snapshot', ms: Date.now() - tSnap, ok: false })
          }
        }
      } catch {}

      if (!sandbox) {
        const tCreate = Date.now()
        sandbox = await Sandbox.create({ runtime: 'node22', resources: { vcpus: 2 }, timeout: 1_800_000 })
        timeline.push({ name: 'create-sandbox', ms: Date.now() - tCreate, ok: true })
        const t1 = Date.now()
        // Install Agent SDK + CLI + zod (for MCP schemas)
        const install = await sandbox.runCommand({ cmd: 'npm', args: ['install', '@anthropic-ai/claude-agent-sdk', '@anthropic-ai/claude-code', 'zod', '@composio/core', '@composio/claude-agent-sdk'] })
        timeline.push({ name: 'install', ms: Date.now() - t1, ok: install.exitCode === 0, exitCode: install.exitCode })
        if (install.exitCode !== 0) {
          const [o, e] = await Promise.all([install.stdout().catch(() => ''), install.stderr().catch(() => '')])
          await sandbox.stop().catch(() => {})
          return Response.json({ ok: false, error: 'install failed', stdout: o, stderr: e, timeline }, { status: 500 })
        }
      }
      if (sandbox) await ensureDashboardSkillInSandbox(sandbox)
      // Seed a single Tools Skill to document generic MCP tools (only when cold start)
      if (!usedChatSnapshot) {
        try {
          await seedAppToolsSkillInSandbox(sandbox, timeline)
        } catch {}
      }
      // Seed default JSON Render dashboards (.jsonr)
      try {
        const parseSeedJson = (raw: string): any[] => {
          try {
            const parsed = JSON.parse(raw)
            const nodes = Array.isArray(parsed) ? parsed : [parsed]
            if (!nodes[0] || nodes[0].type !== 'Theme') {
              return [{ type: 'Theme', props: { name: 'light', headerTheme: 'auto', managers: {} }, children: nodes }]
            }
            const theme = nodes[0]
            theme.props = theme.props && typeof theme.props === 'object' ? theme.props : {}
            if (!theme.props.name) theme.props.name = 'light'
            if (typeof theme.props.headerTheme !== 'string') theme.props.headerTheme = 'auto'
            if (!theme.props.managers || typeof theme.props.managers !== 'object') theme.props.managers = {}
            return nodes
          } catch {
            return []
          }
        }
        const vendasObj = parseSeedJson(APPS_VENDAS_TEMPLATE_TEXT)
        const comprasObj = parseSeedJson(APPS_COMPRAS_TEMPLATE_TEXT)
        const seedDash = `const fs=require('fs');const p=process.env.TARGET;fs.mkdirSync(p,{recursive:true});const w=(f,c)=>{if(!fs.existsSync(f))fs.writeFileSync(f,c,'utf8');};w(p+'/vendas.jsonr',process.env.VENDAS_JSONR||'[]');w(p+'/compras.jsonr',process.env.COMPRAS_JSONR||'[]');console.log('ok');`;
        const runSeed = await sandbox.runCommand({ cmd: 'node', args: ['-e', seedDash], env: { TARGET: '/vercel/sandbox/dashboard', VENDAS_JSONR: JSON.stringify(vendasObj), COMPRAS_JSONR: JSON.stringify(comprasObj) } })
        timeline.push({ name: 'seed-jsonr', ms: 0, ok: runSeed.exitCode === 0, exitCode: runSeed.exitCode })
      } catch {}
      // Seed MCP servers used by the chat runtimes
      try {
        await seedMcpServersInSandbox(sandbox)
      } catch {}
      // Resolve Composio user id: prefer cookie, else DB lookup via Supabase auth
      const composioUserId = await resolveComposioUserIdFromRequest(req)
      // Issue short-lived agent token (opaque) and store
      const { token, exp } = generateAgentToken(1800, id)
      const initialProvider = normalizeProvider(undefined, existingModel)
      const initialModel = normalizeModel(initialProvider, existingModel || (initialProvider === 'openai-responses' ? 'gpt-5.1' : 'claude-haiku-4-5-20251001'))
      SESSIONS.set(id, { id, sandbox, createdAt: Date.now(), lastUsedAt: Date.now(), agentToken: token, agentTokenExp: exp, composioEnabled: false, model: initialModel, composioUserId, provider: initialProvider })
      setAgentToken(id, token, exp)
      // Persist chat header (best-effort)
      const tDb = Date.now()
      try {
        await runQuery(
          'INSERT INTO chat.chats (id, model, composio_enabled) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
          [id, initialModel, false]
        )
        timeline.push({ name: 'db_upsert_chat', ms: Date.now() - tDb, ok: true })
      } catch (e) {
        timeline.push({ name: 'db_upsert_chat', ms: Date.now() - tDb, ok: false })
      }

      // Set automatic title "Chat N" if missing (best-effort)
      const tTitle = Date.now()
      try {
        // Ensure sequence exists (ignore errors if unsupported/exists)
        try { await runQuery('CREATE SEQUENCE IF NOT EXISTS chat.chat_title_seq START WITH 1 INCREMENT BY 1') } catch {}
        const updated = await runQuery<{ title: string }>(
          "UPDATE chat.chats SET title = 'Chat ' || nextval('chat.chat_title_seq') WHERE id = $1 AND title IS NULL RETURNING title",
          [id]
        )
        timeline.push({ name: 'db_set_title', ms: Date.now() - tTitle, ok: Array.isArray(updated) && updated.length > 0 })
      } catch {
        timeline.push({ name: 'db_set_title', ms: Date.now() - tTitle, ok: false })
      }
      const startupMode: 'snapshot' | 'cold' = usedChatSnapshot ? 'snapshot' : 'cold'
      const res = Response.json({
        ok: true,
        chatId: id,
        reused: false,
        startupMode,
        timeline,
      })
      try {
        if (composioUserId) res.headers.set('Set-Cookie', `composio_uid=${encodeURIComponent(composioUserId)}; Path=/; Max-Age=31536000; SameSite=Lax`)
      } catch {}
      return res
    } catch (e) {
      try { await sandbox?.stop() } catch {}
      return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
    }
  }

  async function chatStop({ chatId }: { chatId?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    // Best-effort: snapshot before stopping to persist filesystem for this chat
    let snapshotId: string | null = null
    try {
      const snap = await sess.sandbox.snapshot()
      snapshotId = (snap as any)?.snapshotId || null
      try {
        if (snapshotId) await runQuery('UPDATE chat.chats SET snapshot_id = $1, snapshot_at = now() WHERE id = $2', [snapshotId, chatId])
      } catch {}
    } catch {}
    try { await sess.sandbox.stop() } catch {}
    try { await OPENAI_SANDBOXES.get(chatId)?.sandbox.stop() } catch {}
    SESSIONS.delete(chatId)
    OPENAI_SANDBOXES.delete(chatId)
    return Response.json({ ok: true, snapshotId })
  }

  async function chatSendStream({ chatId, history, clientMessageId }: { chatId?: string; history?: Msg[]; clientMessageId?: string }) {
    if (!chatId) return new Response(JSON.stringify({ ok: false, error: 'chatId obrigatório' }), { status: 400 })
    if (!Array.isArray(history) || !history.length) return new Response(JSON.stringify({ ok: false, error: 'history vazio' }), { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return new Response(JSON.stringify({ ok: false, error: 'chat não encontrado' }), { status: 404 })
    sess.lastUsedAt = Date.now()
    // Best-effort: persist last user message before streaming
    try {
      const lastUser = [...history].reverse().find(m => m.role === 'user')
      if (lastUser && typeof lastUser.content === 'string' && lastUser.content.trim()) {
        await runQuery(
          `INSERT INTO chat.chat_messages (chat_id, role, content, client_message_id)
           VALUES ($1,'user',$2,$3)
           ON CONFLICT (client_message_id) DO NOTHING`,
          [chatId, lastUser.content, clientMessageId || null]
        )
        try { await runQuery('UPDATE chat.chats SET last_message_at = now(), updated_at = now() WHERE id = $1', [chatId]) } catch {}
      }
    } catch {}
    const provider = normalizeProvider(sess.provider, sess.model)
    sess.provider = provider
    if (provider === 'openai-responses') {
      return chatSendStreamOpenAi({ chatId, history, sess })
    }
    const prompt = buildClaudeSystemPrompt({
      history,
      composioEnabled: Boolean(sess.composioEnabled),
    }).slice(0, 6000)
    const runner = getChatStreamRunnerScript()
    await sess.sandbox.writeFiles([{ path: '/vercel/sandbox/agent-chat-stream.mjs', content: Buffer.from(runner) }])
    let assistantTextBuf = ''
    const assistantParts: any[] = []
    let textSegBuf = ''
    // Tool capture state
    let pendingToolName: string | null = null
    let pendingToolInputStream = ''
    let pendingToolInput: any = undefined
    // Reasoning capture state
    let reasoningActive = false
    let reasoningBuf = ''
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const cmd: any = await (sess.sandbox as any).runCommand({
            cmd: 'node',
            args: ['agent-chat-stream.mjs', prompt],
            env: {
              ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
              COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY || '',
              // Prefer per-user cookie value when available
              COMPOSIO_USER_ID: (SESSIONS.get(chatId)?.composioUserId || process.env.COMPOSIO_USER_ID || ''),
              COMPOSIO_CONNECTED_ACCOUNT_ID: process.env.COMPOSIO_CONNECTED_ACCOUNT_ID || '',
              COMPOSIO_GMAIL_AUTH_CONFIG_ID: process.env.COMPOSIO_GMAIL_AUTH_CONFIG_ID || '',
              COMPOSIO_CALLBACK_URL: process.env.COMPOSIO_CALLBACK_URL || '',
              MCP_COMPOSIO_ENABLED: (SESSIONS.get(chatId)?.composioEnabled ? '1' : ''),
              AGENT_MODEL: (SESSIONS.get(chatId)?.model || ''),
              AGENT_TOOL_TOKEN: sess.agentToken || '',
              AGENT_CHAT_ID: chatId,
              AGENT_BASE_URL: origin,
            },
            detached: true,
          })
          controller.enqueue(enc.encode('event: start\ndata: ok\n\n'))
          let outBuf = ''; let errBuf = ''
          for await (const log of cmd.logs()) {
            const ch = String(log.data)
            if (log.stream === 'stdout') {
              outBuf += ch
              let idx
              while ((idx = outBuf.indexOf('\n')) >= 0) {
                const line = outBuf.slice(0, idx).trim(); outBuf = outBuf.slice(idx + 1)
                if (!line) continue
                // Accumulate assistant text deltas for final persistence
                try {
                  const evt = JSON.parse(line)
                  if (evt && evt.type === 'delta' && typeof evt.text === 'string') {
                    assistantTextBuf += evt.text
                    textSegBuf += evt.text
                  } else if (evt && evt.type === 'tool_input_start') {
                    // flush any text before tool input starts
                    const seg = (textSegBuf || '').trim()
                    if (seg) {
                      assistantParts.push({ type: 'text', text: seg })
                      textSegBuf = ''
                    }
                    pendingToolName = (evt.name || evt.tool_name || null) as any
                    pendingToolInputStream = ''
                    pendingToolInput = undefined
                  } else if (evt && evt.type === 'tool_input_delta' && typeof evt.partial === 'string') {
                    pendingToolInputStream += evt.partial
                  } else if (evt && evt.type === 'tool_input_done') {
                    try {
                      if (typeof evt.input !== 'undefined') {
                        pendingToolInput = evt.input
                      } else if (pendingToolInputStream) {
                        const s = pendingToolInputStream.trim()
                        if (s) { try { pendingToolInput = JSON.parse(s) } catch { pendingToolInput = s } }
                      }
                    } catch {}
                  } else if (evt && evt.type === 'reasoning_start') {
                    // flush pending visible text before reasoning block
                    const seg = (textSegBuf || '').trim()
                    if (seg) {
                      assistantParts.push({ type: 'text', text: seg })
                      textSegBuf = ''
                    }
                    reasoningActive = true
                    reasoningBuf = ''
                  } else if (evt && evt.type === 'reasoning_delta' && typeof evt.text === 'string') {
                    if (reasoningActive) reasoningBuf += evt.text
                  } else if (evt && evt.type === 'reasoning_end') {
                    if (reasoningActive) {
                      assistantParts.push({ type: 'reasoning', content: reasoningBuf, state: 'done' })
                      reasoningActive = false
                      reasoningBuf = ''
                    }
                  } else if (evt && evt.type === 'tool_done') {
                    // flush pending text segment before tool output
                    const seg = (textSegBuf || '').trim()
                    if (seg) {
                      assistantParts.push({ type: 'text', text: seg })
                      textSegBuf = ''
                    }
                    const toolName = ((evt.tool_name || pendingToolName || 'generic') as string)
                    assistantParts.push({ type: `tool-${toolName}`, state: 'output-available', output: evt.output, input: pendingToolInput, tool_name: toolName })
                    pendingToolName = null; pendingToolInputStream = ''; pendingToolInput = undefined
                  } else if (evt && evt.type === 'tool_error') {
                    const seg = (textSegBuf || '').trim()
                    if (seg) {
                      assistantParts.push({ type: 'text', text: seg })
                      textSegBuf = ''
                    }
                    const toolName = ((evt.tool_name || pendingToolName || 'generic') as string)
                    assistantParts.push({ type: `tool-${toolName}`, state: 'output-error', errorText: evt.error, input: pendingToolInput, tool_name: toolName })
                    pendingToolName = null; pendingToolInputStream = ''; pendingToolInput = undefined
                  }
                } catch {}
                controller.enqueue(enc.encode(`data: ${line}\n\n`))
              }
            } else {
              errBuf += ch
            }
          }
          if (errBuf) controller.enqueue(enc.encode(`event: stderr\ndata: ${JSON.stringify(errBuf)}\n\n`))
          // Best-effort: persist assistant final message (always parts, includes reasoning/tools when present)
          try {
            // flush any open reasoning block
            if (reasoningActive) {
              assistantParts.push({ type: 'reasoning', content: reasoningBuf, state: 'done' })
              reasoningActive = false
              reasoningBuf = ''
            }
            // flush trailing text segment
            const seg = (textSegBuf || '').trim()
            if (seg) assistantParts.push({ type: 'text', text: seg })
            // if still empty, fallback to single text part
            if (assistantParts.length === 0) {
              const onlyText = (assistantTextBuf || '').trim()
              if (onlyText) assistantParts.push({ type: 'text', text: onlyText })
            }
            if (assistantParts.length > 0) {
              await runQuery(
                `INSERT INTO chat.chat_messages (chat_id, role, content, parts) VALUES ($1,'assistant','',$2)`,
                [chatId, JSON.stringify(assistantParts)]
              )
            }
            try { await runQuery('UPDATE chat.chats SET last_message_at = now(), updated_at = now() WHERE id = $1', [chatId]) } catch {}
          } catch {}
          controller.enqueue(enc.encode('event: end\ndata: done\n\n'))
          controller.close()
        } catch (e: any) {
          controller.enqueue(enc.encode(`event: error\ndata: ${JSON.stringify(e?.message || String(e))}\n\n`))
          controller.close()
        }
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } })
  }

  async function chatSendStreamOpenAi({ chatId, history, sess }: { chatId: string; history: Msg[]; sess: ChatSession }) {
    const enc = new TextEncoder()
    const apiKey = (process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY || '').trim()
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: 'OPENAI_API_KEY/CODEX_API_KEY não configurada' }), { status: 500 })
    }
    const prompt = buildOpenAiSystemPrompt({ history }).slice(0, 9000)

    const modelId = normalizeModel('openai-responses', sess.model)
    sess.model = modelId
    sess.provider = 'openai-responses'
    sess.lastUsedAt = Date.now()

    const runner = getOpenAIResponsesStreamRunnerScript()
    const openAiSandbox = await getOrCreateOpenAiSandbox(chatId)
    await openAiSandbox.writeFiles([{ path: '/vercel/sandbox/openai-chat/agent-openai-stream.mjs', content: Buffer.from(runner) }])

    let assistantTextBuf = ''
    const assistantParts: any[] = []
    let textSegBuf = ''
    let pendingToolName: string | null = null
    let pendingToolInputStream = ''
    let pendingToolInput: any = undefined
    let reasoningActive = false
    let reasoningBuf = ''

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const env: Record<string, string> = {
            OPENAI_API_KEY: apiKey,
            CODEX_API_KEY: apiKey,
            AGENT_MODEL: modelId,
            AGENT_BASE_URL: origin,
            AGENT_TOOL_TOKEN: sess.agentToken || '',
            AGENT_CHAT_ID: chatId,
            AGENT_TENANT_ID: process.env.AGENT_TENANT_ID || '1',
          }
          if ((process.env.OPENAI_BASE_URL || '').trim()) env.OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || '').trim()
          const cmd: any = await (openAiSandbox as any).runCommand({
            cmd: 'node',
            args: ['openai-chat/agent-openai-stream.mjs', prompt],
            env,
            detached: true,
          })
          controller.enqueue(enc.encode('event: start\ndata: ok\n\n'))
          let outBuf = ''; let errBuf = ''
          for await (const log of cmd.logs()) {
            const ch = String(log.data)
            if (log.stream === 'stdout') {
              outBuf += ch
              let idx
              while ((idx = outBuf.indexOf('\n')) >= 0) {
                const line = outBuf.slice(0, idx).trim(); outBuf = outBuf.slice(idx + 1)
                if (!line) continue
                try {
                  const evt = JSON.parse(line)
                  if (evt && evt.type === 'delta' && typeof evt.text === 'string') {
                    assistantTextBuf += evt.text
                    textSegBuf += evt.text
                  } else if (evt && evt.type === 'tool_input_start') {
                    const seg = (textSegBuf || '').trim()
                    if (seg) {
                      assistantParts.push({ type: 'text', text: seg })
                      textSegBuf = ''
                    }
                    pendingToolName = (evt.name || evt.tool_name || null) as any
                    pendingToolInputStream = ''
                    pendingToolInput = undefined
                  } else if (evt && evt.type === 'tool_input_delta' && typeof evt.partial === 'string') {
                    pendingToolInputStream += evt.partial
                  } else if (evt && evt.type === 'tool_input_done') {
                    try {
                      if (typeof evt.input !== 'undefined') {
                        pendingToolInput = evt.input
                      } else if (pendingToolInputStream) {
                        const s = pendingToolInputStream.trim()
                        if (s) { try { pendingToolInput = JSON.parse(s) } catch { pendingToolInput = s } }
                      }
                    } catch {}
                  } else if (evt && evt.type === 'reasoning_start') {
                    const seg = (textSegBuf || '').trim()
                    if (seg) {
                      assistantParts.push({ type: 'text', text: seg })
                      textSegBuf = ''
                    }
                    reasoningActive = true
                    reasoningBuf = ''
                  } else if (evt && evt.type === 'reasoning_delta' && typeof evt.text === 'string') {
                    if (reasoningActive) reasoningBuf += evt.text
                  } else if (evt && evt.type === 'reasoning_end') {
                    if (reasoningActive) {
                      assistantParts.push({ type: 'reasoning', content: reasoningBuf, state: 'done' })
                      reasoningActive = false
                      reasoningBuf = ''
                    }
                  } else if (evt && evt.type === 'tool_done') {
                    const seg = (textSegBuf || '').trim()
                    if (seg) {
                      assistantParts.push({ type: 'text', text: seg })
                      textSegBuf = ''
                    }
                    const toolName = ((evt.tool_name || pendingToolName || 'generic') as string)
                    assistantParts.push({ type: `tool-${toolName}`, state: 'output-available', output: evt.output, input: pendingToolInput, tool_name: toolName })
                    pendingToolName = null; pendingToolInputStream = ''; pendingToolInput = undefined
                  } else if (evt && evt.type === 'tool_error') {
                    const seg = (textSegBuf || '').trim()
                    if (seg) {
                      assistantParts.push({ type: 'text', text: seg })
                      textSegBuf = ''
                    }
                    const toolName = ((evt.tool_name || pendingToolName || 'generic') as string)
                    assistantParts.push({ type: `tool-${toolName}`, state: 'output-error', errorText: evt.error, input: pendingToolInput, tool_name: toolName })
                    pendingToolName = null; pendingToolInputStream = ''; pendingToolInput = undefined
                  }
                } catch {}
                controller.enqueue(enc.encode(`data: ${line}\n\n`))
              }
            } else {
              errBuf += ch
            }
          }
          if (errBuf) controller.enqueue(enc.encode(`event: stderr\ndata: ${JSON.stringify(errBuf)}\n\n`))
          try {
            if (reasoningActive) {
              assistantParts.push({ type: 'reasoning', content: reasoningBuf, state: 'done' })
              reasoningActive = false
              reasoningBuf = ''
            }
            const seg = (textSegBuf || '').trim()
            if (seg) assistantParts.push({ type: 'text', text: seg })
            if (assistantParts.length === 0) {
              const onlyText = (assistantTextBuf || '').trim()
              if (onlyText) assistantParts.push({ type: 'text', text: onlyText })
            }
            if (assistantParts.length > 0) {
              await runQuery(
                `INSERT INTO chat.chat_messages (chat_id, role, content, parts) VALUES ($1,'assistant','',$2)`,
                [chatId, JSON.stringify(assistantParts)]
              )
            }
            try { await runQuery('UPDATE chat.chats SET last_message_at = now(), updated_at = now() WHERE id = $1', [chatId]) } catch {}
          } catch {}
          controller.enqueue(enc.encode('event: end\ndata: done\n\n'))
          controller.close()
        } catch (e: any) {
          controller.enqueue(enc.encode(`event: error\ndata: ${JSON.stringify(e?.message || String(e))}\n\n`))
          controller.close()
        }
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } })
  }

  async function chatSlash({ chatId, prompt }: { chatId?: string; prompt?: string }) {
    const enc = new TextEncoder()
    if (!chatId) return new Response(JSON.stringify({ ok: false, error: 'chatId obrigatório' }), { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return new Response(JSON.stringify({ ok: false, error: 'chat não encontrado' }), { status: 404 })
    const slash = (prompt || '').toString().trim()
    if (!slash || !slash.startsWith('/')) return new Response(JSON.stringify({ ok: false, error: 'prompt deve começar com /' }), { status: 400 })
    sess.lastUsedAt = Date.now()

    const runner = getSlashStreamRunnerScript()
    await sess.sandbox.writeFiles([{ path: '/vercel/sandbox/agent-slash-stream.mjs', content: Buffer.from(runner) }])

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const cmd: any = await (sess.sandbox as any).runCommand({
            cmd: 'node',
            args: ['agent-slash-stream.mjs', slash],
            env: {
              ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
              COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY || '',
              // Prefer per-user cookie value when available
              COMPOSIO_USER_ID: (SESSIONS.get(chatId)?.composioUserId || process.env.COMPOSIO_USER_ID || ''),
              COMPOSIO_CONNECTED_ACCOUNT_ID: process.env.COMPOSIO_CONNECTED_ACCOUNT_ID || '',
              COMPOSIO_GMAIL_AUTH_CONFIG_ID: process.env.COMPOSIO_GMAIL_AUTH_CONFIG_ID || '',
              COMPOSIO_CALLBACK_URL: process.env.COMPOSIO_CALLBACK_URL || '',
              MCP_COMPOSIO_ENABLED: (SESSIONS.get(chatId)?.composioEnabled ? '1' : ''),
              AGENT_MODEL: (SESSIONS.get(chatId)?.model || ''),
              AGENT_TOOL_TOKEN: (SESSIONS.get(chatId)?.agentToken) || '',
              AGENT_CHAT_ID: chatId,
              AGENT_BASE_URL: origin,
            },
            detached: true,
          })
          controller.enqueue(enc.encode('event: start\ndata: ok\n\n'))
          let outBuf = ''
          let errBuf = ''
          for await (const log of cmd.logs()) {
            const ch = String(log.data)
            if (log.stream === 'stdout') {
              outBuf += ch
              let idx
              while ((idx = outBuf.indexOf('\n')) >= 0) {
                const line = outBuf.slice(0, idx).trim(); outBuf = outBuf.slice(idx + 1)
                if (!line) continue
                controller.enqueue(enc.encode(`data: ${line}\n\n`))
              }
            } else {
              errBuf += ch
            }
          }
          if (errBuf) controller.enqueue(enc.encode(`event: stderr\ndata: ${JSON.stringify(errBuf)}\n\n`))
          controller.enqueue(enc.encode('event: end\ndata: done\n\n'))
          controller.close()
        } catch (e: any) {
          controller.enqueue(enc.encode(`event: error\ndata: ${JSON.stringify(e?.message || String(e))}\n\n`))
          controller.close()
        }
      }
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } })
  }

  function validatePath(p?: string) {
    const base = '/vercel/sandbox'
    const path = (p || base).toString()
    if (!path.startsWith(base)) return { ok: false as const, error: 'path fora de /vercel/sandbox' }
    if (path.includes('..')) return { ok: false as const, error: 'path inválido' }
    return { ok: true as const, path }
  }

  async function fsList({ chatId, path }: { chatId?: string; path?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    const v = validatePath(path); if (!v.ok) return Response.json({ ok: false, error: v.error }, { status: 400 })
    const target = v.path
    const script = `
const fs = require('fs');
const p = process.env.TARGET_PATH;
try {
  const names = fs.readdirSync(p, { withFileTypes: true }).map(d=>({ name: d.name, type: d.isDirectory()?'dir':'file', path: require('path').join(p, d.name) }));
  const filtered = names.filter(e => (e.name === '.claude' || !e.name.startsWith('.')) && e.name !== 'node_modules' && e.name !== '.cache');
  filtered.sort((a,b)=> a.type===b.type ? a.name.localeCompare(b.name) : (a.type==='dir'?-1:1));
  console.log(JSON.stringify(filtered));
} catch(e){ console.error(String(e.message||e)); process.exit(1); }
`
    const run = await sess.sandbox.runCommand({ cmd: 'node', args: ['-e', script], env: { TARGET_PATH: target } })
    const [out, err] = await Promise.all([run.stdout().catch(()=>''), run.stderr().catch(()=> '')])
    if (run.exitCode !== 0) return Response.json({ ok: false, error: err || out || 'falha ao listar' }, { status: 500 })
    let entries: Array<{ name: string; type: 'file'|'dir'; path: string }> = []
    try { entries = JSON.parse(out) } catch { return Response.json({ ok: false, error: 'json inválido' }, { status: 500 }) }
    return Response.json({ ok: true, path: target, entries })
  }

  async function fsRead({ chatId, path }: { chatId?: string; path?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    const v = validatePath(path); if (!v.ok) return Response.json({ ok: false, error: v.error }, { status: 400 })
    const target = v.path
    const script = `
const fs = require('fs');
const p = process.env.TARGET_PATH;
try {
  const buf = fs.readFileSync(p);
  const isBin = buf.some(b => b===0);
  if (isBin) console.log(JSON.stringify({ isBinary:true, content: buf.toString('base64') }));
  else console.log(JSON.stringify({ isBinary:false, content: buf.toString('utf8') }));
} catch(e){ console.error(String(e.message||e)); process.exit(1); }
`
    const run = await sess.sandbox.runCommand({ cmd: 'node', args: ['-e', script], env: { TARGET_PATH: target } })
    const [out, err] = await Promise.all([run.stdout().catch(()=>''), run.stderr().catch(()=> '')])
    if (run.exitCode !== 0) return Response.json({ ok: false, error: err || out || 'falha ao ler' }, { status: 500 })
    try {
      const parsed = JSON.parse(out)
      return Response.json({ ok: true, path: target, ...parsed })
    } catch { return Response.json({ ok: false, error: 'json inválido' }, { status: 500 }) }
  }

  async function fsWrite({ chatId, path, content }: { chatId?: string; path?: string; content?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    const v = validatePath(path); if (!v.ok) return Response.json({ ok: false, error: v.error }, { status: 400 })
    const target = v.path
    const script = `
const fs = require('fs');
const p = process.env.TARGET_PATH;
try { fs.mkdirSync(require('path').dirname(p), { recursive: true }); fs.writeFileSync(p, process.env.FILE_CONTENT || '', 'utf8'); console.log('ok'); }
catch(e){ console.error(String(e.message||e)); process.exit(1); }
`
    const run = await sess.sandbox.runCommand({ cmd: 'node', args: ['-e', script], env: { TARGET_PATH: target, FILE_CONTENT: content ?? '' } })
    const [out, err] = await Promise.all([run.stdout().catch(()=>''), run.stderr().catch(()=> '')])
    if (run.exitCode !== 0) return Response.json({ ok: false, error: err || out || 'falha ao escrever' }, { status: 500 })
    return Response.json({ ok: true })
  }

  function resolvePatchPath(rawPath?: string) {
    const path = String(rawPath || '').trim()
    if (!path) return { ok: false as const, error: 'operation.path obrigatório' }
    if (path.startsWith('/vercel/sandbox')) return validatePath(path)
    if (path.startsWith('/')) return { ok: false as const, error: 'operation.path absoluto fora do workspace' }
    return validatePath('/vercel/sandbox/' + path.replace(/^\/+/, ''))
  }

  async function fsApplyPatch({ chatId, operation }: { chatId?: string; operation?: any }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })

    const op = (operation && typeof operation === 'object' && operation.operation)
      ? operation.operation
      : operation
    const opType = String(op?.type || '').trim()
    if (!op || !opType) {
      return Response.json({ ok: false, success: false, error: 'operation inválida' }, { status: 400 })
    }
    if (opType !== 'create_file' && opType !== 'update_file' && opType !== 'delete_file') {
      return Response.json({ ok: false, success: false, error: `operation.type não suportado: ${opType}` }, { status: 400 })
    }

    const resolved = resolvePatchPath(String(op?.path || ''))
    if (!resolved.ok) return Response.json({ ok: false, success: false, error: resolved.error }, { status: 400 })
    const targetPath = resolved.path

    const script = `
const fs = require('fs');
const path = require('path');

function fail(msg, code = 1) {
  console.error(String(msg || 'erro'));
  process.exit(code);
}

function parseOperation() {
  try { return JSON.parse(process.env.OPERATION_JSON || '{}'); }
  catch (e) { fail('operation JSON inválido: ' + String(e?.message || e)); }
}

function parseHunks(diffText) {
  const lines = String(diffText || '').replace(/\\r\\n/g, '\\n').split('\\n');
  const hunks = [];
  let i = 0;
  while (i < lines.length && !lines[i].startsWith('@@')) i++;
  while (i < lines.length) {
    const header = lines[i];
    if (!header.startsWith('@@')) { i++; continue; }
    const m = header.match(/^@@\\s*-(\\d+)(?:,(\\d+))?\\s+\\+(\\d+)(?:,(\\d+))?\\s*@@/);
    if (!m) fail('hunk header inválido: ' + header);
    const oldStart = Math.max(1, parseInt(m[1], 10));
    i++;
    const hLines = [];
    while (i < lines.length && !lines[i].startsWith('@@')) {
      const ln = lines[i];
      if (ln.startsWith('\\\\ No newline at end of file')) { i++; continue; }
      if (ln.startsWith('diff --git ') || ln.startsWith('index ') || ln.startsWith('--- ') || ln.startsWith('+++ ')) { i++; continue; }
      const prefix = ln[0];
      if (prefix === ' ' || prefix === '+' || prefix === '-') {
        hLines.push({ prefix, text: ln.slice(1) });
      } else {
        hLines.push({ prefix: ' ', text: ln });
      }
      i++;
    }
    hunks.push({ oldStart, lines: hLines });
  }
  return hunks;
}

function applyHunks(originalContent, hunks) {
  const src = String(originalContent || '').replace(/\\r\\n/g, '\\n').split('\\n');
  const out = [];
  let cursor = 1;
  for (const h of hunks) {
    const start = Math.max(1, Number(h.oldStart || 1));
    if (start > cursor) out.push(...src.slice(cursor - 1, start - 1));
    let pos = start - 1;
    for (const line of (h.lines || [])) {
      if (line.prefix === ' ') {
        out.push(src[pos] !== undefined ? src[pos] : line.text);
        pos += 1;
      } else if (line.prefix === '-') {
        pos += 1;
      } else if (line.prefix === '+') {
        out.push(line.text);
      }
    }
    cursor = pos + 1;
  }
  if (cursor <= src.length) out.push(...src.slice(cursor - 1));
  return out.join('\\n');
}

const op = parseOperation();
const target = process.env.TARGET_PATH || '';
if (!target) fail('TARGET_PATH ausente');

const type = String(op?.type || '');
if (type !== 'create_file' && type !== 'update_file' && type !== 'delete_file') {
  fail('operation.type não suportado: ' + type);
}

if (type === 'delete_file') {
  try {
    if (fs.existsSync(target)) fs.unlinkSync(target);
    console.log(JSON.stringify({ success: true, status: 'completed', output: 'Arquivo removido: ' + target }));
    process.exit(0);
  } catch (e) {
    fail('falha ao remover arquivo: ' + String(e?.message || e));
  }
}

const diff = String(op?.diff || '');
if (!diff.trim()) fail('diff obrigatório para create_file/update_file');

if (type === 'create_file') {
  const hunks = parseHunks(diff);
  let content = '';
  if (hunks.length) {
    content = applyHunks('', hunks);
  } else {
    const lines = diff.replace(/\\r\\n/g, '\\n').split('\\n');
    content = lines.filter((ln) => ln.startsWith('+') && !ln.startsWith('+++')).map((ln) => ln.slice(1)).join('\\n');
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
  console.log(JSON.stringify({ success: true, status: 'completed', output: 'Arquivo criado: ' + target }));
  process.exit(0);
}

if (!fs.existsSync(target)) fail('arquivo não encontrado para update: ' + target);
const current = fs.readFileSync(target, 'utf8');
const hunks = parseHunks(diff);
if (!hunks.length) fail('diff sem hunk @@ para update_file');
const next = applyHunks(current, hunks);
fs.writeFileSync(target, next, 'utf8');
console.log(JSON.stringify({ success: true, status: 'completed', output: 'Arquivo atualizado: ' + target }));
process.exit(0);
`

    const run = await sess.sandbox.runCommand({
      cmd: 'node',
      args: ['-e', script],
      env: {
        TARGET_PATH: targetPath,
        OPERATION_JSON: JSON.stringify(op),
      },
    } as any)
    const [out, err] = await Promise.all([run.stdout().catch(() => ''), run.stderr().catch(() => '')])
    if (run.exitCode !== 0) {
      return Response.json({
        ok: false,
        success: false,
        status: 'failed',
        output: (err || out || 'falha ao aplicar patch').toString().slice(0, 4000),
      })
    }
    let parsed: any = {}
    try { parsed = JSON.parse(String(out || '{}')) } catch {}
    return Response.json({
      ok: true,
      success: true,
      status: parsed?.status || 'completed',
      output: parsed?.output || 'Patch aplicado com sucesso.',
    })
  }

  async function sandboxShell({ chatId, command, cwd }: { chatId?: string; command?: string; cwd?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    const cmd = String(command || '').trim()
    if (!cmd) return Response.json({ ok: false, error: 'command obrigatório' }, { status: 400 })
    const v = validatePath(cwd || '/vercel/sandbox')
    if (!v.ok) return Response.json({ ok: false, error: v.error }, { status: 400 })
    const run = await sess.sandbox.runCommand({
      cmd: 'bash',
      args: ['-lc', cmd],
      cwd: v.path,
    } as any)
    const [stdout, stderr] = await Promise.all([run.stdout().catch(() => ''), run.stderr().catch(() => '')])
    const exitCode = Number(run.exitCode ?? 1)
    return Response.json({
      ok: true,
      success: exitCode === 0,
      exit_code: exitCode,
      cwd: v.path,
      stdout,
      stderr,
    })
  }
}
  async function mcpToggle({ chatId, enabled }: { chatId?: string; enabled?: boolean }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    sess.composioEnabled = Boolean(enabled)
    sess.lastUsedAt = Date.now()
    return Response.json({ ok: true, enabled: sess.composioEnabled })
  }

  async function chatStatus({ chatId }: { chatId?: string }) {
    if (!chatId) return Response.json({ ok: true, status: 'off' as const })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: true, status: 'off' as const })
    const provider = normalizeProvider(sess.provider, sess.model)
    return Response.json({
      ok: true,
      status: 'running' as const,
      chatId,
      provider,
      model: sess.model || null,
      hasOpenAiSandbox: OPENAI_SANDBOXES.has(chatId),
      composioEnabled: Boolean(sess.composioEnabled),
      lastUsedAt: sess.lastUsedAt,
    })
  }

  async function chatSnapshot({ chatId }: { chatId?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    try {
      const t0 = Date.now()
      const snap = await sess.sandbox.snapshot()
      const snapshotId = (snap as any)?.snapshotId || null
      const ms = Date.now() - t0
      try {
        if (snapshotId) await runQuery('UPDATE chat.chats SET snapshot_id = $1, snapshot_at = now() WHERE id = $2', [snapshotId, chatId])
      } catch { /* ignore db errors */ }
      return Response.json({ ok: true, snapshotId, ms })
    } catch (e: any) {
      return Response.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
    }
  }

  async function modelSet({ chatId, model, provider }: { chatId?: string; model?: string; provider?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    const chosenProvider = normalizeProvider(provider, model || sess.model)
    const fallbackModel = chosenProvider === 'openai-responses' ? 'gpt-5.1' : 'claude-haiku-4-5-20251001'
    const chosen = normalizeModel(chosenProvider, model || sess.model || fallbackModel)
    sess.provider = chosenProvider
    sess.model = chosen
    sess.lastUsedAt = Date.now()
    await ensureDashboardSkillInSandbox(sess.sandbox)
    if (chosenProvider === 'openai-responses') {
      // Also pre-warm OpenAI dedicated sandbox (used by streaming runner).
      try { await getOrCreateOpenAiSandbox(chatId) } catch {}
    } else {
      try {
        await sess.sandbox.runCommand({
          cmd: 'node',
          args: ['-e', "const fs=require('fs');fs.mkdirSync('/vercel/sandbox/.claude/skills',{recursive:true});console.log('ok')"],
        })
      } catch {}
    }
    try {
      await runQuery('UPDATE chat.chats SET model = $1, updated_at = now() WHERE id = $2', [chosen, chatId])
    } catch {}
    return Response.json({ ok: true, model: chosen, provider: chosenProvider })
  }
