import { Sandbox } from '@vercel/sandbox'
import { getChatStreamRunnerScript, getSlashStreamRunnerScript } from './agent'
import { generateAgentToken, setAgentToken } from './tokenStore'

export const runtime = 'nodejs'

type Msg = { role: 'user'|'assistant'; content: string }

// Simple in-memory session store
type ChatSession = { id: string; sandbox: Sandbox; createdAt: number; lastUsedAt: number; agentToken?: string; agentTokenExp?: number }
const SESSIONS = new Map<string, ChatSession>()
const genId = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

export async function POST(req: Request) {
  const enc = new TextEncoder()
  const { action, ...payload } = await req.json().catch(() => ({})) as any
  const origin = (() => { try { return new URL((req as any).url).origin } catch { return process.env.NEXT_PUBLIC_BASE_URL || '' } })()
  if (!action || typeof action !== 'string') {
    return Response.json({ ok: false, error: 'action inválida' }, { status: 400 })
  }

  if (action === 'chat-start') return chatStart()
  if (action === 'chat-stop') return chatStop(payload as { chatId?: string })
  if (action === 'chat-send-stream') return chatSendStream(payload as { chatId?: string; history?: Msg[] })
  if (action === 'chat-slash') return chatSlash(payload as { chatId?: string; prompt?: string })
  if (action === 'fs-list') return fsList(payload as { chatId?: string; path?: string })
  if (action === 'fs-read') return fsRead(payload as { chatId?: string; path?: string })
  if (action === 'fs-write') return fsWrite(payload as { chatId?: string; path?: string; content?: string })

  return Response.json({ ok: false, error: `ação desconhecida: ${action}` }, { status: 400 })

  async function chatStart() {
    let sandbox: Sandbox | undefined
    const timeline: Array<{ name: string; ms: number; ok: boolean; exitCode?: number }> = []
    const t0 = Date.now()
    try {
      sandbox = await Sandbox.create({ runtime: 'node22', resources: { vcpus: 2 }, timeout: 600_000 })
      timeline.push({ name: 'create-sandbox', ms: Date.now() - t0, ok: true })
      const t1 = Date.now()
      // Install Agent SDK + CLI + zod (for MCP schemas)
      const install = await sandbox.runCommand({ cmd: 'npm', args: ['install', '@anthropic-ai/claude-agent-sdk', '@anthropic-ai/claude-code', 'zod'] })
      timeline.push({ name: 'install', ms: Date.now() - t1, ok: install.exitCode === 0, exitCode: install.exitCode })
      if (install.exitCode !== 0) {
        const [o, e] = await Promise.all([install.stdout().catch(() => ''), install.stderr().catch(() => '')])
        await sandbox.stop().catch(() => {})
        return Response.json({ ok: false, error: 'install failed', stdout: o, stderr: e, timeline }, { status: 500 })
      }
      // Seed a single Tools Skill to document app tools usage
      try {
        const mk = await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.claude/skills/Tools', { recursive: true });`] })
        timeline.push({ name: 'mkdir-skills-tools', ms: 0, ok: mk.exitCode === 0, exitCode: mk.exitCode })
        const skill = `---\nname: Tools\ndescription: Coleção de ferramentas do aplicativo acessíveis via HTTP bridge.\n---\n\nUse esta Skill para chamar as ferramentas do app. Sempre envie UM objeto JSON no input com o formato:\n\n{\n  \"tool\": \"<nome-da-tool>\",\n  \"args\": { /* parâmetros da tool */ }\n}\n\nExemplos:\n- Buscar fornecedor por nome:\n  { \"tool\": \"buscarFornecedor\", \"args\": { \"query\": \"ACME LTDA\", \"limite\": 20 } }\n- Buscar fornecedor por CNPJ:\n  { \"tool\": \"buscarFornecedor\", \"args\": { \"cnpj\": \"12.345.678/0001-90\" } }\n\nAs chamadas são feitas para a API do app usando variáveis de ambiente:\n- $AGENT_BASE_URL\n- $AGENT_TOOL_TOKEN\n- $AGENT_CHAT_ID\n`;
        await sandbox.writeFiles([{ path: '/vercel/sandbox/.claude/skills/Tools/SKILL.md', content: Buffer.from(skill) }])
      } catch {}
      // Seed MCP test tools server file
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpContent = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';\nimport { z } from 'zod';\nexport const appToolsServer = createSdkMcpServer({\n  name: 'app-tools',\n  version: '1.0.0',\n  tools: [\n    tool('get_weather','Get current temperature (mock)', { city: z.string().optional() }, async (args) => {\n      const city = (args && args.city) || 'Local';\n      return { content: [{ type: 'text', text: 'Temperatura em ' + city + ': 25°C' }] };\n    }),\n    tool('echo_text','Echo the provided text', { text: z.string() }, async (args) => {\n      const t = (args && args.text) || '';\n      return { content: [{ type: 'text', text: String(t) }] };\n    }),\n    tool('buscar_fornecedor','Buscar fornecedor no ERP (via HTTP bridge)', {\n      query: z.string().optional(),\n      cnpj: z.string().optional(),\n      nome: z.string().optional(),\n      limite: z.number().int().positive().max(10000).optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para buscar_fornecedor (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/contas-a-pagar/buscar-fornecedor';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de buscar_fornecedor disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar buscar_fornecedor: ' + String(e?.message || e) }] };\n      }\n    }),\n    tool('get_contas_pagar','Listar contas a pagar', {\n      status: z.string().optional(),\n      fornecedor_id: z.string().optional(),\n      vence_em_dias: z.number().optional(),\n      venceu_ha_dias: z.number().optional(),\n      data_vencimento_de: z.string().optional(),\n      data_vencimento_ate: z.string().optional(),\n      data_emissao_de: z.string().optional(),\n      data_emissao_ate: z.string().optional(),\n      valor_minimo: z.number().optional(),\n      valor_maximo: z.number().optional(),\n      limit: z.number().int().positive().max(500).optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para get_contas_pagar (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/contas-a-pagar/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de get_contas_pagar disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar get_contas_pagar: ' + String(e?.message || e) }] };\n      }\n    }),\n    tool('get_contas_receber','Listar contas a receber', {\n      status: z.string().optional(),\n      cliente_id: z.string().optional(),\n      vence_em_dias: z.number().optional(),\n      venceu_ha_dias: z.number().optional(),\n      data_vencimento_de: z.string().optional(),\n      data_vencimento_ate: z.string().optional(),\n      data_emissao_de: z.string().optional(),\n      data_emissao_ate: z.string().optional(),\n      valor_minimo: z.number().optional(),\n      valor_maximo: z.number().optional(),\n      limit: z.number().int().positive().max(500).optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para get_contas_receber (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/contas-a-receber/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de get_contas_receber disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar get_contas_receber: ' + String(e?.message || e) }] };\n      }\n    })\n  ]\n});\nexport default appToolsServer;\n`;
        await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/app-tools.mjs', content: Buffer.from(mcpContent) }])
      } catch {}
      // Seed extra MCP server file (vendas/compras)
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpExtra = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';\nimport { z } from 'zod';\nexport const appToolsServerExtra = createSdkMcpServer({\n  name: 'app-tools-extra',\n  version: '1.0.0',\n  tools: [\n    tool('get_vendas','Listar pedidos de vendas', {\n      page: z.number().optional(),\n      pageSize: z.number().optional(),\n      de: z.string().optional(),\n      ate: z.string().optional(),\n      status: z.string().optional(),\n      cliente_id: z.string().optional(),\n      vendedor_id: z.string().optional(),\n      canal_venda_id: z.string().optional(),\n      valor_min: z.number().optional(),\n      valor_max: z.number().optional(),\n      q: z.string().optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para get_vendas (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/vendas/pedidos/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de get_vendas disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar get_vendas: ' + String(e?.message || e) }] };\n      }\n    }),\n    tool('get_compras','Listar pedidos de compra', {\n      limit: z.number().optional(),\n      status: z.string().optional(),\n      fornecedor_id: z.string().optional(),\n      condicao_pagamento_id: z.string().optional(),\n      valor_min: z.number().optional(),\n      valor_max: z.number().optional(),\n      de: z.string().optional(),\n      ate: z.string().optional(),\n      q: z.string().optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para get_compras (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/compras/pedidos/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de get_compras disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar get_compras: ' + String(e?.message || e) }] };\n      }\n    })\n  ]\n});\nexport default appToolsServerExtra;\n`;
        await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/app-tools-extra.mjs', content: Buffer.from(mcpExtra) }])
      } catch {}
      // Seed finance MCP server file (contas/categorias)
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpFinance = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';\nimport { z } from 'zod';\nexport const appToolsServerFinance = createSdkMcpServer({\n  name: 'app-tools-finance',\n  version: '1.0.0',\n  tools: [\n    tool('get_contas_financeiras','Listar contas financeiras', {\n      q: z.string().optional(), de: z.string().optional(), ate: z.string().optional(), ativo: z.boolean().optional(), page: z.number().optional(), pageSize: z.number().optional(), limit: z.number().optional()\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para get_contas_financeiras' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/contas-financeiras/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: (out && out.message) ? String(out.message) : 'Contas financeiras' }, { type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar get_contas_financeiras: ' + String(e?.message || e) }] }; }\n    }),\n    tool('get_categorias_despesa','Listar categorias de despesa', {\n      q: z.string().optional(), de: z.string().optional(), ate: z.string().optional(), page: z.number().optional(), pageSize: z.number().optional(), limit: z.number().optional()\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para get_categorias_despesa' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/categorias-despesa/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: (out && out.message) ? String(out.message) : 'Categorias de despesa' }, { type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar get_categorias_despesa: ' + String(e?.message || e) }] }; }\n    }),\n    tool('get_categorias_receita','Listar categorias de receita', {\n      q: z.string().optional(), de: z.string().optional(), ate: z.string().optional(), ativo: z.boolean().optional(), page: z.number().optional(), pageSize: z.number().optional(), limit: z.number().optional()\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para get_categorias_receita' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/categorias-receita/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: (out && out.message) ? String(out.message) : 'Categorias de receita' }, { type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar get_categorias_receita: ' + String(e?.message || e) }] }; }\n    })\n  ]\n});\nexport default appToolsServerFinance;\n`;
        await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/app-tools-finance.mjs', content: Buffer.from(mcpFinance) }])
      } catch {}
      const id = genId()
      // Issue short-lived agent token (opaque) and store
      const { token, exp } = generateAgentToken(1800)
      SESSIONS.set(id, { id, sandbox, createdAt: Date.now(), lastUsedAt: Date.now(), agentToken: token, agentTokenExp: exp })
      setAgentToken(id, token, exp)
      return Response.json({ ok: true, chatId: id, timeline })
    } catch (e) {
      try { await sandbox?.stop() } catch {}
      return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
    }
  }

  async function chatStop({ chatId }: { chatId?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    try { await sess.sandbox.stop() } catch {}
    SESSIONS.delete(chatId)
    return Response.json({ ok: true })
  }

  async function chatSendStream({ chatId, history }: { chatId?: string; history?: Msg[] }) {
    if (!chatId) return new Response(JSON.stringify({ ok: false, error: 'chatId obrigatório' }), { status: 400 })
    if (!Array.isArray(history) || !history.length) return new Response(JSON.stringify({ ok: false, error: 'history vazio' }), { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return new Response(JSON.stringify({ ok: false, error: 'chat não encontrado' }), { status: 404 })
    sess.lastUsedAt = Date.now()
    const lines: string[] = [
      'You are a helpful assistant. Continue the conversation.',
      'Available application tools (invoke with tool_use):',
      '- buscarFornecedor(input: { query?: string, cnpj?: string, nome?: string, limite?: number }) — use to list suppliers when the user asks about fornecedores.',
      '- get_contas_pagar(input: { status?: string, fornecedor_id?: string, data_vencimento_de?: string, data_vencimento_ate?: string, limit?: number }) — use to list contas a pagar per user request.',
      '- get_contas_receber(input: { status?: string, cliente_id?: string, data_vencimento_de?: string, data_vencimento_ate?: string, limit?: number }) — use to list contas a receber per user request.',
      '- get_vendas(input: { de?: string, ate?: string, status?: string, cliente_id?: string, vendedor_id?: string, canal_venda_id?: string, valor_min?: number, valor_max?: number, pageSize?: number }) — use to list sales orders (pedidos de venda).',
      '- get_compras(input: { de?: string, ate?: string, status?: string, fornecedor_id?: string, condicao_pagamento_id?: string, valor_min?: number, valor_max?: number, limit?: number }) — use to list purchase orders (pedidos de compra).',
      '- get_contas_financeiras(input: { q?: string, ativo?: boolean, de?: string, ate?: string, pageSize?: number }) — list bank/cash accounts.',
      '- get_categorias_despesa(input: { q?: string, de?: string, ate?: string, pageSize?: number }) — list expense categories.',
      '- get_categorias_receita(input: { q?: string, ativo?: boolean, de?: string, ate?: string, pageSize?: number }) — list revenue categories.',
      'When the user asks for fornecedores, emit a tool_use with name "buscarFornecedor" and a reasonable JSON input (e.g., {"query":"<user term>","limite":20}). For financial lists, call get_contas_pagar/get_contas_receber with appropriate filters; do not simulate results — call the tool and then summarize.',
      '',
      'Conversation:'
    ]
    for (const m of history.slice(-12)) lines.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    lines.push('Assistant:')
    const prompt = lines.join('\n').slice(0, 6000)
    const runner = getChatStreamRunnerScript()
    await sess.sandbox.writeFiles([{ path: '/vercel/sandbox/agent-chat-stream.mjs', content: Buffer.from(runner) }])
    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const cmd: any = await (sess.sandbox as any).runCommand({
            cmd: 'node',
            args: ['agent-chat-stream.mjs', prompt],
            env: {
              ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
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
}
