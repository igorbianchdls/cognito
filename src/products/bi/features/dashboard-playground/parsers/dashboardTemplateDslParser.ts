import type { JsonTree } from '@/products/bi/shared/types'

type AttrMap = Record<string, string>

type DslNode = {
  tag: string
  attrs: AttrMap
  children: DslNode[]
  text: string
  start: number
}

type CompileContext = {
  chartInteractionDefaults?: Record<string, unknown>
}

function lineCol(source: string, index: number): { line: number; column: number } {
  const safe = Math.max(0, Math.min(index, source.length))
  const segment = source.slice(0, safe)
  const lines = segment.split(/\r?\n/)
  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length || 0) + 1,
  }
}

export class DashboardTemplateDslParseError extends Error {
  readonly line: number
  readonly column: number

  constructor(source: string, index: number, message: string) {
    const { line, column } = lineCol(source, index)
    super(`${message} (linha ${line}, coluna ${column})`)
    this.name = 'DashboardTemplateDslParseError'
    this.line = line
    this.column = column
  }
}

function findTagEnd(source: string, start: number): number {
  let i = start
  let quote: '"' | "'" | null = null
  while (i < source.length) {
    const ch = source[i]
    if (quote) {
      if (ch === quote) quote = null
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      i += 1
      continue
    }
    if (ch === '>') return i
    i += 1
  }
  return -1
}

function parseTagAttrs(source: string, content: string, startIndex: number): { name: string; attrs: AttrMap; selfClosing: boolean } {
  let raw = content.trim()
  let selfClosing = false
  if (raw.endsWith('/')) {
    selfClosing = true
    raw = raw.slice(0, -1).trim()
  }

  const nameMatch = raw.match(/^([a-zA-Z][a-zA-Z0-9_-]*)/)
  if (!nameMatch) throw new DashboardTemplateDslParseError(source, startIndex, `Tag invalida: <${content}>`)

  const name = nameMatch[1].toLowerCase()
  let cursor = nameMatch[0].length
  const attrs: AttrMap = {}

  while (cursor < raw.length) {
    while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1
    if (cursor >= raw.length) break

    const keyMatch = raw.slice(cursor).match(/^([a-zA-Z_][a-zA-Z0-9_:-]*)/)
    if (!keyMatch) throw new DashboardTemplateDslParseError(source, startIndex, `Atributo invalido em <${name}>`)
    const keyRaw = keyMatch[1]
    const key = keyRaw.trim().toLowerCase()
    cursor += keyRaw.length

    while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1
    if (raw[cursor] !== '=') {
      throw new DashboardTemplateDslParseError(source, startIndex, `Atributo "${keyRaw}" em <${name}> deve usar = "valor"`)
    }
    cursor += 1

    while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1
    const quote = raw[cursor]
    if (quote !== '"' && quote !== "'") {
      throw new DashboardTemplateDslParseError(source, startIndex, `Atributo "${keyRaw}" em <${name}> deve estar entre aspas`)
    }
    cursor += 1

    const valueStart = cursor
    while (cursor < raw.length && raw[cursor] !== quote) cursor += 1
    if (cursor >= raw.length) {
      throw new DashboardTemplateDslParseError(source, startIndex, `Atributo "${keyRaw}" em <${name}> nao foi fechado`)
    }
    const value = raw.slice(valueStart, cursor)
    cursor += 1
    attrs[key] = value
  }

  return { name, attrs, selfClosing }
}

