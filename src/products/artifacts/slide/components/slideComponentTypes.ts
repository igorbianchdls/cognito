import type { SlideElementKind } from '@/products/artifacts/slide/model/slideModel'

export type SlideComponentCategory = 'core' | 'text' | 'layout' | 'media' | 'data'

export type SlidePptxEditability = 'native' | 'image-fallback' | 'unsupported'

export type SlideComponentSupport = {
  html: boolean
  pptx: SlidePptxEditability
}

export type SlideComponentValidationContext = {
  path: string
}

export type SlideComponentDefinition = {
  name: string
  category: SlideComponentCategory
  elementKind: SlideElementKind
  defaultProps?: Record<string, unknown>
  acceptsChildren: boolean
  support: SlideComponentSupport
  validateProps?: (
    props: Record<string, unknown>,
    context: SlideComponentValidationContext,
  ) => string[]
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function optionalStringError(props: Record<string, unknown>, key: string, path: string): string | null {
  const value = props[key]
  if (value == null || value === '') return null
  return typeof value === 'string' && value.trim() ? null : `${path}.${key} deve ser uma string não vazia`
}

export function requiredStringError(props: Record<string, unknown>, key: string, path: string): string | null {
  const value = props[key]
  return typeof value === 'string' && value.trim() ? null : `${path}.${key} é obrigatório`
}

export function optionalNumberError(props: Record<string, unknown>, key: string, path: string): string | null {
  const value = props[key]
  if (value == null || value === '') return null
  return typeof value === 'number' && Number.isFinite(value) ? null : `${path}.${key} deve ser numérico`
}

export function optionalRecordError(props: Record<string, unknown>, key: string, path: string): string | null {
  const value = props[key]
  if (value == null) return null
  return isRecord(value) ? null : `${path}.${key} deve ser um objeto`
}

export function requiredDataQueryError(props: Record<string, unknown>, path: string): string | null {
  const dataQuery = props.dataQuery
  if (!isRecord(dataQuery) || typeof dataQuery.query !== 'string' || !dataQuery.query.trim()) {
    return `${path}.dataQuery.query é obrigatório`
  }
  return null
}

export function requiredDataSourceError(props: Record<string, unknown>, path: string): string | null {
  const dataQuery = props.dataQuery
  const hasQuery = isRecord(dataQuery) && typeof dataQuery.query === 'string' && dataQuery.query.trim()
  const hasData = Array.isArray(props.data) && props.data.length > 0
  return hasQuery || hasData ? null : `${path}.dataQuery.query ou ${path}.data é obrigatório`
}

export function collectPropErrors(
  props: Record<string, unknown>,
  path: string,
  checks: Array<(props: Record<string, unknown>, path: string) => string | null>,
): string[] {
  return checks.map((check) => check(props, path)).filter((error): error is string => Boolean(error))
}
