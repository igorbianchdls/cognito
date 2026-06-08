import crypto from 'crypto'

import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'

export class IntegrationApiAuthError extends Error {
  status: number
  code: string

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message)
    this.name = 'IntegrationApiAuthError'
    this.status = options?.status ?? 403
    this.code = options?.code ?? 'integracoes_forbidden'
  }
}

function timingSafeTextEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function getBearerToken(req: Request) {
  const auth = req.headers.get('authorization') || ''
  return auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
}

export function getIntegrationRequestTenantId(req: Request): number | null {
  const headerTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
  return Number.isFinite(headerTenant) && headerTenant > 0 ? headerTenant : null
}

export function assertIntegrationTenantRequest(req: Request, tenantId: number) {
  const headerTenant = getIntegrationRequestTenantId(req)
  if (headerTenant && headerTenant !== tenantId) {
    throw new IntegrationApiAuthError('Tenant do header nao corresponde ao tenant solicitado.', {
      status: 403,
      code: 'tenant_mismatch',
    })
  }
}

export function assertIntegracoesApiToken(req: Request) {
  const expectedToken = String(process.env.INTEGRACOES_API_TOKEN || '').trim()
  if (!expectedToken) return

  const token = getBearerToken(req) || String(req.headers.get('x-integracoes-api-token') || '').trim()
  if (!token || !timingSafeTextEqual(token, expectedToken)) {
    throw new IntegrationApiAuthError('Token de integracoes invalido.', {
      status: 401,
      code: 'integracoes_unauthorized',
    })
  }
}

export function assertCanManageIntegrationConnection(req: Request, connection: IntegrationConnection) {
  assertIntegracoesApiToken(req)
  assertIntegrationTenantRequest(req, connection.tenantId)
}
