import type { JsonTree } from '@/products/bi/shared/types'

export type WidgetType = 'kpi' | 'chart' | 'filtro' | 'insights'

type OrderBy = {
  field?: string
  dir?: 'asc' | 'desc'
}

type KpiPayload = {
  title: string
  tabela: string
  medida: string
  fr?: number
  formato?: 'currency' | 'percent' | 'number'
  filtros?: Record<string, unknown>
}

type ChartPayload = {
  chart_type: 'bar' | 'line' | 'pie'
  title: string
  tabela: string
  dimensao: string
  medida: string
  fr?: number
  formato?: 'currency' | 'percent' | 'number'
  filtros?: Record<string, unknown>
  limit?: number
  ordem?: string | OrderBy
  height?: number
}

type FiltroPayload = {
  title: string
  campo: string
  tabela: string
  tipo?: 'list' | 'dropdown' | 'multi'
  chave?: string
  fr?: number
}

type InsightItem = string | { text: string; icon?: string }

type InsightsPayload = {
  title: string
  items: InsightItem[]
  fr?: number
}

type WidgetPayloadByType = {
  kpi: KpiPayload
  chart: ChartPayload
  filtro: FiltroPayload
  insights: InsightsPayload
}

export type AddWidgetInput<T extends WidgetType = WidgetType> = {
  dashboard_name: string
  widget_id: string
  widget_type: T
  container?: string
  payload: WidgetPayloadByType[T]
}

export type AddWidgetsBatchInput = {
  dashboard_name: string
  widgets: AddWidgetInput[]
}

export type CreateDashboardInput = {
  dashboard_name: string
  title: string
  subtitle?: string
  theme?: string
}

type WidgetIndex = {
  rowKey: string
  index: number
}

export type DashboardToolParserState = {
  dashboardName: string | null
  tree: JsonTree
  widgetIndexById: Record<string, WidgetIndex>
  rowIndexByKey: Record<string, number>
}

function cloneTree<T>(value: T): T {
  return value == null ? value : (JSON.parse(JSON.stringify(value)) as T)
}

function sanitizeKey(value: string): string {
  const raw = String(value || '').trim().toLowerCase()
  return raw.replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'row'
}

function normalizeRowKey(input: AddWidgetInput): string {
  if (input.container && input.container.trim()) return sanitizeKey(input.container)
  return `row_${sanitizeKey(input.widget_type)}`
}

function normalizeOrderBy(value: string | OrderBy | undefined): OrderBy | undefined {
  if (!value) return undefined
  if (typeof value === 'object') {
    const dir = value.dir === 'asc' || value.dir === 'desc' ? value.dir : undefined
    const field = value.field ? String(value.field) : undefined
    if (!field && !dir) return undefined
    return { field, dir }
  }

  const [fieldRaw, dirRaw] = String(value).split(':').map((part) => part.trim())
  if (!fieldRaw) return undefined
  const dir = dirRaw === 'asc' || dirRaw === 'desc' ? dirRaw : undefined
  return { field: fieldRaw, dir }
}

function ensureThemeTree(tree: JsonTree): Array<Record<string, unknown>> {
  const arr = Array.isArray(tree) ? cloneTree(tree) : []

  if (!arr[0] || typeof arr[0] !== 'object' || arr[0].type !== 'Theme') {
    return [
      {
        type: 'Theme',
        props: { name: 'light', managers: {} },
        children: [],
      },
    ]
  }

  const theme = arr[0]
  if (!theme.props || typeof theme.props !== 'object') theme.props = {}
  if (typeof (theme.props as Record<string, unknown>).name !== 'string') {
    ;(theme.props as Record<string, unknown>).name = 'light'
  }

  if (!Array.isArray(theme.children)) theme.children = []
  return arr
}

function buildRow(): Record<string, unknown> {
  return {
    type: 'Div',
    props: {
      direction: 'row',
      gap: 12,
      padding: 16,
      wrap: true,
      childGrow: true,
    },
    children: [],
  }
}

