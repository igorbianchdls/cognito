import type { AuthTenantRole } from '@/products/auth/shared/authContracts'

export type WorkspaceMemberStatus = 'active' | 'invited' | 'suspended'

export type SettingsProfile = {
  avatarUrl?: string | null
  clerkUserId: string
  email: string
  fullName?: string | null
  sharedUserId: number
}

export type SettingsWorkspace = {
  clerkOrganizationId?: string | null
  clerkOrganizationSlug?: string | null
  id: number
  name: string
  slug?: string | null
  status: string
}

export type SettingsMember = {
  avatarUrl?: string | null
  clerkMembershipId?: string | null
  clerkOrganizationId?: string | null
  clerkUserId?: string | null
  email: string
  fullName?: string | null
  role: AuthTenantRole
  status: WorkspaceMemberStatus
  userId: number
}

export type SettingsState = {
  currentUserRole: AuthTenantRole
  members: SettingsMember[]
  profile: SettingsProfile
  workspace: SettingsWorkspace
}

export type UpdateProfileInput = {
  fullName: string
}

export type UpdateWorkspaceInput = {
  name: string
  slug: string
}

export type UpdateMemberInput = {
  role?: AuthTenantRole
  status?: WorkspaceMemberStatus
  userId: number
}
