import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'
import type { output, ZodTypeAny } from 'zod'

import { ErpDomainError, normalizeErpError } from '@/products/erp/shared/erpErrors'
export { ErpDomainError } from '@/products/erp/shared/erpErrors'

export async function parseErpBody<TSchema extends ZodTypeAny>(request: Request, schema: TSchema): Promise<output<TSchema>> {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw new ErpDomainError('VALIDATION_ERROR', 'Revise os campos informados.', 422, parsed.error.flatten())
  }
  return parsed.data as output<TSchema>
}

export function erpErrorResponse(error: unknown) {
  const correlationId = randomUUID()
  const normalized = normalizeErpError(error)
  // Nao registrar payload, SQL nem detalhes de registros comerciais.
  console.error(JSON.stringify({ level: 'error', scope: 'erp', correlationId, code: normalized.code }))
  return NextResponse.json(
    { error: { code: normalized.code, message: normalized.message, details: normalized.details, correlationId, recovery: normalized.recovery } },
    { status: normalized.status, headers: { 'x-correlation-id': correlationId, 'Cache-Control': 'no-store' } },
  )
}

export function erpFailure(message: string, status: number) {
  const code = status === 401 ? 'AUTH_REQUIRED' : status === 403 ? 'ACCESS_DENIED' : status === 404 ? 'NOT_FOUND' : status === 409 ? 'VERSION_CONFLICT' : 'VALIDATION_ERROR'
  return erpErrorResponse(new ErpDomainError(code, message, status))
}
