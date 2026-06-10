export type AuthTenantRole = 'owner' | 'admin' | 'member' | 'viewer'

export type AuthUserIdentity = {
  clerkUserId: string
  sharedUserId: number
  email: string
  fullName?: string | null
  avatarUrl?: string | null
}

export type AuthTenantMembership = {
  tenantId: number
  tenantName: string
  tenantSlug?: string | null
  role: AuthTenantRole
}

export type AuthTenantContext = AuthUserIdentity & AuthTenantMembership & {
  authMode: 'clerk'
}

export type ClerkTenantBootstrapResult = AuthUserIdentity & {
  memberships: AuthTenantMembership[]
  needsOnboarding: boolean
  activeTenant?: AuthTenantMembership | null
}

export type AuthBootstrapState = ClerkTenantBootstrapResult & {
  isAuthenticated: true
}
