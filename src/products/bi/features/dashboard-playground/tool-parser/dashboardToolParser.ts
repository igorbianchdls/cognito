import type { JsonTree } from '@/products/bi/shared/types'
import { listAppsFilters } from '@/products/bi/shared/queryCatalog'

export type WidgetType = 'kpi' | 'chart' | 'filtro' | 'insights'
type MetricFormat = 'currency' | 'percent' | 'number'

type KpiPayload = {
  title: string
  query?: string
  fr?: number
  formato?: MetricFormat | string
  filtros?: Record<string, unknown>
}

type ChartPayload = {
  chart_type: 'bar' | 'line' | 'pie'
  title: string
  query?: string
  xField?: string
  yField?: string
  keyField?: string
  layout?: 'auto' | 'vertical' | 'horizontal' | string
  fr?: number
  formato?: MetricFormat | string
  filtros?: Record<string, unknown>
  limit?: number
  height?: number
}

type FiltroPayload = {
  title: string
  campo: string
  tabela: string
  tipo?: 'list' | 'dropdown' | 'multi' | string
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
  return 'principal'
}

function resolveBarLayout(payload: ChartPayload): 'vertical' | 'horizontal' {
  const raw = String((payload as any).layout ?? '').trim().toLowerCase()
  if (raw === 'vertical' || raw === 'horizontal') return raw

  const xField = String((payload as any).xField ?? '').trim().toLowerCase()
  const isTimeLike =
    xField.includes('mes') ||
    xField.includes('mês') ||
    xField.includes('month') ||
    xField.includes('data') ||
    xField.includes('date') ||
    xField.includes('period') ||
    xField.includes('periodo') ||
    xField.includes('período') ||
    xField.includes('ano') ||
    xField.includes('year')

  return isTimeLike ? 'vertical' : 'horizontal'
}

function normalizeFormat(value: unknown): MetricFormat {
  const raw = String(value ?? '').trim().toLowerCase()
  if (!raw) return 'number'

  if (
    raw === 'currency' ||
    raw === 'moeda' ||
    raw === 'money' ||
    raw === 'brl' ||
    raw === 'r$' ||
    raw === 'real' ||
    raw === 'reais' ||
    raw === 'monetario' ||
    raw === 'monetário'
  ) {
    return 'currency'
  }

  if (
    raw === 'percent' ||
    raw === 'percentage' ||
    raw === 'pct' ||
    raw === '%' ||
    raw === 'porcentagem' ||
    raw === 'percentual'
  ) {
    return 'percent'
  }

  return 'number'
}

function normalizeFieldName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function normalizeFiltroType(value: unknown): 'list' | 'dropdown' | 'multi' {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'list' || raw === 'dropdown' || raw === 'multi') return raw
  return 'list'
}

function toRequiredText(value: unknown, fieldName: string): string {
  const out = String(value ?? '').trim()
  if (!out) throw new Error(`${fieldName} é obrigatório`)
  return out
}

function toChartType(value: unknown): ChartPayload['chart_type'] {
  const out = String(value ?? '').trim().toLowerCase()
  if (out === 'bar' || out === 'line' || out === 'pie') return out
  throw new Error('payload.chart_type inválido. Use: bar, line, pie')
}

function resolveSlicerField(table: string, rawField: string): string {
  const filters = listAppsFilters(table)
  const normalized = normalizeFieldName(rawField)
  if (!normalized) return normalized

  const exact = filters.find((f) => normalizeFieldName(f.field) === normalized)
  if (exact) return exact.field

  if (!normalized.endsWith('_id')) {
    const idCandidate = `${normalized}_id`
    const idMatch = filters.find((f) => normalizeFieldName(f.field) === idCandidate)
    if (idMatch) return idMatch.field
  }

  return normalized
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
    type: 'Container',
    props: {
      direction: 'row',
      gap: 12,
      padding: 16,
      wrap: true,
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
  const title = toRequiredText((payload as any).title, 'payload.title')
  const query = toRequiredText((payload as any).query, 'payload.query')

  return {
    type: 'KPI',
    props: {
      title,
      fr: payload.fr ?? 1,
      format: normalizeFormat(payload.formato),
      dataQuery: {
        query,
        filters: payload.filtros ?? {},
      },
    },
  }
}

function buildChartNode(payload: ChartPayload): Record<string, unknown> {
  const chartType = toChartType((payload as any).chart_type)
  const title = toRequiredText((payload as any).title, 'payload.title')
  const query = toRequiredText((payload as any).query, 'payload.query')

  const typeMap: Record<ChartPayload['chart_type'], string> = {
    bar: 'BarChart',
    line: 'LineChart',
    pie: 'PieChart',
  }

  const barLayout = chartType === 'bar' ? resolveBarLayout(payload) : undefined

  return {
    type: typeMap[chartType],
    props: {
      title,
      fr: payload.fr ?? 1,
      format: normalizeFormat(payload.formato),
      height: payload.height ?? 240,
      ...(barLayout ? { nivo: { layout: barLayout } } : {}),
      dataQuery: {
        query,
        xField: toRequiredText((payload as any).xField, 'payload.xField'),
        yField: toRequiredText((payload as any).yField, 'payload.yField'),
        ...(typeof payload.keyField === 'string' && payload.keyField.trim() ? { keyField: payload.keyField.trim() } : {}),
        ...(typeof (payload as any).seriesField === 'string' && (payload as any).seriesField.trim()
          ? { seriesField: (payload as any).seriesField.trim() }
          : {}),
        filters: payload.filtros ?? {},
        ...(typeof payload.limit === 'number' ? { limit: payload.limit } : {}),
      },
    },
  }
}

function buildFiltroNode(payload: FiltroPayload): Record<string, unknown> {
  const title = toRequiredText((payload as any).title, 'payload.title')
  const campo = toRequiredText((payload as any).campo, 'payload.campo')
  const tabela = toRequiredText((payload as any).tabela, 'payload.tabela')
  const resolvedField = resolveSlicerField(tabela, campo)
  const key = sanitizeKey(payload.chave || resolvedField)
  const slicerType = normalizeFiltroType((payload as any).tipo)

  return {
    type: 'SlicerCard',
    props: {
      title,
      fr: payload.fr ?? 1,
      fields: [
        {
          label: title,
          type: slicerType,
          storePath: `filters.${key}`,
          source: {
            type: 'options',
            model: tabela,
            field: resolvedField,
          },
        },
      ],
    },
  }
}

function buildInsightsNode(payload: InsightsPayload): Record<string, unknown> {
  const title = toRequiredText((payload as any).title, 'payload.title')
  const items = Array.isArray((payload as any).items) ? (payload as any).items : []
  if (!items.length) throw new Error('payload.items é obrigatório em insights')

  return {
    type: 'AISummary',
    props: {
      title,
      fr: payload.fr ?? 1,
      items: items.map((item: any) => {
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
