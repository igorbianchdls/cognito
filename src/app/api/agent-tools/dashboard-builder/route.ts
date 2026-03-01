import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import {
  addWidget,
  addWidgetsBatch,
  createDashboard,
  createEmptyParserState,
  type AddWidgetInput,
  type AddWidgetsBatchInput,
  type CreateDashboardInput,
  type DashboardToolParserState,
} from '@/products/bi/features/dashboard-playground/tool-parser/dashboardToolParser'

export const runtime = 'nodejs'

type JsonMap = Record<string, unknown>
type DashboardToolAction = 'create_dashboard' | 'add_widget' | 'add_widgets_batch' | 'get_dashboard'

type DashboardSessionBucket = {
  updatedAt: number
  statesByDashboard: Record<string, DashboardToolParserState>
}

const SESSION_TTL_MS = 6 * 60 * 60 * 1000

const globalStore = globalThis as typeof globalThis & {
  __dashboardBuilderSessions?: Map<string, DashboardSessionBucket>
}

const dashboardBuilderSessions =
  globalStore.__dashboardBuilderSessions || new Map<string, DashboardSessionBucket>()

if (!globalStore.__dashboardBuilderSessions) {
  globalStore.__dashboardBuilderSessions = dashboardBuilderSessions
}

function toObj(input: unknown): JsonMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonMap
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function textOrUndefined(value: unknown): string | undefined {
  const out = toText(value)
  return out || undefined
}

function normalizeAction(value: unknown): DashboardToolAction | null {
  const out = toText(value).toLowerCase()
  if (out === 'create_dashboard') return out
  if (out === 'add_widget') return out
  if (out === 'add_widgets_batch') return out
  if (out === 'get_dashboard') return out
  return null
}

function normalizeWidgetType(value: unknown): AddWidgetInput['widget_type'] | null {
  const out = toText(value).toLowerCase()
  if (out === 'kpi' || out === 'chart' || out === 'filtro' || out === 'insights') return out
  return null
}

function cloneState(state: DashboardToolParserState): DashboardToolParserState {
  return JSON.parse(JSON.stringify(state)) as DashboardToolParserState
}

function parseState(value: unknown): DashboardToolParserState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const obj = value as Record<string, unknown>
  const dashboardName = typeof obj.dashboardName === 'string' ? obj.dashboardName : null
  const tree = (obj.tree ?? null) as DashboardToolParserState['tree']
  const widgetIndexById = (obj.widgetIndexById && typeof obj.widgetIndexById === 'object' && !Array.isArray(obj.widgetIndexById))
    ? (obj.widgetIndexById as Record<string, { rowKey: string; index: number }>)
    : {}
  const rowIndexByKey = (obj.rowIndexByKey && typeof obj.rowIndexByKey === 'object' && !Array.isArray(obj.rowIndexByKey))
    ? (obj.rowIndexByKey as Record<string, number>)
    : {}

  return {
    dashboardName,
    tree,
    widgetIndexById,
    rowIndexByKey,
  }
}

function unauthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return !verifyAgentToken(chatId, token)
}

function cleanupExpiredSessions() {
  const now = Date.now()
  for (const [chatId, bucket] of dashboardBuilderSessions.entries()) {
    if (now - bucket.updatedAt > SESSION_TTL_MS) {
      dashboardBuilderSessions.delete(chatId)
    }
  }
}

function getSessionState(chatId: string, dashboardName: string): DashboardToolParserState | null {
  if (!chatId || !dashboardName) return null
  const bucket = dashboardBuilderSessions.get(chatId)
  if (!bucket) return null
  const state = bucket.statesByDashboard[dashboardName]
  return state ? cloneState(state) : null
}

function setSessionState(chatId: string, dashboardName: string, state: DashboardToolParserState) {
  if (!chatId || !dashboardName) return
  const bucket = dashboardBuilderSessions.get(chatId) || {
    updatedAt: Date.now(),
    statesByDashboard: {},
  }
  bucket.updatedAt = Date.now()
  bucket.statesByDashboard[dashboardName] = cloneState(state)
  dashboardBuilderSessions.set(chatId, bucket)
}

function toolErrorJson(status: number, code: string, error: string, action: string = 'unknown') {
  return Response.json(
    {
      ok: false,
      success: false,
      data: null,
      error,
      code,
      meta: { tool: 'dashboard_builder', action, status },
      result: { success: false, error, code },
    },
    { status },
  )
}

function summarizeState(state: DashboardToolParserState) {
  return {
    dashboard_name: state.dashboardName,
    widgets_total: Object.keys(state.widgetIndexById || {}).length,
    containers: Object.keys(state.rowIndexByKey || {}),
  }
}

function toolSuccessJson(action: DashboardToolAction, result: Record<string, unknown>) {
  return Response.json({
    ok: true,
    success: true,
    data: result,
    meta: { tool: 'dashboard_builder', action, status: 200 },
    result,
  })
}

function resolveState({
  payload,
  chatId,
  dashboardName,
}: {
  payload: JsonMap
  chatId: string
  dashboardName: string
}): DashboardToolParserState {
  const fromPayload = parseState(payload.parser_state)
  if (fromPayload) return fromPayload
  const fromSession = getSessionState(chatId, dashboardName)
  if (fromSession) return fromSession
  return createEmptyParserState()
}

