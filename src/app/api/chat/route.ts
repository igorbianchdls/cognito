import { Sandbox } from '@vercel/sandbox'
import { getChatStreamRunnerScript, getSlashStreamRunnerScript } from './agent'
import { generateAgentToken, setAgentToken } from './tokenStore'

export const runtime = 'nodejs'

type Msg = { role: 'user'|'assistant'; content: string }

// Simple in-memory session store
type ChatSession = { id: string; sandbox: Sandbox; createdAt: number; lastUsedAt: number; agentToken?: string; agentTokenExp?: number; composioEnabled?: boolean; model?: string }
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
  if (action === 'mcp-toggle') return mcpToggle(payload as { chatId?: string; enabled?: boolean })
  if (action === 'model-set') return modelSet(payload as { chatId?: string; model?: string })

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
      const install = await sandbox.runCommand({ cmd: 'npm', args: ['install', '@anthropic-ai/claude-agent-sdk', '@anthropic-ai/claude-code', 'zod', '@composio/core', '@composio/claude-agent-sdk'] })
      timeline.push({ name: 'install', ms: Date.now() - t1, ok: install.exitCode === 0, exitCode: install.exitCode })
      if (install.exitCode !== 0) {
        const [o, e] = await Promise.all([install.stdout().catch(() => ''), install.stderr().catch(() => '')])
        await sandbox.stop().catch(() => {})
        return Response.json({ ok: false, error: 'install failed', stdout: o, stderr: e, timeline }, { status: 500 })
      }
      // Seed a single Tools Skill to document generic MCP tools
      try {
        const mk = await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.claude/skills/Tools', { recursive: true });`] })
        timeline.push({ name: 'mkdir-skills-tools', ms: 0, ok: mk.exitCode === 0, exitCode: mk.exitCode })
        const skill = `---\nname: App MCP Tools\ndescription: Uso das tools genéricas via MCP (listar, criar, atualizar, deletar).\n---\n\nAs tools disponíveis (apenas via MCP):\n- listar(input: { resource: string, params?: object, actionSuffix?: string, method?: \"GET\"|\"POST\" })\n- criar(input: { resource: string, data?: object, actionSuffix?: string, method?: \"GET\"|\"POST\" })\n- atualizar(input: { resource: string, data?: object, actionSuffix?: string, method?: \"GET\"|\"POST\" })\n- deletar(input: { resource: string, data?: object, actionSuffix?: string, method?: \"GET\"|\"POST\" })\n\nRECURSOS (resource) SUPORTADOS (use exatamente estes caminhos; não invente nomes):\n- financeiro/contas-financeiras\n- financeiro/categorias-despesa\n- financeiro/categorias-receita\n- financeiro/clientes\n- financeiro/centros-custo\n- financeiro/centros-lucro\n- vendas/pedidos\n- compras/pedidos\n- contas-a-pagar\n- contas-a-receber\n\nRegras:\n- NUNCA use termos genéricos como \"categoria\" ou \"despesa\". Use os caminhos exatos, por exemplo \"financeiro/categorias-despesa\".\n- Prefixe corretamente com o módulo (ex.: \"financeiro/...\").\n- O \"resource\" não pode conter \"..\" e deve iniciar com um dos prefixos: financeiro, vendas, compras, contas-a-pagar, contas-a-receber, estoque, cadastros.\n- Por padrão, listar usa actionSuffix=\"listar\" e criar/atualizar/deletar usam seus sufixos homônimos.\n\nExemplos:\n- Listar contas financeiras:\n  { \"tool\": \"listar\", \"args\": { \"resource\": \"financeiro/contas-financeiras\", \"params\": { \"limit\": 50 } } }\n- Listar categorias de despesa (não use \"categoria\" sozinho):\n  { \"tool\": \"listar\", \"args\": { \"resource\": \"financeiro/categorias-despesa\", \"params\": { \"q\": \"marketing\" } } }\n- Criar centro de custo:\n  { \"tool\": \"criar\", \"args\": { \"resource\": \"financeiro/centros-custo\", \"data\": { \"nome\": \"Marketing\", \"codigo\": \"CC-001\" } } }\n- Atualizar centro de custo:\n  { \"tool\": \"atualizar\", \"args\": { \"resource\": \"financeiro/centros-custo\", \"data\": { \"id\": 123, \"nome\": \"Marketing & Growth\" } } }\n- Deletar centro de custo:\n  { \"tool\": \"deletar\", \"args\": { \"resource\": \"financeiro/centros-custo\", \"data\": { \"id\": 123 } } }\n\nAs chamadas são roteadas para /api/agent-tools/<resource>/<acao> usando as variáveis:\n- $AGENT_BASE_URL\n- $AGENT_TOOL_TOKEN\n- $AGENT_CHAT_ID\n`;
        await sandbox.writeFiles([{ path: '/vercel/sandbox/.claude/skills/Tools/SKILL.md', content: Buffer.from(skill) }])
      } catch {}
      // Seed default JSON Render dashboards (.jsonr)
      try {
        const vendasObj = [
          { type: 'Theme', props: { name: 'light' }, children: [
            { type: 'Header', props: { title: 'Dashboard de Vendas', subtitle: 'Principais indicadores e cortes', align: 'center', datePicker: { visible: true, mode: 'range', position: 'right', storePath: 'filters.dateRange', actionOnChange: { type: 'refresh_data' }, style: { padding: 6, fontFamily: 'Barlow', fontSize: 12 } } } },
            { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
              { type: 'KPI', props: { title: 'Vendas', format: 'currency', dataQuery: { model: 'vendas.pedidos', measure: 'SUM(p.valor_total)', filters: { tenant_id: 1 } }, containerStyle: { borderWidth: 2, borderColor: '#0ea5e9', borderRadius: 12 }, titleStyle: { fontWeight: 600, fontSize: 12, color: '#64748b' }, valueStyle: { fontWeight: 700, fontSize: 24, color: '#0f172a' } } },
              { type: 'KPI', props: { title: 'Pedidos', format: 'number', dataQuery: { model: 'vendas.pedidos', measure: 'COUNT()', filters: { tenant_id: 1 } }, containerStyle: { borderWidth: 2, borderColor: '#22c55e', borderStyle: 'dashed', borderRadius: 10 } } },
              { type: 'KPI', props: { title: 'Ticket Médio', format: 'currency', dataQuery: { model: 'vendas.pedidos', measure: 'AVG(p.valor_total)', filters: { tenant_id: 1 } }, titleStyle: { fontWeight: 600 }, valueStyle: { fontSize: 22 }, containerStyle: { borderWidth: 2, borderColor: '#f59e0b', borderStyle: 'dotted', borderRadius: 8 } } }
            ] },
            { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
              { type: 'PieChart', props: { fr: 1, title: 'Canais', containerStyle: { borderWidth: 2, borderColor: '#0ea5e9', borderRadius: 12 }, dataQuery: { model: 'vendas.pedidos', dimension: 'canal_venda', measure: 'SUM(itens.subtotal)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 6 }, format: 'currency', height: 240 } },
              { type: 'BarChart', props: { fr: 2, title: 'Categorias', containerStyle: { borderWidth: 2, borderColor: '#10b981', borderStyle: 'dashed', borderRadius: 10 }, dataQuery: { model: 'vendas.pedidos', dimension: 'categoria_receita', measure: 'SUM(itens.subtotal)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 6 }, format: 'currency', height: 240, nivo: { layout: 'horizontal' } } },
              { type: 'SlicerCard', props: { fr: 1, title: 'Filtro de Canais', fields: [ { label: 'Canal', type: 'list', storePath: 'filters.canal_venda_id', source: { type: 'api', url: '/api/modulos/vendas/options?field=canal_venda_id&limit=50' }, selectAll: true, clearable: true } ], containerStyle: { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12 } } },
              { type: 'BarChart', props: { fr: 2, title: 'Clientes', containerStyle: { borderWidth: 3, borderColor: '#f59e0b', borderStyle: 'solid', borderRadius: 6 }, dataQuery: { model: 'vendas.pedidos', dimension: 'cliente', measure: 'SUM(itens.subtotal)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 5 }, format: 'currency', height: 240, nivo: { layout: 'horizontal' } } }
            ] },
            { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
              { type: 'BarChart', props: { fr: 1, title: 'Vendedores', containerStyle: { borderWidth: 2, borderColor: '#8b5cf6', borderRadius: 10 }, dataQuery: { model: 'vendas.pedidos', dimension: 'vendedor', measure: 'SUM(itens.subtotal)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 6 }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } },
              { type: 'BarChart', props: { fr: 1, title: 'Filiais', containerStyle: { borderWidth: 2, borderColor: '#ef4444', borderStyle: 'dotted', borderRadius: 12 }, dataQuery: { model: 'vendas.pedidos', dimension: 'filial', measure: 'SUM(itens.subtotal)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 6 }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } },
              { type: 'BarChart', props: { fr: 1, title: 'Unidades de Negócio', containerStyle: { borderWidth: 1, borderColor: '#334155', borderStyle: 'solid', borderRadius: 8 }, dataQuery: { model: 'vendas.pedidos', dimension: 'unidade_negocio', measure: 'SUM(itens.subtotal)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 6 }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } }
            ] }
          ] }
        ];
        const comprasObj = [
          { type: 'Theme', props: { name: 'light' }, children: [
            { type: 'Header', props: { title: 'Dashboard de Compras', subtitle: 'Principais indicadores e cortes', align: 'center', datePicker: { visible: true, mode: 'range', position: 'right', storePath: 'filters.dateRange', actionOnChange: { type: 'refresh_data' }, style: { padding: 6, fontFamily: 'Barlow', fontSize: 12 } } } },
            { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
              { type: 'KPI', props: { title: 'Gasto', format: 'currency', dataQuery: { model: 'compras.compras', measure: 'SUM(valor_total)', filters: { tenant_id: 1 } }, titleStyle: { fontWeight: 600, fontSize: 12, color: '#64748b' }, valueStyle: { fontWeight: 700, fontSize: 24, color: '#0f172a' } } },
              { type: 'KPI', props: { title: 'Fornecedores', format: 'number', dataQuery: { model: 'compras.compras', measure: 'COUNT_DISTINCT(fornecedor_id)', filters: { tenant_id: 1 } } } },
              { type: 'KPI', props: { title: 'Pedidos', format: 'number', dataQuery: { model: 'compras.compras', measure: 'COUNT_DISTINCT(id)', filters: { tenant_id: 1 } }, valueStyle: { fontSize: 22 } } },
              { type: 'KPI', props: { title: 'Transações', format: 'number', dataQuery: { model: 'compras.recebimentos', measure: 'COUNT()', filters: { tenant_id: 1 } } } }
            ] },
            { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
              { type: 'BarChart', props: { fr: 1, title: 'Fornecedores', dataQuery: { model: 'compras.compras', dimension: 'fornecedor', measure: 'SUM(valor_total)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 }, format: 'currency', height: 240, nivo: { layout: 'horizontal' } } },
              { type: 'BarChart', props: { fr: 1, title: 'Centros de Custo', dataQuery: { model: 'compras.compras', dimension: 'centro_custo', measure: 'SUM(valor_total)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 }, format: 'currency', height: 240, nivo: { layout: 'horizontal' } } },
              { type: 'SlicerCard', props: { fr: 1, title: 'Filtro Centro de Custo', fields: [ { label: 'Centro de Custo', type: 'list', storePath: 'filters.centro_custo_id', source: { type: 'api', url: '/api/modulos/compras/options?field=centro_custo_id&limit=100' }, selectAll: true } ], containerStyle: { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 12 } } },
              { type: 'BarChart', props: { fr: 1, title: 'Filiais', dataQuery: { model: 'compras.compras', dimension: 'filial', measure: 'SUM(valor_total)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 }, format: 'currency', height: 240, nivo: { layout: 'horizontal' } } }
            ] },
            { type: 'Div', props: { direction: 'row', gap: 12, padding: 16, justify: 'start', align: 'start', childGrow: true }, children: [
              { type: 'BarChart', props: { fr: 1, title: 'Categorias', dataQuery: { model: 'compras.compras', dimension: 'categoria_despesa', measure: 'SUM(valor_total)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } },
              { type: 'BarChart', props: { fr: 1, title: 'Projetos', dataQuery: { model: 'compras.compras', dimension: 'projeto', measure: 'SUM(valor_total)', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 }, format: 'currency', height: 220, nivo: { layout: 'horizontal' } } },
              { type: 'BarChart', props: { fr: 1, title: 'Status (Qtd)', dataQuery: { model: 'compras.compras', dimension: 'status', measure: 'COUNT()', filters: { tenant_id: 1 }, orderBy: { field: 'measure', dir: 'desc' }, limit: 8 }, format: 'number', height: 220, nivo: { layout: 'horizontal' } } }
            ] }
          ] }
        ];
        const seedDash = `const fs=require('fs');const p=process.env.TARGET;fs.mkdirSync(p,{recursive:true});const w=(f,c)=>{if(!fs.existsSync(f))fs.writeFileSync(f,c,'utf8');};w(p+'/vendas.jsonr',process.env.VENDAS_JSONR||'[]');w(p+'/compras.jsonr',process.env.COMPRAS_JSONR||'[]');console.log('ok');`;
        const runSeed = await sandbox.runCommand({ cmd: 'node', args: ['-e', seedDash], env: { TARGET: '/vercel/sandbox/dashboards', VENDAS_JSONR: JSON.stringify(vendasObj), COMPRAS_JSONR: JSON.stringify(comprasObj) } })
        timeline.push({ name: 'seed-jsonr', ms: 0, ok: runSeed.exitCode === 0, exitCode: runSeed.exitCode })
      } catch {}
      // Seed Composio MCP server file
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpComposio = `import { Composio } from '@composio/core';\nimport { ClaudeAgentSDKProvider } from '@composio/claude-agent-sdk';\nimport { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';\nlet server = null;\ntry {\n  const apiKey = process.env.COMPOSIO_API_KEY || '';\n  const provider = new ClaudeAgentSDKProvider();\n  const composio = new Composio({ apiKey, provider });\n  const externalUserId = process.env.COMPOSIO_USER_ID || process.env.AGENT_CHAT_ID || ('composio-' + Date.now());\n  const session = await composio.create(String(externalUserId));\n  const tools = await session.tools();\n  server = createSdkMcpServer({ name: 'composio', version: '1.0.0', tools });\n} catch (e) {\n  // Fallback: export empty server if auth/config fails\n  server = createSdkMcpServer({ name: 'composio', version: '1.0.0', tools: [] });\n}\nexport const composioServer = server;\nexport default composioServer;\n`;
        await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/composio.mjs', content: Buffer.from(mcpComposio) }])
      } catch {}
      // Seed MCP test tools server file
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpContent = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';\nimport { z } from 'zod';\nexport const appToolsServer = createSdkMcpServer({\n  name: 'app-tools',\n  version: '1.0.0',\n  tools: [\n    tool('get_weather','Get current temperature (mock)', { city: z.string().optional() }, async (args) => {\n      const city = (args && args.city) || 'Local';\n      return { content: [{ type: 'text', text: 'Temperatura em ' + city + ': 25°C' }] };\n    }),\n    tool('echo_text','Echo the provided text', { text: z.string() }, async (args) => {\n      const t = (args && args.text) || '';\n      return { content: [{ type: 'text', text: String(t) }] };\n    }),\n    tool('buscar_fornecedor','Buscar fornecedor no ERP (via HTTP bridge)', {\n      query: z.string().optional(),\n      cnpj: z.string().optional(),\n      nome: z.string().optional(),\n      limite: z.number().int().positive().max(10000).optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para buscar_fornecedor (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/contas-a-pagar/buscar-fornecedor';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de buscar_fornecedor disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar buscar_fornecedor: ' + String(e?.message || e) }] };\n      }\n    }),\n    tool('get_contas_pagar','Listar contas a pagar', {\n      status: z.string().optional(),\n      fornecedor_id: z.string().optional(),\n      vence_em_dias: z.number().optional(),\n      venceu_ha_dias: z.number().optional(),\n      data_vencimento_de: z.string().optional(),\n      data_vencimento_ate: z.string().optional(),\n      data_emissao_de: z.string().optional(),\n      data_emissao_ate: z.string().optional(),\n      valor_minimo: z.number().optional(),\n      valor_maximo: z.number().optional(),\n      limit: z.number().int().positive().max(500).optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para get_contas_pagar (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/contas-a-pagar/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de get_contas_pagar disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar get_contas_pagar: ' + String(e?.message || e) }] };\n      }\n    }),\n    tool('get_contas_receber','Listar contas a receber', {\n      status: z.string().optional(),\n      cliente_id: z.string().optional(),\n      vence_em_dias: z.number().optional(),\n      venceu_ha_dias: z.number().optional(),\n      data_vencimento_de: z.string().optional(),\n      data_vencimento_ate: z.string().optional(),\n      data_emissao_de: z.string().optional(),\n      data_emissao_ate: z.string().optional(),\n      valor_minimo: z.number().optional(),\n      valor_maximo: z.number().optional(),\n      limit: z.number().int().positive().max(500).optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para get_contas_receber (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/contas-a-receber/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de get_contas_receber disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar get_contas_receber: ' + String(e?.message || e) }] };\n      }\n    })\n  ]\n});\nexport default appToolsServer;\n`;
        // await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/app-tools.mjs', content: Buffer.from(mcpContent) }])
      } catch {}
      // Seed extra MCP server file (vendas/compras)
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpExtra = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';\nimport { z } from 'zod';\nexport const appToolsServerExtra = createSdkMcpServer({\n  name: 'app-tools-extra',\n  version: '1.0.0',\n  tools: [\n    tool('get_vendas','Listar pedidos de vendas', {\n      page: z.number().optional(),\n      pageSize: z.number().optional(),\n      de: z.string().optional(),\n      ate: z.string().optional(),\n      status: z.string().optional(),\n      cliente_id: z.string().optional(),\n      vendedor_id: z.string().optional(),\n      canal_venda_id: z.string().optional(),\n      valor_min: z.number().optional(),\n      valor_max: z.number().optional(),\n      q: z.string().optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para get_vendas (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/vendas/pedidos/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de get_vendas disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar get_vendas: ' + String(e?.message || e) }] };\n      }\n    }),\n    tool('get_compras','Listar pedidos de compra', {\n      limit: z.number().optional(),\n      status: z.string().optional(),\n      fornecedor_id: z.string().optional(),\n      condicao_pagamento_id: z.string().optional(),\n      valor_min: z.number().optional(),\n      valor_max: z.number().optional(),\n      de: z.string().optional(),\n      ate: z.string().optional(),\n      q: z.string().optional(),\n    }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || '';\n      const token = process.env.AGENT_TOOL_TOKEN || '';\n      const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) {\n        return { content: [{ type: 'text', text: 'Configuração ausente para get_compras (AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID)'}] };\n      }\n      try {\n        const url = (base || '') + '/api/agent-tools/compras/pedidos/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({}));\n        const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [\n          { type: 'text', text: (out && out.message) ? String(out.message) : 'Resultado de get_compras disponível.' },\n          { type: 'text', text: JSON.stringify(out) }\n        ] }\n      } catch (e) {\n        return { content: [{ type: 'text', text: 'Erro ao chamar get_compras: ' + String(e?.message || e) }] };\n      }\n    })\n  ]\n});\nexport default appToolsServerExtra;\n`;
        // await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/app-tools-extra.mjs', content: Buffer.from(mcpExtra) }])
      } catch {}
      // Seed finance MCP server file (contas/categorias + lookups)
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpFinance = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';\nimport { z } from 'zod';\nexport const appToolsServerFinance = createSdkMcpServer({\n  name: 'app-tools-finance',\n  version: '1.0.0',\n  tools: [\n    tool('get_contas_financeiras','Listar contas financeiras', { q: z.string().optional(), de: z.string().optional(), ate: z.string().optional(), ativo: z.boolean().optional(), page: z.number().optional(), pageSize: z.number().optional(), limit: z.number().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para get_contas_financeiras' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/contas-financeiras/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: (out && out.message) ? String(out.message) : 'Contas financeiras' }, { type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar get_contas_financeiras: ' + String(e?.message || e) }] }; }\n    }),\n    tool('get_categorias_despesa','Listar categorias de despesa', { q: z.string().optional(), de: z.string().optional(), ate: z.string().optional(), page: z.number().optional(), pageSize: z.number().optional(), limit: z.number().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para get_categorias_despesa' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/categorias-despesa/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: (out && out.message) ? String(out.message) : 'Categorias de despesa' }, { type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar get_categorias_despesa: ' + String(e?.message || e) }] }; }\n    }),\n    tool('get_categorias_receita','Listar categorias de receita', { q: z.string().optional(), de: z.string().optional(), ate: z.string().optional(), ativo: z.boolean().optional(), page: z.number().optional(), pageSize: z.number().optional(), limit: z.number().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para get_categorias_receita' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/categorias-receita/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: (out && out.message) ? String(out.message) : 'Categorias de receita' }, { type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar get_categorias_receita: ' + String(e?.message || e) }] }; }\n    }),\n    tool('get_clientes','Listar clientes', { q: z.string().optional(), limit: z.number().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para get_clientes' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/clientes/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: (out && out.message) ? String(out.message) : 'Clientes' }, { type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar get_clientes: ' + String(e?.message || e) }] }; }\n    }),\n    tool('get_centros_custo','Listar centros de custo', { q: z.string().optional(), de: z.string().optional(), ate: z.string().optional(), ativo: z.boolean().optional(), page: z.number().optional(), pageSize: z.number().optional(), limit: z.number().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para get_centros_custo' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/centros-custo/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: (out && out.message) ? String(out.message) : 'Centros de Custo' }, { type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar get_centros_custo: ' + String(e?.message || e) }] }; }\n    }),\n    tool('get_centros_lucro','Listar centros de lucro', { q: z.string().optional(), de: z.string().optional(), ate: z.string().optional(), ativo: z.boolean().optional(), page: z.number().optional(), pageSize: z.number().optional(), limit: z.number().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para get_centros_lucro' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/centros-lucro/listar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: (out && out.message) ? String(out.message) : 'Centros de Lucro' }, { type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar get_centros_lucro: ' + String(e?.message || e) }] }; }\n    })\n  ]\n});\nexport default appToolsServerFinance;\n`;
        // await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/app-tools-finance.mjs', content: Buffer.from(mcpFinance) }])
      } catch {}
      // Seed generic MCP server file (listar/criar/atualizar/deletar)
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpGeneric = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';\nimport { z } from 'zod';\nconst SAFE_PREFIXES = ['financeiro', 'vendas', 'compras', 'contas-a-pagar', 'contas-a-receber', 'estoque', 'cadastros'];\nfunction isSafeResource(res){\n  try {\n    if (!res || typeof res !== 'string') return false;\n    if (res.includes('..')) return false;\n    const clean = res.replace(/^\\/+|\\/+$/g,'');\n    return SAFE_PREFIXES.some(p=> clean === p || clean.startsWith(p + '/'));\n  } catch { return false }\n}\nfunction buildUrl(base, res, suffix){\n  const cleanRes = String(res || '').replace(/^\\/+|\\/+$/g,'');\n  const cleanSuf = String(suffix || '').replace(/^\\/+|\\/+$/g,'');\n  return (base || '') + '/api/agent-tools/' + cleanRes + '/' + cleanSuf;\n}\nasync function callBridge({ action, args }){\n  const base = process.env.AGENT_BASE_URL || '';\n  const token = process.env.AGENT_TOOL_TOKEN || '';\n  const chatId = process.env.AGENT_CHAT_ID || '';\n  if (!base || !token || !chatId) {\n    return { content: [{ type: 'text', text: 'Configuração ausente (' + action + '): AGENT_BASE_URL/AGENT_TOOL_TOKEN/AGENT_CHAT_ID' }] };\n  }\n  const resPath = (args && (args.resource || args.path || args.endpoint)) || '';\n  if (!isSafeResource(resPath)) {\n    return { content: [{ type: 'text', text: 'Recurso não permitido: ' + String(resPath) }] };\n  }\n  const method = (args && args.method && typeof args.method === 'string' ? args.method.toUpperCase() : 'POST');\n  const headers = { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId };\n  const doFetch = async (suffix, bodyObj) => {\n    const url = buildUrl(base, resPath, suffix);\n    const init = method === 'GET' ? { method, headers } : { method, headers, body: JSON.stringify(bodyObj || {}) };\n    const res = await fetch(url, init);\n    const data = await res.json().catch(() => ({}));\n    const out = (data && (data.result !== undefined ? data.result : data)) || {};\n    return { ok: res.ok, out, status: res.status };\n  };\n  try {\n    if (action === 'listar') {\n      const suffix = (args && args.actionSuffix) || 'listar';\n      const { ok, out, status } = await doFetch(suffix, (args && args.params) || {});\n      if (!ok) return { content: [{ type: 'text', text: 'Erro ao listar (' + status + ')' }] };\n      return { content: [ { type: 'text', text: 'Listagem disponível.' }, { type: 'json', json: out } ] };\n    } else if (action === 'criar') {\n      const suffix = (args && args.actionSuffix) || 'criar';\n      const { ok, out, status } = await doFetch(suffix, (args && args.data) || {});\n      if (!ok) return { content: [{ type: 'text', text: 'Erro ao criar (' + status + ')' }] };\n      return { content: [ { type: 'text', text: 'Criação realizada.' }, { type: 'json', json: out } ] };\n    } else if (action === 'atualizar') {\n      // Try common suffixes if not provided\n      const suffixes = (args && args.actionSuffix) ? [String(args.actionSuffix)] : ['atualizar','editar','update','edit'];\n      const payload = (args && args.data) || {}\n      for (const suf of suffixes) {\n        const { ok, out } = await doFetch(suf, payload);\n        if (ok) return { content: [ { type: 'text', text: 'Atualização realizada.' }, { type: 'json', json: out } ] };\n      }\n      return { content: [{ type: 'text', text: 'Falha ao atualizar (nenhum sufixo aceito)'}] };\n    } else if (action === 'deletar') {\n      const suffixes = (args && args.actionSuffix) ? [String(args.actionSuffix)] : ['deletar','delete'];\n      const payload = (args && args.data) || {}\n      for (const suf of suffixes) {\n        const { ok, out } = await doFetch(suf, payload);\n        if (ok) return { content: [ { type: 'text', text: 'Exclusão realizada.' }, { type: 'json', json: out } ] };\n      }\n      return { content: [{ type: 'text', text: 'Falha ao deletar (nenhum sufixo aceito)'}] };\n    }\n    return { content: [{ type: 'text', text: 'Ação desconhecida: ' + String(action) }] };\n  } catch(e) {\n    return { content: [{ type: 'text', text: 'Erro: ' + String(e?.message || e) }] };\n  }\n}\nexport const appToolsServerGeneric = createSdkMcpServer({\n  name: 'app-tools-generic',\n  version: '1.0.0',\n  tools: [\n    tool('listar','Listar recursos genericamente', {\n      resource: z.string().optional(),\n      path: z.string().optional(),\n      params: z.any().optional(),\n      actionSuffix: z.string().optional(),\n      method: z.enum(['GET','POST']).optional(),\n    }, async (args) => callBridge({ action: 'listar', args })),\n    tool('criar','Criar recursos genericamente', {\n      resource: z.string().optional(),\n      path: z.string().optional(),\n      data: z.any().optional(),\n      actionSuffix: z.string().optional(),\n      method: z.enum(['GET','POST']).optional(),\n    }, async (args) => callBridge({ action: 'criar', args })),\n    tool('atualizar','Atualizar recursos genericamente', {\n      resource: z.string().optional(),\n      path: z.string().optional(),\n      data: z.any().optional(),\n      actionSuffix: z.string().optional(),\n      method: z.enum(['GET','POST']).optional(),\n    }, async (args) => callBridge({ action: 'atualizar', args })),\n    tool('deletar','Deletar recursos genericamente', {\n      resource: z.string().optional(),\n      path: z.string().optional(),\n      data: z.any().optional(),\n      actionSuffix: z.string().optional(),\n      method: z.enum(['GET','POST']).optional(),\n    }, async (args) => callBridge({ action: 'deletar', args })),\n  ]\n});\nexport default appToolsServerGeneric;\n`;
        // await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/app-tools-generic.mjs', content: Buffer.from(mcpGeneric) }])
        const mcpGeneric2 = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';\nimport { z } from 'zod';\nconst SAFE_PREFIXES = ['financeiro', 'vendas', 'compras', 'contas-a-pagar', 'contas-a-receber', 'estoque', 'cadastros'];\nfunction isSafeResource(res){ try { if (!res || typeof res !== 'string') return false; if (res.includes('..')) return false; const clean = res.replace(/^\\/+|\\/+$/g,''); return SAFE_PREFIXES.some(p=> clean === p || clean.startsWith(p + '/')); } catch { return false } }\nfunction buildUrl(base, res, suffix){ const cleanRes = String(res || '').replace(/^\\/+|\\/+$/g,''); const cleanSuf = String(suffix || '').replace(/^\\/+|\\/+$/g,''); return (base || '') + '/api/agent-tools/' + cleanRes + '/' + cleanSuf; }\nasync function callBridge({ action, args }){ const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || ''; if (!base || !token || !chatId) { return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'configuração ausente', action }) }] }; } const resPath = (args && (args.resource || args.path || args.endpoint)) || ''; if (!isSafeResource(resPath)) { return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'recurso não permitido', resource: String(resPath) }) }] }; } const method = (args && args.method && typeof args.method === 'string' ? args.method.toUpperCase() : 'POST'); const headers = { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId, 'x-tenant-id': (process.env.AGENT_TENANT_ID || '1') }; const doFetch = async (suffix, bodyObj) => { const url = buildUrl(base, resPath, suffix); const init = method === 'GET' ? { method, headers } : { method, headers, body: JSON.stringify(bodyObj || {}) }; const res = await fetch(url, init); let raw = ''; try { raw = await res.text(); } catch {} let data = {}; try { data = JSON.parse(raw); } catch {} const out = (data && (data.result !== undefined ? data.result : data)) || {}; return { ok: res.ok, out, status: res.status, rawText: raw, statusText: (res.statusText || '') }; }; try { if (action === 'listar') { const suffix = (args && args.actionSuffix) || 'listar'; const { ok, out, status, rawText, statusText } = await doFetch(suffix, (args && args.params) || {}); const payload = ok ? out : { success:false, error: (out?.error || out?.message || rawText || statusText || 'erro ao listar'), status }; return { content: [ { type: 'text', text: JSON.stringify(payload) } ] }; } else if (action === 'criar') { const suffix = (args && args.actionSuffix) || 'criar'; const { ok, out, status, rawText, statusText } = await doFetch(suffix, (args && args.data) || {}); const payload = ok ? out : { success:false, error: (out?.error || out?.message || rawText || statusText || 'erro ao criar'), status }; return { content: [ { type: 'text', text: JSON.stringify(payload) } ] }; } else if (action === 'atualizar') { const suffixes = (args && args.actionSuffix) ? [String(args.actionSuffix)] : ['atualizar','editar','update','edit']; const payloadIn = (args && args.data) || {}; for (const suf of suffixes) { const { ok, out, rawText, statusText } = await doFetch(suf, payloadIn); if (ok) return { content: [ { type: 'text', text: JSON.stringify(out) } ] }; } return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'falha ao atualizar' }) }] }; } else if (action === 'deletar') { const suffixes = (args && args.actionSuffix) ? [String(args.actionSuffix)] : ['deletar','delete']; const payloadIn = (args && args.data) || {}; for (const suf of suffixes) { const { ok, out, status, rawText, statusText } = await doFetch(suf, payloadIn); if (ok) return { content: [ { type: 'text', text: JSON.stringify(out) } ] }; const payloadErr = { success:false, error: (out?.error || out?.message || rawText || statusText || 'falha ao deletar'), status }; return { content: [ { type: 'text', text: JSON.stringify(payloadErr) } ] }; } return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'falha ao deletar' }) }] }; } return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'ação desconhecida', action }) }] }; } catch(e) { return { content: [{ type: 'text', text: JSON.stringify({ success:false, error: String(e?.message || e) }) }] }; } }\nexport const appToolsServerGeneric2 = createSdkMcpServer({ name: 'app-tools-generic2', version: '1.0.0', tools: [ ] });\nexport default appToolsServerGeneric2;\n`;
        // await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/app-tools-generic2.mjs', content: Buffer.from(mcpGeneric2) }])
        try {
          let mcpERP = mcpGeneric2
            .replace("name: 'app-tools-generic2'", "name: 'ERP'")
            .replace('export const appToolsServerGeneric2', 'export const mcpERPServer')
            .replace('export default appToolsServerGeneric2', 'export default mcpERPServer');
          // Inject unified CRUD tool into ERP server tools list (no other changes)
          mcpERP = mcpERP.replace(
            'tools: [',
            "tools: [ tool('crud','Executa ações CRUD genéricas', { action: z.enum(['listar','criar','atualizar','deletar']), resource: z.string().optional(), path: z.string().optional(), params: z.any().optional(), data: z.any().optional(), actionSuffix: z.string().optional(), method: z.enum(['GET','POST']).optional(), }, async (args) => callBridge({ action: args.action, args })), "
          );
          // (listar removida diretamente no template mcpGeneric2 abaixo)
          await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/ERP.mjs', content: Buffer.from(mcpERP) }])
        } catch {}
      } catch {}
      // Seed finance create MCP server (criar_cliente/fornecedor/custo/lucro criam diretamente)
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpFinanceCreate = `import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';\nimport { z } from 'zod';\nexport const appToolsServerFinanceCreate = createSdkMcpServer({\n  name: 'app-tools-finance-create',\n  version: '1.0.0',\n  tools: [\n    tool('criar_centro_custo','Criar Centro de Custo (criação imediata)', { nome: z.string(), codigo: z.string().optional(), descricao: z.string().optional(), ativo: z.boolean().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para criar_centro_custo' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/centros-custo/criar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar criar_centro_custo: ' + String(e?.message || e) }] }; }\n    }),\n    tool('criar_cliente','Criar Cliente (criação imediata)', { nome: z.string(), cpf_cnpj: z.string().optional(), tipo_pessoa: z.enum(['fisica','juridica']).optional(), endereco: z.string().optional(), telefone: z.string().optional(), email: z.string().optional(), observacoes: z.string().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para criar_cliente' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/clientes/criar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar criar_cliente: ' + String(e?.message || e) }] }; }\n    }),\n    tool('criar_fornecedor','Criar Fornecedor (criação imediata)', { nome: z.string(), cnpj: z.string().optional(), endereco: z.string().optional(), telefone: z.string().optional(), email: z.string().optional(), observacoes: z.string().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para criar_fornecedor' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/fornecedores/criar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar criar_fornecedor: ' + String(e?.message || e) }] }; }\n    }),\n    tool('criar_centro_lucro','Criar Centro de Lucro (criação imediata)', { nome: z.string(), codigo: z.string().optional(), descricao: z.string().optional(), ativo: z.boolean().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para criar_centro_lucro' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/centros-lucro/criar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar criar_centro_lucro: ' + String(e?.message || e) }] }; }\n    }),\n    tool('criar_categoria_despesa','Criar Categoria de Despesa (imediato)', { nome: z.string(), codigo: z.string().optional(), descricao: z.string().optional(), tipo: z.enum(['operacional','financeira','outras']).optional(), plano_conta_id: z.number().optional(), ativo: z.boolean().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para criar_categoria_despesa' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/categorias-despesa/criar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar criar_categoria_despesa: ' + String(e?.message || e) }] }; }\n    }),\n    tool('criar_categoria_receita','Criar Categoria de Receita (imediato)', { nome: z.string(), codigo: z.string().optional(), descricao: z.string().optional(), tipo: z.enum(['operacional','financeira','outras']).optional(), plano_conta_id: z.number().optional(), ativo: z.boolean().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para criar_categoria_receita' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/categorias-receita/criar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar criar_categoria_receita: ' + String(e?.message || e) }] }; }\n    }),\n    tool('criar_conta_financeira','Criar Conta Financeira (imediato)', { nome_conta: z.string(), tipo_conta: z.string().optional(), agencia: z.string().optional(), numero_conta: z.string().optional(), pix_chave: z.string().optional(), saldo_inicial: z.number().optional(), data_abertura: z.string().optional(), ativo: z.boolean().optional() }, async (args) => {\n      const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || '';\n      if (!base || !token || !chatId) return { content: [{ type: 'text', text: 'Configuração ausente para criar_conta_financeira' }] };\n      try {\n        const url = (base || '') + '/api/agent-tools/financeiro/contas-financeiras/criar';\n        const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId }, body: JSON.stringify(args || {}) });\n        const data = await res.json().catch(() => ({})); const out = (data && (data.result !== undefined ? data.result : data)) || {};\n        return { content: [{ type: 'text', text: JSON.stringify(out) }] }\n      } catch (e) { return { content: [{ type: 'text', text: 'Erro ao chamar criar_conta_financeira: ' + String(e?.message || e) }] }; }\n    })\n  ]\n});\nexport default appToolsServerFinanceCreate;\n`;
        // await sandbox.writeFiles([{ path: '/vercel/sandbox/.mcp/app-tools-finance-create.mjs', content: Buffer.from(mcpFinanceCreate) }])
      } catch {}
      const id = genId()
      // Issue short-lived agent token (opaque) and store
      const { token, exp } = generateAgentToken(1800)
      SESSIONS.set(id, { id, sandbox, createdAt: Date.now(), lastUsedAt: Date.now(), agentToken: token, agentTokenExp: exp, composioEnabled: false, model: 'claude-haiku-4-5-20251001' })
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
    const lines: string[] = []
    lines.push('You are a helpful assistant. Continue the conversation.')
    if (SESSIONS.get(chatId)?.composioEnabled) {
      lines.push('Prioritize the ERP MCP tool "crud" for ERP-related operations. You MAY also use the Composio MCP tools for external actions (e.g., email, calendar, SaaS integrations) when explicitly requested or clearly required.')
    } else {
      lines.push('Use ONLY the ERP MCP tool "crud". Strictly follow the resource list and naming below. Do not invent resources.')
    }
    lines.push('ERP Tool (invoke with tool_use):')
    lines.push('- crud(input: { action: "listar"|"criar"|"atualizar"|"deletar", resource: string, params?: object, data?: object, actionSuffix?: string, method?: "GET"|"POST" })')
    lines.push('Allowed top-level ERP prefixes: financeiro, vendas, compras, contas-a-pagar, contas-a-receber, estoque, cadastros.')
    lines.push('Canonical ERP resources (use EXACT strings):')
    lines.push('- financeiro/contas-financeiras')
    lines.push('- financeiro/categorias-despesa')
    lines.push('- financeiro/categorias-receita')
    lines.push('- financeiro/clientes')
    lines.push('- financeiro/centros-custo')
    lines.push('- financeiro/centros-lucro')
    lines.push('- vendas/pedidos')
    lines.push('- compras/pedidos')
    lines.push('- contas-a-pagar')
    lines.push('- contas-a-receber')
    lines.push('ERP Guidelines:')
    lines.push('- NEVER use vague terms like "categoria" or "despesa". Always use canonical paths (e.g., "financeiro/categorias-despesa").')
    lines.push('- Always include the correct module prefix (e.g., "financeiro/...").')
    lines.push('- resource must not contain ".." and must start with one of the allowed prefixes.')
    if (SESSIONS.get(chatId)?.composioEnabled) {
      lines.push('Composio MCP (external tools) Guidelines:')
      lines.push('- Use Composio tools only for external actions (email/calendar/SaaS), not for ERP CRUD.')
      lines.push('- Read the tool schema and provide required fields; ask for any missing critical info.')
      lines.push('- Before irreversible actions (e.g., sending email), summarize intent and ask for confirmation when appropriate.')
      lines.push('- Keep outputs concise and relevant; include IDs/links returned by the tool when helpful.')
    }
    lines.push('')
    lines.push('Conversation:')
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
              COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY || '',
              COMPOSIO_USER_ID: process.env.COMPOSIO_USER_ID || '',
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
              COMPOSIO_API_KEY: process.env.COMPOSIO_API_KEY || '',
              COMPOSIO_USER_ID: process.env.COMPOSIO_USER_ID || '',
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
}
  async function mcpToggle({ chatId, enabled }: { chatId?: string; enabled?: boolean }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    sess.composioEnabled = Boolean(enabled)
    sess.lastUsedAt = Date.now()
    return Response.json({ ok: true, enabled: sess.composioEnabled })
  }

  async function modelSet({ chatId, model }: { chatId?: string; model?: string }) {
    if (!chatId) return Response.json({ ok: false, error: 'chatId obrigatório' }, { status: 400 })
    const sess = SESSIONS.get(chatId)
    if (!sess) return Response.json({ ok: false, error: 'chat não encontrado' }, { status: 404 })
    const raw = (model || '').toString().trim().toLowerCase()
    const map: Record<string, string> = {
      'sonnet': 'claude-sonnet-4-5-20251001',
      'sonnet-4.5': 'claude-sonnet-4-5-20251001',
      'claude-sonnet-4-5-20251001': 'claude-sonnet-4-5-20251001',
      'haiku': 'claude-haiku-4-5-20251001',
      'haiku-4.5': 'claude-haiku-4-5-20251001',
      'claude-haiku-4-5-20251001': 'claude-haiku-4-5-20251001',
    }
    const chosen = map[raw] || sess.model || 'claude-haiku-4-5-20251001'
    sess.model = chosen
    sess.lastUsedAt = Date.now()
    return Response.json({ ok: true, model: chosen })
  }
