"use client"

import { AuthUserMenu } from '@/products/auth/frontend/components/AuthUserMenu'

export function NavUser(_: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  return <AuthUserMenu />
}