function buildAddWidgetInput(payload: JsonMap, dashboardName: string): AddWidgetInput {
  const widgetId = toText(payload.widget_id)
  if (!widgetId) throw new Error('widget_id é obrigatório em add_widget')

  const widgetType = normalizeWidgetType(payload.widget_type)
  if (!widgetType) {
    throw new Error('widget_type inválido. Use: kpi, chart, filtro, insights')
  }

  const input: AddWidgetInput = {
    dashboard_name: dashboardName,
    widget_id: widgetId,
    widget_type: widgetType,
    payload: toObj(payload.payload) as AddWidgetInput['payload'],
    ...(textOrUndefined(payload.container) ? { container: textOrUndefined(payload.container) } : {}),
  }
  return input
}

function buildAddWidgetsBatchInput(payload: JsonMap, dashboardName: string): AddWidgetsBatchInput {
  const rawWidgets = Array.isArray(payload.widgets) ? payload.widgets : []
  if (!rawWidgets.length) throw new Error('widgets é obrigatório em add_widgets_batch')

  const widgets: AddWidgetInput[] = rawWidgets.map((raw, index) => {
    const widgetPayload = toObj(raw)
    const widgetId = toText(widgetPayload.widget_id)
    if (!widgetId) throw new Error(`widgets[${index}].widget_id é obrigatório`)
    const widgetType = normalizeWidgetType(widgetPayload.widget_type)
    if (!widgetType) {
      throw new Error(`widgets[${index}].widget_type inválido. Use: kpi, chart, filtro, insights`)
    }
    const item: AddWidgetInput = {
      dashboard_name: dashboardName,
      widget_id: widgetId,
      widget_type: widgetType,
      payload: toObj(widgetPayload.payload) as AddWidgetInput['payload'],
      ...(textOrUndefined(widgetPayload.container) ? { container: textOrUndefined(widgetPayload.container) } : {}),
    }
    return item
  })

  return { dashboard_name: dashboardName, widgets }
}

function buildCreateDashboardInput(payload: JsonMap, dashboardName: string): CreateDashboardInput {
  const title = toText(payload.title)
  if (!title) throw new Error('title é obrigatório em create_dashboard')

  return {
    dashboard_name: dashboardName,
    title,
    ...(textOrUndefined(payload.subtitle) ? { subtitle: textOrUndefined(payload.subtitle) } : {}),
    ...(textOrUndefined(payload.theme) ? { theme: textOrUndefined(payload.theme) } : {}),
  }
}

function buildResult(action: DashboardToolAction, state: DashboardToolParserState, source: 'session' | 'payload' | 'new') {
  return {
    action,
    source,
    summary: summarizeState(state),
    tree: state.tree,
    parser_state: state,
  }
}

export async function POST(req: NextRequest) {
  try {
    cleanupExpiredSessions()

    const payload = toObj(await req.json().catch(() => ({})))
    if (unauthorized(req)) {
      return toolErrorJson(401, 'UNAUTHORIZED', 'unauthorized')
    }

    const action = normalizeAction(payload.action)
    if (!action) {
      return toolErrorJson(
        400,
        'DASHBOARD_ACTION_INVALID',
        'action inválida. Use: create_dashboard, add_widget, add_widgets_batch, get_dashboard',
      )
    }

    const dashboardName = toText(payload.dashboard_name)
    if (!dashboardName) {
      return toolErrorJson(400, 'DASHBOARD_NAME_REQUIRED', 'dashboard_name é obrigatório', action)
    }

    const chatId = toText(req.headers.get('x-chat-id'))
    let nextState: DashboardToolParserState
    let source: 'session' | 'payload' | 'new' = 'new'

    if (action === 'create_dashboard') {
      const input = buildCreateDashboardInput(payload, dashboardName)
      nextState = createDashboard(createEmptyParserState(), input)
    } else if (action === 'add_widget') {
      const hasPayloadState = Boolean(parseState(payload.parser_state))
      source = hasPayloadState ? 'payload' : (getSessionState(chatId, dashboardName) ? 'session' : 'new')
      const state = resolveState({ payload, chatId, dashboardName })
      const input = buildAddWidgetInput(payload, dashboardName)
      nextState = addWidget(state, input)
    } else if (action === 'add_widgets_batch') {
      const hasPayloadState = Boolean(parseState(payload.parser_state))
      source = hasPayloadState ? 'payload' : (getSessionState(chatId, dashboardName) ? 'session' : 'new')
      const state = resolveState({ payload, chatId, dashboardName })
      const input = buildAddWidgetsBatchInput(payload, dashboardName)
      nextState = addWidgetsBatch(state, input)
    } else {
      const hasPayloadState = Boolean(parseState(payload.parser_state))
      const fromSession = getSessionState(chatId, dashboardName)
      if (hasPayloadState) {
        source = 'payload'
        nextState = parseState(payload.parser_state) as DashboardToolParserState
      } else if (fromSession) {
        source = 'session'
        nextState = fromSession
      } else {
        return toolErrorJson(
          404,
          'DASHBOARD_NOT_FOUND',
          'dashboard não encontrado. Rode create_dashboard primeiro.',
          action,
        )
      }
    }

    setSessionState(chatId, dashboardName, nextState)
    return toolSuccessJson(action, buildResult(action, nextState, source))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return toolErrorJson(400, 'DASHBOARD_TOOL_ERROR', message)
  }
}
