import { randomUUID } from 'crypto'
import { generateAgentToken, setAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type RelaySession = {
  conversationId: string
  lastResponseId: string | null
  updatedAt: number
}

type JsonObject = Record<string, unknown>

type OpenAiResponse = {
  id?: string
  output?: unknown[]
  output_text?: string
}

type FunctionCallItem = {
  callId: string
  name: string
  argumentsText: string
}

type ToolTraceEntry = {
  tool: string
  ok: boolean
  input: unknown
  output: unknown
}

const SESSIONS = new Map<string, RelaySession>()
const SESSION_TTL_MS = 6 * 60 * 60 * 1000
const SAFE_PREFIXES = ['financeiro', 'vendas', 'compras', 'contas-a-pagar', 'contas-a-receber', 'crm', 'estoque', 'cadastros']
const CRUD_CANONICAL_RESOURCES = [
  'financeiro/contas-financeiras',
  'financeiro/categorias-despesa',
  'financeiro/categorias-receita',
  'financeiro/clientes',
  'financeiro/centros-custo',
  'financeiro/centros-lucro',
  'vendas/pedidos',
  'compras/pedidos',
  'contas-a-pagar',
  'contas-a-receber',
  'crm/contas',
  'crm/contatos',
  'crm/leads',
  'crm/oportunidades',
  'crm/atividades',
  'estoque/almoxarifados',
  'estoque/movimentacoes',
  'estoque/estoque-atual',
  'estoque/tipos-movimentacao',
]

function nowMs() {
  return Date.now()
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function toPositiveInt(value: unknown, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const i = Math.trunc(n)
  return i > 0 ? i : fallback
}

function toObject(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as JsonObject
}

function cleanupSessions() {
  const cutoff = nowMs() - SESSION_TTL_MS
  for (const [key, item] of SESSIONS.entries()) {
    if (item.updatedAt < cutoff) SESSIONS.delete(key)
  }
}

function getSession(conversationId: string): RelaySession {
  cleanupSessions()
  const existing = SESSIONS.get(conversationId)
  if (existing) {
    existing.updatedAt = nowMs()
    return existing
  }
  const created: RelaySession = {
    conversationId,
    lastResponseId: null,
    updatedAt: nowMs(),
  }
  SESSIONS.set(conversationId, created)
  return created
}

function getOrigin(req: Request): string {
  try {
    return new URL(req.url).origin
  } catch {
    return toText(process.env.NEXT_PUBLIC_BASE_URL) || 'http://localhost:3000'
  }
}

function parseJsonMaybe(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function safeToolOutput(input: unknown): unknown {
  if (input == null) return null
  if (typeof input === 'string') return input.slice(0, 1200)
  if (typeof input === 'number' || typeof input === 'boolean') return input
  try {
    const text = JSON.stringify(input)
    if (text.length <= 1200) return input
    return { preview: text.slice(0, 1200), truncated: true }
  } catch {
    return { preview: '[unserializable output]' }
  }
}

function isSafeResource(resourceRaw: unknown): boolean {
  const resource = toText(resourceRaw).replace(/^\/+|\/+$/g, '')
  if (!resource || resource.includes('..')) return false
  return SAFE_PREFIXES.some((prefix) => resource === prefix || resource.startsWith(prefix + '/'))
}

function buildAgentToolsUrl(origin: string, resource: string, suffix: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '')
  const cleanResource = resource.replace(/^\/+|\/+$/g, '')
  const cleanSuffix = suffix.replace(/^\/+|\/+$/g, '')
  return `${cleanOrigin}/api/agent-tools/${cleanResource}/${cleanSuffix}`
}

function resolveCrudSuffix(actionRaw: unknown, explicitSuffixRaw: unknown): string {
  const explicitSuffix = toText(explicitSuffixRaw)
  if (explicitSuffix) return explicitSuffix
  const action = toText(actionRaw).toLowerCase()
  if (action === 'criar') return 'criar'
  if (action === 'atualizar') return 'atualizar'
  if (action === 'deletar') return 'deletar'
  if (action === 'aprovar') return 'aprovar'
  if (action === 'concluir') return 'concluir'
  if (action === 'baixar') return 'baixar'
  if (action === 'estornar') return 'estornar'
  if (action === 'cancelar') return 'cancelar'
  if (action === 'reabrir') return 'reabrir'
  if (action === 'marcar_como_recebido') return 'marcar_como_recebido'
  if (action === 'marcar_recebimento_parcial') return 'marcar_recebimento_parcial'
  return 'listar'
}

type CrudToolAction =
  | 'listar'
  | 'criar'
  | 'atualizar'
  | 'deletar'
  | 'cancelar'
  | 'baixar'
  | 'estornar'
  | 'reabrir'
  | 'aprovar'
  | 'concluir'
  | 'marcar_como_recebido'
  | 'marcar_recebimento_parcial'

type CrudActionRule = {
  actions: CrudToolAction[]
  blockedMessages?: Partial<Record<CrudToolAction, { code: string; error: string; suggested_action?: CrudToolAction }>>
}

const DEFAULT_CRUD_ACTIONS: CrudToolAction[] = ['listar', 'criar', 'atualizar', 'deletar']

const CRUD_RESOURCE_ACTION_RULES: Array<{ match: RegExp; rule: CrudActionRule }> = [
  {
    match: /^vendas\/pedidos$/,
    rule: {
      actions: ['listar', 'criar', 'atualizar', 'aprovar', 'concluir', 'cancelar', 'reabrir'],
      blockedMessages: {
        deletar: {
          code: 'CRUD_ACTION_NOT_ALLOWED_FOR_RESOURCE',
          error: 'vendas/pedidos é transacional; use action="cancelar" (ou atualizar status="cancelado") em vez de deletar.',
          suggested_action: 'cancelar',
        },
      },
    },
  },
  {
    match: /^compras\/pedidos$/,
    rule: {
      actions: ['listar', 'criar', 'atualizar', 'aprovar', 'cancelar', 'reabrir', 'marcar_como_recebido', 'marcar_recebimento_parcial'],
      blockedMessages: {
        deletar: {
          code: 'CRUD_ACTION_NOT_ALLOWED_FOR_RESOURCE',
          error: 'compras/pedidos é transacional; use action="cancelar" (ou atualizar status="cancelado") em vez de deletar.',
          suggested_action: 'cancelar',
        },
      },
    },
  },
  {
    match: /^contas-a-pagar$/,
    rule: {
      actions: ['listar', 'criar', 'atualizar', 'baixar', 'estornar', 'cancelar', 'reabrir'],
      blockedMessages: {
        deletar: {
          code: 'CRUD_ACTION_NOT_ALLOWED_FOR_RESOURCE',
          error: 'contas-a-pagar é transacional; use action="baixar", "estornar", "cancelar" ou "reabrir" em vez de deletar.',
          suggested_action: 'cancelar',
        },
      },
    },
  },
  {
    match: /^contas-a-receber$/,
    rule: {
      actions: ['listar', 'criar', 'atualizar', 'baixar', 'estornar', 'cancelar', 'reabrir'],
      blockedMessages: {
        deletar: {
          code: 'CRUD_ACTION_NOT_ALLOWED_FOR_RESOURCE',
          error: 'contas-a-receber é transacional; use action="baixar", "estornar", "cancelar" ou "reabrir" em vez de deletar.',
          suggested_action: 'cancelar',
        },
      },
    },
  },
]

function getCrudActionRule(resourceRaw: unknown): CrudActionRule {
  const resource = toText(resourceRaw).replace(/^\/+|\/+$/g, '')
  const found = CRUD_RESOURCE_ACTION_RULES.find((entry) => entry.match.test(resource))
  return found?.rule || { actions: DEFAULT_CRUD_ACTIONS }
}

function normalizeCrudRelaySuccess(
  outRaw: unknown,
  meta: { status: number; action: string; resource: string },
) {
  const out = normalizeRelayToolSuccess(outRaw, { tool: 'crud', status: meta.status }) as Record<string, unknown>
  const message = toText(out.message) || undefined
  const payloadData = Object.prototype.hasOwnProperty.call(out, 'data') ? out.data : outRaw
  return {
    ...out,
    action: meta.action,
    resource: meta.resource,
    result: {
      success: typeof out.success === 'boolean' ? out.success : true,
      message,
      data: payloadData,
    },
  }
}

function normalizeCrudRelayError(input: {
  status: number
  code?: string
  error: string
  action: string
  resource: string
  allowedActions?: string[]
  suggestedAction?: string
}) {
  return {
    success: false,
    status: input.status,
    code: input.code,
    error: input.error,
    action: input.action,
    resource: input.resource,
    result: {
      success: false,
      message: input.error,
      data: {
        action: input.action,
        resource: input.resource,
        allowed_actions: input.allowedActions,
        suggested_action: input.suggestedAction,
      },
    },
    meta: { tool: 'crud', status: input.status },
  }
}

async function parseJsonResponse(res: Response) {
  const raw = await res.text().catch(() => '')
  let data: JsonObject = {}
  try {
    data = JSON.parse(raw)
  } catch {
    data = {}
  }
  return { raw, data }
}

function normalizeRelayToolSuccess(outRaw: unknown, meta: { tool: string; status: number }) {
  const out: Record<string, unknown> = (outRaw && typeof outRaw === 'object' && !Array.isArray(outRaw))
    ? { ...(outRaw as Record<string, unknown>) }
    : { value: outRaw }
  const success = typeof out.success === 'boolean'
    ? out.success
    : (typeof out.ok === 'boolean' ? out.ok : true)
  if (!('success' in out)) out.success = success
  if (!('data' in out)) {
    if ('rows' in out || 'count' in out) out.data = outRaw
    else if ('ok' in out && 'data' in out) {
      // unreachable due to branch above; kept for clarity
      out.data = (out as any).data
    } else if ('data' in (outRaw as any || {})) {
      out.data = (outRaw as any).data
    } else {
      out.data = outRaw
    }
  }
  out.meta = { ...(typeof out.meta === 'object' && out.meta ? out.meta as Record<string, unknown> : {}), ...meta }
  return out
}

async function callScopedTool(input: {
  origin: string
  token: string
  internalKey?: string
  chatId: string
  tenantId: number
  path: string
  args: unknown
  label: string
}) {
  const url = `${input.origin.replace(/\/+$/, '')}${input.path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${input.token}`,
      'x-chat-id': input.chatId,
      'x-tenant-id': String(input.tenantId),
      ...(input.internalKey ? { 'x-internal-agent-key': input.internalKey } : {}),
    },
    body: JSON.stringify(input.args ?? {}),
    cache: 'no-store',
  })
  const { raw, data } = await parseJsonResponse(res)
  const out = (data && (data.result !== undefined ? data.result : data)) || {}
  if (!res.ok) {
    return {
      success: false,
      status: res.status,
      code: (out as any)?.code || undefined,
      error: (out as any)?.error || (out as any)?.message || raw || res.statusText || `erro na tool ${input.label}`,
    }
  }
  return normalizeRelayToolSuccess(out, { tool: input.label, status: res.status })
}

