'use client'

import { type FormEvent, type ReactNode, useMemo, useState } from 'react'
import { UserProfile } from '@clerk/nextjs'
import { Building2, Loader2, Save, Shield, User, Users, type LucideIcon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { clerkAuthAppearance } from '@/products/auth/frontend/components/ClerkAuthShell'
import {
  updateSettingsMember,
  updateSettingsProfile,
  updateSettingsWorkspace,
} from '@/products/auth/frontend/services/settingsApi'
import type { AuthTenantRole } from '@/products/auth/shared/authContracts'
import type {
  SettingsMember,
  SettingsState,
  WorkspaceMemberStatus,
} from '@/products/auth/shared/settingsContracts'

type SettingsPanelProps = {
  initialState: SettingsState
  variant?: 'modal' | 'page'
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'
type SettingsSection = 'profile' | 'security' | 'workspace' | 'members'

const ROLE_LABELS: Record<AuthTenantRole, string> = {
  admin: 'Admin',
  member: 'Member',
  owner: 'Owner',
  viewer: 'Viewer',
}

const STATUS_LABELS: Record<WorkspaceMemberStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
}

const NAV_ITEMS: Array<{ icon: LucideIcon; label: string; value: SettingsSection }> = [
  { icon: User, label: 'Profile', value: 'profile' },
  { icon: Shield, label: 'Security', value: 'security' },
  { icon: Building2, label: 'Workspace', value: 'workspace' },
  { icon: Users, label: 'Members', value: 'members' },
]

function getInitials(name: string | null | undefined, email: string) {
  const source = name || email
  const parts = source
    .replace(/@.*/, '')
    .split(/\s|[._-]/)
    .filter(Boolean)
  return (parts[0]?.[0] || 'C').concat(parts[1]?.[0] || '').toUpperCase()
}

function getUsername(email: string) {
  return email.split('@')[0] || email
}

function StatusMessage({ error, state }: { error: string | null; state: SaveState }) {
  if (state === 'saved') return <span className="text-xs font-medium text-emerald-700">Salvo.</span>
  if (state === 'error') return <span className="text-xs font-medium text-red-600">{error}</span>
  return null
}

function MemberAvatar({ member }: { member: SettingsMember }) {
  const label = member.fullName || member.email
  return (
    <Avatar className="size-9 rounded-md">
      <AvatarImage alt={label} src={member.avatarUrl || ''} />
      <AvatarFallback className="rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
        {getInitials(member.fullName, member.email)}
      </AvatarFallback>
    </Avatar>
  )
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-slate-200 pb-5">
      <h2 className="text-base font-semibold text-slate-950">{children}</h2>
    </div>
  )
}

function SettingsRow({ action, children, label }: { action?: ReactNode; children: ReactNode; label: string }) {
  return (
    <div className="grid gap-3 border-b border-slate-200 py-6 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)_150px] md:items-start">
      <div className="text-sm font-medium text-slate-900">{label}</div>
      <div className="min-w-0">{children}</div>
      <div className="flex justify-start md:justify-end">{action}</div>
    </div>
  )
}