function parseDslTree(sourceRaw: string): DslNode {
  const source = String(sourceRaw || '')
  const stack: DslNode[] = []
  let root: DslNode | null = null
  let i = 0
  const RAW_TEXT_TAGS = new Set(['props', 'query', 'sql'])

  while (i < source.length) {
    const top = stack[stack.length - 1]
    if (top && RAW_TEXT_TAGS.has(top.tag)) {
      const close = `</${top.tag}>`
      const closeIndex = source.toLowerCase().indexOf(close, i)
      if (closeIndex < 0) throw new DashboardTemplateDslParseError(source, top.start, `Tag <${top.tag}> nao foi fechada`)
      if (closeIndex > i) {
        top.text += source.slice(i, closeIndex)
        i = closeIndex
        continue
      }
    }

    if (source.startsWith('<!--', i)) {
      const end = source.indexOf('-->', i + 4)
      if (end < 0) throw new DashboardTemplateDslParseError(source, i, 'Comentario nao foi fechado')
      i = end + 3
      continue
    }

    const ch = source[i]
    if (ch !== '<') {
      const next = source.indexOf('<', i)
      const end = next < 0 ? source.length : next
      const text = source.slice(i, end)
      if (stack.length === 0 && text.trim()) {
        throw new DashboardTemplateDslParseError(source, i, 'Texto fora da tag raiz nao e permitido')
      }
      if (stack.length > 0) stack[stack.length - 1].text += text
      i = end
      continue
    }

    const end = findTagEnd(source, i + 1)
    if (end < 0) throw new DashboardTemplateDslParseError(source, i, 'Tag nao foi fechada com ">"')
    const raw = source.slice(i + 1, end).trim()
    if (!raw) throw new DashboardTemplateDslParseError(source, i, 'Tag vazia nao e permitida')

    if (raw.startsWith('/')) {
      const closeName = raw.slice(1).trim().toLowerCase()
      const current = stack.pop()
      if (!current) throw new DashboardTemplateDslParseError(source, i, `Tag de fechamento </${closeName}> sem abertura`)
      if (current.tag !== closeName) {
        throw new DashboardTemplateDslParseError(source, i, `Fechamento invalido: esperado </${current.tag}> e recebido </${closeName}>`)
      }
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(current)
      } else if (!root) {
        root = current
      } else {
        throw new DashboardTemplateDslParseError(source, i, 'Apenas uma tag raiz e permitida')
      }
      i = end + 1
      continue
    }

    const parsed = parseTagAttrs(source, raw, i)
    const node: DslNode = {
      tag: parsed.name,
      attrs: parsed.attrs,
      children: [],
      text: '',
      start: i,
    }

    if (parsed.selfClosing) {
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node)
      } else if (!root) {
        root = node
      } else {
        throw new DashboardTemplateDslParseError(source, i, 'Apenas uma tag raiz e permitida')
      }
    } else {
      stack.push(node)
    }

    i = end + 1
  }

  if (stack.length) {
    const pending = stack[stack.length - 1]
    throw new DashboardTemplateDslParseError(source, pending.start, `Tag <${pending.tag}> nao foi fechada`)
  }
  if (!root) throw new DashboardTemplateDslParseError(source, 0, 'DSL vazio ou sem tag raiz')

  return root
}

function parsePropsNode(source: string, node: DslNode): Record<string, unknown> {
  const raw = String(node.text || '').trim()
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new DashboardTemplateDslParseError(source, node.start, 'JSON invalido em <props>')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DashboardTemplateDslParseError(source, node.start, '<props> deve conter um objeto JSON')
  }
  return parsed as Record<string, unknown>
}

