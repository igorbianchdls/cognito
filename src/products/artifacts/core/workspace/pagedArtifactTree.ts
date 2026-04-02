import type { ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'

export type ArtifactRecord = Record<string, any>

type PagedArtifactStructureOptions = {
  rootType: string
  pageType: string
  fallbackRootName: string
}

type PagedArtifactSizeOptions = {
  rootType: string
  pageType: string
}

export function isArtifactRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function getPagedArtifactStructure(
  tree: unknown,
  options: PagedArtifactStructureOptions,
): {
  rootName: string
  themeNode: ArtifactRecord | null
  pages: ArtifactRecord[]
} {
  if (!isArtifactRecord(tree) || String(tree.type || '').trim() !== options.rootType) {
    return { rootName: options.fallbackRootName, themeNode: null, pages: [] }
  }

  const props = isArtifactRecord(tree.props) ? (tree.props as ArtifactRecord) : {}
  const children = Array.isArray(tree.children) ? tree.children.filter(isArtifactRecord) : []
  const themeNode = children.find((child) => String(child.type || '').trim() === 'Theme') as ArtifactRecord | undefined
  const pages = children.filter((child) => String(child.type || '').trim() === options.pageType) as ArtifactRecord[]

  return {
    rootName:
      typeof props.title === 'string' && props.title.trim()
        ? props.title
        : (typeof props.name === 'string' && props.name.trim() ? props.name : options.fallbackRootName),
    themeNode: themeNode || null,
    pages,
  }
}

export function getArtifactPageId(page: ArtifactRecord, index: number, fallbackPrefix: string): string {
  const props = isArtifactRecord(page.props) ? (page.props as ArtifactRecord) : {}
  const raw = typeof props.id === 'string' && props.id.trim() ? props.id.trim() : ''
  return raw || `${fallbackPrefix}_${index + 1}`
}

export function getPagedArtifactDimension(
  page: ArtifactRecord | null,
  key: 'width' | 'height',
  fallback: number,
): number {
  if (!page || !isArtifactRecord(page.props)) return fallback
  const raw = (page.props as ArtifactRecord)[key]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback
}

export function updatePagedArtifactSizeInTree<T extends ArtifactTreeNode>(
  tree: T,
  pageId: string,
  nextSize: { width?: number; height?: number },
  options: PagedArtifactSizeOptions,
): T {
  if (tree.type !== options.rootType) return tree

  const nextChildren = tree.children.map((child) => {
    if (!child || typeof child === 'string') return child
    if (child.type !== options.pageType) return child

    const props = isArtifactRecord(child.props) ? (child.props as ArtifactRecord) : {}
    const childPageId = typeof props.id === 'string' ? props.id.trim() : ''
    if (childPageId !== pageId) return child

    return {
      ...child,
      props: {
        ...props,
        ...(typeof nextSize.width === 'number' ? { width: nextSize.width } : {}),
        ...(typeof nextSize.height === 'number' ? { height: nextSize.height } : {}),
      },
    }
  })

  return {
    ...tree,
    children: nextChildren,
  }
}

export function parseArtifactDimensionDraft(value: string, minimum: number): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return null
  return Math.max(minimum, Math.round(parsed))
}

export function buildPagedArtifactRenderTree(page: ArtifactRecord, themeNode: ArtifactRecord | null) {
  const pageNode = {
    ...page,
    props: {
      ...((isArtifactRecord(page.props) ? page.props : {}) as ArtifactRecord),
      width: '100%',
      height: '100%',
      minHeight: '100%',
    },
  }

  if (!themeNode) return pageNode
  const themeChildren = Array.isArray(themeNode.children) ? themeNode.children : []
  return {
    ...themeNode,
    children: [...themeChildren, pageNode],
  }
}

export function cloneArtifactTree<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
