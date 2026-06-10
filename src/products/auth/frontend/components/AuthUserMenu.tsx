"use client"

import { Show, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { LogIn, UserPlus } from 'lucide-react'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function AuthUserMenu() {
  const { user } = useUser()
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Conta'
  const email = user?.primaryEmailAddress?.emailAddress || ''

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Show when="signed-in">
          <div className="flex min-h-12 items-center gap-2 rounded-md px-2 py-1.5 text-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <UserButton />
            <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{displayName}</span>
              {email ? <span className="truncate text-xs text-sidebar-foreground/70">{email}</span> : null}
            </div>
          </div>
        </Show>
        <Show when="signed-out">
          <div className="grid gap-1 p-1 group-data-[collapsible=icon]:hidden">
            <SignInButton mode="modal" fallbackRedirectUrl="/onboarding" signUpFallbackRedirectUrl="/onboarding">
              <SidebarMenuButton size="sm">
                <LogIn className="size-4" />
                <span>Entrar</span>
              </SidebarMenuButton>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/onboarding" signInFallbackRedirectUrl="/onboarding">
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