function toCamelKey(input: string): string {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

function parsePrimitive(valueRaw: string): unknown {
  const value = String(valueRaw ?? '').trim()
  if (!value) return ''
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return valueRaw
}

function attrsToProps(attrs: AttrMap, opts?: { skip?: string[] }): Record<string, unknown> {
  const skip = new Set((opts?.skip || []).map((s) => String(s).toLowerCase()))
  const out: Record<string, unknown> = {}
  for (const [rawKey, rawVal] of Object.entries(attrs || {})) {
    const keyLower = String(rawKey || '').toLowerCase()
    if (!keyLower || skip.has(keyLower)) continue
    const key = toCamelKey(keyLower)
    if (!key) continue
    out[key] = parsePrimitive(rawVal)
  }
  return out
}

function mergeObjects(base: Record<string, unknown>, extra: Record<string, unknown>): Record<string, unknown> {
  return { ...(base || {}), ...(extra || {}) }
}

function mapChartType(source: string, node: DslNode, rawType: string): string {
  const t = String(rawType || '').trim().toLowerCase()
  if (t === 'line') return 'LineChart'
  if (t === 'bar') return 'BarChart'
  if (t === 'pie') return 'PieChart'
  throw new DashboardTemplateDslParseError(source, node.start, `Tag <chart> exige type valido: line | bar | pie`)
}

function toCatalogType(tag: string): string {
  if (tag === 'chart') return 'Chart'
  if (tag === 'kpi') return 'KPI'
  if (tag === 'ai-summary' || tag === 'aisummary') return 'AISummary'
  return tag
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function compileDefaultsNode(source: string, node: DslNode): CompileContext {
  const attrDefaults = attrsToProps(node.attrs)
  const propsNodes = node.children.filter((child) => child.tag === 'props')
  if (propsNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <defaults> aceita no maximo um <props>')
  }
  const jsonDefaults = propsNodes.length ? parsePropsNode(source, propsNodes[0]) : {}
  const interactionFromAttrs: Record<string, unknown> = {}
  for (const [kRaw, vRaw] of Object.entries(node.attrs || {})) {
    const k = String(kRaw || '').toLowerCase()
    if (k.startsWith('interaction-')) {
      interactionFromAttrs[toCamelKey(k.slice('interaction-'.length))] = parsePrimitive(vRaw)
      continue
    }
    if (k === 'click-as-filter') interactionFromAttrs.clickAsFilter = parsePrimitive(vRaw)
    if (k === 'clear-on-second-click') interactionFromAttrs.clearOnSecondClick = parsePrimitive(vRaw)
  }

  const interactionNodes = node.children.filter((child) => child.tag === 'interaction')
  if (interactionNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <defaults> aceita no maximo um <interaction>')
  }
  const interactionFromNode = interactionNodes.length ? attrsToProps(interactionNodes[0].attrs) : {}

  const jsonInteraction =
    jsonDefaults.interaction && typeof jsonDefaults.interaction === 'object' && !Array.isArray(jsonDefaults.interaction)
      ? (jsonDefaults.interaction as Record<string, unknown>)
      : {}

  const mergedInteraction = {
    ...jsonInteraction,
    ...interactionFromNode,
    ...interactionFromAttrs,
  }

  const fromAttrRoot =
    attrDefaults.interaction && typeof attrDefaults.interaction === 'object' && !Array.isArray(attrDefaults.interaction)
      ? (attrDefaults.interaction as Record<string, unknown>)
      : {}

  const finalInteraction = { ...fromAttrRoot, ...mergedInteraction }
  if (Object.keys(finalInteraction).length === 0) return {}
  return { chartInteractionDefaults: finalInteraction }
}

function compileChartNode(source: string, node: DslNode, context: CompileContext): Record<string, unknown> {
  const chartType = mapChartType(source, node, String(node.attrs.type || ''))
  const propsNodes = node.children.filter((child) => child.tag === 'props')
  if (propsNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <chart> aceita no maximo um <props>')
  }
  const propsFromAttrs = attrsToProps(node.attrs, { skip: ['type'] })
  const propsFromJson = propsNodes.length ? parsePropsNode(source, propsNodes[0]) : {}
  const props = mergeObjects(propsFromAttrs, propsFromJson)

  const queryNodes = node.children.filter((child) => child.tag === 'query' || child.tag === 'sql')
  if (queryNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <chart> aceita no maximo um <query>')
  }
  const fieldsNodes = node.children.filter((child) => child.tag === 'fields')
  if (fieldsNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <chart> aceita no maximo um <fields>')
  }
  const interactionNodes = node.children.filter((child) => child.tag === 'interaction')
  if (interactionNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <chart> aceita no maximo um <interaction>')
  }
  const nivoNodes = node.children.filter((child) => child.tag === 'nivo')
  if (nivoNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <chart> aceita no maximo um <nivo>')
  }

  const dataQueryFromProps =
    props.dataQuery && typeof props.dataQuery === 'object' && !Array.isArray(props.dataQuery)
      ? ({ ...(props.dataQuery as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  if (queryNodes.length) {
    const queryRaw = String(queryNodes[0].text || '').trim()
    if (queryRaw) dataQueryFromProps.query = queryRaw
  }

  if (fieldsNodes.length) {
    const attrs = fieldsNodes[0].attrs
    const x = attrs.x || attrs.xfield || attrs['x-field']
    const y = attrs.y || attrs.yfield || attrs.valuefield || attrs['value-field'] || attrs['y-field']
    const key = attrs.key || attrs.keyfield || attrs['key-field']
    if (x) dataQueryFromProps.xField = String(x)
    if (y) dataQueryFromProps.yField = String(y)
    if (key) dataQueryFromProps.keyField = String(key)
  }

  if (Object.keys(dataQueryFromProps).length) props.dataQuery = dataQueryFromProps

  const interactionFromDefaults = context.chartInteractionDefaults || {}
  const interactionFromProps =
    props.interaction && typeof props.interaction === 'object' && !Array.isArray(props.interaction)
      ? ({ ...(props.interaction as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  const interactionFromNode = interactionNodes.length ? attrsToProps(interactionNodes[0].attrs) : {}
  const mergedInteraction = {
    ...interactionFromDefaults,
    ...interactionFromProps,
    ...interactionFromNode,
  }
  if (Object.keys(mergedInteraction).length) props.interaction = mergedInteraction

  if (nivoNodes.length) {
    const nivoFromNode = attrsToProps(nivoNodes[0].attrs)
    const nivoFromProps =
      props.nivo && typeof props.nivo === 'object' && !Array.isArray(props.nivo)
        ? ({ ...(props.nivo as Record<string, unknown>) } as Record<string, unknown>)
        : {}
    props.nivo = {
      ...nivoFromProps,
      ...nivoFromNode,
    }
  }

  const out: Record<string, unknown> = { type: chartType }
  if (Object.keys(props).length) out.props = props
  return out
}

function compileNode(source: string, node: DslNode, context: CompileContext): Record<string, unknown> | null {
  if (node.tag === 'defaults') return null
  if (node.tag === 'chart') return compileChartNode(source, node, context)

  const type = toCatalogType(node.tag)
  if (!type || type === 'Chart') {
    throw new DashboardTemplateDslParseError(source, node.start, `Tag <${node.tag}> nao e suportada`)
  }

  const propsNodes = node.children.filter((child) => child.tag === 'props')
  if (propsNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, `Tag <${node.tag}> aceita no maximo um <props>`)
  }

  const propsFromAttrs = attrsToProps(node.attrs)
  const propsFromJson = propsNodes.length ? parsePropsNode(source, propsNodes[0]) : {}
  const props = mergeObjects(propsFromAttrs, propsFromJson)
  if (type === 'LineChart' || type === 'BarChart' || type === 'PieChart') {
    const interactionFromDefaults = context.chartInteractionDefaults || {}
    const interactionFromProps =
      props.interaction && typeof props.interaction === 'object' && !Array.isArray(props.interaction)
        ? (props.interaction as Record<string, unknown>)
        : {}
    const mergedInteraction = {
      ...interactionFromDefaults,
      ...interactionFromProps,
    }
    if (Object.keys(mergedInteraction).length) props.interaction = mergedInteraction
  }
  const children = node.children
    .filter((child) => child.tag !== 'props')
    .map((child) => compileNode(source, child, context))
    .filter((child): child is Record<string, unknown> => Boolean(child))

  const out: Record<string, unknown> = { type }
  if (Object.keys(props).length) out.props = props
  if (children.length) out.children = children
  return out
}

export function parseDashboardTemplateDslToTree(source: string): JsonTree {
  const root = parseDslTree(source)
  if (root.tag !== 'dashboard-template') {
    throw new DashboardTemplateDslParseError(source, root.start, `Tag raiz invalida: esperado <dashboard-template> e recebido <${root.tag}>`)
  }
  function collectDefaults(nodes: DslNode[], acc: DslNode[] = []): DslNode[] {
    for (const n of nodes) {
      if (n.tag === 'defaults') acc.push(n)
      if (Array.isArray(n.children) && n.children.length) collectDefaults(n.children, acc)
    }
    return acc
  }
  let context: CompileContext = {}
  const defaultsNodes = collectDefaults(root.children)
  for (const defaultsNode of defaultsNodes) {
    const parsed = compileDefaultsNode(source, defaultsNode)
    context = {
      chartInteractionDefaults: {
        ...(context.chartInteractionDefaults || {}),
        ...(parsed.chartInteractionDefaults || {}),
      },
    }
  }
  return root.children
    .map((node) => compileNode(source, node, context))
    .filter((node): node is Record<string, unknown> => Boolean(node))
}

function sanitizeTemplateName(value: string): string {
  const out = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return out || 'dashboard_template'
}

function chartTypeToAttr(type: string): 'line' | 'bar' | 'pie' | null {
  if (type === 'LineChart') return 'line'
  if (type === 'BarChart') return 'bar'
  if (type === 'PieChart') return 'pie'
  return null
}

function toDslTag(type: string): string {
  const raw = String(type || '').trim()
  if (!raw) return 'node'
  if (chartTypeToAttr(raw)) return 'chart'
  if (raw === 'KPI') return 'kpi'
  if (raw === 'AISummary') return 'ai-summary'
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

function renderIndent(level: number): string {
  return '  '.repeat(level)
}

function toKebabKey(input: string): string {
  return String(input || '')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

function escapeAttr(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

function renderAttrs(attrs: Record<string, unknown>): string {
  const parts: string[] = []
  for (const [keyRaw, valueRaw] of Object.entries(attrs || {})) {
    if (valueRaw === undefined) continue
    if (typeof valueRaw === 'object' && valueRaw !== null) continue
    const key = toKebabKey(keyRaw)
    if (!key) continue
    const value =
      typeof valueRaw === 'boolean'
        ? (valueRaw ? 'true' : 'false')
        : String(valueRaw)
    parts.push(`${key}="${escapeAttr(value)}"`)
  }
  return parts.length ? ` ${parts.join(' ')}` : ''
}

function renderPropsBlock(props: unknown, level: number): string[] {
  if (!props || typeof props !== 'object' || Array.isArray(props) || Object.keys(props as Record<string, unknown>).length === 0) {
    return []
  }
  const json = JSON.stringify(props, null, 2)
  if (!json) return []
  const lines = json.split('\n')
  return [
    `${renderIndent(level)}<props>`,
    ...lines.map((line) => `${renderIndent(level + 1)}${line}`),
    `${renderIndent(level)}</props>`,
  ]
}

function renderChartNodeToDsl(node: Record<string, unknown>, level: number): string[] {
  const propsRaw =
    node.props && typeof node.props === 'object' && !Array.isArray(node.props)
      ? ({ ...(node.props as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  const typeRaw = String(node.type || '').trim()
  const chartType = chartTypeToAttr(typeRaw) || 'bar'

  const baseAttrs: Record<string, unknown> = { type: chartType }
  const consumedTopLevel = new Set(['dataQuery', 'interaction', 'nivo'])
  for (const [k, v] of Object.entries(propsRaw)) {
    if (consumedTopLevel.has(k)) continue
    if (v === undefined) continue
    if (typeof v !== 'object' || v === null) {
      baseAttrs[k] = v
      delete propsRaw[k]
    }
  }

  const lines: string[] = [`${renderIndent(level)}<chart${renderAttrs(baseAttrs)}>`]

  const dataQueryRaw =
    propsRaw.dataQuery && typeof propsRaw.dataQuery === 'object' && !Array.isArray(propsRaw.dataQuery)
      ? ({ ...(propsRaw.dataQuery as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const query = typeof dataQueryRaw.query === 'string' ? dataQueryRaw.query : ''
  if (query.trim()) {
    lines.push(`${renderIndent(level + 1)}<query>`)
    lines.push(query
      .split('\n')
      .map((line) => `${renderIndent(level + 2)}${line}`)
      .join('\n'))
    lines.push(`${renderIndent(level + 1)}</query>`)
    delete dataQueryRaw.query
  }

  const fieldsAttrs: Record<string, unknown> = {}
  if (typeof dataQueryRaw.xField === 'string' && dataQueryRaw.xField.trim()) {
    fieldsAttrs.x = dataQueryRaw.xField
    delete dataQueryRaw.xField
  }
  if (typeof dataQueryRaw.yField === 'string' && dataQueryRaw.yField.trim()) {
    fieldsAttrs.y = dataQueryRaw.yField
    delete dataQueryRaw.yField
  }
  if (typeof dataQueryRaw.keyField === 'string' && dataQueryRaw.keyField.trim()) {
    fieldsAttrs.key = dataQueryRaw.keyField
    delete dataQueryRaw.keyField
  }
  if (Object.keys(fieldsAttrs).length) {
    lines.push(`${renderIndent(level + 1)}<fields${renderAttrs(fieldsAttrs)} />`)
  }

  const interactionRaw =
    propsRaw.interaction && typeof propsRaw.interaction === 'object' && !Array.isArray(propsRaw.interaction)
      ? ({ ...(propsRaw.interaction as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  if (Object.keys(interactionRaw).length) {
    lines.push(`${renderIndent(level + 1)}<interaction${renderAttrs(interactionRaw)} />`)
    delete propsRaw.interaction
  }

  const nivoRaw =
    propsRaw.nivo && typeof propsRaw.nivo === 'object' && !Array.isArray(propsRaw.nivo)
      ? ({ ...(propsRaw.nivo as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  if (Object.keys(nivoRaw).length) {
    lines.push(`${renderIndent(level + 1)}<nivo${renderAttrs(nivoRaw)} />`)
    delete propsRaw.nivo
  }

  if (Object.keys(dataQueryRaw).length) {
    propsRaw.dataQuery = dataQueryRaw
  } else {
    delete propsRaw.dataQuery
  }

  lines.push(...renderPropsBlock(propsRaw, level + 1))

  const children = Array.isArray(node.children) ? node.children : []
  for (const child of children) {
    lines.push(...renderNodeToDsl(child, level + 1))
  }

  lines.push(`${renderIndent(level)}</chart>`)
  return lines
}

function renderNodeToDsl(node: unknown, level: number): string[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return []
  const record = node as Record<string, unknown>
  if (chartTypeToAttr(String(record.type || '').trim())) {
    return renderChartNodeToDsl(record, level)
  }
  const tag = toDslTag(String(record.type || 'node'))
  const lines: string[] = [`${renderIndent(level)}<${tag}>`]
  lines.push(...renderPropsBlock(record.props, level + 1))

  const children = Array.isArray(record.children) ? record.children : []
  for (const child of children) {
    lines.push(...renderNodeToDsl(child, level + 1))
  }

  lines.push(`${renderIndent(level)}</${tag}>`)
  return lines
}

export function renderDashboardTemplateDslFromTree(tree: JsonTree, templateName = 'dashboard_template'): string {
  const nodes = Array.isArray(tree) ? tree : tree ? [tree] : []
  const rootName = sanitizeTemplateName(templateName)
  const lines: string[] = [`<dashboard-template name="${rootName}">`]
  for (const node of nodes) lines.push(...renderNodeToDsl(node, 1))
  lines.push('</dashboard-template>')
  return lines.join('\n')
}
