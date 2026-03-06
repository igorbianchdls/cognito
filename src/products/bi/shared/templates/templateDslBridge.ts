type JsonNode = {
  type?: string
  props?: Record<string, unknown>
  children?: JsonNode[]
}

function toKebab(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase()
}

function indent(level: number): string {
  return '  '.repeat(level)
}

function formatProps(props: Record<string, unknown> | undefined, level: number): string | null {
  if (!props || Object.keys(props).length === 0) return null
  const json = JSON.stringify(props, null, 2)
  const linePrefix = indent(level)
  const body = json
    .split('\n')
    .map((line) => `${linePrefix}${line}`)
    .join('\n')
  return `${indent(level - 1)}<props>\n${body}\n${indent(level - 1)}</props>`
}

function renderNode(node: JsonNode, level: number): string {
  const tag = toKebab(String(node.type || 'node'))
  const open = `${indent(level)}<${tag}>`
  const close = `${indent(level)}</${tag}>`
  const lines: string[] = [open]

  const propsBlock = formatProps(node.props, level + 2)
  if (propsBlock) lines.push(propsBlock)

  if (Array.isArray(node.children) && node.children.length > 0) {
    for (const child of node.children) {
      lines.push(renderNode(child, level + 1))
    }
  }

  lines.push(close)
  return lines.join('\n')
}

export function renderDashboardTemplateDslFromJsonText(templateText: string, templateName: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(templateText)
  } catch {
    return `<dashboard-template name="${templateName}"></dashboard-template>`
  }

  const tree = Array.isArray(parsed) ? parsed : [parsed]
  const lines: string[] = [`<dashboard-template name="${templateName}">`]
  for (const node of tree as JsonNode[]) {
    lines.push(renderNode(node, 1))
  }
  lines.push('</dashboard-template>')
  return lines.join('\n')
}
