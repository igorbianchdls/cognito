import type { AuthTenantRole } from '@/products/auth/shared/authContracts'

type ClerkApiRequestInit = {
  body?: unknown
  method?: string
}

export type ClerkOrganizationPayload = {
  id: string
  name: string
  slug?: string | null
  image_url?: string | null
  logo_url?: string | null
  public_metadata?: Record<string, unknown> | null
  private_metadata?: Record<string, unknown> | null
}

export class ClerkApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ClerkApiError'
    this.status = status
  }
}

function getClerkSecretKey() {
  const key = process.env.CLERK_SECRET_KEY?.trim()
  if (!key) throw new Error('CLERK_SECRET_KEY nao esta configurada.')
  return key
}

function shouldSyncOrganizationSlug() {
  return process.env.CLERK_ORGANIZATION_SLUGS_ENABLED === 'true'
}

async function clerkApiRequest<T>(path: string, init: ClerkApiRequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    method: init.method || (init.body ? 'POST' : 'GET'),
    headers: {
      authorization: `Bearer ${getClerkSecretKey()}`,
      'content-type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) as Record<string, unknown> : {}

  if (!response.ok) {
    const errors = Array.isArray(payload.errors) ? payload.errors as Array<Record<string, unknown>> : []
    const firstError = errors[0]
    const longMessage = typeof firstError?.long_message === 'string' ? firstError.long_message : ''
    const message = typeof firstError?.message === 'string' ? firstError.message : ''
    throw new ClerkApiError(longMessage || message || `Clerk API retornou HTTP ${response.status}.`, response.status)
  }

  return payload as T
}

function toClerkOrganizationRole(role: AuthTenantRole) {
  return role === 'owner' || role === 'admin' ? 'org:admin' : 'org:member'
}

export async function createClerkOrganization(input: {
  createdByClerkUserId: string
  name: string
  privateMetadata?: Record<string, unknown>
  publicMetadata?: Record<string, unknown>
  slug: string
}) {
  return clerkApiRequest<ClerkOrganizationPayload>('/organizations', {
    body: {
      created_by: input.createdByClerkUserId,
      name: input.name,
      private_metadata: input.privateMetadata || {},
      public_metadata: input.publicMetadata || {},
      ...(shouldSyncOrganizationSlug() ? { slug: input.slug } : {}),
    },
  })
}

export async function updateClerkOrganization(input: {
  organizationId: string
  name?: string
  slug?: string | null
}) {
  return clerkApiRequest<ClerkOrganizationPayload>(`/organizations/${encodeURIComponent(input.organizationId)}`, {
    body: {
      ...(input.name ? { name: input.name } : {}),
      ...(shouldSyncOrganizationSlug() && input.slug ? { slug: input.slug } : {}),
    },
    method: 'PATCH',
  })
}

export async function updateClerkOrganizationMetadata(input: {
  organizationId: string
  privateMetadata?: Record<string, unknown>
  publicMetadata?: Record<string, unknown>
}) {
  return clerkApiRequest<ClerkOrganizationPayload>(
    `/organizations/${encodeURIComponent(input.organizationId)}/metadata`,
    {
      body: {
        ...(input.privateMetadata ? { private_metadata: input.privateMetadata } : {}),
        ...(input.publicMetadata ? { public_metadata: input.publicMetadata } : {}),
      },
      method: 'PATCH',
    },
  )
}

export async function updateClerkOrganizationMembership(input: {
  appRole: AuthTenantRole
  clerkUserId: string
  organizationId: string
}) {
  return clerkApiRequest<Record<string, unknown>>(
    `/organizations/${encodeURIComponent(input.organizationId)}/memberships/${encodeURIComponent(input.clerkUserId)}`,
    {
      body: {
        role: toClerkOrganizationRole(input.appRole),
      },
      method: 'PATCH',
    },
  )
}
