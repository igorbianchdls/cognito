import type { SlideComponentDefinition } from '@/products/artifacts/slide/components/slideComponentTypes'
import {
  collectPropErrors,
  optionalNumberError,
  optionalRecordError,
  optionalStringError,
} from '@/products/artifacts/slide/components/slideComponentTypes'

const frameChecks = [
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'x', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'y', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'w', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'h', path),
  (props: Record<string, unknown>, path: string) => optionalRecordError(props, 'style', path),
]

export const SLIDE_LAYOUT_COMPONENTS: SlideComponentDefinition[] = [
  {
    name: 'Card',
    category: 'layout',
    elementKind: 'card',
    acceptsChildren: true,
    defaultProps: { radius: 10, padding: 16 },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) => collectPropErrors(props, path, frameChecks),
  },
  {
    name: 'Stat',
    category: 'layout',
    elementKind: 'stat',
    acceptsChildren: false,
    defaultProps: { x: 72, y: 170, w: 250, h: 116 },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) =>
      collectPropErrors(props, path, [
        ...frameChecks,
        (nextProps, nextPath) => optionalStringError(nextProps, 'label', nextPath),
        (nextProps, nextPath) => optionalStringError(nextProps, 'value', nextPath),
        (nextProps, nextPath) => optionalStringError(nextProps, 'delta', nextPath),
      ]),
  },
  {
    name: 'Shape',
    category: 'layout',
    elementKind: 'shape',
    acceptsChildren: false,
    defaultProps: { x: 72, y: 170, w: 160, h: 80, shape: 'rect' },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) =>
      collectPropErrors(props, path, [
        ...frameChecks,
        (nextProps, nextPath) => optionalStringError(nextProps, 'shape', nextPath),
        (nextProps, nextPath) => optionalStringError(nextProps, 'fill', nextPath),
        (nextProps, nextPath) => optionalStringError(nextProps, 'stroke', nextPath),
      ]),
  },
]
