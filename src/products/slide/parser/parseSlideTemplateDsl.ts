'use client'

type SlideNode = {
  type: string
  props: Record<string, unknown>
  children: Array<SlideNode | string>
}

function isNameChar(char: string) {
  return /[A-Za-z0-9:_-]/.test(char)
}

function normalizeText(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized ? normalized : null
}

function evaluateExpression(source: string): unknown {
  try {
    return Function(`"use strict"; return (${source});`)()
  } catch {
    return source
  }
}

function skipWhitespace(source: string, start: number): number {
  let index = start
  while (index < source.length && /\s/.test(source[index])) index += 1
  return index
}

function readName(source: string, start: number): { value: string; next: number } {
  let index = start
  while (index < source.length && isNameChar(source[index])) index += 1
  return { value: source.slice(start, index), next: index }
}

function readQuoted(source: string, start: number): { value: string; next: number } {
  const quote = source[start]
  let index = start + 1
  let out = ''

  while (index < source.length) {
    const char = source[index]
    if (char === '\\') {
      out += source.slice(index, index + 2)
      index += 2
      continue
    }
    if (char === quote) {
      return { value: out, next: index + 1 }
    }
    out += char
    index += 1
  }

  throw new Error('String attribute not closed in slide DSL')
}

function readBracedExpression(source: string, start: number): { value: string; next: number } {
  let index = start
  let depth = 0
  let out = ''

  while (index < source.length) {
    const char = source[index]

    if (char === '"' || char === "'") {
      const quoted = readQuoted(source, index)
      out += source.slice(index, quoted.next)
      index = quoted.next
      continue
    }

    if (char === '{') {
      depth += 1
      if (depth > 1) out += char
      index += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return { value: out, next: index + 1 }
      }
      out += char
      index += 1
      continue
    }

    out += char
    index += 1
  }

  throw new Error('Expression attribute not closed in slide DSL')
}

function readAttributeValue(source: string, start: number): { value: unknown; next: number } {
  const char = source[start]
  if (char === '"' || char === "'") {
    const quoted = readQuoted(source, start)
    return { value: quoted.value, next: quoted.next }
  }
  if (char === '{') {
    const expression = readBracedExpression(source, start)
    return { value: evaluateExpression(expression.value.trim()), next: expression.next }
  }

  let index = start
  while (index < source.length && !/[\s/>]/.test(source[index])) index += 1
  return { value: source.slice(start, index), next: index }
}

function parseAttributes(source: string, start: number): { props: Record<string, unknown>; next: number; selfClosing: boolean } {
  let index = start
  const props: Record<string, unknown> = {}

  while (index < source.length) {
    index = skipWhitespace(source, index)

    if (source.startsWith('/>', index)) {
      return { props, next: index + 2, selfClosing: true }
    }

    if (source[index] === '>') {
      return { props, next: index + 1, selfClosing: false }
    }

    const name = readName(source, index)
    if (!name.value) break
    index = skipWhitespace(source, name.next)

    if (source[index] !== '=') {
      props[name.value] = true
      continue
    }

    index = skipWhitespace(source, index + 1)
    const attrValue = readAttributeValue(source, index)
    props[name.value] = attrValue.value
    index = attrValue.next
  }

  throw new Error('Tag not closed in slide DSL')
}

function parseNode(source: string, start: number): { node: SlideNode; next: number } {
  if (source[start] !== '<') {
    throw new Error('Expected tag start in slide DSL')
  }

  const tagName = readName(source, start + 1)
  if (!tagName.value) throw new Error('Invalid tag in slide DSL')

  const parsedAttributes = parseAttributes(source, tagName.next)
  const node: SlideNode = {
    type: tagName.value,
    props: parsedAttributes.props,
    children: [],
  }

  if (parsedAttributes.selfClosing) {
    return { node, next: parsedAttributes.next }
  }

  let index = parsedAttributes.next
  while (index < source.length) {
    if (source.startsWith(`</${tagName.value}`, index)) {
      const closeName = readName(source, index + 2)
      if (closeName.value !== tagName.value) {
        throw new Error(`Mismatched closing tag: expected </${tagName.value}>`)
      }
      index = skipWhitespace(source, closeName.next)
      if (source[index] !== '>') throw new Error('Closing tag not terminated in slide DSL')
      return { node, next: index + 1 }
    }

    if (source[index] === '<') {
      const child = parseNode(source, index)
      node.children.push(child.node)
      index = child.next
      continue
    }

    let textEnd = index
    while (textEnd < source.length && source[textEnd] !== '<') textEnd += 1
    const text = normalizeText(source.slice(index, textEnd))
    if (text) node.children.push(text)
    index = textEnd
  }

  throw new Error(`Tag <${tagName.value}> not closed in slide DSL`)
}

export function parseSlideTemplateDslToTree(source: string): SlideNode {
  const input = String(source || '').trim()
  if (!input) {
    throw new Error('Empty slide DSL')
  }

  const parsed = parseNode(input, 0)
  const root = parsed.node
  if (root.type !== 'SlideTemplate') {
    throw new Error(`Invalid slide root: expected <SlideTemplate> and received <${root.type}>`)
  }

  return root
}
