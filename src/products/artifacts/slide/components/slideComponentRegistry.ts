import type { SlideComponentDefinition } from '@/products/artifacts/slide/components/slideComponentTypes'
import { SLIDE_DATA_COMPONENTS } from '@/products/artifacts/slide/components/chartComponents'
import { SLIDE_LAYOUT_COMPONENTS } from '@/products/artifacts/slide/components/layoutComponents'
import { SLIDE_MEDIA_COMPONENTS } from '@/products/artifacts/slide/components/mediaComponents'
import { SLIDE_TEXT_COMPONENTS } from '@/products/artifacts/slide/components/textComponents'

const SLIDE_CORE_COMPONENTS: SlideComponentDefinition[] = [
  {
    name: 'Theme',
    category: 'core',
    elementKind: 'container',
    acceptsChildren: false,
    support: { html: true, pptx: 'native' },
  },
  {
    name: 'Slide',
    category: 'core',
    elementKind: 'container',
    acceptsChildren: true,
    support: { html: true, pptx: 'native' },
  },
  {
    name: 'TextNode',
    category: 'core',
    elementKind: 'text',
    acceptsChildren: false,
    support: { html: true, pptx: 'native' },
  },
  {
    name: 'Br',
    category: 'text',
    elementKind: 'lineBreak',
    acceptsChildren: false,
    support: { html: true, pptx: 'native' },
  },
]

export const SLIDE_COMPONENT_DEFINITIONS = [
  ...SLIDE_CORE_COMPONENTS,
  ...SLIDE_TEXT_COMPONENTS,
  ...SLIDE_LAYOUT_COMPONENTS,
  ...SLIDE_MEDIA_COMPONENTS,
  ...SLIDE_DATA_COMPONENTS,
] as const satisfies readonly SlideComponentDefinition[]

export const SLIDE_COMPONENT_NAMES = SLIDE_COMPONENT_DEFINITIONS.map((definition) => definition.name)

export const SLIDE_COMPONENT_DEFINITION_BY_NAME = new Map(
  SLIDE_COMPONENT_DEFINITIONS.map((definition) => [definition.name, definition]),
)

export const SLIDE_RUNTIME_COMPONENT_NAMES = SLIDE_COMPONENT_NAMES.filter((name) => name !== 'TextNode')

export function getSlideComponentDefinition(name: string): SlideComponentDefinition | undefined {
  return SLIDE_COMPONENT_DEFINITION_BY_NAME.get(name)
}

export function getSlideComponentElementKind(name: string) {
  return getSlideComponentDefinition(name)?.elementKind
}

export function validateSlideComponentProps(
  name: string,
  props: Record<string, unknown>,
  path: string,
): string[] {
  return getSlideComponentDefinition(name)?.validateProps?.(props, { path }) || []
}
