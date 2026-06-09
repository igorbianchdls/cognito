import { createClient } from '@/lib/supabase/server'
import { runQuery } from '@/lib/postgres'
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

type TenantMembershipRow = {
  tenant_id: string | number
  tenant_name: string
  tenant_slug: string | null
  user_id: string | number
  role: string
}

export type ResolvedIntegrationTenant = {
  tenantId: number
  tenantName?: string
  tenantSlug?: string | null
  userId?: string
  sharedUserId?: number
  role?: string
  authMode: 'supabase' | 'api_token' | 'dev_fallback' | 'smoke_test'
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

function roleCanAccess(role: string, access: AccessKind) {
  if (access === 'read') return ['owner', 'admin', 'member', 'viewer'].includes(role)
  return ['owner', 'admin'].includes(role)
}

function getDevFallbackTenantId() {
  if (process.env.NODE_ENV === 'production') return null
  return normalizeTenantId(process.env.INTEGRACOES_DEV_TENANT_ID)
}

function hasSmokeTestBypass(req: Request) {
  return req.headers.get(SMOKE_TEST_HEADER) === SMOKE_TEST_HEADER_VALUE
}

async function linkSharedUserToAuthUser(authUserId: string, email: string | null | undefined) {
  if (!email) return

  await runQuery(
    `UPDATE shared.users
        SET auth_user_id = $1::uuid,
            metadata = metadata || jsonb_build_object('linkedBy', 'integracoes-api', 'linkedAt', now()),
            updated_at = now()
      WHERE auth_user_id IS NULL
        AND lower(email::text) = lower($2::text)`,
    [authUserId, email],
  )
}

async function listUserTenantMemberships(authUserId: string, email: string | null | undefined) {
  return runQuery<TenantMembershipRow>(
    `SELECT
        tenants.id::text AS tenant_id,
        tenants.name::text AS tenant_name,
        tenants.slug::text AS tenant_slug,
        users.id::text AS user_id,
        memberships.role::text AS role
      FROM shared.tenant_memberships AS memberships
      JOIN shared.tenants AS tenants
        ON tenants.id = memberships.tenant_id
      JOIN shared.users AS users
        ON users.id = memberships.user_id
      WHERE memberships.status = 'active'
        AND tenants.status = 'active'
        AND (
          users.auth_user_id = $1::uuid
          OR ($2::text <> '' AND lower(users.email::text) = lower($2::text))
        )
      ORDER BY
        CASE memberships.role
          WHEN 'owner' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'member' THEN 3
          WHEN 'viewer' THEN 4
          ELSE 5
        END,
        tenants.id ASC`,
    [authUserId, email || ''],
  )
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

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  const authUser = data?.user

  if (error || !authUser) {
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

    throw new IntegrationApiAuthError('Usuario nao autenticado para acessar integracoes.', {
      status: 401,
      code: 'integracoes_unauthorized',
    })
  }

  await linkSharedUserToAuthUser(authUser.id, authUser.email)
  const memberships = await listUserTenantMemberships(authUser.id, authUser.email)
  const membership = explicitTenantId
    ? memberships.find((item) => Number(item.tenant_id) === explicitTenantId)
    : memberships[0]

  if (!membership) {
    throw new IntegrationApiAuthError('Usuario nao tem acesso ao tenant solicitado.', {
      status: 403,
      code: 'tenant_forbidden',
    })
  }

  if (!roleCanAccess(membership.role, access)) {
    throw new IntegrationApiAuthError('Usuario nao tem permissao para gerenciar integracoes neste tenant.', {
      status: 403,
      code: 'tenant_role_forbidden',
    })
  }

  return {
    tenantId: Number(membership.tenant_id),
    tenantName: membership.tenant_name,
    tenantSlug: membership.tenant_slug,
    userId: authUser.id,
    sharedUserId: Number(membership.user_id),
    role: membership.role,
    authMode: 'supabase',
  }
}

export function integrationAuthErrorResponse(error: unknown) {
  if (error instanceof IntegrationApiAuthError) {
    return Response.json({ ok: false, code: error.code, error: error.message }, { status: error.status })
  }
  return null
}
