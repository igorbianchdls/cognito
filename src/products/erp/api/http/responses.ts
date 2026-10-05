import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { ZodError, type output, type ZodTypeAny } from 'zod'
import { ErpDomainError, normalizeErpError } from '../../shared/erpErrors'
import { erpHttpContext } from './context'
export { ErpDomainError } from '../../shared/erpErrors'

export async function parseErpBody<TSchema extends ZodTypeAny>(request: Request, schema: TSchema): Promise<output<TSchema>> {
  let body: unknown
  try { body = await request.json() } catch { throw new ErpDomainError('INVALID_JSON', 'Envie um corpo JSON válido.', 400) }
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new ErpDomainError('VALIDATION_ERROR', 'Revise os campos informados.', 422, parsed.error.flatten())
  return parsed.data as output<TSchema>
}

export function erpErrorResponse(error: unknown) {
  const correlationId = erpHttpContext.getStore()?.correlationId ?? randomUUID()
  const normalized = error instanceof ZodError
    ? new ErpDomainError('VALIDATION_ERROR', 'Revise os campos informados.', 422, error.flatten())
    : normalizeErpError(error)
  console.error(JSON.stringify({ level: 'error', scope: 'erp', correlationId, code: normalized.code }))
  return NextResponse.json({ error: { code: normalized.code, message: normalized.message, details: normalized.details, correlationId, recovery: normalized.recovery } }, {
    status: normalized.status, headers: { 'x-correlation-id': correlationId, 'Cache-Control': 'no-store' },
  })
}

export function erpFailure(message: string, status: number) {
  const code = status === 401 ? 'AUTH_REQUIRED' : status === 403 ? 'ACCESS_DENIED' : status === 404 ? 'NOT_FOUND' : status === 409 ? 'VERSION_CONFLICT' : 'VALIDATION_ERROR'
  return erpErrorResponse(new ErpDomainError(code, message, status))
}
