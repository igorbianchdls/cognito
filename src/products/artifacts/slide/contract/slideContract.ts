import { SLIDE_CHART_TYPES } from '@/products/artifacts/slide/components/chartComponents'
import { SLIDE_COMPONENT_NAMES } from '@/products/artifacts/slide/components/slideComponentRegistry'

export const SLIDE_ROOT_TYPES = new Set(['SlideTemplate', 'Slide'])

export const SLIDE_SUPPORTED_COMPONENTS = new Set(SLIDE_COMPONENT_NAMES)

export const SLIDE_SUPPORTED_HTML_TAGS = new Set([
  'div',
  'section',
  'article',
  'header',
  'footer',
  'main',
  'aside',
  'p',
  'span',
  'strong',
  'em',
  'small',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
])

export const SLIDE_SUPPORTED_CHART_TYPES = new Set(SLIDE_CHART_TYPES)
