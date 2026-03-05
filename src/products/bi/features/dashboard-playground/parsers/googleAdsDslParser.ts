import type { JsonTree } from '@/products/bi/shared/types'

type AttrMap = Record<string, string>

type DslNode = {
  tag: string
  attrs: AttrMap
  children: DslNode[]
  text: string
  start: number
}

const TAG_TO_CATALOG_TYPE: Record<string, string> = {
  theme: 'Theme',
  header: 'Header',
  div: 'Div',
  card: 'Card',
  kpi: 'KPI',
  'bar-chart': 'BarChart',
  'line-chart': 'LineChart',
  'pie-chart': 'PieChart',
  'slicer-card': 'SlicerCard',
  'ai-summary': 'AISummary',
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

export class GoogleAdsDslParseError extends Error {
  readonly line: number
  readonly column: number

  constructor(source: string, index: number, message: string) {
    const { line, column } = lineCol(source, index)
    super(`${message} (linha ${line}, coluna ${column})`)
    this.name = 'GoogleAdsDslParseError'
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
  if (!nameMatch) throw new GoogleAdsDslParseError(source, startIndex, `Tag invalida: <${content}>`)

  const name = nameMatch[1].toLowerCase()
  let cursor = nameMatch[0].length
  const attrs: AttrMap = {}

  while (cursor < raw.length) {
    while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1
    if (cursor >= raw.length) break

    const keyMatch = raw.slice(cursor).match(/^([a-zA-Z_][a-zA-Z0-9_:-]*)/)
    if (!keyMatch) throw new GoogleAdsDslParseError(source, startIndex, `Atributo invalido em <${name}>`)
    const keyRaw = keyMatch[1]
    const key = keyRaw.trim().toLowerCase()
    cursor += keyRaw.length

    while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1
    if (raw[cursor] !== '=') {
      throw new GoogleAdsDslParseError(source, startIndex, `Atributo "${keyRaw}" em <${name}> deve usar = "valor"`)
    }
    cursor += 1

    while (cursor < raw.length && /\s/.test(raw[cursor])) cursor += 1
    const quote = raw[cursor]
    if (quote !== '"' && quote !== "'") {
      throw new GoogleAdsDslParseError(source, startIndex, `Atributo "${keyRaw}" em <${name}> deve estar entre aspas`)
    }
    cursor += 1

    const valueStart = cursor
    while (cursor < raw.length && raw[cursor] !== quote) cursor += 1
    if (cursor >= raw.length) {
      throw new GoogleAdsDslParseError(source, startIndex, `Atributo "${keyRaw}" em <${name}> nao foi fechado`)
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

  while (i < source.length) {
    const top = stack[stack.length - 1]
    if (top?.tag === 'props') {
      const close = '</props>'
      const closeIndex = source.toLowerCase().indexOf(close, i)
      if (closeIndex < 0) throw new GoogleAdsDslParseError(source, top.start, 'Tag <props> nao foi fechada')
      top.text += source.slice(i, closeIndex)
      i = closeIndex
      continue
    }

    if (source.startsWith('<!--', i)) {
      const end = source.indexOf('-->', i + 4)
      if (end < 0) throw new GoogleAdsDslParseError(source, i, 'Comentario nao foi fechado')
      i = end + 3
      continue
    }

    const ch = source[i]
    if (ch !== '<') {
      const next = source.indexOf('<', i)
      const end = next < 0 ? source.length : next
      const text = source.slice(i, end)
      if (stack.length === 0 && text.trim()) {
        throw new GoogleAdsDslParseError(source, i, 'Texto fora da tag raiz nao e permitido')
      }
      if (stack.length > 0) stack[stack.length - 1].text += text
      i = end
      continue
    }

    const end = findTagEnd(source, i + 1)
    if (end < 0) throw new GoogleAdsDslParseError(source, i, 'Tag nao foi fechada com ">"')
    const raw = source.slice(i + 1, end).trim()
    if (!raw) throw new GoogleAdsDslParseError(source, i, 'Tag vazia nao e permitida')

    if (raw.startsWith('/')) {
      const closeName = raw.slice(1).trim().toLowerCase()
      const current = stack.pop()
      if (!current) throw new GoogleAdsDslParseError(source, i, `Tag de fechamento </${closeName}> sem abertura`)
      if (current.tag !== closeName) {
        throw new GoogleAdsDslParseError(source, i, `Fechamento invalido: esperado </${current.tag}> e recebido </${closeName}>`)
      }
      if (stack.length > 0) {
        stack[stack.length - 1].children.push(current)
      } else if (!root) {
        root = current
      } else {
        throw new GoogleAdsDslParseError(source, i, 'Apenas uma tag raiz e permitida')
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
        throw new GoogleAdsDslParseError(source, i, 'Apenas uma tag raiz e permitida')
      }
    } else {
      stack.push(node)
    }

    i = end + 1
  }

  if (stack.length) {
    const pending = stack[stack.length - 1]
    throw new GoogleAdsDslParseError(source, pending.start, `Tag <${pending.tag}> nao foi fechada`)
  }
  if (!root) throw new GoogleAdsDslParseError(source, 0, 'DSL vazio ou sem tag raiz')

  return root
}

function parsePropsNode(source: string, node: DslNode): Record<string, unknown> {
  const raw = String(node.text || '').trim()
  if (!raw) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new GoogleAdsDslParseError(source, node.start, 'JSON invalido em <props>')
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new GoogleAdsDslParseError(source, node.start, '<props> deve conter um objeto JSON')
  }
  return parsed as Record<string, unknown>
}

function compileNode(source: string, node: DslNode): Record<string, unknown> {
  const type = TAG_TO_CATALOG_TYPE[node.tag]
  if (!type) {
    throw new GoogleAdsDslParseError(source, node.start, `Tag <${node.tag}> nao e suportada`)
  }

  const propsNodes = node.children.filter((child) => child.tag === 'props')
  if (propsNodes.length > 1) {
    throw new GoogleAdsDslParseError(source, node.start, `Tag <${node.tag}> aceita no maximo um <props>`)
  }

  const props = propsNodes.length ? parsePropsNode(source, propsNodes[0]) : {}
  const children = node.children
    .filter((child) => child.tag !== 'props')
    .map((child) => compileNode(source, child))

  const out: Record<string, unknown> = { type }
  if (Object.keys(props).length) out.props = props
  if (children.length) out.children = children
  return out
}

export function parseGoogleAdsDslToTree(source: string): JsonTree {
  const root = parseDslTree(source)
  if (root.tag !== 'dashboard-template') {
    throw new GoogleAdsDslParseError(source, root.start, `Tag raiz invalida: esperado <dashboard-template> e recebido <${root.tag}>`)
  }
  return root.children.map((node) => compileNode(source, node))
}