async function callCrudTool(input: {
  origin: string
  token: string
  internalKey?: string
  chatId: string
  tenantId: number
  args: JsonObject
}) {
  const action = toText(input.args.action || 'listar').toLowerCase()
  const resource = toText(input.args.resource || input.args.path)
  if (!isSafeResource(resource)) {
    return normalizeCrudRelayError({
      status: 400,
      code: 'CRUD_RESOURCE_FORBIDDEN',
      error: 'recurso não permitido',
      action,
      resource,
      allowedActions: getCrudActionRule(resource).actions,
    })
  }
  const actionRule = getCrudActionRule(resource)
  if (!actionRule.actions.includes(action as CrudToolAction)) {
    const blocked = actionRule.blockedMessages?.[action as CrudToolAction]
    return normalizeCrudRelayError({
      status: 409,
      code: blocked?.code || 'CRUD_ACTION_NOT_ALLOWED_FOR_RESOURCE',
      error: blocked?.error || `Ação ${action || '(vazia)'} não permitida para resource ${resource}`,
      action,
      resource,
      allowedActions: actionRule.actions,
      suggestedAction: blocked?.suggested_action,
    })
  }
  const method = 'POST'
  const suffix = resolveCrudSuffix(action, input.args.actionSuffix)
  const url = buildAgentToolsUrl(input.origin, resource, suffix)
  const payload = action === 'listar'
    ? toObject(input.args.params)
    : toObject(input.args.data)

  const res = await fetch(url, {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${input.token}`,
      'x-chat-id': input.chatId,
      'x-tenant-id': String(input.tenantId),
      ...(input.internalKey ? { 'x-internal-agent-key': input.internalKey } : {}),
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const { raw, data } = await parseJsonResponse(res)
  const out = (data && (data.result !== undefined ? data.result : data)) || {}
  if (!res.ok) {
    return normalizeCrudRelayError({
      status: res.status,
      code: (out as any)?.code || undefined,
      error: (out as any)?.error || (out as any)?.message || raw || res.statusText || 'erro na tool crud',
      action,
      resource,
      allowedActions: actionRule.actions,
      suggestedAction: (out as any)?.suggested_action || (out as any)?.result?.data?.suggested_action,
    })
  }
  return normalizeCrudRelaySuccess(out, { status: res.status, action, resource })
}

function buildToolsSchema() {
  return [
    {
      type: 'function',
      name: 'artifact_read',
      description: 'Lê um dashboard persistido no banco via artifact_id e retorna source TSX, versão draft/published e metadados.',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          artifact_id: { type: 'string' },
          kind: { type: 'string', description: 'draft|published' },
          version: { type: 'integer' },
        },
        required: ['artifact_id'],
      },
    },
    {
      type: 'function',
      name: 'artifact_write',
      description: 'Cria dashboard novo no banco ou sobrescreve completamente o draft de um dashboard existente. Para update, exige artifact_id + expected_version.',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          artifact_id: { type: 'string' },
          expected_version: { type: 'integer' },
          title: { type: 'string' },
          source: { type: 'string' },
          workspace_id: { type: 'string' },
          slug: { type: 'string' },
          metadata: { type: 'object' },
          change_summary: { type: 'string' },
        },
        required: ['source'],
      },
    },
    {
      type: 'function',
      name: 'artifact_patch',
      description: 'Aplica patch versionado em dashboard persistido. Suporta replace_text e replace_full_source.',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          artifact_id: { type: 'string' },
          expected_version: { type: 'integer' },
          operation: {
            type: 'object',
            additionalProperties: true,
            properties: {
              type: { type: 'string', description: 'replace_text|replace_full_source' },
              old_string: { type: 'string' },
              new_string: { type: 'string' },
              replace_all: { type: 'boolean' },
              source: { type: 'string' },
              change_summary: { type: 'string' },
            },
            required: ['type'],
          },
        },
        required: ['artifact_id', 'expected_version', 'operation'],
      },
    },
    {
      type: 'function',
      name: 'crud',
      description: 'Executa operações no ERP para recursos permitidos (CRUD + ações de negócio como aprovar, concluir, cancelar, baixar, estornar e reabrir em recursos transacionais).',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          action: { type: 'string', description: 'listar|criar|atualizar|deletar|aprovar|concluir|cancelar|reabrir|baixar|estornar|marcar_como_recebido|marcar_recebimento_parcial' },
          resource: { type: 'string', description: 'Ex: financeiro/clientes ou vendas/pedidos' },
          method: { type: 'string', description: 'GET|POST|DELETE' },
          params: { type: 'object' },
          data: { type: 'object' },
          actionSuffix: { type: 'string', description: 'listar|criar|atualizar|deletar|aprovar|concluir|cancelar|reabrir|baixar|estornar|marcar_como_recebido|marcar_recebimento_parcial (override opcional)' },
        },
        required: ['action', 'resource'],
      },
    },
    {
      type: 'function',
      name: 'documento',
      description: 'Gera e consulta documentos operacionais (OS/proposta/NFSe/fatura/contrato).',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          action: { type: 'string', description: 'gerar|status' },
          tipo: { type: 'string', description: 'proposta|os|fatura|contrato|nfse' },
          origem_tipo: { type: 'string' },
          origem_id: { type: 'integer' },
          titulo: { type: 'string' },
          dados: { type: 'object' },
          documento_id: { type: 'integer' },
          template_id: { type: 'integer' },
          template_version_id: { type: 'integer' },
          idempotency_key: { type: 'string' },
          save_to_drive: { type: 'boolean', description: 'Salva attachment gerado no Drive e retorna metadados do arquivo' },
          workspace_id: { type: 'string', description: 'Workspace do Drive (atalho para drive.workspace_id)' },
          folder_id: { type: 'string', description: 'Pasta do Drive (atalho para drive.folder_id)' },
          file_name: { type: 'string', description: 'Nome do arquivo persistido (atalho para drive.file_name)' },
          drive: { type: 'object', description: 'Config de save_to_drive (workspace_id, folder_id, file_name)' },
          include_attachment_content: { type: 'boolean', description: 'Se false, omite attachment.content (base64) da resposta; status é enxuto por padrão' },
        },
        required: ['action'],
      },
    },
    {
      type: 'function',
      name: 'ecommerce',
      description:
        'Tool analítica canônica de ecommerce por actions fixas (sem SQL livre). Use para KPIs e cortes padrão de operação/comercial. Não use para SQL customizado; nesse caso use sql_execution. Entrada: action obrigatória + params opcionais (datas YYYY-MM-DD). Saída padronizada: rows, columns, count, chart, sql_query e sql_params.',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          action: {
            type: 'string',
            enum: ['kpis_resumo', 'vendas_por_canal', 'pedidos_por_status', 'faturamento_por_mes', 'top_produtos_receita', 'frete_por_transportadora'],
            description:
              'Ação analítica de ecommerce. Mapa: kpis_resumo (pedidos/receita/ticket/clientes), vendas_por_canal, pedidos_por_status, faturamento_por_mes, top_produtos_receita, frete_por_transportadora.',
          },
          params: {
            type: 'object',
            additionalProperties: false,
            properties: {
              de: { type: 'string', description: 'Data inicial (YYYY-MM-DD).' },
              ate: { type: 'string', description: 'Data final (YYYY-MM-DD).' },
              plataforma: { type: 'string', description: 'Filtro por plataforma (ex.: shopify).' },
              canal_conta_id: { type: 'string', description: 'Filtro por canal/conta de venda.' },
              loja_id: { type: 'string', description: 'Filtro por loja.' },
              status: { type: 'string', description: 'Filtro por status do pedido.' },
              status_pagamento: { type: 'string', description: 'Filtro por status de pagamento.' },
              status_fulfillment: { type: 'string', description: 'Filtro por status de fulfillment/logística.' },
              limit: { type: 'integer', description: 'Limite de linhas para rankings/séries (máximo 200).' },
            },
            description: 'Filtros opcionais da action. Use somente campos listados.',
          },
        },
        required: ['action'],
      },
    },
    {
      type: 'function',
      name: 'marketing',
      description:
        'Tool analítica canônica de marketing/tráfego pago por actions fixas (sem SQL livre). Use para KPIs e cortes padrão de mídia. Não use para SQL customizado; nesse caso use sql_execution. Entrada: action obrigatória + params opcionais (datas YYYY-MM-DD). Saída padronizada: rows, columns, count, chart, sql_query e sql_params.',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          action: {
            type: 'string',
            enum: ['kpis_resumo', 'desempenho_diario', 'gasto_por_campanha', 'roas_por_campanha', 'gasto_por_conta', 'top_anuncios'],
            description:
              'Ação analítica de marketing. Mapa: kpis_resumo, desempenho_diario, gasto_por_campanha, roas_por_campanha, gasto_por_conta, top_anuncios.',
          },
          params: {
            type: 'object',
            additionalProperties: false,
            properties: {
              de: { type: 'string', description: 'Data inicial (YYYY-MM-DD).' },
              ate: { type: 'string', description: 'Data final (YYYY-MM-DD).' },
              plataforma: { type: 'string', description: 'Filtro por plataforma (ex.: meta_ads, google_ads).' },
              nivel: { type: 'string', description: 'Filtro por nível analítico do dado.' },
              conta_id: { type: 'string', description: 'Filtro por conta de mídia.' },
              campanha_id: { type: 'string', description: 'Filtro por campanha.' },
              grupo_id: { type: 'string', description: 'Filtro por grupo/conjunto.' },
              anuncio_id: { type: 'string', description: 'Filtro por anúncio.' },
              limit: { type: 'integer', description: 'Limite de linhas para rankings/séries (máximo 200).' },
            },
            description: 'Filtros opcionais da action. Use somente campos listados.',
          },
        },
        required: ['action'],
      },
    },
  ]
}

function buildRelayInstructions() {
  const resources = CRUD_CANONICAL_RESOURCES.join(', ')
  return [
    'Camada de identidade (Alfred): neste canal (ex.: Telegram), você é o Alfred, um mordomo digital e assistente pessoal executivo do empresário.',
    'Missão do Alfred: aumentar a produtividade do dono do negócio, reduzir ruído operacional, organizar prioridades, esclarecer próximos passos e executar ações reais com segurança usando as tools disponíveis.',
    'Comporte-se como um braço direito de confiança para operações diárias (comercial, financeiro, documentos, arquivos e comunicação), não apenas como um executor técnico de comandos.',
    'Tom do Alfred: profissional, claro, direto e útil. Priorize resultado, contexto e próximos passos práticos.',
    'As tools são a infraestrutura de execução do Alfred (não a identidade principal dele).',
    'Mentalidade do Alfred: pensar em prioridade, impacto no caixa, follow-up comercial, pendências operacionais e risco de atraso. Ajude o empresário a decidir e agir mais rápido.',
    'Quando houver múltiplas tarefas, organize em sequência lógica e execute por etapas, mantendo o usuário informado do que já foi feito e do que falta.',
    'Sempre que possível, entregue uma síntese executiva antes dos detalhes técnicos (o que foi feito, resultado, próximo passo recomendado).',
    'Se faltar contexto crítico para executar (ex.: destinatário, ID, aprovação, recurso exato), faça uma pergunta curta e específica em vez de assumir.',
    'Se a solicitação for ambígua, proponha a interpretação mais útil e confirme rapidamente antes de ações irreversíveis.',
    'Para dashboards persistidos, prefira artifact_read/artifact_write/artifact_patch em vez de filesystem efêmero.',
    'Para ações irreversíveis ou sensíveis (ex.: enviar email, deletar, cancelar, estornar), confirme a intenção quando o contexto não estiver explicitamente claro.',
    'Quando uma ação falhar, explique em linguagem de negócio (não só erro técnico), diga o impacto e proponha a melhor alternativa prática.',
    'Evite respostas longas e burocráticas. Em Telegram, prefira mensagens curtas, objetivas e acionáveis.',
    'Ao concluir uma sequência de ações, diga explicitamente o que foi concluído e termine com uma pergunta curta de continuidade.',
    'Você é um agente operacional SMB.',
    'Responda em português brasileiro, curto e objetivo.',
    `Crud: use somente resources canônicos (${resources}). Não invente paths como "financeiro/caixa".`,
    'Crud: para listar use action="listar"; para criar/atualizar use action correspondente. Em recursos transacionais (ex.: vendas/pedidos, compras/pedidos), prefira action="cancelar" em vez de deletar.',
    'Documento: use action="gerar" para proposta/os/nfse/fatura/contrato com payload em dados; use action="status" com documento_id. status retorna payload enxuto por padrão (sem base64).',
    'Documento: quando save_to_drive=true, prefira include_attachment_content=false para evitar payload grande.',
    'Nunca use ações/resources inexistentes como save_document/save_file_to_drive.',
    'Se faltar campo obrigatório para executar a ação, faça uma pergunta curta.',
    'Se uma tool retornar erro de arquivo não encontrado, informe claramente e prossiga com alternativa segura (ex.: listar novamente).',
  ].join('\n')
}

function extractFunctionCalls(output: unknown): FunctionCallItem[] {
  if (!Array.isArray(output)) return []
  const calls: FunctionCallItem[] = []

  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>
    const type = toText(obj.type).toLowerCase()

    if (type === 'function_call') {
      const name = toText(obj.name)
      const callId = toText(obj.call_id || obj.id)
      const argsText = typeof obj.arguments === 'string' ? obj.arguments : JSON.stringify(obj.arguments ?? {})
      if (name && callId) calls.push({ name, callId, argumentsText: argsText || '{}' })
      continue
    }

    if (type === 'tool_call' && obj.function && typeof obj.function === 'object') {
      const fn = obj.function as Record<string, unknown>
      const name = toText(fn.name)
      const callId = toText(obj.call_id || obj.id)
      const argsText = typeof fn.arguments === 'string' ? fn.arguments : JSON.stringify(fn.arguments ?? {})
      if (name && callId) calls.push({ name, callId, argumentsText: argsText || '{}' })
    }
  }

  return calls
}

function extractResponseText(resp: OpenAiResponse): string {
  if (typeof resp.output_text === 'string' && resp.output_text.trim()) return resp.output_text.trim()
  if (!Array.isArray(resp.output)) return ''
  const chunks: string[] = []
  for (const item of resp.output) {
    if (!item || typeof item !== 'object') continue
    const obj = item as Record<string, unknown>
    const type = toText(obj.type).toLowerCase()
    if (type === 'message' && Array.isArray(obj.content)) {
      for (const contentItem of obj.content) {
        if (!contentItem || typeof contentItem !== 'object') continue
        const part = contentItem as Record<string, unknown>
        const partType = toText(part.type).toLowerCase()
        if ((partType === 'output_text' || partType === 'text') && typeof part.text === 'string') {
          chunks.push(part.text)
        }
      }
      continue
    }
    if ((type === 'output_text' || type === 'text') && typeof obj.text === 'string') {
      chunks.push(obj.text)
    }
  }
  return chunks.join('').trim()
}

async function callOpenAiResponses(input: {
  apiKey: string
  baseUrl: string
  body: JsonObject
}): Promise<OpenAiResponse> {
  const res = await fetch(input.baseUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify(input.body),
    cache: 'no-store',
  })
  const raw = await res.text().catch(() => '')
  if (!res.ok) {
    throw new Error(`Responses API ${res.status}: ${raw.slice(0, 1400)}`)
  }
  const data = JSON.parse(raw || '{}') as OpenAiResponse
  return data
}

export async function POST(req: Request) {
  try {
    const payload = toObject(await req.json().catch(() => ({})))

    const message = toText(payload.message)
    if (!message) {
      return Response.json({ ok: false, error: 'message é obrigatório' }, { status: 400 })
    }

    const apiKey = toText(process.env.OPENAI_API_KEY || process.env.CODEX_API_KEY)
    if (!apiKey) {
      return Response.json({ ok: false, error: 'OPENAI_API_KEY/CODEX_API_KEY não configurada' }, { status: 500 })
    }

    const rawBase = toText(process.env.OPENAI_BASE_URL) || 'https://api.openai.com/v1'
    const base = rawBase.replace(/\/+$/, '')
    const responsesUrl = base.endsWith('/responses') ? base : `${base}/responses`

    const conversationId = toText(payload.conversation_id) || `relay-${randomUUID()}`
    const tenantId = toPositiveInt(payload.tenant_id ?? req.headers.get('x-tenant-id') ?? '1', 1)
    const maxRoundtrips = Math.min(toPositiveInt(payload.max_tool_roundtrips, 8), 12)
    const model = toText(payload.model) || 'gpt-5.4-mini'
    const reset = String(payload.reset || '').toLowerCase() === 'true' || payload.reset === true

    const session = getSession(conversationId)
    if (reset) session.lastResponseId = null

    const chatId = `relay-lite:${conversationId}`
    const internalKey = toText(process.env.AGENT_INTERNAL_API_KEY)
    const tokenData = generateAgentToken(1800, chatId)
    const toolToken = internalKey || tokenData.token
    setAgentToken(chatId, tokenData.token, tokenData.exp)

    const origin = getOrigin(req)
    const tools = buildToolsSchema()
    const toolTrace: ToolTraceEntry[] = []

    const baseRequest: JsonObject = {
      model,
      tools,
      tool_choice: 'auto',
      reasoning: { effort: 'medium', summary: 'auto' },
      instructions: buildRelayInstructions(),
    }

    let response = await callOpenAiResponses({
      apiKey,
      baseUrl: responsesUrl,
      body: {
        ...baseRequest,
        previous_response_id: session.lastResponseId || undefined,
        input: message,
      },
    })

    let round = 0
    while (round < maxRoundtrips) {
      const functionCalls = extractFunctionCalls(response.output)
      if (!functionCalls.length) break
      round += 1

      const toolOutputs: Array<{ type: 'function_call_output'; call_id: string; output: string }> = []
      for (const call of functionCalls) {
        const parsedArgsRaw = parseJsonMaybe(call.argumentsText)
        const parsedArgs = toObject(parsedArgsRaw)
        let result: unknown
        let ok = true

        try {
          if (call.name === 'artifact_read') {
            result = await callScopedTool({
              origin,
              token: toolToken,
              internalKey: internalKey || undefined,
              chatId,
              tenantId,
              path: '/api/agent-tools/artifact-read',
              args: parsedArgs,
              label: 'artifact_read',
            })
          } else if (call.name === 'artifact_write') {
            result = await callScopedTool({
              origin,
              token: toolToken,
              internalKey: internalKey || undefined,
              chatId,
              tenantId,
              path: '/api/agent-tools/artifact-write',
              args: parsedArgs,
              label: 'artifact_write',
            })
          } else if (call.name === 'artifact_patch') {
            result = await callScopedTool({
              origin,
              token: toolToken,
              internalKey: internalKey || undefined,
              chatId,
              tenantId,
              path: '/api/agent-tools/artifact-patch',
              args: parsedArgs,
              label: 'artifact_patch',
            })
          } else if (call.name === 'crud') {
            result = await callCrudTool({
              origin,
              token: toolToken,
              internalKey: internalKey || undefined,
              chatId,
              tenantId,
              args: parsedArgs,
            })
          } else if (call.name === 'documento') {
            result = await callScopedTool({
              origin,
              token: toolToken,
              internalKey: internalKey || undefined,
              chatId,
              tenantId,
              path: '/api/agent-tools/documento',
              args: parsedArgs,
              label: 'documento',
            })
          } else if (call.name === 'ecommerce') {
            result = await callScopedTool({
              origin,
              token: toolToken,
              internalKey: internalKey || undefined,
              chatId,
              tenantId,
              path: '/api/agent-tools/ecommerce',
              args: parsedArgs,
              label: 'ecommerce',
            })
          } else if (call.name === 'marketing') {
            result = await callScopedTool({
              origin,
              token: toolToken,
              internalKey: internalKey || undefined,
              chatId,
              tenantId,
              path: '/api/agent-tools/marketing',
              args: parsedArgs,
              label: 'marketing',
            })
          } else {
            result = { success: false, error: `tool desconhecida: ${call.name}` }
            ok = false
          }
          if (result && typeof result === 'object' && 'success' in (result as Record<string, unknown>) && (result as Record<string, unknown>).success === false) {
            ok = false
          }
        } catch (error) {
          ok = false
          result = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }
        }

        toolTrace.push({
          tool: call.name,
          ok,
          input: safeToolOutput(parsedArgs),
          output: safeToolOutput(result),
        })

        const serialized = (() => {
          try {
            return JSON.stringify(result ?? {})
          } catch {
            return JSON.stringify({ success: false, error: 'falha ao serializar resultado da tool' })
          }
        })()

        toolOutputs.push({
          type: 'function_call_output',
          call_id: call.callId,
          output: serialized,
        })
      }

      if (!response.id) break
      response = await callOpenAiResponses({
        apiKey,
        baseUrl: responsesUrl,
        body: {
          ...baseRequest,
          previous_response_id: response.id,
          input: toolOutputs,
        },
      })
    }

    const reply = extractResponseText(response)
    session.lastResponseId = toText(response.id) || session.lastResponseId
    session.updatedAt = nowMs()

    return Response.json({
      ok: true,
      conversation_id: conversationId,
      response_id: response.id || null,
      model,
      reply,
      tool_trace: toolTrace,
      roundtrips: round,
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
