import type { JsonTree } from '@/products/bi/shared/types'

type AttrMap = Record<string, unknown>

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
  let quote: '"' | "'" | '`' | null = null
  let braceDepth = 0
  while (i < source.length) {
    const ch = source[i]
    if (quote) {
      if (ch === '\\') {
        i += 2
        continue
      }
      if (ch === quote) quote = null
      i += 1
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      i += 1
      continue
    }
    if (ch === '{') {
      braceDepth += 1
      i += 1
      continue
    }
    if (ch === '}') {
      braceDepth = Math.max(0, braceDepth - 1)
      i += 1
      continue
    }
    if (ch === '>' && braceDepth === 0) return i
    i += 1
  }
  return -1
}

function decodeQuotedString(raw: string, quote: '"' | "'" | '`'): string {
  if (!raw) return ''
  let out = ''
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i]
    if (ch !== '\\') {
      out += ch
      continue
    }
    const next = raw[i + 1]
    if (next == null) break
    i += 1
    if (next === 'n') out += '\n'
    else if (next === 'r') out += '\r'
    else if (next === 't') out += '\t'
    else if (next === quote) out += quote
    else out += next
  }
  return out
}

function escapeForJsonString(input: string): string {
  return JSON.stringify(String(input ?? '')).slice(1, -1)
}

function tryParseJsonLike(value: string): unknown {
  const trimmed = String(value || '').trim()
  if (!trimmed) return {}
  try {
    return JSON.parse(trimmed)
  } catch {}

  let normalized = trimmed
  normalized = normalized.replace(/`([^`\\]*(?:\\.[^`\\]*)*)`/g, (_, inner: string) => `"${escapeForJsonString(decodeQuotedString(inner, '`'))}"`)
  normalized = normalized.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner: string) => `"${escapeForJsonString(decodeQuotedString(inner, '\''))}"`)
  normalized = normalized.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$-]*)(\s*:)/g, '$1"$2"$3')
  normalized = normalized.replace(/,\s*([}\]])/g, '$1')
  return JSON.parse(normalized)
}

function parseJsxExpression(source: string, index: number, rawExpr: string): unknown {
  const expr = String(rawExpr || '').trim()
  if (!expr) return ''
  if ((expr.startsWith('`') && expr.endsWith('`')) || (expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith('\'') && expr.endsWith('\''))) {
    const quote = expr[0] as '"' | "'" | '`'
    return decodeQuotedString(expr.slice(1, -1), quote)
  }
  if (expr === 'true') return true
  if (expr === 'false') return false
  if (expr === 'null') return null
  if (expr === 'undefined') return null
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    const n = Number(expr)
    if (Number.isFinite(n)) return n
  }
  if (
    (expr.startsWith('{') && expr.endsWith('}')) ||
    (expr.startsWith('[') && expr.endsWith(']'))
  ) {
    try {
      return tryParseJsonLike(expr)
    } catch {
      throw new DashboardTemplateDslParseError(source, index, `Expressao invalida em atributo JSX: {${expr}}`)
    }
  }
  return expr
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
    const key = keyRaw.trim()
    cursor += keyRaw.length

    while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1
    if (raw[cursor] !== '=') {
      attrs[key] = true
      continue
    }
    cursor += 1

    while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1
    if (cursor >= raw.length) {
      throw new DashboardTemplateDslParseError(source, startIndex, `Atributo "${keyRaw}" em <${name}> sem valor`)
    }

    const quote = raw[cursor]
    if (quote === '"' || quote === "'") {
      cursor += 1
      const valueStart = cursor
      while (cursor < raw.length) {
        if (raw[cursor] === '\\') {
          cursor += 2
          continue
        }
        if (raw[cursor] === quote) break
        cursor += 1
      }
      if (cursor >= raw.length) {
        throw new DashboardTemplateDslParseError(source, startIndex, `Atributo "${keyRaw}" em <${name}> nao foi fechado`)
      }
      const value = raw.slice(valueStart, cursor)
      cursor += 1
      attrs[key] = decodeQuotedString(value, quote)
      continue
    }

    if (quote === '{') {
      const openIndex = cursor
      let depth = 0
      let innerQuote: '"' | "'" | '`' | null = null
      while (cursor < raw.length) {
        const ch = raw[cursor]
        if (innerQuote) {
          if (ch === '\\') {
            cursor += 2
            continue
          }
          if (ch === innerQuote) innerQuote = null
          cursor += 1
          continue
        }
        if (ch === '"' || ch === "'" || ch === '`') {
          innerQuote = ch
          cursor += 1
          continue
        }
        if (ch === '{') {
          depth += 1
          cursor += 1
          continue
        }
        if (ch === '}') {
          depth -= 1
          cursor += 1
          if (depth === 0) break
          continue
        }
        cursor += 1
      }
      if (depth !== 0) {
        throw new DashboardTemplateDslParseError(source, startIndex, `Atributo "${keyRaw}" em <${name}> com chaves nao fechadas`)
      }
      const exprRaw = raw.slice(openIndex + 1, cursor - 1)
      attrs[key] = parseJsxExpression(source, startIndex, exprRaw)
      continue
    }

    const valueStart = cursor
    while (cursor < raw.length && !/\s/.test(raw[cursor])) cursor += 1
    attrs[key] = parsePrimitive(raw.slice(valueStart, cursor))
  }

  return { name, attrs, selfClosing }
}

