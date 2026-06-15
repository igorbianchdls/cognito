"use client"

import Link from 'next/link'
import { Show, SignInButton, SignUpButton, useClerk, useUser } from '@clerk/nextjs'
import { ChevronsUpDown, LogIn, LogOut, Plug, Settings, UserPlus } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Conta'
  const email = user?.primaryEmailAddress?.emailAddress || ''
  const avatarUrl = user?.imageUrl || ''
  const initials = getInitials(displayName, email)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Show when="signed-in">
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="min-h-12 gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                >
                  <Avatar className="size-8 rounded-md">
                    <AvatarImage alt={displayName} src={avatarUrl} />
                    <AvatarFallback className="rounded-md bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{displayName}</span>
                    {email ? <span className="truncate text-xs text-sidebar-foreground/70">{email}</span> : null}
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
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
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes">
                    <Settings className="size-4" />
                    <span>Gerenciar conta</span>
                  </Link>
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
