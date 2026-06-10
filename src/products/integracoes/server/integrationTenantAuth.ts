import {
  authRoleCanAccess,
  getClerkTenantBootstrapState,
  resolveAuthTenant,
} from '@/products/auth/server/authTenantResolver'
import {
  getIntegrationRequestTenantId,
  hasValidIntegracoesApiToken,
  IntegrationApiAuthError,
} from '@/products/integracoes/server/integrationApiAuth'

type AccessKind = 'read' | 'manage'

// TEMPORARIO: remover depois dos testes Conta Azul em producao.
const SMOKE_TEST_HEADER = 'x-integracoes-smoke-test'
const SMOKE_TEST_HEADER_VALUE = 'conta-azul-tenant-1'
const SMOKE_TEST_TENANT_ID = 1

export type ResolvedIntegrationTenant = {
  tenantId: number
  tenantName?: string
  tenantSlug?: string | null
  userId?: string
  sharedUserId?: number
  role?: string
  authMode: 'clerk' | 'api_token' | 'dev_fallback' | 'smoke_test'
}

function normalizeTenantId(value: unknown): number | null {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function assertHeaderTenantMatches(req: Request, requestedTenantId: number | null) {
  const headerTenantId = getIntegrationRequestTenantId(req)
  if (headerTenantId && requestedTenantId && headerTenantId !== requestedTenantId) {
    throw new IntegrationApiAuthError('Tenant do header nao corresponde ao tenant solicitado.', {
      status: 403,
      code: 'tenant_mismatch',
    })
  }
  return headerTenantId
}

function getDevFallbackTenantId() {
  if (process.env.NODE_ENV === 'production') return null
  return normalizeTenantId(process.env.INTEGRACOES_DEV_TENANT_ID)
}

function hasSmokeTestBypass(req: Request) {
  return req.headers.get(SMOKE_TEST_HEADER) === SMOKE_TEST_HEADER_VALUE
}

export async function resolveIntegrationTenant(
  req: Request,
  options?: {
    requestedTenantId?: unknown
    access?: AccessKind
  },
): Promise<ResolvedIntegrationTenant> {
  const access = options?.access || 'read'
  const requestedTenantId = normalizeTenantId(options?.requestedTenantId)
  const headerTenantId = assertHeaderTenantMatches(req, requestedTenantId)
  const explicitTenantId = requestedTenantId || headerTenantId

  if (hasValidIntegracoesApiToken(req)) {
    return {
      tenantId: explicitTenantId || normalizeTenantId(process.env.INTEGRACOES_API_TENANT_ID) || 1,
      authMode: 'api_token',
    }
  }

  if (hasSmokeTestBypass(req)) {
    if (explicitTenantId && explicitTenantId !== SMOKE_TEST_TENANT_ID) {
      throw new IntegrationApiAuthError('Tenant solicitado nao corresponde ao tenant do smoke test.', {
        status: 403,
        code: 'tenant_mismatch',
      })
    }

    return {
      tenantId: SMOKE_TEST_TENANT_ID,
      tenantName: 'Smoke test tenant',
      tenantSlug: 'smoke-test',
      role: 'owner',
      authMode: 'smoke_test',
    }
  }

  const clerkTenant = await resolveAuthTenant({ requestedTenantId: explicitTenantId, access })
  if (clerkTenant) {
    return {
      tenantId: clerkTenant.tenantId,
      tenantName: clerkTenant.tenantName,
      tenantSlug: clerkTenant.tenantSlug,
      userId: clerkTenant.clerkUserId,
      sharedUserId: clerkTenant.sharedUserId,
      role: clerkTenant.role,
      authMode: 'clerk',
    }
  }
  const clerkBootstrap = await getClerkTenantBootstrapState()
  if (clerkBootstrap) {
    const membership = explicitTenantId
      ? clerkBootstrap.memberships.find((item) => item.tenantId === explicitTenantId)
      : clerkBootstrap.memberships[0]

    if (!membership) {
      throw new IntegrationApiAuthError('Usuario nao tem acesso ao tenant solicitado.', {
        status: 403,
        code: 'tenant_forbidden',
      })
    }

    if (!authRoleCanAccess(membership.role, access)) {
      throw new IntegrationApiAuthError('Usuario nao tem permissao para gerenciar integracoes neste tenant.', {
        status: 403,
        code: 'tenant_role_forbidden',
      })
    }
  }

  const devTenantId = getDevFallbackTenantId()
  if (devTenantId) {
    if (explicitTenantId && explicitTenantId !== devTenantId) {
      throw new IntegrationApiAuthError('Tenant solicitado nao corresponde ao tenant de desenvolvimento.', {
        status: 403,
        code: 'tenant_mismatch',
      })
    }
    return { tenantId: devTenantId, authMode: 'dev_fallback' }
  }

  if (explicitTenantId) {
    throw new IntegrationApiAuthError('Usuario nao tem acesso ao tenant solicitado.', {
      status: 403,
      code: 'tenant_forbidden',
    })
  }

  throw new IntegrationApiAuthError('Usuario nao autenticado para acessar integracoes.', {
    status: 401,
    code: 'integracoes_unauthorized',
  })
}

export function integrationAuthErrorResponse(error: unknown) {
  if (error instanceof IntegrationApiAuthError) {
    return Response.json({ ok: false, code: error.code, error: error.message }, { status: error.status })
  }
  return null
}
