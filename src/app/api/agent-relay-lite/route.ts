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
  return 'listar'
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
      error: (out as any)?.error || (out as any)?.message || raw || res.statusText || `erro na tool ${input.label}`,
    }
  }
  return out
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
    return { success: false, error: 'recurso não permitido', resource }
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
    return {
      success: false,
      status: res.status,
      error: (out as any)?.error || (out as any)?.message || raw || res.statusText || 'erro na tool crud',
    }
  }
  return out
}

function buildToolsSchema() {
  return [
    {
      type: 'function',
      name: 'crud',
      description: 'Executa CRUD no ERP para recursos permitidos (financeiro/vendas/compras/contas/crm/estoque/cadastros).',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          action: { type: 'string', description: 'listar|criar|atualizar|deletar' },
          resource: { type: 'string', description: 'Ex: financeiro/clientes ou vendas/pedidos' },
          method: { type: 'string', description: 'GET|POST|DELETE' },
          params: { type: 'object' },
          data: { type: 'object' },
          actionSuffix: { type: 'string', description: 'listar|criar|atualizar|deletar (override opcional)' },
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
          dados: { type: 'object' },
          documento_id: { type: 'integer' },
          template_id: { type: 'integer' },
          template_version_id: { type: 'integer' },
          idempotency_key: { type: 'string' },
        },
        required: ['action'],
      },
    },
    {
      type: 'function',
      name: 'drive',
      description: 'Acessa operações de Drive e arquivos.',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          action: { type: 'string', description: 'request|read_file|get_drive_file_url|get_file_url' },
          method: { type: 'string', description: 'GET|POST|DELETE' },
          resource: { type: 'string' },
          params: { type: 'object' },
          data: { type: 'object' },
          file_id: { type: 'string' },
          mode: { type: 'string', description: 'auto|text|binary' },
        },
        required: ['action'],
      },
    },
    {
      type: 'function',
      name: 'email',
      description: 'Acessa operações de Email e envio de mensagens.',
      parameters: {
        type: 'object',
        additionalProperties: true,
        properties: {
          action: { type: 'string', description: 'request|send|send_email' },
          method: { type: 'string', description: 'GET|POST|DELETE' },
          resource: { type: 'string' },
          params: { type: 'object' },
          data: { type: 'object' },
          inbox_id: { type: 'string' },
          to: { description: 'lista ou string de destinatários' },
          subject: { type: 'string' },
          text: { type: 'string' },
          html: { type: 'string' },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
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
    'Você é um agente operacional SMB.',
    'Responda em português brasileiro, curto e objetivo.',
    `Crud: use somente resources canônicos (${resources}). Não invente paths como "financeiro/caixa".`,
    'Crud: para listar use action="listar"; para criar/atualizar/deletar use action correspondente.',
    'Documento: use action="gerar" para proposta/os/nfse/fatura/contrato com payload em dados; use action="status" com documento_id.',
    'Drive: actions válidas são request, read_file e get_file_url.',
    'Drive request: resources válidos são drive, drive/folders, drive/folders/{id}, drive/files/{id}, drive/files/{id}/download, drive/files/prepare-upload, drive/files/complete-upload.',
    'Drive upload: use exatamente method="POST" com resource="drive/files/prepare-upload" e depois method="POST" com resource="drive/files/complete-upload".',
    'Email: use action="send" com inbox_id, to, subject e text/html; anexos por attachments[] ou signed_url/attachment_url.',
    'Fluxo obrigatório para anexar arquivo do Drive em email: 1) drive get_file_url por file_id; 2) email send com essa URL no anexo.',
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
    const model = toText(payload.model) || 'gpt-5-nano'
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
          if (call.name === 'crud') {
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
          } else if (call.name === 'drive') {
            result = await callScopedTool({
              origin,
              token: toolToken,
              internalKey: internalKey || undefined,
              chatId,
              tenantId,
              path: '/api/agent-tools/drive',
              args: parsedArgs,
              label: 'drive',
            })
          } else if (call.name === 'email') {
            result = await callScopedTool({
              origin,
              token: toolToken,
              internalKey: internalKey || undefined,
              chatId,
              tenantId,
              path: '/api/agent-tools/email',
              args: parsedArgs,
              label: 'email',
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
