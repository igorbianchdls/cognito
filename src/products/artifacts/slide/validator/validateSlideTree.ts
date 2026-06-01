import type { ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'
import {
  getSlideComponentDefinition,
  validateSlideComponentProps,
} from '@/products/artifacts/slide/components/slideComponentRegistry'
import {
  SLIDE_ROOT_TYPES,
  SLIDE_SUPPORTED_COMPONENTS,
  SLIDE_SUPPORTED_HTML_TAGS,
} from '@/products/artifacts/slide/contract/slideContract'

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

  if (SLIDE_SUPPORTED_COMPONENTS.has(type)) {
    const definition = getSlideComponentDefinition(type)
    if (definition && !definition.acceptsChildren && node.children.length > 0) {
      throw new Error(`${path} não aceita children`)
    }

    const props = isRecord(node.props) ? node.props : {}
    const componentErrors = validateSlideComponentProps(type, props, path)
    if (componentErrors.length) {
      throw new Error(componentErrors.join('\n'))
    }
  }

  node.children.forEach((child, index) => {
    if (!isTreeNode(child)) return
    validateNode(child, `${path}.children[${index}]`)
  })
}

export function validateSlideTree(tree: ArtifactTreeNode) {
  validateNode(tree, 'slide', true)
}