function ensureHeader(tree: Array<Record<string, unknown>>) {
  const theme = tree[0]
  const children = Array.isArray(theme.children) ? (theme.children as Array<Record<string, unknown>>) : []

  if (!children[0] || children[0].type !== 'Header') {
    children[0] = {
      type: 'Header',
      props: {
        title: 'Dashboard',
        subtitle: 'Parser sandbox',
        datePicker: {
          visible: true,
          mode: 'range',
          storePath: 'filters.dateRange',
          actionOnChange: { type: 'refresh_data' },
        },
      },
    }
  }

  theme.children = children
}

function requireParserReady(state: DashboardToolParserState, dashboardName: string) {
  if (!state.dashboardName || !state.tree) {
    throw new Error('Dashboard ainda não criado. Rode create_dashboard primeiro.')
  }
  if (state.dashboardName !== dashboardName) {
    throw new Error(`Dashboard ativo é "${state.dashboardName}". Recebido: "${dashboardName}".`)
  }
}

function buildKpiNode(payload: KpiPayload): Record<string, unknown> {
  return {
    type: 'KPI',
    props: {
      title: payload.title,
      fr: payload.fr ?? 1,
      format: payload.formato ?? 'number',
      dataQuery: {
        model: payload.tabela,
        measure: payload.medida,
        filters: payload.filtros ?? {},
      },
    },
  }
}

function buildChartNode(payload: ChartPayload): Record<string, unknown> {
  const typeMap: Record<ChartPayload['chart_type'], string> = {
    bar: 'BarChart',
    line: 'LineChart',
    pie: 'PieChart',
  }

  const orderBy = normalizeOrderBy(payload.ordem)

  return {
    type: typeMap[payload.chart_type],
    props: {
      title: payload.title,
      fr: payload.fr ?? 1,
      format: payload.formato ?? 'number',
      height: payload.height ?? 240,
      dataQuery: {
        model: payload.tabela,
        dimension: payload.dimensao,
        measure: payload.medida,
        filters: payload.filtros ?? {},
        ...(typeof payload.limit === 'number' ? { limit: payload.limit } : {}),
        ...(orderBy ? { orderBy } : {}),
      },
    },
  }
}

function buildFiltroNode(payload: FiltroPayload): Record<string, unknown> {
  const key = sanitizeKey(payload.chave || payload.campo)

  return {
    type: 'SlicerCard',
    props: {
      title: payload.title,
      fr: payload.fr ?? 1,
      fields: [
        {
          label: payload.title,
          type: payload.tipo ?? 'list',
          storePath: `filters.${key}`,
          source: {
            type: 'options',
            model: payload.tabela,
            field: payload.campo,
          },
        },
      ],
    },
  }
}

function buildInsightsNode(payload: InsightsPayload): Record<string, unknown> {
  return {
    type: 'AISummary',
    props: {
      title: payload.title,
      fr: payload.fr ?? 1,
      items: payload.items.map((item) => {
        if (typeof item === 'string') return { text: item }
        return { text: item.text, ...(item.icon ? { icon: item.icon } : {}) }
      }),
    },
  }
}

function buildNodeFromInput(input: AddWidgetInput): Record<string, unknown> {
  if (input.widget_type === 'kpi') return buildKpiNode(input.payload as KpiPayload)
  if (input.widget_type === 'chart') return buildChartNode(input.payload as ChartPayload)
  if (input.widget_type === 'filtro') return buildFiltroNode(input.payload as FiltroPayload)
  return buildInsightsNode(input.payload as InsightsPayload)
}

function getRowChildren(
  state: DashboardToolParserState,
  tree: Array<Record<string, unknown>>,
  rowKey: string,
): { nextState: DashboardToolParserState; children: Array<Record<string, unknown>> } {
  const theme = tree[0]
  const children = theme.children as Array<Record<string, unknown>>
  const nextRowIndexByKey = { ...state.rowIndexByKey }
  let rowIndex = nextRowIndexByKey[rowKey]

  if (!Number.isInteger(rowIndex) || (rowIndex as number) < 1 || !children[rowIndex as number]) {
    children.push(buildRow())
    rowIndex = children.length - 1
    nextRowIndexByKey[rowKey] = rowIndex
  }

  const rowNode = children[rowIndex as number]
  if (!Array.isArray(rowNode.children)) rowNode.children = []

  return {
    nextState: {
      ...state,
      rowIndexByKey: nextRowIndexByKey,
    },
    children: rowNode.children as Array<Record<string, unknown>>,
  }
}

