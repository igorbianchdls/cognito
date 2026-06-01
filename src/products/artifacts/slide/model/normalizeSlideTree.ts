import type { ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'
import {
  SLIDE_SUPPORTED_COMPONENTS,
  SLIDE_SUPPORTED_HTML_TAGS,
} from '@/products/artifacts/slide/contract/slideContract'
import type {
  SlideDeckModel,
  SlideElementKind,
  SlideElementModel,
  SlideFrameModel,
  SlideModel,
} from '@/products/artifacts/slide/model/slideModel'
import { createSlideSizeModel, DEFAULT_SLIDE_HEIGHT_PX, DEFAULT_SLIDE_WIDTH_PX } from '@/products/artifacts/slide/model/slideUnits'
import { normalizeSlideTheme } from '@/products/artifacts/slide/model/slideTheme'

type SlideTreeChild = ArtifactTreeNode | string

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isTreeNode(value: SlideTreeChild | unknown): value is ArtifactTreeNode {
  return isRecord(value) && typeof value.type === 'string' && Array.isArray(value.children)
}

function getChildren(node: ArtifactTreeNode): SlideTreeChild[] {
  return Array.isArray(node.children) ? node.children : []
}

function getNodeProps(node: ArtifactTreeNode): Record<string, unknown> {
  return isRecord(node.props) ? node.props : {}
}

function getStringProp(props: Record<string, unknown>, key: string): string | undefined {
  const value = props[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getNumberProp(props: Record<string, unknown>, key: string): number | undefined {
  const value = props[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function getStyle(props: Record<string, unknown>): Record<string, unknown> | undefined {
  return isRecord(props.style) ? props.style : undefined
}

function getStyleNumber(style: Record<string, unknown> | undefined, key: string): number | undefined {
  if (!style) return undefined
  const value = style[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function getExplicitNodeId(type: string, props: Record<string, unknown>, path: number[]): string {
  return getStringProp(props, 'id') || getStringProp(props, 'key') || `${type}:${path.join('.') || 'root'}`
}

function createFrame(props: Record<string, unknown>, style: Record<string, unknown> | undefined): SlideFrameModel | undefined {
  const x = getNumberProp(props, 'x') ?? getStyleNumber(style, 'x') ?? getStyleNumber(style, 'left')
  const y = getNumberProp(props, 'y') ?? getStyleNumber(style, 'y') ?? getStyleNumber(style, 'top')
  const w = getNumberProp(props, 'w') ?? getNumberProp(props, 'width') ?? getStyleNumber(style, 'width')
  const h = getNumberProp(props, 'h') ?? getNumberProp(props, 'height') ?? getStyleNumber(style, 'height')

  if (x == null && y == null && w == null && h == null) return undefined
  return { x, y, w, h, unit: 'px' }
}

function getElementKind(type: string): SlideElementKind {
  if (type === 'Card') return 'card'
  if (type === 'Chart') return 'chart'
  if (type === 'Query') return 'query'
  if (type === 'Table') return 'table'
  if (type === 'PivotTable') return 'pivotTable'
  if (type === 'TextNode') return 'text'
  if (type === 'Br') return 'lineBreak'
  if (SLIDE_SUPPORTED_HTML_TAGS.has(type.toLowerCase())) return 'html'
  if (SLIDE_SUPPORTED_COMPONENTS.has(type)) return 'container'
  return 'unknown'
}

function getNodeText(type: string, props: Record<string, unknown>, children: SlideElementModel[]): string | undefined {
  const text = getStringProp(props, 'text') || getStringProp(props, 'title')
  if (text) return text
  if (type === 'Br') return '\n'
  if (children.length !== 1 || children[0].kind !== 'text') return undefined
  return children[0].text
}

function normalizeElement(child: SlideTreeChild, path: number[]): SlideElementModel | null {
  if (typeof child === 'string') {
    return {
      id: `TextNode:${path.join('.')}`,
      kind: 'text',
      sourceType: 'TextNode',
      props: {},
      text: child,
      children: [],
    }
  }

  if (!isTreeNode(child)) return null

  const type = String(child.type || '').trim()
  const props = getNodeProps(child)
  const style = getStyle(props)
  const children = getChildren(child)
    .map((nestedChild, index) => normalizeElement(nestedChild, [...path, index]))
    .filter((element): element is SlideElementModel => element !== null)

  return {
    id: getExplicitNodeId(type || 'Unknown', props, path),
    kind: getElementKind(type),
    sourceType: type || 'Unknown',
    props,
    style,
    frame: createFrame(props, style),
    text: getNodeText(type, props, children),
    children,
    rawNode: child,
  }
}

function normalizeSlide(slideNode: ArtifactTreeNode, index: number): SlideModel {
  const props = getNodeProps(slideNode)
  const width = getNumberProp(props, 'width') || DEFAULT_SLIDE_WIDTH_PX
  const height = getNumberProp(props, 'height') || DEFAULT_SLIDE_HEIGHT_PX
  const id = getStringProp(props, 'id') || `slide_${index + 1}`

  return {
    id,
    index,
    title: getStringProp(props, 'title') || id,
    size: createSlideSizeModel(width, height),
    props,
    elements: getChildren(slideNode)
      .map((child, childIndex) => normalizeElement(child, [index, childIndex]))
      .filter((element): element is SlideElementModel => element !== null),
    rawNode: slideNode,
  }
}

export function normalizeSlideTree(tree: ArtifactTreeNode): SlideDeckModel {
  if (!isTreeNode(tree)) {
    throw new Error('Invalid slide tree')
  }

  if (tree.type === 'Slide') {
    return {
      kind: 'slide-deck',
      title: 'Presentation',
      theme: normalizeSlideTheme(null),
      slides: [normalizeSlide(tree, 0)],
      rawTree: tree,
    }
  }

  if (tree.type !== 'SlideTemplate') {
    throw new Error(`Unsupported slide root: ${tree.type}`)
  }

  const props = getNodeProps(tree)
  const childNodes = getChildren(tree).filter(isTreeNode)
  const themeNode = childNodes.find((child) => child.type === 'Theme')
  const slides = childNodes.filter((child) => child.type === 'Slide')
  const title = getStringProp(props, 'title') || getStringProp(props, 'name') || 'Presentation'

  return {
    kind: 'slide-deck',
    title,
    name: getStringProp(props, 'name'),
    theme: normalizeSlideTheme(themeNode),
    slides: slides.map((slide, index) => normalizeSlide(slide, index)),
    rawTree: tree,
  }
}
