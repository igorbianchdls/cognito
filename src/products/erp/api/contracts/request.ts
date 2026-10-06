import { z } from 'zod'
import { erpDateSchema } from '../../shared/erpTransport'
import { ErpDomainError } from '../../shared/erpErrors'

export const erpHttpIdSchema = z.string().regex(/^[1-9]\d*$/).refine(value => Number.isSafeInteger(Number(value)), 'Identificador inválido.')
export const erpHttpPageSchema = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().max(10_000))
export const erpHttpPageSizeSchema = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().int().max(100))

/** Only transport-level fields. Domain-specific filters are validated by each handler. */
export function validateErpHttpQuery(request: Request) {
  const params = new URL(request.url).searchParams
  for (const key of ['page', 'pagina']) if (params.has(key)) erpHttpPageSchema.parse(params.get(key))
  for (const key of ['pageSize', 'por_pagina', 'limite', 'limit']) if (params.has(key)) erpHttpPageSizeSchema.parse(params.get(key))
  for (const key of ['query', 'q', 'busca']) if (params.has(key)) z.string().max(500).parse(params.get(key))
  for (const [key, value] of params) {
    if (['from', 'to', 'inicio', 'fim', 'vencimento_inicio', 'vencimento_fim', 'filter.inicio', 'filter.fim', 'filter.vencimento_inicio', 'filter.vencimento_fim'].includes(key) && value) erpDateSchema.parse(value)
  }
  for (const [start, end] of [['from','to'], ['inicio','fim'], ['vencimento_inicio','vencimento_fim'], ['filter.inicio','filter.fim'], ['filter.vencimento_inicio','filter.vencimento_fim']]) {
    if (params.get(start) && params.get(end) && params.get(start)! > params.get(end)!) throw new ErpDomainError('VALIDATION_ERROR', 'O início do período deve ser anterior ao fim.')
  }
}

export async function validateErpHttpParams(context: unknown) {
  if (!context || typeof context !== 'object' || !('params' in context)) return
  // Next passes { params: undefined } for routes without dynamic segments.
  const params = await (context as { params?: Promise<Record<string, string>> }).params
  if (params?.id !== undefined) erpHttpIdSchema.parse(params.id)
}
