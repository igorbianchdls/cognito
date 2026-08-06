import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'
import type { output, ZodTypeAny } from 'zod'

export class ErpDomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ErpDomainError'
  }
}

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
  console.error(JSON.stringify({
    level: 'error', scope: 'erp', correlationId,
    code: error instanceof ErpDomainError ? error.code : 'ERP_OPERATION_ERROR',
    message: error instanceof Error ? error.message : 'Erro desconhecido',
  }))
  if (error instanceof ErpDomainError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, details: error.details, correlationId } },
      { status: error.status, headers: { 'x-correlation-id': correlationId } },
    )
  }
  const message = error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.'
  const status = message.startsWith('CONFLITO_VERSAO') ? 409 : 400
  return NextResponse.json(
    { error: { code: status === 409 ? 'VERSION_CONFLICT' : 'ERP_OPERATION_ERROR', message, correlationId } },
    { status, headers: { 'x-correlation-id': correlationId } },
  )
}
