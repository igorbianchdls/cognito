import type { ArtifactKind } from '@/products/artifacts/core/types/artifactTypes'

export const REPORT_DSL_VERSION = 'report.v1'
export const SLIDE_DSL_VERSION = 'slide.v1'

export const DOCUMENT_SUPPORTED_HTML_TAGS = [
  'div',
  'section',
  'header',
  'footer',
  'main',
  'article',
  'p',
  'span',
  'strong',
  'em',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'img',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
] as const

export const DOCUMENT_STRUCTURAL_TAGS = ['page', 'slide'] as const

export const DOCUMENT_SPECIAL_COMPONENTS = ['Report', 'Deck', 'Chart', 'DataTable'] as const

export const DOCUMENT_SUPPORTED_NODE_TYPES = [
  ...DOCUMENT_SUPPORTED_HTML_TAGS,
  ...DOCUMENT_STRUCTURAL_TAGS,
  ...DOCUMENT_SPECIAL_COMPONENTS,
] as const

export const DOCUMENT_SUPPORTED_NODE_TYPE_SET = new Set<string>(DOCUMENT_SUPPORTED_NODE_TYPES)

export const reportLanguageManifest = {
  version: REPORT_DSL_VERSION,
  kind: 'report' as const,
  rootTypes: ['Report'] as const,
  unitTag: 'page',
  components: DOCUMENT_SPECIAL_COMPONENTS,
  htmlTags: DOCUMENT_SUPPORTED_HTML_TAGS,
  structuralTags: ['page'] as const,
} as const

export const slideLanguageManifest = {
  version: SLIDE_DSL_VERSION,
  kind: 'slide' as const,
  rootTypes: ['Deck'] as const,
  unitTag: 'slide',
  components: DOCUMENT_SPECIAL_COMPONENTS,
  htmlTags: DOCUMENT_SUPPORTED_HTML_TAGS,
  structuralTags: ['slide'] as const,
} as const

export function getDocumentManifest(kind: Extract<ArtifactKind, 'report' | 'slide'>) {
  return kind === 'report' ? reportLanguageManifest : slideLanguageManifest
}