function parseDslTree(sourceRaw: string): DslNode {
  const source = String(sourceRaw || '')
  const stack: DslNode[] = []
  let root: DslNode | null = null
  let i = 0
  const RAW_TEXT_TAGS = new Set(['props', 'query', 'sql', 'filters', 'style', 'config'])

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

function parseJsonObjectNode(source: string, node: DslNode, tagName: string): Record<string, unknown> {
  const raw = String(node.text || '').trim()
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new DashboardTemplateDslParseError(source, node.start, `JSON invalido em <${tagName}>`)
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new DashboardTemplateDslParseError(source, node.start, `<${tagName}> deve conter um objeto JSON`)
  }
  return parsed as Record<string, unknown>
}

function toCamelKey(input: string): string {
  const raw = String(input || '').trim()
  if (!raw) return ''
  if (/[._:-]/.test(raw)) {
    const normalized = raw
      .replace(/[_:.]/g, '-')
      .toLowerCase()
    return normalized.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
  }
  return raw.charAt(0).toLowerCase() + raw.slice(1)
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
  const normalizeKey = (value: string) => String(value || '').trim().toLowerCase().replace(/[_:.]/g, '-')
  const skip = new Set((opts?.skip || []).map((s) => normalizeKey(String(s))))
  const out: Record<string, unknown> = {}
  for (const [rawKey, rawVal] of Object.entries(attrs || {})) {
    const keyRaw = String(rawKey || '').trim()
    if (!keyRaw || skip.has(normalizeKey(keyRaw))) continue
    const key = toCamelKey(keyRaw)
    if (!key) continue
    out[key] = typeof rawVal === 'string' ? parsePrimitive(rawVal) : rawVal
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
  const normalized = String(tag || '').trim().toLowerCase()
  if (normalized === 'dashboardtemplate') return 'DashboardTemplate'
  if (normalized === 'theme') return 'Theme'
  if (normalized === 'header') return 'Header'
  if (normalized === 'div') return 'Div'
  if (normalized === 'sidebar') return 'Sidebar'
  if (normalized === 'card') return 'Card'
  if (normalized === 'cardtitle') return 'CardTitle'
  if (normalized === 'slicercard') return 'SlicerCard'
  if (normalized === 'table') return 'Table'
  if (normalized === 'linechart') return 'LineChart'
  if (normalized === 'barchart') return 'BarChart'
  if (normalized === 'piechart') return 'PieChart'
  if (normalized === 'defaults') return 'Defaults'
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
  const configNodes = node.children.filter((child) => child.tag === 'config')
  if (configNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <defaults> aceita no maximo um <config>')
  }
  const configDefaults = configNodes.length ? parseJsonObjectNode(source, configNodes[0], 'config') : {}
  const mergedDefaults = mergeObjects(jsonDefaults, configDefaults)
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
    mergedDefaults.interaction && typeof mergedDefaults.interaction === 'object' && !Array.isArray(mergedDefaults.interaction)
      ? (mergedDefaults.interaction as Record<string, unknown>)
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
  const configNodes = node.children.filter((child) => child.tag === 'config')
  if (configNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <chart> aceita no maximo um <config>')
  }
  if (configNodes.length) {
    Object.assign(props, parseJsonObjectNode(source, configNodes[0], 'config'))
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
    const attrEntries = Object.entries(attrs || {})
    const pickAttr = (...candidates: string[]): unknown => {
      const set = new Set(candidates.map((k) => k.toLowerCase()))
      for (const [k, v] of attrEntries) {
        const kn = String(k || '').toLowerCase()
        if (set.has(kn)) return v
      }
      return undefined
    }
    const x = pickAttr('x', 'xfield', 'x-field')
    const y = pickAttr('y', 'yfield', 'valuefield', 'value-field', 'y-field')
    const key = pickAttr('key', 'keyfield', 'key-field')
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

function compileHeaderNode(source: string, node: DslNode): Record<string, unknown> {
  const propsNodes = node.children.filter((child) => child.tag === 'props')
  if (propsNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <header> aceita no maximo um <props>')
  }
  const propsFromAttrs = attrsToProps(node.attrs)
  const propsFromJson = propsNodes.length ? parsePropsNode(source, propsNodes[0]) : {}
  const props = mergeObjects(propsFromAttrs, propsFromJson)

  const datePickerNodes = node.children.filter((child) => child.tag === 'date-picker' || child.tag === 'datepicker')
  if (datePickerNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <header> aceita no maximo um <date-picker>')
  }

  const configNodes = node.children.filter((child) => child.tag === 'config')
  if (configNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <header> aceita no maximo um <config>')
  }
  if (configNodes.length) {
    const cfg = parseJsonObjectNode(source, configNodes[0], 'config')
    Object.assign(props, cfg)
  }

  if (datePickerNodes.length) {
    const dpNode = datePickerNodes[0]
    const dpFromAttrs = attrsToProps(dpNode.attrs)
    const dpPropsNodes = dpNode.children.filter((child) => child.tag === 'props')
    if (dpPropsNodes.length > 1) {
      throw new DashboardTemplateDslParseError(source, dpNode.start, 'Tag <date-picker> aceita no maximo um <props>')
    }
    const dpFromJson = dpPropsNodes.length ? parsePropsNode(source, dpPropsNodes[0]) : {}
    const datePicker = mergeObjects(dpFromAttrs, dpFromJson)

    const actionNodes = dpNode.children.filter((child) => child.tag === 'action-on-change' || child.tag === 'actiononchange')
    if (actionNodes.length > 1) {
      throw new DashboardTemplateDslParseError(source, dpNode.start, 'Tag <date-picker> aceita no maximo um <action-on-change>')
    }
    if (actionNodes.length) {
      const action = attrsToProps(actionNodes[0].attrs)
      if (Object.keys(action).length) datePicker.actionOnChange = action
    }

    const styleNodes = dpNode.children.filter((child) => child.tag === 'style')
    if (styleNodes.length > 1) {
      throw new DashboardTemplateDslParseError(source, dpNode.start, 'Tag <date-picker> aceita no maximo um <style>')
    }
    if (styleNodes.length) {
      const style = parseJsonObjectNode(source, styleNodes[0], 'style')
      if (Object.keys(style).length) datePicker.style = style
    }

    const configNodesInDatePicker = dpNode.children.filter((child) => child.tag === 'config')
    if (configNodesInDatePicker.length > 1) {
      throw new DashboardTemplateDslParseError(source, dpNode.start, 'Tag <date-picker> aceita no maximo um <config>')
    }
    if (configNodesInDatePicker.length) {
      Object.assign(datePicker, parseJsonObjectNode(source, configNodesInDatePicker[0], 'config'))
    }

    if (Object.keys(datePicker).length) {
      props.datePicker = datePicker
    }
  }

  const out: Record<string, unknown> = { type: 'Header' }
  if (Object.keys(props).length) out.props = props
  return out
}

function compileKpiNode(source: string, node: DslNode): Record<string, unknown> {
  const propsNodes = node.children.filter((child) => child.tag === 'props')
  if (propsNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <kpi> aceita no maximo um <props>')
  }
  const propsFromAttrs = attrsToProps(node.attrs)
  const propsFromJson = propsNodes.length ? parsePropsNode(source, propsNodes[0]) : {}
  const props = mergeObjects(propsFromAttrs, propsFromJson)

  const queryNodes = node.children.filter((child) => child.tag === 'query' || child.tag === 'sql')
  if (queryNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <kpi> aceita no maximo um <query>')
  }

  const dataQueryFromProps =
    props.dataQuery && typeof props.dataQuery === 'object' && !Array.isArray(props.dataQuery)
      ? ({ ...(props.dataQuery as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  if (queryNodes.length) {
    const queryRaw = String(queryNodes[0].text || '').trim()
    if (queryRaw) dataQueryFromProps.query = queryRaw
  }

  const dataQueryNodes = node.children.filter((child) => child.tag === 'data-query' || child.tag === 'dataquery')
  if (dataQueryNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <kpi> aceita no maximo um <data-query>')
  }
  if (dataQueryNodes.length) {
    const dqNode = dataQueryNodes[0]
    Object.assign(dataQueryFromProps, attrsToProps(dqNode.attrs))

    const dqPropsNodes = dqNode.children.filter((child) => child.tag === 'props')
    if (dqPropsNodes.length > 1) {
      throw new DashboardTemplateDslParseError(source, dqNode.start, 'Tag <data-query> aceita no maximo um <props>')
    }
    if (dqPropsNodes.length) {
      Object.assign(dataQueryFromProps, parsePropsNode(source, dqPropsNodes[0]))
    }

    const dqQueryNodes = dqNode.children.filter((child) => child.tag === 'query' || child.tag === 'sql')
    if (dqQueryNodes.length > 1) {
      throw new DashboardTemplateDslParseError(source, dqNode.start, 'Tag <data-query> aceita no maximo um <query>')
    }
    if (dqQueryNodes.length) {
      const dqQueryRaw = String(dqQueryNodes[0].text || '').trim()
      if (dqQueryRaw) dataQueryFromProps.query = dqQueryRaw
    }

    const filterNodes = dqNode.children.filter((child) => child.tag === 'filters')
    if (filterNodes.length > 1) {
      throw new DashboardTemplateDslParseError(source, dqNode.start, 'Tag <data-query> aceita no maximo um <filters>')
    }
    if (filterNodes.length) {
      dataQueryFromProps.filters = parseJsonObjectNode(source, filterNodes[0], 'filters')
    }

    const orderByNodes = dqNode.children.filter((child) => child.tag === 'order-by' || child.tag === 'orderby')
    if (orderByNodes.length > 1) {
      throw new DashboardTemplateDslParseError(source, dqNode.start, 'Tag <data-query> aceita no maximo um <order-by>')
    }
    if (orderByNodes.length) {
      const orderBy = attrsToProps(orderByNodes[0].attrs)
      if (Object.keys(orderBy).length) dataQueryFromProps.orderBy = orderBy
    }

    const configNodesInDataQuery = dqNode.children.filter((child) => child.tag === 'config')
    if (configNodesInDataQuery.length > 1) {
      throw new DashboardTemplateDslParseError(source, dqNode.start, 'Tag <data-query> aceita no maximo um <config>')
    }
    if (configNodesInDataQuery.length) {
      Object.assign(dataQueryFromProps, parseJsonObjectNode(source, configNodesInDataQuery[0], 'config'))
    }
  }

  if (Object.keys(dataQueryFromProps).length) {
    props.dataQuery = dataQueryFromProps
  }

  const configNodes = node.children.filter((child) => child.tag === 'config')
  if (configNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, 'Tag <kpi> aceita no maximo um <config>')
  }
  if (configNodes.length) {
    Object.assign(props, parseJsonObjectNode(source, configNodes[0], 'config'))
  }

  const out: Record<string, unknown> = { type: 'KPI' }
  if (Object.keys(props).length) out.props = props
  return out
}

function compileNode(source: string, node: DslNode, context: CompileContext): Record<string, unknown> | null {
  if (node.tag === 'defaults') return null
  if (node.tag === 'chart') return compileChartNode(source, node, context)
  if (node.tag === 'header') return compileHeaderNode(source, node)
  if (node.tag === 'kpi') return compileKpiNode(source, node)

  const type = toCatalogType(node.tag)
  if (!type || type === 'Chart') {
    throw new DashboardTemplateDslParseError(source, node.start, `Tag <${node.tag}> nao e suportada`)
  }

  const propsNodes = node.children.filter((child) => child.tag === 'props')
  if (propsNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, `Tag <${node.tag}> aceita no maximo um <props>`)
  }
  const configNodes = node.children.filter((child) => child.tag === 'config')
  if (configNodes.length > 1) {
    throw new DashboardTemplateDslParseError(source, node.start, `Tag <${node.tag}> aceita no maximo um <config>`)
  }

  const propsFromAttrs = attrsToProps(node.attrs)
  const propsFromJson = propsNodes.length ? parsePropsNode(source, propsNodes[0]) : {}
  const propsFromConfig = configNodes.length ? parseJsonObjectNode(source, configNodes[0], 'config') : {}
  const props = mergeObjects(mergeObjects(propsFromAttrs, propsFromJson), propsFromConfig)
  if (type === 'CardTitle') {
    const inlineText = String(node.text || '').trim()
    if (inlineText && props.text === undefined && props.title === undefined) {
      props.text = inlineText
    }
  }
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
    .filter((child) => child.tag !== 'props' && child.tag !== 'config')
    .map((child) => compileNode(source, child, context))
    .filter((child): child is Record<string, unknown> => Boolean(child))

  const out: Record<string, unknown> = { type }
  if (Object.keys(props).length) out.props = props
  if (children.length) out.children = children
  return out
}

export function parseDashboardTemplateDslToTree(source: string): JsonTree {
  const root = parseDslTree(source)
  if (root.tag !== 'dashboard-template' && root.tag !== 'dashboardtemplate') {
    throw new DashboardTemplateDslParseError(source, root.start, `Tag raiz invalida: esperado <DashboardTemplate> e recebido <${root.tag}>`)
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
  if (!raw) return 'Node'
  if (chartTypeToAttr(raw)) return 'Chart'
  if (raw === 'KPI') return 'KPI'
  if (raw === 'AISummary') return 'AISummary'
  if (raw === 'CardTitle') return 'CardTitle'
  if (raw === 'SlicerCard') return 'SlicerCard'
  if (raw === 'Theme') return 'Theme'
  if (raw === 'Header') return 'Header'
  if (raw === 'Div') return 'Div'
  if (raw === 'Sidebar') return 'Sidebar'
  if (raw === 'Table') return 'Table'
  return raw
}

function renderIndent(level: number): string {
  return '  '.repeat(level)
}

function toJsxKey(input: string): string {
  const raw = String(input || '').trim()
  if (!raw) return ''
  if (raw.includes('-') || raw.includes('_') || raw.includes('.')) {
    const normalized = raw.replace(/[_.]/g, '-').toLowerCase()
    return normalized.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
  }
  return raw
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
    const key = toJsxKey(keyRaw)
    if (!key) continue
    if (valueRaw === true) {
      parts.push(key)
      continue
    }
    if (valueRaw === false) {
      parts.push(`${key}={false}`)
      continue
    }
    if (valueRaw === null) {
      parts.push(`${key}={null}`)
      continue
    }
    if (typeof valueRaw === 'number') {
      parts.push(`${key}={${String(valueRaw)}}`)
      continue
    }
    if (typeof valueRaw === 'string') {
      parts.push(`${key}="${escapeAttr(valueRaw)}"`)
      continue
    }
    try {
      parts.push(`${key}={${JSON.stringify(valueRaw)}}`)
    } catch {
      parts.push(`${key}="${escapeAttr(String(valueRaw))}"`)
    }
  }
  return parts.length ? ` ${parts.join(' ')}` : ''
}

function renderJsonObjectBlock(tag: string, value: unknown, level: number): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value as Record<string, unknown>).length === 0) {
    return []
  }
  const json = JSON.stringify(value, null, 2)
  if (!json) return []
  const lines = json.split('\n')
  return [
    `${renderIndent(level)}<${tag}>`,
    ...lines.map((line) => `${renderIndent(level + 1)}${line}`),
    `${renderIndent(level)}</${tag}>`,
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

  const lines: string[] = [`${renderIndent(level)}<Chart${renderAttrs(baseAttrs)}>`]

  const dataQueryRaw =
    propsRaw.dataQuery && typeof propsRaw.dataQuery === 'object' && !Array.isArray(propsRaw.dataQuery)
      ? ({ ...(propsRaw.dataQuery as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const query = typeof dataQueryRaw.query === 'string' ? dataQueryRaw.query : ''
  if (query.trim()) {
    lines.push(`${renderIndent(level + 1)}<Query>`)
    lines.push(query
      .split('\n')
      .map((line) => `${renderIndent(level + 2)}${line}`)
      .join('\n'))
    lines.push(`${renderIndent(level + 1)}</Query>`)
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
    lines.push(`${renderIndent(level + 1)}<Fields${renderAttrs(fieldsAttrs)} />`)
  }

  const interactionRaw =
    propsRaw.interaction && typeof propsRaw.interaction === 'object' && !Array.isArray(propsRaw.interaction)
      ? ({ ...(propsRaw.interaction as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  if (Object.keys(interactionRaw).length) {
    lines.push(`${renderIndent(level + 1)}<Interaction${renderAttrs(interactionRaw)} />`)
    delete propsRaw.interaction
  }

  const nivoRaw =
    propsRaw.nivo && typeof propsRaw.nivo === 'object' && !Array.isArray(propsRaw.nivo)
      ? ({ ...(propsRaw.nivo as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  if (Object.keys(nivoRaw).length) {
    lines.push(`${renderIndent(level + 1)}<Nivo${renderAttrs(nivoRaw)} />`)
    delete propsRaw.nivo
  }

  if (Object.keys(dataQueryRaw).length) {
    propsRaw.dataQuery = dataQueryRaw
  } else {
    delete propsRaw.dataQuery
  }

  lines.push(...renderJsonObjectBlock('Config', propsRaw, level + 1))

  const children = Array.isArray(node.children) ? node.children : []
  for (const child of children) {
    lines.push(...renderNodeToDsl(child, level + 1))
  }

  lines.push(`${renderIndent(level)}</Chart>`)
  return lines
}

function renderHeaderNodeToDsl(node: Record<string, unknown>, level: number): string[] {
  const propsRaw =
    node.props && typeof node.props === 'object' && !Array.isArray(node.props)
      ? ({ ...(node.props as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const datePickerRaw =
    propsRaw.datePicker && typeof propsRaw.datePicker === 'object' && !Array.isArray(propsRaw.datePicker)
      ? ({ ...(propsRaw.datePicker as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  delete propsRaw.datePicker

  const headerAttrs: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(propsRaw)) {
    if (v === undefined) continue
    if (typeof v !== 'object' || v === null) {
      headerAttrs[k] = v
      delete propsRaw[k]
    }
  }

  const lines: string[] = [`${renderIndent(level)}<Header${renderAttrs(headerAttrs)}>`]

  if (Object.keys(datePickerRaw).length) {
    const datePickerAttrs: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(datePickerRaw)) {
      if (v === undefined) continue
      if (typeof v !== 'object' || v === null) {
        datePickerAttrs[k] = v
        delete datePickerRaw[k]
      }
    }

    const actionOnChangeRaw =
      datePickerRaw.actionOnChange && typeof datePickerRaw.actionOnChange === 'object' && !Array.isArray(datePickerRaw.actionOnChange)
        ? ({ ...(datePickerRaw.actionOnChange as Record<string, unknown>) } as Record<string, unknown>)
        : {}
    delete datePickerRaw.actionOnChange

    const styleRaw =
      datePickerRaw.style && typeof datePickerRaw.style === 'object' && !Array.isArray(datePickerRaw.style)
        ? ({ ...(datePickerRaw.style as Record<string, unknown>) } as Record<string, unknown>)
        : {}
    delete datePickerRaw.style

    const hasDatePickerChildren = Object.keys(actionOnChangeRaw).length > 0 || Object.keys(styleRaw).length > 0 || Object.keys(datePickerRaw).length > 0
    if (!hasDatePickerChildren) {
      lines.push(`${renderIndent(level + 1)}<DatePicker${renderAttrs(datePickerAttrs)} />`)
    } else {
      lines.push(`${renderIndent(level + 1)}<DatePicker${renderAttrs(datePickerAttrs)}>`)
      if (Object.keys(actionOnChangeRaw).length) {
        lines.push(`${renderIndent(level + 2)}<ActionOnChange${renderAttrs(actionOnChangeRaw)} />`)
      }
      lines.push(...renderJsonObjectBlock('Style', styleRaw, level + 2))
      lines.push(...renderJsonObjectBlock('Config', datePickerRaw, level + 2))
      lines.push(`${renderIndent(level + 1)}</DatePicker>`)
    }
  }

  lines.push(...renderJsonObjectBlock('Config', propsRaw, level + 1))
  lines.push(`${renderIndent(level)}</Header>`)
  return lines
}

function renderKpiNodeToDsl(node: Record<string, unknown>, level: number): string[] {
  const propsRaw =
    node.props && typeof node.props === 'object' && !Array.isArray(node.props)
      ? ({ ...(node.props as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const dataQueryRaw =
    propsRaw.dataQuery && typeof propsRaw.dataQuery === 'object' && !Array.isArray(propsRaw.dataQuery)
      ? ({ ...(propsRaw.dataQuery as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  delete propsRaw.dataQuery

  const kpiAttrs: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(propsRaw)) {
    if (v === undefined) continue
    if (typeof v !== 'object' || v === null) {
      kpiAttrs[k] = v
      delete propsRaw[k]
    }
  }

  const lines: string[] = [`${renderIndent(level)}<KPI${renderAttrs(kpiAttrs)}>`]

  const query = typeof dataQueryRaw.query === 'string' ? dataQueryRaw.query : ''
  delete dataQueryRaw.query
  if (query.trim()) {
    lines.push(`${renderIndent(level + 1)}<Query>`)
    lines.push(query
      .split('\n')
      .map((line) => `${renderIndent(level + 2)}${line}`)
      .join('\n'))
    lines.push(`${renderIndent(level + 1)}</Query>`)
  }

  if (Object.keys(dataQueryRaw).length) {
    const dataQueryAttrs: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(dataQueryRaw)) {
      if (v === undefined) continue
      if (typeof v !== 'object' || v === null) {
        dataQueryAttrs[k] = v
        delete dataQueryRaw[k]
      }
    }

    const filtersRaw =
      dataQueryRaw.filters && typeof dataQueryRaw.filters === 'object' && !Array.isArray(dataQueryRaw.filters)
        ? ({ ...(dataQueryRaw.filters as Record<string, unknown>) } as Record<string, unknown>)
        : {}
    delete dataQueryRaw.filters

    const orderByRaw =
      dataQueryRaw.orderBy && typeof dataQueryRaw.orderBy === 'object' && !Array.isArray(dataQueryRaw.orderBy)
        ? ({ ...(dataQueryRaw.orderBy as Record<string, unknown>) } as Record<string, unknown>)
        : {}
    delete dataQueryRaw.orderBy

    const hasDataQueryChildren = Object.keys(filtersRaw).length > 0 || Object.keys(orderByRaw).length > 0 || Object.keys(dataQueryRaw).length > 0
    if (!hasDataQueryChildren) {
      lines.push(`${renderIndent(level + 1)}<DataQuery${renderAttrs(dataQueryAttrs)} />`)
    } else {
      lines.push(`${renderIndent(level + 1)}<DataQuery${renderAttrs(dataQueryAttrs)}>`)
      lines.push(...renderJsonObjectBlock('Filters', filtersRaw, level + 2))
      if (Object.keys(orderByRaw).length) {
        lines.push(`${renderIndent(level + 2)}<OrderBy${renderAttrs(orderByRaw)} />`)
      }
      lines.push(...renderJsonObjectBlock('Config', dataQueryRaw, level + 2))
      lines.push(`${renderIndent(level + 1)}</DataQuery>`)
    }
  }

  lines.push(...renderJsonObjectBlock('Config', propsRaw, level + 1))
  lines.push(`${renderIndent(level)}</KPI>`)
  return lines
}

function renderNodeToDsl(node: unknown, level: number): string[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return []
  const record = node as Record<string, unknown>
  if (chartTypeToAttr(String(record.type || '').trim())) {
    return renderChartNodeToDsl(record, level)
  }
  if (String(record.type || '').trim() === 'Header') {
    return renderHeaderNodeToDsl(record, level)
  }
  if (String(record.type || '').trim() === 'KPI') {
    return renderKpiNodeToDsl(record, level)
  }
  const tag = toDslTag(String(record.type || 'node'))
  const propsRaw =
    record.props && typeof record.props === 'object' && !Array.isArray(record.props)
      ? ({ ...(record.props as Record<string, unknown>) } as Record<string, unknown>)
      : {}
  const baseAttrs: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(propsRaw)) {
    if (v === undefined) continue
    if (typeof v !== 'object' || v === null) {
      baseAttrs[k] = v
      delete propsRaw[k]
    }
  }

  const lines: string[] = [`${renderIndent(level)}<${tag}${renderAttrs(baseAttrs)}>`]
  lines.push(...renderJsonObjectBlock('Config', propsRaw, level + 1))

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
  const lines: string[] = [`<DashboardTemplate name="${rootName}">`]
  for (const node of nodes) lines.push(...renderNodeToDsl(node, 1))
  lines.push('</DashboardTemplate>')
  return lines.join('\n')
}
