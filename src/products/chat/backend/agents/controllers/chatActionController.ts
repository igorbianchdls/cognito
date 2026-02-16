import { Sandbox } from '@vercel/sandbox'
import { runQuery } from '@/lib/postgres'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import { getChatStreamRunnerScript, getOpenAIResponsesStreamRunnerScript, getSlashStreamRunnerScript } from '@/products/chat/backend/agents/sandbox/runners/agentRunnerScripts'
import { generateAgentToken, setAgentToken } from '@/products/chat/backend/agents/auth/agentTokenStore'
import { buildClaudeSystemPrompt, buildOpenAiSystemPrompt } from '@/products/chat/backend/agents/prompts/chatSystemPrompts'
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
const DASHBOARD_SKILL_MD = `
# Dashboard Skill (JSON Render + ERP BI)

Objetivo: criar e editar dashboards .jsonr de Vendas, Compras e Financeiro com alta precisao funcional, boa UX e queries compativeis com o backend.

Este skill e obrigatorio para pedidos envolvendo: dashboard, KPI, grafico, filtro, tema, layout, dataQuery, drill, interacao de chart, apps /apps e artefatos JSON Render.

## Principios Nao Negociaveis
- Catalog-first: nunca inventar tabela, medida, dimensao, filtro ou data field.
- Contrato atual e dataQuery (nao SQL puro dentro do JSON).
- Responder com estrutura JSON valida e operacional.
- Priorizar corretude dos dados antes de refinamento visual.
- Evitar mudancas fora do escopo pedido.

## Fonte de Verdade (sempre consultar)
- GET /api/modulos/query/catalog
- GET /api/modulos/query/catalog?module=vendas|compras|financeiro
- GET /api/modulos/query/catalog?table=<tabela> ou ?model=<model>

Use o catalogo para:
- confirmar model canonico
- escolher metricas permitidas (legacyMeasures)
- escolher dimensoes permitidas
- escolher filtros permitidos
- escolher defaultTimeField

Se houver divergencia entre pedido e catalogo: seguir catalogo e explicar ajuste.

## Escopo ERP Suportado (atual)
- vendas.pedidos
- compras.compras
- compras.recebimentos
- financeiro.contas_pagar
- financeiro.contas_receber

## Contrato de Query (obrigatorio)
- Sempre usar dataQuery com:
  - model (obrigatorio)
  - measure (obrigatorio)
  - dimension (opcional; nao usar em KPI agregado)
  - filters (obrigatorio em cenarios reais)
  - orderBy, limit (quando fizer sentido)
  - dimensionExpr (somente quando necessario)
- Nunca usar SQL puro no JSON.
- Em KPI agregado: sem dimension.
- Em chart segmentado: dimension + measure.
- Para serie temporal: preferir dimension = "periodo" quando suportado.
- dimensionExpr e ultima opcao.

## Regras de Filtros
- Sempre incluir filters.tenant_id.
- Quando houver analise temporal:
  - usar filters.de e filters.ate
  - manter coerencia com datePicker (filters.dateRange no estado)
- Para recortes de negocio, usar *_id conforme catalogo (ex.: filial_id, categoria_receita_id etc.).
- Nao inventar filtro fora do catalogo.

## Estrutura JSON Render (padrao recomendado)
1. Theme na raiz (sempre)
2. Header no topo
3. Linha de KPIs principais
4. Linha de filtros (SlicerCard)
5. Linhas de distribuicao (Bar/Pie)
6. Linhas de tendencia temporal (Line/Bar)

Padroes:
- Theme.props.name e Theme.props.headerTheme sempre definidos.
- Header com datePicker quando houver serie temporal.
- Div com childGrow=true para grids fluidos.
- Evitar containers redundantes.

## Componentes e Boas Praticas

### KPI
- Uso: total, contagem, ticket, saldo, valor medio.
- dataQuery sem dimension.
- format coerente (currency/number/percent).

### BarChart / PieChart / LineChart
- Bar/Pie: comparacao por dimensao de negocio.
- Line: evolucao temporal.
- limit padrao de 5-12 conforme caso.
- orderBy normalmente por measure desc (ranking) ou dimension asc (serie temporal).

### SlicerCard
- Preferir source.type = "options" com model + field.
- Evitar URLs hardcoded.
- Para filtros de alto impacto: usar tile-multi ou list com selectAll e search.

### Header
- Usar datePicker visivel quando dashboard for temporal.
- storePath padrao: filters.dateRange.

## Interacoes de Charts (padrao atual)
- Charts podem agir como filtro global via interaction.clickAsFilter.
- Para dimensoes de negocio, definir explicitamente:
  - interaction.filterField
  - interaction.storePath (ex.: filters.cliente_id)
- clearOnSecondClick geralmente true.
- Em chart com drill, definir claramente se clique tambem filtra:
  - interaction.alsoWithDrill (quando aplicavel).

## Drill (quando usar)
- Usar apenas quando ha narrativa hierarquica clara (ex.: filial -> cliente -> vendedor).
- Cada nivel deve ter:
  - label
  - dimension (ou dimensionExpr)
  - filterField (recomendado explicito)
- Nao aplicar drill por padrao em todos os graficos.

## Mapeamento de Negocio -> Query (heuristicas praticas)

### Vendas
- Faturamento por dimensao: preferir SUM(itens.subtotal) quando permitido.
- Faturamento de pedido (KPI): SUM(p.valor_total) quando permitido.
- Pedidos: COUNT()
- Ticket medio: AVG(p.valor_total) quando permitido.

### Compras
- Gasto total: SUM(c.valor_total) quando permitido.
- Ticket medio compras: AVG(c.valor_total) quando permitido.
- Pedidos: COUNT() ou COUNT_DISTINCT(id) conforme catalogo.

### Financeiro
- AP/AR valor total: SUM(valor_liquido) (ou alias permitido no catalogo).
- Titulos: COUNT()
- Dimensoes comuns: categoria, centro, filial, unidade, projeto, status.

Sempre validar no catalogo antes de fixar medida final.

## Processo Obrigatorio (execucao)
1. Entender objetivo do usuario (pergunta de negocio).
2. Identificar modulo(s) e periodo.
3. Consultar catalogo do modulo/tabela.
4. Mapear KPIs e charts necessarios.
5. Definir layout (KPI -> filtros -> distribuicao -> tendencia).
6. Montar dataQuery de cada bloco com tenant_id e periodo.
7. Configurar interacoes/filtros (Slicer + clickAsFilter/drill se aplicavel).
8. Revisar consistencia de formatos, titulos e limites.
9. Validar JSON final.
10. Entregar resposta objetiva com o .jsonr final.

## When User Asks "crie um dashboard completo"
Sem clarificacao extensa, assumir baseline:
- 3 a 5 KPIs
- 1 linha de filtros principais
- 2 a 4 charts de distribuicao
- 1 ou 2 charts de tendencia temporal
- tema padrao consistente

Fazer no maximo 1 pergunta de clarificacao se faltar algo critico:
- modulo principal
- periodo alvo
- objetivo principal (receita, margem, inadimplencia, compras etc.)

## Anti-Erros (proibido)
- Misturar measure de uma tabela com dimension de outra.
- Omitir tenant_id.
- Usar dimension em KPI agregado.
- Usar campo/measure nao existente no catalogo.
- Entregar JSON invalido.
- Responder com pseudo-SQL em vez de dataQuery.
- Ignorar filtros de periodo quando pedido e temporal.

## Checklist Final (obrigatorio)
- JSON valido.
- Theme na raiz.
- Header coerente com periodo.
- Todos dataQuery com model valido.
- Measure valida para cada model.
- Dimension valida (ou ausente em KPI).
- filters.tenant_id presente.
- filtros de periodo coerentes (de/ate) quando aplicavel.
- interaction/drill coerentes e sem conflito.
- Sem SQL puro no JSON.

## Snippet Base (referencia rapida)
~~~json
[
  {
    "type": "Theme",
    "props": { "name": "light", "headerTheme": "light", "managers": {} },
    "children": [
      {
        "type": "Header",
        "props": {
          "title": "Dashboard",
          "datePicker": {
            "visible": true,
            "mode": "range",
            "storePath": "filters.dateRange",
            "actionOnChange": { "type": "refresh_data" }
          }
        }
      }
    ]
  }
]
~~~

Se houver erro de execucao de query, corrigir com base no catalogo (nunca tentativa cega com campos inventados).
`.trim()

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
          const { token, exp } = generateAgentToken(1800)
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
      if (!usedChatSnapshot) try {
        const mk = await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.claude/skills/Tools', { recursive: true });`] })
        timeline.push({ name: 'mkdir-skills-tools', ms: 0, ok: mk.exitCode === 0, exitCode: mk.exitCode })
        const skill = `---\nname: App MCP Tools\ndescription: Uso das tools genéricas via MCP (listar, criar, atualizar, deletar).\n---\n\nAs tools disponíveis (apenas via MCP):\n- listar(input: { resource: string, params?: object, actionSuffix?: string, method?: \"GET\"|\"POST\" })\n- criar(input: { resource: string, data?: object, actionSuffix?: string, method?: \"GET\"|\"POST\" })\n- atualizar(input: { resource: string, data?: object, actionSuffix?: string, method?: \"GET\"|\"POST\" })\n- deletar(input: { resource: string, data?: object, actionSuffix?: string, method?: \"GET\"|\"POST\" })\n\nRECURSOS (resource) SUPORTADOS (use exatamente estes caminhos; não invente nomes):\n- financeiro/contas-financeiras\n- financeiro/categorias-despesa\n- financeiro/categorias-receita\n- financeiro/clientes\n- financeiro/centros-custo\n- financeiro/centros-lucro\n- vendas/pedidos\n- compras/pedidos\n- contas-a-pagar\n- contas-a-receber\n\nRegras:\n- NUNCA use termos genéricos como \"categoria\" ou \"despesa\". Use os caminhos exatos, por exemplo \"financeiro/categorias-despesa\".\n- Prefixe corretamente com o módulo (ex.: \"financeiro/...\").\n- O \"resource\" não pode conter \"..\" e deve iniciar com um dos prefixos: financeiro, vendas, compras, contas-a-pagar, contas-a-receber, estoque, cadastros.\n- Por padrão, listar usa actionSuffix=\"listar\" e criar/atualizar/deletar usam seus sufixos homônimos.\n\nExemplos:\n- Listar contas financeiras:\n  { \"tool\": \"listar\", \"args\": { \"resource\": \"financeiro/contas-financeiras\", \"params\": { \"limit\": 50 } } }\n- Listar categorias de despesa (não use \"categoria\" sozinho):\n  { \"tool\": \"listar\", \"args\": { \"resource\": \"financeiro/categorias-despesa\", \"params\": { \"q\": \"marketing\" } } }\n- Criar centro de custo:\n  { \"tool\": \"criar\", \"args\": { \"resource\": \"financeiro/centros-custo\", \"data\": { \"nome\": \"Marketing\", \"codigo\": \"CC-001\" } } }\n- Atualizar centro de custo:\n  { \"tool\": \"atualizar\", \"args\": { \"resource\": \"financeiro/centros-custo\", \"data\": { \"id\": 123, \"nome\": \"Marketing & Growth\" } } }\n- Deletar centro de custo:\n  { \"tool\": \"deletar\", \"args\": { \"resource\": \"financeiro/centros-custo\", \"data\": { \"id\": 123 } } }\n\nAs chamadas são roteadas para /api/agent-tools/<resource>/<acao> usando as variáveis:\n- $AGENT_BASE_URL\n- $AGENT_TOOL_TOKEN\n- $AGENT_CHAT_ID\n`;
        await sandbox.writeFiles([{ path: '/vercel/sandbox/.claude/skills/Tools/SKILL.md', content: Buffer.from(skill) }])
      } catch {}
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
      // Seed Composio MCP server file
      try {
        await sandbox.runCommand({ cmd: 'node', args: ['-e', `require('fs').mkdirSync('/vercel/sandbox/.mcp', { recursive: true });`] })
        const mcpComposio = `import { Composio } from '@composio/core';\nimport { ClaudeAgentSDKProvider } from '@composio/claude-agent-sdk';\nimport { createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';\nlet server = null;\ntry {\n  const apiKey = process.env.COMPOSIO_API_KEY || '';\n  const provider = new ClaudeAgentSDKProvider();\n  const composio = new Composio({ apiKey, provider });\n  const externalUserId = process.env.COMPOSIO_USER_ID || process.env.AGENT_CHAT_ID || ('composio-' + Date.now());\n  // Restrict to Gmail toolkit and only the fetch emails tool (read-only)\n  const session = await composio.create(String(externalUserId), {\n    toolkits: ['gmail'],\n    tools: { gmail: ['GMAIL_FETCH_EMAILS'] },\n    tags: ['readOnlyHint']\n  });\n  const tools = await session.tools();\n  server = createSdkMcpServer({ name: 'composio', version: '1.0.0', tools });\n} catch (e) {\n  // Fallback: export empty server if auth/config fails\n  server = createSdkMcpServer({ name: 'composio', version: '1.0.0', tools: [] });\n}\nexport const composioServer = server;\nexport default composioServer;\n`;
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
          mcpERP = mcpERP.replace(
            'export const mcpERPServer = createSdkMcpServer({',
            "async function callWorkspace(args){ const base = process.env.AGENT_BASE_URL || ''; const token = process.env.AGENT_TOOL_TOKEN || ''; const chatId = process.env.AGENT_CHAT_ID || ''; if (!base || !token || !chatId) { return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:'configuração ausente', tool:'workspace' }) }] }; } try { const url = (base || '') + '/api/agent-tools/workspace/crud'; const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + token, 'x-chat-id': chatId, 'x-tenant-id': (process.env.AGENT_TENANT_ID || '1') }, body: JSON.stringify(args || {}) }); let raw = ''; try { raw = await res.text(); } catch {} let data = {}; try { data = JSON.parse(raw); } catch {} const out = (data && (data.result !== undefined ? data.result : data)) || {}; if (!res.ok) { const err = { success:false, status:res.status, error:(out?.error || out?.message || raw || res.statusText || 'workspace error') }; return { content: [{ type:'text', text: JSON.stringify(err) }] }; } return { content: [{ type:'text', text: JSON.stringify(out) }] }; } catch(e) { return { content: [{ type: 'text', text: JSON.stringify({ success:false, error:String(e?.message || e) }) }] }; } }\nexport const mcpERPServer = createSdkMcpServer({"
          );
          // Inject unified CRUD tool into ERP server tools list (no other changes)
          mcpERP = mcpERP.replace(
            'tools: [',
            "tools: [ tool('crud','Executa ações CRUD genéricas', { action: z.enum(['listar','criar','atualizar','deletar']), resource: z.string().optional(), path: z.string().optional(), params: z.any().optional(), data: z.any().optional(), actionSuffix: z.string().optional(), method: z.enum(['GET','POST']).optional(), }, async (args) => callBridge({ action: args.action, args })), tool('workspace','Acessa email/drive, URL de arquivo e envio de email com anexo', { action: z.enum(['request','read_file','get_drive_file_url','send_email']).default('request'), method: z.enum(['GET','POST','DELETE']).optional(), resource: z.string().optional(), params: z.any().optional(), data: z.any().optional(), file_id: z.string().optional(), mode: z.enum(['auto','text','binary']).optional(), inbox_id: z.string().optional(), inboxId: z.string().optional(), to: z.any().optional(), cc: z.any().optional(), bcc: z.any().optional(), labels: z.any().optional(), subject: z.string().optional(), text: z.string().optional(), html: z.string().optional(), attachments: z.any().optional(), attachment_url: z.string().optional(), signed_url: z.string().optional(), filename: z.string().optional(), content_type: z.string().optional(), content_disposition: z.string().optional(), content_id: z.string().optional(), }, async (args) => callWorkspace(args)), "
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
      // Resolve Composio user id: prefer cookie, else DB lookup via Supabase auth
      let composioUserId: string | undefined
      try {
        const cookie = (req.headers.get('cookie') || '').toString()
        const m = cookie.match(/(?:^|;\s*)composio_uid=([^;]+)/)
        if (m && m[1]) composioUserId = decodeURIComponent(m[1])
      } catch {}
      if (!composioUserId) {
        try {
          const supabase = await createSupabaseServerClient()
          const { data: { user } } = await supabase.auth.getUser()
          const uid = user?.id?.toString().trim()
          if (uid) {
            const rows = await runQuery<{ composio_user_id: string | null }>(
              'SELECT composio_user_id FROM shared.users WHERE id = $1', [uid]
            )
            const cid = (rows && rows[0] && rows[0].composio_user_id) ? String(rows[0].composio_user_id).trim() : ''
            if (cid) composioUserId = cid
          }
        } catch {}
      }
      // Issue short-lived agent token (opaque) and store
      const { token, exp } = generateAgentToken(1800)
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
