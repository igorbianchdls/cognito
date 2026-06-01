import type { ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'
import type {
  ReportDeckModel,
  ReportElementKind,
  ReportElementModel,
  ReportFrameModel,
  ReportPageModel,
} from '@/products/artifacts/report/model/reportModel'
import { DEFAULT_REPORT_HEIGHT_PX, DEFAULT_REPORT_WIDTH_PX } from '@/products/artifacts/report/model/reportUnits'

type ReportTreeChild = ArtifactTreeNode | string | number
type AnyRecord = Record<string, any>

const DEFAULT_TEXT_COLOR = '#263145'
const MUTED_TEXT_COLOR = '#51607A'
const CARD_BORDER = '#E7ECF3'
const CARD_FILL = '#FFFFFF'
const CALLOUT_FILL = '#F8FAFD'

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isTreeNode(value: unknown): value is ArtifactTreeNode {
  return isRecord(value) && typeof value.type === 'string' && Array.isArray(value.children)
}

function getProps(node: ArtifactTreeNode): AnyRecord {
  return isRecord(node.props) ? node.props : {}
}

function getStyle(node: ArtifactTreeNode): AnyRecord {
  const props = getProps(node)
  return isRecord(props.style) ? props.style : {}
}

function getChildren(node: ArtifactTreeNode): ReportTreeChild[] {
  return Array.isArray(node.children) ? (node.children as ReportTreeChild[]) : []
}

function getStringProp(props: AnyRecord, key: string): string | undefined {
  const value = props[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getNumberProp(props: AnyRecord, key: string): number | undefined {
  const value = props[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function getStyleNumber(style: AnyRecord, key: string): number | undefined {
  const value = style[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function getPadding(style: AnyRecord): number {
  return getStyleNumber(style, 'padding') ?? getStyleNumber(style, 'paddingTop') ?? 0
}

function getGap(style: AnyRecord, fallback = 0): number {
  return getStyleNumber(style, 'gap') ?? fallback
}

function getTextContent(value: ReportTreeChild | unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (!isTreeNode(value)) return ''
  const props = getProps(value)
  const direct = getStringProp(props, 'text') || getStringProp(props, 'title') || getStringProp(props, 'value')
  if (direct) return direct
  return getChildren(value).map(getTextContent).filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

function getSourceId(type: string, props: AnyRecord, path: number[]) {
  return getStringProp(props, 'id') || getStringProp(props, 'key') || `${type}:${path.join('.') || 'root'}`
}

function isTextNode(type: string) {
  return ['h1', 'h2', 'h3', 'p', 'span', 'strong', 'li'].includes(type.toLowerCase())
}

function isListNode(type: string) {
  return type.toLowerCase() === 'ul' || type.toLowerCase() === 'ol'
}

function isGrid(style: AnyRecord) {
  return style.display === 'grid'
}

function isColumnFlex(style: AnyRecord) {
  return style.display === 'flex' && (style.flexDirection === 'column' || !style.flexDirection)
}

function isCardLike(node: ArtifactTreeNode) {
  const props = getProps(node)
  const style = getStyle(node)
  const dataUi = getStringProp(props, 'data-ui') || ''
  return Boolean(
    dataUi.includes('card') ||
      style.border ||
      style.borderRadius ||
      (style.backgroundColor && style.backgroundColor !== '#FFFFFF'),
  )
}

function parseGridColumns(style: AnyRecord): number {
  const value = typeof style.gridTemplateColumns === 'string' ? style.gridTemplateColumns : ''
  const repeat = /repeat\((\d+),/.exec(value)
  if (repeat) return Math.max(1, Number(repeat[1]) || 1)
  if (value.trim()) return Math.max(1, value.trim().split(/\s+/).length)
  return 1
}

function getTextStyle(node: ArtifactTreeNode): { color: string; fontSize: number; lineHeight: number; bold: boolean } {
  const type = String(node.type || '').toLowerCase()
  const props = getProps(node)
  const style = getStyle(node)
  const dataUi = getStringProp(props, 'data-ui')
  const fontSize =
    getStyleNumber(style, 'fontSize') ??
    (dataUi === 'title' ? 34 : dataUi === 'kpi-value' ? 24 : dataUi === 'kpi-title' ? 11 : type === 'h1' ? 34 : type === 'h2' ? 28 : type === 'h3' ? 20 : type === 'li' ? 14 : 15)
  const lineHeight = typeof style.lineHeight === 'number' ? style.lineHeight : type === 'h1' || type === 'h2' ? 1.08 : 1.65
  const color =
    typeof style.color === 'string'
      ? style.color
      : dataUi === 'eyebrow' || dataUi === 'kpi-title'
        ? '#8A95A8'
        : dataUi === 'kpi-delta'
          ? '#3B7D4F'
          : type === 'p' || type === 'li'
            ? MUTED_TEXT_COLOR
            : DEFAULT_TEXT_COLOR
  const bold = ['h1', 'h2', 'h3', 'strong'].includes(type) || dataUi === 'title' || dataUi === 'kpi-value'
  return { color, fontSize, lineHeight, bold }
}

function estimateTextHeight(text: string, width: number, fontSize: number, lineHeight: number) {
  const safeWidth = Math.max(80, width)
  const charsPerLine = Math.max(8, Math.floor(safeWidth / (fontSize * 0.52)))
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine))
  return Math.ceil(lines * fontSize * lineHeight)
}

function explicitHeight(node: ArtifactTreeNode): number | undefined {
  const props = getProps(node)
  const style = getStyle(node)
  const propHeight = getNumberProp(props, 'height') ?? getNumberProp(props, 'h')
  if (propHeight) return propHeight
  return getStyleNumber(style, 'height')
}

function measureNode(node: ReportTreeChild, width: number): number {
  if (typeof node === 'string' || typeof node === 'number') return estimateTextHeight(String(node), width, 15, 1.5)
  if (!isTreeNode(node)) return 0

  const type = String(node.type || '')
  const style = getStyle(node)
  const padding = getPadding(style)
  const gap = getGap(style, 8)
  const children = getChildren(node)
  const knownHeight = explicitHeight(node)
  if (knownHeight && !['section', 'article', 'div', 'header'].includes(type.toLowerCase())) return knownHeight

  if (type === 'Chart') return explicitHeight(node) ?? 320
  if (type === 'Table' || type === 'PivotTable') return explicitHeight(node) ?? 420
  if (type === 'Query') return children.reduce((height, child) => Math.max(height, measureNode(child, width)), 0)

  if (isTextNode(type)) {
    const textStyle = getTextStyle(node)
    return estimateTextHeight(getTextContent(node), width, textStyle.fontSize, textStyle.lineHeight)
  }

  if (isListNode(type)) {
    return children.reduce((total, child, index) => total + measureNode(child, width - 18) + (index ? gap : 0), 0)
  }

  if (isGrid(style)) {
    const columns = parseGridColumns(style)
    const cellWidth = (width - gap * (columns - 1) - padding * 2) / columns
    const rows = Math.ceil(children.length / columns)
    let total = padding * 2 + Math.max(0, rows - 1) * gap
    for (let row = 0; row < rows; row += 1) {
      const rowChildren = children.slice(row * columns, row * columns + columns)
      total += Math.max(...rowChildren.map((child) => measureNode(child, cellWidth)), 72)
    }
    return Math.ceil(total)
  }

  const contentWidth = Math.max(80, width - padding * 2)
  const childHeight = children.reduce((total, child, index) => total + measureNode(child, contentWidth) + (index ? gap : 0), 0)
  const minimum = isCardLike(node) ? 72 : 0
  return Math.ceil(Math.max(minimum, childHeight + padding * 2))
}

function createBoxElement(node: ArtifactTreeNode, frame: ReportFrameModel, path: number[]): ReportElementModel | null {
  if (!isCardLike(node)) return null
  const props = getProps(node)
  const style = getStyle(node)
  return {
    id: getSourceId(String(node.type || 'Box'), props, path),
    kind: 'box',
    sourceType: String(node.type || 'Box'),
    frame,
    props,
    style: {
      backgroundColor: style.backgroundColor || (getStringProp(props, 'data-ui')?.includes('card') ? CARD_FILL : CALLOUT_FILL),
      borderColor: style.border ? CARD_BORDER : style.borderColor || CARD_BORDER,
      borderRadius: getStyleNumber(style, 'borderRadius') ?? 10,
      ...style,
    },
  }
}

function layoutNode(node: ReportTreeChild, frame: ReportFrameModel, path: number[], out: ReportElementModel[]) {
  if (typeof node === 'string' || typeof node === 'number') {
    const text = String(node).trim()
    if (!text) return
    out.push({
      id: `TextNode:${path.join('.')}`,
      kind: 'text',
      sourceType: 'TextNode',
      frame,
      props: {},
      style: { color: MUTED_TEXT_COLOR, fontSize: 15, lineHeight: 1.5 },
      text,
    })
    return
  }
  if (!isTreeNode(node)) return

  const type = String(node.type || '')
  const props = getProps(node)
  const style = getStyle(node)
  const children = getChildren(node)
  const padding = getPadding(style)
  const gap = getGap(style, 8)

  if (type === 'Query') {
    children.forEach((child, index) => layoutNode(child, frame, [...path, index], out))
    return
  }

  if (type === 'Chart' || type === 'Table' || type === 'PivotTable') {
    out.push({
      id: getSourceId(type, props, path),
      kind: type === 'Chart' ? 'chart' : type === 'PivotTable' ? 'pivotTable' : 'table',
      sourceType: type,
      frame,
      props,
      style,
      text: getStringProp(props, 'title') || type,
    })
    return
  }

  if (isTextNode(type)) {
    const text = getTextContent(node)
    if (!text) return
    out.push({
      id: getSourceId(type, props, path),
      kind: 'text',
      sourceType: type,
      frame,
      props,
      style: { ...getTextStyle(node), ...style },
      text,
    })
    return
  }

  const box = createBoxElement(node, frame, path)
  if (box) out.push(box)

  const contentFrame = {
    x: frame.x + padding,
    y: frame.y + padding,
    w: Math.max(80, frame.w - padding * 2),
    h: Math.max(20, frame.h - padding * 2),
  }

  if (isListNode(type)) {
    let y = contentFrame.y
    children.forEach((child, index) => {
      const h = measureNode(child, contentFrame.w - 18)
      const prefix = type.toLowerCase() === 'ol' ? `${index + 1}. ` : '• '
      const text = `${prefix}${getTextContent(child)}`
      out.push({
        id: `ListItem:${path.join('.')}.${index}`,
        kind: 'text',
        sourceType: 'li',
        frame: { x: contentFrame.x + 4, y, w: contentFrame.w - 4, h },
        props: {},
        style: { color: MUTED_TEXT_COLOR, fontSize: 14, lineHeight: 1.5 },
        text,
      })
      y += h + gap
    })
    return
  }

  if (isGrid(style)) {
    const columns = parseGridColumns(style)
    const cellWidth = (contentFrame.w - gap * (columns - 1)) / columns
    const rowHeights: number[] = []
    children.forEach((child, index) => {
      const row = Math.floor(index / columns)
      rowHeights[row] = Math.max(rowHeights[row] || 0, measureNode(child, cellWidth), 72)
    })

    let y = contentFrame.y
    children.forEach((child, index) => {
      const row = Math.floor(index / columns)
      const col = index % columns
      const cellFrame = {
        x: contentFrame.x + col * (cellWidth + gap),
        y,
        w: cellWidth,
        h: rowHeights[row],
      }
      layoutNode(child, cellFrame, [...path, index], out)
      if (col === columns - 1) y += rowHeights[row] + gap
    })
    return
  }

  let y = contentFrame.y
  children.forEach((child, index) => {
    const h = measureNode(child, contentFrame.w)
    layoutNode(child, { x: contentFrame.x, y, w: contentFrame.w, h }, [...path, index], out)
    y += h + (isColumnFlex(style) || children.length > 1 ? gap : 0)
  })
}

function normalizePage(pageNode: ArtifactTreeNode, index: number): ReportPageModel {
  const props = getProps(pageNode)
  const widthPx = getNumberProp(props, 'width') || DEFAULT_REPORT_WIDTH_PX
  const heightPx = getNumberProp(props, 'height') || DEFAULT_REPORT_HEIGHT_PX
  const id = getStringProp(props, 'id') || `report_${index + 1}`
  const elements: ReportElementModel[] = []

  getChildren(pageNode).forEach((child, childIndex) => {
    layoutNode(child, { x: 0, y: 0, w: widthPx, h: heightPx }, [index, childIndex], elements)
  })

  return {
    id,
    index,
    title: getStringProp(props, 'title') || id,
    widthPx,
    heightPx,
    props,
    elements,
    rawNode: pageNode,
  }
}

export function normalizeReportTree(tree: ArtifactTreeNode): ReportDeckModel {
  if (!isTreeNode(tree)) throw new Error('Invalid report tree')

  if (tree.type === 'Report') {
    return {
      kind: 'report-deck',
      title: 'Report',
      pages: [normalizePage(tree, 0)],
      rawTree: tree,
    }
  }

  if (tree.type !== 'ReportTemplate') {
    throw new Error(`Unsupported report root: ${tree.type}`)
  }

  const props = getProps(tree)
  const pages = getChildren(tree).filter((child): child is ArtifactTreeNode => isTreeNode(child) && child.type === 'Report')
  return {
    kind: 'report-deck',
    title: getStringProp(props, 'title') || getStringProp(props, 'name') || 'Report',
    name: getStringProp(props, 'name'),
    pages: pages.map(normalizePage),
    rawTree: tree,
  }
}
