import type { ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'
import {
  SLIDE_ROOT_TYPES,
  SLIDE_SUPPORTED_CHART_TYPES,
  SLIDE_SUPPORTED_COMPONENTS,
  SLIDE_SUPPORTED_HTML_TAGS,
} from '@/products/slide/contract/slideContract'

type SlideTreeChild = ArtifactTreeNode | string

function isTreeNode(value: SlideTreeChild): value is ArtifactTreeNode {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function assertStringProp(
  node: ArtifactTreeNode,
  propName: string,
  path: string,
  options: { required?: boolean } = {},
) {
  const value = node.props?.[propName]
  if (value == null || value === '') {
    if (options.required) {
      throw new Error(`${path}.${propName} é obrigatório`)
    }
    return
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${path}.${propName} deve ser uma string não vazia`)
  }
}

function validateQueryLikeNode(node: ArtifactTreeNode, path: string) {
  const dataQuery = node.props?.dataQuery
  if (!isRecord(dataQuery) || typeof dataQuery.query !== 'string' || !dataQuery.query.trim()) {
    throw new Error(`${path}.dataQuery.query é obrigatório`)
  }
}

function validateNode(node: ArtifactTreeNode, path: string, isRoot = false) {
  const type = String(node.type || '').trim()
  if (!type) {
    throw new Error(`${path} tem type inválido`)
  }

  if (isRoot) {
    if (!SLIDE_ROOT_TYPES.has(type)) {
      throw new Error(`Root de slide não suportado: ${type}`)
    }
  } else if (!SLIDE_SUPPORTED_COMPONENTS.has(type) && !SLIDE_SUPPORTED_HTML_TAGS.has(type.toLowerCase())) {
    throw new Error(`Componente de slide não suportado em ${path}: ${type}`)
  }

  if (type === 'SlideTemplate') {
    assertStringProp(node, 'title', path, { required: false })
  }

  if (type === 'Slide') {
    assertStringProp(node, 'id', path, { required: true })
    assertStringProp(node, 'title', path, { required: false })
    const width = node.props?.width
    const height = node.props?.height
    if (width != null && (typeof width !== 'number' || !Number.isFinite(width))) {
      throw new Error(`${path}.width deve ser numérico`)
    }
    if (height != null && (typeof height !== 'number' || !Number.isFinite(height))) {
      throw new Error(`${path}.height deve ser numérico`)
    }
  }

  if (type === 'Theme') {
    assertStringProp(node, 'name', path, { required: false })
  }

  if (type === 'Chart') {
    const chartType = node.props?.type
    if (chartType != null) {
      if (typeof chartType !== 'string' || !SLIDE_SUPPORTED_CHART_TYPES.has(chartType)) {
        throw new Error(`${path}.type usa chart não suportado: ${String(chartType)}`)
      }
    }
    validateQueryLikeNode(node, path)
  }

  if (type === 'Query' || type === 'Table' || type === 'PivotTable') {
    validateQueryLikeNode(node, path)
  }

  node.children.forEach((child, index) => {
    if (!isTreeNode(child)) return
    validateNode(child, `${path}.children[${index}]`)
  })
}

export function validateSlideTree(tree: ArtifactTreeNode) {
  validateNode(tree, 'slide', true)
}

