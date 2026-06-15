'use client'

import { FormEvent, useMemo, useState } from 'react'
import { UserProfile } from '@clerk/nextjs'
import { Building2, Loader2, Save, Shield, User, Users } from 'lucide-react'

import PageContainer from '@/components/layout/PageContainer'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

type SettingsPageProps = {
  initialState: SettingsState
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const ROLE_LABELS: Record<AuthTenantRole, string> = {
  admin: 'Admin',
  member: 'Membro',
  owner: 'Owner',
  viewer: 'Leitura',
}

const STATUS_LABELS: Record<WorkspaceMemberStatus, string> = {
  active: 'Ativo',
  invited: 'Convidado',
  suspended: 'Suspenso',
}

function getInitials(name: string | null | undefined, email: string) {
  const source = name || email
  const parts = source
    .replace(/@.*/, '')
    .split(/\s|[._-]/)
    .filter(Boolean)
  return (parts[0]?.[0] || 'C').concat(parts[1]?.[0] || '').toUpperCase()
}

function StatusMessage({ error, state }: { error: string | null; state: SaveState }) {
  if (state === 'saved') return <span className="text-sm font-medium text-emerald-700">Salvo.</span>
  if (state === 'error') return <span className="text-sm font-medium text-red-600">{error}</span>
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

export default function SettingsPage({ initialState }: SettingsPageProps) {
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

  return (
    <SidebarProvider>
      <SidebarShadcn />
      <SidebarInset className="bg-slate-100">
        <PageContainer className="overflow-y-auto bg-slate-100">
          <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-1">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Configurações</h1>
                <p className="text-sm text-slate-600">{state.workspace.name}</p>
              </div>
              <Badge variant="secondary" className="w-fit rounded-md">
                {ROLE_LABELS[state.currentUserRole]}
              </Badge>
            </header>

            <Tabs defaultValue="profile" className="grid gap-5">
              <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-md border border-slate-200 bg-white p-1">
                <TabsTrigger value="profile" className="gap-2 rounded-sm">
                  <User className="size-4" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2 rounded-sm">
                  <Shield className="size-4" />
                  Segurança
                </TabsTrigger>
                <TabsTrigger value="workspace" className="gap-2 rounded-sm">
                  <Building2 className="size-4" />
                  Workspace
                </TabsTrigger>
                <TabsTrigger value="members" className="gap-2 rounded-sm">
                  <Users className="size-4" />
                  Membros
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-0">
                <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12 rounded-md">
                      <AvatarImage alt={state.profile.fullName || state.profile.email} src={state.profile.avatarUrl || ''} />
                      <AvatarFallback className="rounded-md bg-slate-100 text-sm font-semibold text-slate-700">
                        {getInitials(state.profile.fullName, state.profile.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-950">{state.profile.email}</p>
                      <p className="truncate text-xs text-slate-500">ID interno {state.profile.sharedUserId}</p>
                    </div>
                  </div>

                  <form className="grid max-w-xl gap-4" onSubmit={submitProfile}>
                    <div className="grid gap-2">
                      <Label htmlFor="profile-name">Nome</Label>
                      <Input
                        id="profile-name"
                        value={profileName}
                        onChange={(event) => {
                          setProfileName(event.target.value)
                          setProfileSave('idle')
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button disabled={profileSave === 'saving'} type="submit">
                        {profileSave === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Salvar perfil
                      </Button>
                      <StatusMessage error={error} state={profileSave} />
                    </div>
                  </form>
                </section>
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <section className="rounded-md border border-slate-200 bg-white p-5">
                  <UserProfile appearance={clerkAuthAppearance} routing="hash" />
                </section>
              </TabsContent>

              <TabsContent value="workspace" className="mt-0">
                <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-5">
                  <div className="grid gap-1">
                    <h2 className="text-base font-semibold text-slate-950">Workspace</h2>
                    <p className="text-sm text-slate-600">Status: {state.workspace.status}</p>
                  </div>
                  <form className="grid max-w-xl gap-4" onSubmit={submitWorkspace}>
                    <div className="grid gap-2">
                      <Label htmlFor="workspace-name">Nome</Label>
                      <Input
                        disabled={!canManageWorkspace}
                        id="workspace-name"
                        value={workspaceName}
                        onChange={(event) => {
                          setWorkspaceName(event.target.value)
                          setWorkspaceSave('idle')
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="workspace-slug">Slug</Label>
                      <Input
                        disabled={!canManageWorkspace}
                        id="workspace-slug"
                        value={workspaceSlug}
                        onChange={(event) => {
                          setWorkspaceSlug(event.target.value)
                          setWorkspaceSave('idle')
                        }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button disabled={!canManageWorkspace || workspaceSave === 'saving'} type="submit">
                        {workspaceSave === 'saving' ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Salvar workspace
                      </Button>
                      <StatusMessage error={error} state={workspaceSave} />
                    </div>
                  </form>
                </section>
              </TabsContent>

              <TabsContent value="members" className="mt-0">
                <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-5">
                  {state.members.map((member) => {
                    const memberSave = membersSave[member.userId] || 'idle'
                    return (
                      <div
                        className="grid gap-3 rounded-md border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_170px_170px] sm:items-center"
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
                  <StatusMessage error={error} state={Object.values(membersSave).includes('error') ? 'error' : 'idle'} />
                </section>
              </TabsContent>
            </Tabs>
          </main>
        </PageContainer>
      </SidebarInset>
    </SidebarProvider>
  )
}
