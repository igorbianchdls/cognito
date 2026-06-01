import type { SlideComponentDefinition } from '@/products/artifacts/slide/components/slideComponentTypes'
import {
  collectPropErrors,
  optionalNumberError,
  optionalRecordError,
  optionalStringError,
  requiredDataQueryError,
} from '@/products/artifacts/slide/components/slideComponentTypes'

export const SLIDE_CHART_TYPES = ['bar', 'line', 'pie'] as const

function optionalSupportedChartTypeError(props: Record<string, unknown>, path: string): string | null {
  const value = props.type
  if (value == null || value === '') return null
  return typeof value === 'string' && (SLIDE_CHART_TYPES as readonly string[]).includes(value)
    ? null
    : `${path}.type usa chart não suportado: ${String(value)}`
}

const dataVisualChecks = [
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'x', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'y', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'w', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'h', path),
  (props: Record<string, unknown>, path: string) => optionalNumberError(props, 'height', path),
  (props: Record<string, unknown>, path: string) => optionalRecordError(props, 'style', path),
]

export const SLIDE_DATA_COMPONENTS: SlideComponentDefinition[] = [
  {
    name: 'Query',
    category: 'data',
    elementKind: 'query',
    acceptsChildren: true,
    support: { html: true, pptx: 'unsupported' },
    validateProps: (props, { path }) =>
      collectPropErrors(props, path, [
        (nextProps, nextPath) => requiredDataQueryError(nextProps, nextPath),
        (nextProps, nextPath) => optionalStringError(nextProps, 'format', nextPath),
        (nextProps, nextPath) => optionalStringError(nextProps, 'comparisonMode', nextPath),
      ]),
  },
  {
    name: 'Chart',
    category: 'data',
    elementKind: 'chart',
    acceptsChildren: false,
    defaultProps: { type: 'bar', x: 72, y: 210, w: 560, h: 280 },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) =>
      collectPropErrors(props, path, [
        ...dataVisualChecks,
        (nextProps, nextPath) => requiredDataQueryError(nextProps, nextPath),
        optionalSupportedChartTypeError,
        (nextProps, nextPath) => optionalStringError(nextProps, 'format', nextPath),
        (nextProps, nextPath) => optionalRecordError(nextProps, 'recharts', nextPath),
      ]),
  },
  {
    name: 'Table',
    category: 'data',
    elementKind: 'table',
    acceptsChildren: false,
    defaultProps: { x: 72, y: 210, w: 760, h: 300 },
    support: { html: true, pptx: 'native' },
    validateProps: (props, { path }) =>
      collectPropErrors(props, path, [
        ...dataVisualChecks,
        (nextProps, nextPath) => requiredDataQueryError(nextProps, nextPath),
      ]),
  },
  {
    name: 'PivotTable',
    category: 'data',
    elementKind: 'pivotTable',
    acceptsChildren: false,
    defaultProps: { x: 72, y: 210, w: 760, h: 300 },
    support: { html: true, pptx: 'image-fallback' },
    validateProps: (props, { path }) =>
      collectPropErrors(props, path, [
        ...dataVisualChecks,
        (nextProps, nextPath) => requiredDataQueryError(nextProps, nextPath),
      ]),
  },
]
