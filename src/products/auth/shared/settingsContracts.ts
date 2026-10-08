import type { AuthTenantRole } from '@/products/auth/shared/authContracts'
import type { ErpAccessProfile } from '@/products/erp/shared/professionalContracts'

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
  profileId: ErpAccessProfile
  syncPending?: boolean
  /** Permissões comerciais: vendedor que representa o usuário, escopo das vendas e desconto máximo (%). */
  sellerId?: number | null
  salesScope?: SalesScope
  maxDiscountPercent?: number | null
}

export type SalesScope = 'todas' | 'proprias'

export type SettingsState = {
  currentUserRole: AuthTenantRole
  members: SettingsMember[]
  sellers: Array<{ id: number; name: string }>
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
  profileId?: ErpAccessProfile
  reason?: string
  role?: AuthTenantRole
  status?: WorkspaceMemberStatus
  userId: number
  sellerId?: number | null
  salesScope?: SalesScope
  maxDiscountPercent?: number | null
}