export default function SettingsPanel({ initialState, variant = 'modal' }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [state, setState] = useState(initialState)
  const [profileName, setProfileName] = useState(initialState.profile.fullName || '')
  const [workspaceName, setWorkspaceName] = useState(initialState.workspace.name)
  const [workspaceSlug, setWorkspaceSlug] = useState(initialState.workspace.slug || '')
  const [profileSave, setProfileSave] = useState<SaveState>('idle')
  const [workspaceSave, setWorkspaceSave] = useState<SaveState>('idle')
  const [membersSave, setMembersSave] = useState<Record<number, SaveState>>({})
  const [error, setError] = useState<string | null>(null)

  const canManageWorkspace = useMemo(
    () => ['owner', 'admin'].includes(state.currentUserRole),
    [state.currentUserRole],
  )

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setProfileSave('saving')
    try {
      const profile = await updateSettingsProfile({ fullName: profileName })
      setState((current) => ({ ...current, profile }))
      setProfileName(profile.fullName || '')
      setProfileSave('saved')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar.')
      setProfileSave('error')
    }
  }

  async function submitWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setWorkspaceSave('saving')
    try {
      const workspace = await updateSettingsWorkspace({
        name: workspaceName,
        slug: workspaceSlug,
      })
      setState((current) => ({ ...current, workspace }))
      setWorkspaceName(workspace.name)
      setWorkspaceSlug(workspace.slug || '')
      setWorkspaceSave('saved')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar.')
      setWorkspaceSave('error')
    }
  }

  async function saveMember(userId: number, patch: { role?: AuthTenantRole; status?: WorkspaceMemberStatus }) {
    setError(null)
    setMembersSave((current) => ({ ...current, [userId]: 'saving' }))
    try {
      const member = await updateSettingsMember({ userId, ...patch })
      setState((current) => ({
        ...current,
        members: current.members.map((item) => (item.userId === member.userId ? member : item)),
      }))
      setMembersSave((current) => ({ ...current, [userId]: 'saved' }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar.')
      setMembersSave((current) => ({ ...current, [userId]: 'error' }))
    }
  }

  const shellClass = variant === 'modal'
    ? 'grid h-[min(704px,88vh)] overflow-hidden rounded-lg bg-white text-slate-950 md:grid-cols-[220px_minmax(0,1fr)]'
    : 'grid min-h-[680px] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-950 md:grid-cols-[240px_minmax(0,1fr)]'

  return (
    <div className={shellClass}>
      <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50 px-3 py-7">
        <div className="px-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Account</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your account info.</p>
        </div>

        <nav className="mt-7 grid gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.value
            return (
              <button
                className={`flex h-9 items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-200 text-slate-950'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
                key={item.value}
                onClick={() => setActiveSection(item.value)}
                type="button"
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="mt-auto hidden px-3 text-xs font-medium text-slate-500 md:block">
          {state.workspace.name}
        </div>
      </aside>

      <section className="min-h-0 overflow-y-auto px-8 py-7">
        {activeSection === 'profile' ? (
          <div>
            <SectionHeader>Profile details</SectionHeader>
            <form onSubmit={submitProfile}>
              <SettingsRow
                action={
                  <Button disabled={profileSave === 'saving'} size="sm" type="submit" variant="ghost">
                    {profileSave === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Update profile
                  </Button>
                }
                label="Profile"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="size-12 rounded-full">
                    <AvatarImage alt={state.profile.fullName || state.profile.email} src={state.profile.avatarUrl || ''} />
                    <AvatarFallback className="rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                      {getInitials(state.profile.fullName, state.profile.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    className="max-w-xs bg-white"
                    value={profileName}
                    onChange={(event) => {
                      setProfileName(event.target.value)
                      setProfileSave('idle')
                    }}
                  />
                </div>
              </SettingsRow>
              <SettingsRow label="Username">
                <p className="text-sm text-slate-800">{getUsername(state.profile.email)}</p>
              </SettingsRow>
              <SettingsRow label="Email addresses">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-800">{state.profile.email}</span>
                  <Badge variant="secondary" className="rounded-md text-[11px]">Primary</Badge>
                </div>
              </SettingsRow>
              <div className="pt-2">
                <StatusMessage error={error} state={profileSave} />
              </div>
            </form>
          </div>
        ) : null}

        {activeSection === 'security' ? (
          <div>
            <SectionHeader>Security</SectionHeader>
            <div className="pt-6">
              <UserProfile appearance={clerkAuthAppearance} routing="hash" />
            </div>
          </div>
        ) : null}

        {activeSection === 'workspace' ? (
          <div>
            <SectionHeader>Workspace details</SectionHeader>
            <form onSubmit={submitWorkspace}>
              <SettingsRow
                action={
                  <Button disabled={!canManageWorkspace || workspaceSave === 'saving'} size="sm" type="submit" variant="ghost">
                    {workspaceSave === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Update workspace
                  </Button>
                }
                label="Workspace"
              >
                <Input
                  className="max-w-sm bg-white"
                  disabled={!canManageWorkspace}
                  value={workspaceName}
                  onChange={(event) => {
                    setWorkspaceName(event.target.value)
                    setWorkspaceSave('idle')
                  }}
                />
              </SettingsRow>
              <SettingsRow label="Slug">
                <Input
                  className="max-w-sm bg-white"
                  disabled={!canManageWorkspace}
                  value={workspaceSlug}
                  onChange={(event) => {
                    setWorkspaceSlug(event.target.value)
                    setWorkspaceSave('idle')
                  }}
                />
              </SettingsRow>
              <SettingsRow label="Role">
                <Badge variant="secondary" className="rounded-md">{ROLE_LABELS[state.currentUserRole]}</Badge>
              </SettingsRow>
              <div className="pt-2">
                <StatusMessage error={error} state={workspaceSave} />
              </div>
            </form>
          </div>
        ) : null}

        {activeSection === 'members' ? (
          <div>
            <SectionHeader>Members</SectionHeader>
            <div className="divide-y divide-slate-200">
              {state.members.map((member) => {
                const memberSave = membersSave[member.userId] || 'idle'
                return (
                  <div
                    className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_140px_140px]"
                    key={member.userId}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <MemberAvatar member={member} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-950">
                          {member.fullName || member.email}
                        </p>
                        <p className="truncate text-xs text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <Select
                      disabled={!canManageWorkspace || memberSave === 'saving'}
                      value={member.role}
                      onValueChange={(value) => {
                        void saveMember(member.userId, { role: value as AuthTenantRole })
                      }}
                    >
                      <SelectTrigger className="w-full border border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      disabled={!canManageWorkspace || memberSave === 'saving'}
                      value={member.status}
                      onValueChange={(value) => {
                        void saveMember(member.userId, { status: value as WorkspaceMemberStatus })
                      }}
                    >
                      <SelectTrigger className="w-full border border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
            <StatusMessage error={error} state={Object.values(membersSave).includes('error') ? 'error' : 'idle'} />
          </div>
        ) : null}
      </section>
    </div>
  )
}
