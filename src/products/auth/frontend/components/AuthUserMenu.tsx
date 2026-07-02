"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Show, SignInButton, SignUpButton, useClerk, useUser } from '@clerk/nextjs'
import { Loader2, LogIn, LogOut, Plug, Settings, UserPlus } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import SettingsPanel from '@/products/auth/frontend/components/SettingsPanel'
import { fetchSettingsState } from '@/products/auth/frontend/services/settingsApi'
import type { SettingsState } from '@/products/auth/shared/settingsContracts'

function getInitials(name: string, email: string) {
  const source = name && name !== 'Conta' ? name : email
  const parts = source
    .replace(/@.*/, '')
    .split(/\s|[._-]/)
    .filter(Boolean)

  return (parts[0]?.[0] || 'C').concat(parts[1]?.[0] || '').toUpperCase()
}

export function AuthUserMenu() {
  const { signOut } = useClerk()
  const { user } = useUser()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsState, setSettingsState] = useState<SettingsState | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [isSettingsLoading, setIsSettingsLoading] = useState(false)
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Conta'
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const avatarUrl = user?.imageUrl || ''
  const initials = getInitials(displayName, email)

  useEffect(() => {
    if (!isSettingsOpen) return
    let isCurrent = true
    setIsSettingsLoading(true)
    setSettingsError(null)
    void fetchSettingsState()
      .then((state) => {
        if (isCurrent) setSettingsState(state)
      })
      .catch((error) => {
        if (isCurrent) {
          setSettingsError(error instanceof Error ? error.message : 'Nao foi possivel carregar configuracoes.')
        }
      })
      .finally(() => {
        if (isCurrent) setIsSettingsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [isSettingsOpen])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Show when="signed-in">
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="mx-auto h-10 w-10 justify-center p-1"
                >
                  <Avatar className="size-8 rounded-md">
                    <AvatarImage alt={displayName} src={avatarUrl} />
                    <AvatarFallback className="rounded-md bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64" side="right" sideOffset={8}>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <Avatar className="size-9 rounded-md">
                      <AvatarImage alt={displayName} src={avatarUrl} />
                      <AvatarFallback className="rounded-md bg-slate-100 text-xs font-semibold text-slate-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 leading-tight">
                      <span className="truncate text-sm font-medium text-slate-950">{displayName}</span>
                      {email ? <span className="truncate text-xs text-slate-500">{email}</span> : null}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
                  <Settings className="size-4" />
                  <span>Gerenciar conta</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/integracoes">
                    <Plug className="size-4" />
                    <span>Integrações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700"
                  onSelect={() => {
                    void signOut({ redirectUrl: '/sign-in' })
                  }}
                >
                  <LogOut className="size-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogContent className="max-h-[88vh] w-[calc(100vw-32px)] max-w-[880px] overflow-hidden border-0 bg-transparent p-0 shadow-2xl sm:rounded-lg">
                <DialogTitle className="sr-only">Gerenciar conta</DialogTitle>
                <DialogDescription className="sr-only">
                  Atualize perfil, seguranca, workspace e membros.
                </DialogDescription>
                {isSettingsLoading && !settingsState ? (
                  <div className="grid h-[min(704px,88vh)] place-items-center rounded-lg bg-white text-slate-700">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Loader2 className="size-4 animate-spin" />
                      Carregando configuracoes...
                    </div>
                  </div>
                ) : null}
                {settingsError && !settingsState ? (
                  <div className="grid h-[min(704px,88vh)] place-items-center rounded-lg bg-white px-8 text-center">
                    <div className="grid gap-2">
                      <p className="text-sm font-semibold text-slate-950">Nao foi possivel abrir a conta.</p>
                      <p className="text-sm text-slate-600">{settingsError}</p>
                    </div>
                  </div>
                ) : null}
                {settingsState ? <SettingsPanel initialState={settingsState} /> : null}
              </DialogContent>
            </Dialog>
          </>
        </Show>
        <Show when="signed-out">
          <div className="grid gap-1 p-1 group-data-[collapsible=icon]:hidden">
            <SignInButton
              mode="modal"
              forceRedirectUrl="/onboarding"
              fallbackRedirectUrl="/onboarding"
              signUpForceRedirectUrl="/onboarding"
              signUpFallbackRedirectUrl="/onboarding"
            >
              <SidebarMenuButton size="sm">
                <LogIn className="size-4" />
                <span>Entrar</span>
              </SidebarMenuButton>
            </SignInButton>
            <SignUpButton
              mode="modal"
              forceRedirectUrl="/onboarding"
              fallbackRedirectUrl="/onboarding"
              signInForceRedirectUrl="/onboarding"
              signInFallbackRedirectUrl="/onboarding"
            >
              <SidebarMenuButton size="sm">
                <UserPlus className="size-4" />
                <span>Criar conta</span>
              </SidebarMenuButton>
            </SignUpButton>
          </div>
        </Show>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
