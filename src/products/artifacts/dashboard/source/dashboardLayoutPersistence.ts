'use client'

type AnyRecord = Record<string, unknown>

type DashboardNode = {
  type: string
  props?: AnyRecord
  children?: Array<DashboardNode | string>
}

type LayoutEntry = {
  id: string
  span?: number
  rows?: number
}

function isNode(value: DashboardNode | string | null | undefined): value is DashboardNode {
  return Boolean(value && typeof value === 'object')
}

function toInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value)
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.round(parsed)
  }
  return undefined
}

function collectLayoutEntries(node: DashboardNode | string, entries: LayoutEntry[]) {
  if (!isNode(node)) return
  const id = typeof node.props?.id === 'string' ? node.props.id.trim() : ''
  const span = toInt(node.props?.span)
  const rows = toInt(node.props?.rows)

  if (id && (span !== undefined || rows !== undefined)) {
    entries.push({ id, ...(span !== undefined ? { span } : {}), ...(rows !== undefined ? { rows } : {}) })
  }

  for (const child of Array.isArray(node.children) ? node.children : []) {
    collectLayoutEntries(child, entries)
  }
}

function setNumericJsxProp(tag: string, prop: 'span' | 'rows', value: number | undefined) {
  if (value === undefined) return tag
  const propRegex = new RegExp(`\\s${prop}=\\{[^}]*\\}`, 'm')
  if (propRegex.test(tag)) {
    return tag.replace(propRegex, ` ${prop}={${value}}`)
  }
  return tag.replace(/>$/, ` ${prop}={${value}}>`)
}

function updateOpeningTagById(source: string, entry: LayoutEntry) {
  const idNeedle = `id="${entry.id}"`
  const idIndex = source.indexOf(idNeedle)
  if (idIndex === -1) return source

  const tagStart = source.lastIndexOf('<', idIndex)
  const tagEnd = source.indexOf('>', idIndex)
  if (tagStart === -1 || tagEnd === -1 || tagEnd < tagStart) return source

  const openingTag = source.slice(tagStart, tagEnd + 1)
  let nextTag = openingTag
  nextTag = setNumericJsxProp(nextTag, 'span', entry.span)
  nextTag = setNumericJsxProp(nextTag, 'rows', entry.rows)

  if (nextTag === openingTag) return source
  return `${source.slice(0, tagStart)}${nextTag}${source.slice(tagEnd + 1)}`
}

export function applyDashboardTreeLayoutToSource(source: string, tree: DashboardNode | null | undefined) {
  if (!tree || typeof tree !== 'object') return String(source || '')

  const entries: LayoutEntry[] = []
  collectLayoutEntries(tree, entries)

  let nextSource = String(source || '')
  for (const entry of entries) {
    nextSource = updateOpeningTagById(nextSource, entry)
  }
  return nextSource
}