export function createEmptyParserState(): DashboardToolParserState {
  return {
    dashboardName: null,
    tree: null,
    widgetIndexById: {},
    rowIndexByKey: {},
  }
}

export function createDashboard(_state: DashboardToolParserState, input: CreateDashboardInput): DashboardToolParserState {
  const theme = String(input.theme || 'light').trim() || 'light'
  const nextTree = ensureThemeTree(null)
  ensureHeader(nextTree)

  const themeNode = nextTree[0]
  const themeProps = (themeNode.props || {}) as Record<string, unknown>
  themeNode.props = {
    ...themeProps,
    name: theme,
    managers: typeof themeProps.managers === 'object' && themeProps.managers ? themeProps.managers : {},
  }

  const header = (themeNode.children as Array<Record<string, unknown>>)[0]
  header.props = {
    ...(header.props || {}),
    title: input.title,
    subtitle: input.subtitle || undefined,
    datePicker: {
      visible: true,
      mode: 'range',
      storePath: 'filters.dateRange',
      actionOnChange: { type: 'refresh_data' },
    },
  }

  return {
    dashboardName: input.dashboard_name,
    tree: nextTree,
    widgetIndexById: {},
    rowIndexByKey: {},
  }
}

export function addWidget(state: DashboardToolParserState, input: AddWidgetInput): DashboardToolParserState {
  requireParserReady(state, input.dashboard_name)

  const nextTree = ensureThemeTree(state.tree)
  ensureHeader(nextTree)

  const rowKey = normalizeRowKey(input)
  const nextIndexMap: Record<string, WidgetIndex> = { ...state.widgetIndexById }
  let nextState: DashboardToolParserState = {
    ...state,
    tree: nextTree,
    widgetIndexById: nextIndexMap,
    rowIndexByKey: { ...state.rowIndexByKey },
  }

  const existing = nextIndexMap[input.widget_id]
  const node = buildNodeFromInput(input)

  if (existing) {
    const previousRow = getRowChildren(nextState, nextTree, existing.rowKey)
    nextState = previousRow.nextState
    if (previousRow.children[existing.index]) {
      previousRow.children.splice(existing.index, 1)
      for (const [widgetId, indexInfo] of Object.entries(nextIndexMap)) {
        if (widgetId === input.widget_id) continue
        if (indexInfo.rowKey === existing.rowKey && indexInfo.index > existing.index) {
          nextIndexMap[widgetId] = { ...indexInfo, index: indexInfo.index - 1 }
        }
      }
    }
  }

  const targetRow = getRowChildren(nextState, nextTree, rowKey)
  nextState = targetRow.nextState
  const rowChildren = targetRow.children

  const insertAt = existing && existing.rowKey === rowKey
    ? Math.min(existing.index, rowChildren.length)
    : rowChildren.length

  for (const [widgetId, indexInfo] of Object.entries(nextIndexMap)) {
    if (widgetId === input.widget_id) continue
    if (indexInfo.rowKey === rowKey && indexInfo.index >= insertAt) {
      nextIndexMap[widgetId] = { ...indexInfo, index: indexInfo.index + 1 }
    }
  }

  rowChildren.splice(insertAt, 0, node)
  nextIndexMap[input.widget_id] = { rowKey, index: insertAt }

  return {
    dashboardName: nextState.dashboardName,
    tree: nextTree,
    widgetIndexById: nextIndexMap,
    rowIndexByKey: nextState.rowIndexByKey,
  }
}

export function addWidgetsBatch(state: DashboardToolParserState, input: AddWidgetsBatchInput): DashboardToolParserState {
  requireParserReady(state, input.dashboard_name)
  return input.widgets.reduce((acc, widget) => addWidget(acc, widget), state)
}
