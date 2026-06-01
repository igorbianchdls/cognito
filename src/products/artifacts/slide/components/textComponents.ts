import type { SlideComponentDefinition } from '@/products/artifacts/slide/components/slideComponentTypes'
import {
  collectPropErrors,
  optionalNumberError,
  optionalRecordError,
  optionalStringError,
} from '@/products/artifacts/slide/components/slideComponentTypes'

const positionedTextChecks = [
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'x', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'y', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'w', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'h', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'fontSize', path),
  (props: Record<string, unknown>, path: string) => optionalStringError(props, 'color', path),
  (props: Record<string, unknown>, path: string) => optionalStringError(props, 'align', path),
  (props: Record<string, unknown>, path: string) => optionalRecordError(props, 'style', path),
]

export const SLIDE_TEXT_COMPONENTS: SlideComponentDefinition[] = [
  {
    name: 'Title',
    category: 'text',
    elementKind: 'title',
    acceptsChildren: true,
    defaultProps: { x: 72, y: 54, w: 900, h: 72, fontSize: 44 },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) => collectPropErrors(props, path, positionedTextChecks),
  },
  {
    name: 'Subtitle',
    category: 'text',
    elementKind: 'subtitle',
    acceptsChildren: true,
    defaultProps: { x: 74, y: 132, w: 780, h: 42, fontSize: 20 },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) => collectPropErrors(props, path, positionedTextChecks),
  },
  {
    name: 'TextBox',
    category: 'text',
    elementKind: 'textBox',
    acceptsChildren: true,
    defaultProps: { x: 72, y: 190, w: 520, h: 120, fontSize: 16 },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) => collectPropErrors(props, path, positionedTextChecks),
  },
  {
    name: 'Bullets',
    category: 'text',
    elementKind: 'bullets',
    acceptsChildren: true,
    defaultProps: { x: 72, y: 220, w: 520, h: 180, fontSize: 16 },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) => collectPropErrors(props, path, positionedTextChecks),
  },
  {
    name: 'Footer',
    category: 'text',
    elementKind: 'footer',
    acceptsChildren: true,
    defaultProps: { x: 72, y: 668, w: 1136, h: 24, fontSize: 11 },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) => collectPropErrors(props, path, positionedTextChecks),
  },
]
