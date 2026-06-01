import type { SlideComponentDefinition } from '@/products/artifacts/slide/components/slideComponentTypes'
import {
  collectPropErrors,
  optionalNumberError,
  optionalRecordError,
  optionalStringError,
  requiredStringError,
} from '@/products/artifacts/slide/components/slideComponentTypes'

const imageChecks = [
  (props: Record<string, unknown>, path: string) => requiredStringError(props, 'src', path),
  (props: Record<string, unknown>, path: string) => optionalStringError(props, 'alt', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'x', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'y', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'w', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'h', path),
  (props: Record<string, unknown>, path: string) => optionalRecordError(props, 'style', path),
]

export const SLIDE_MEDIA_COMPONENTS: SlideComponentDefinition[] = [
  {
    name: 'Image',
    category: 'media',
    elementKind: 'image',
    acceptsChildren: false,
    defaultProps: { x: 72, y: 160, w: 420, h: 240, fit: 'contain' },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) => collectPropErrors(props, path, imageChecks),
  },
  {
    name: 'Logo',
    category: 'media',
    elementKind: 'logo',
    acceptsChildren: false,
    defaultProps: { x: 1080, y: 40, w: 120, h: 40, fit: 'contain' },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) => collectPropErrors(props, path, imageChecks),
  },
]
