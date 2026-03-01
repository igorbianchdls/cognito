import type { JsonTree } from '@/products/bi/shared/types'

type RowKind = 'kpi' | 'chart' | 'filtro' | 'insights'
export type WidgetType = RowKind

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
  row: RowKind
  index: number
}

export type DashboardToolParserState = {
  dashboardName: string | null
  tree: JsonTree
  widgetIndexById: Record<string, WidgetIndex>
}

const ROW_INDEX: Record<RowKind, number> = {
  kpi: 1,
  chart: 2,
  filtro: 3,
  insights: 4,
}

function cloneTree<T>(value: T): T {
  return value == null ? value : (JSON.parse(JSON.stringify(value)) as T)
}

function sanitizeKey(value: string): string {
  const raw = String(value || '').trim().toLowerCase()
  return raw.replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'filtro'
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

function ensureBaseRows(tree: Array<Record<string, unknown>>) {
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

  for (const rowKind of Object.keys(ROW_INDEX) as RowKind[]) {
    const idx = ROW_INDEX[rowKind]
    if (!children[idx] || children[idx].type !== 'Div') {
      children[idx] = buildRow()
    }
    if (!Array.isArray(children[idx].children)) {
      children[idx].children = []
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

function getRowChildren(tree: Array<Record<string, unknown>>, row: RowKind): Array<Record<string, unknown>> {
  const theme = tree[0]
  const children = theme.children as Array<Record<string, unknown>>
  const rowNode = children[ROW_INDEX[row]]
  if (!Array.isArray(rowNode.children)) rowNode.children = []
  return rowNode.children as Array<Record<string, unknown>>
}

export function createEmptyParserState(): DashboardToolParserState {
  return {
    dashboardName: null,
    tree: null,
    widgetIndexById: {},
  }
}

export function createDashboard(_state: DashboardToolParserState, input: CreateDashboardInput): DashboardToolParserState {
  const theme = String(input.theme || 'light').trim() || 'light'
  const nextTree = ensureThemeTree(null)
  ensureBaseRows(nextTree)

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
  }
}

export function addWidget(state: DashboardToolParserState, input: AddWidgetInput): DashboardToolParserState {
  requireParserReady(state, input.dashboard_name)

  const nextTree = ensureThemeTree(state.tree)
  ensureBaseRows(nextTree)

  const row = input.widget_type
  const nextIndexMap: Record<string, WidgetIndex> = { ...state.widgetIndexById }
  const existing = nextIndexMap[input.widget_id]
  const node = buildNodeFromInput(input)

  if (existing) {
    const previousRowChildren = getRowChildren(nextTree, existing.row)
    if (previousRowChildren[existing.index]) {
      previousRowChildren.splice(existing.index, 1)
      for (const [widgetId, indexInfo] of Object.entries(nextIndexMap)) {
        if (widgetId === input.widget_id) continue
        if (indexInfo.row === existing.row && indexInfo.index > existing.index) {
          nextIndexMap[widgetId] = { ...indexInfo, index: indexInfo.index - 1 }
        }
      }
    }
  }

  const rowChildren = getRowChildren(nextTree, row)
  const insertAt =
    existing && existing.row === row
      ? Math.min(existing.index, rowChildren.length)
      : rowChildren.length

  for (const [widgetId, indexInfo] of Object.entries(nextIndexMap)) {
    if (widgetId === input.widget_id) continue
    if (indexInfo.row === row && indexInfo.index >= insertAt) {
      nextIndexMap[widgetId] = { ...indexInfo, index: indexInfo.index + 1 }
    }
  }
  rowChildren.splice(insertAt, 0, node)
  nextIndexMap[input.widget_id] = { row, index: insertAt }

  return {
    dashboardName: state.dashboardName,
    tree: nextTree,
    widgetIndexById: nextIndexMap,
  }
}

export function addWidgetsBatch(state: DashboardToolParserState, input: AddWidgetsBatchInput): DashboardToolParserState {
  requireParserReady(state, input.dashboard_name)
  return input.widgets.reduce((acc, widget) => addWidget(acc, widget), state)
}
