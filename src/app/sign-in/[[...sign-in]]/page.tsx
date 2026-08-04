import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs'

import { AuthLayout } from '@/products/auth/frontend/components/AuthLayout'
import { SignInFlow } from '@/products/auth/frontend/components/SignInFlow'

export default function SignInPage() {
  return (
    <AuthLayout mode="sign-in">
      <ClerkLoading><AuthFlowLoading /></ClerkLoading>
      <ClerkLoaded><SignInFlow /></ClerkLoaded>
    </AuthLayout>
  )
}

function AuthFlowLoading() {
  return <div className="h-[460px] w-full animate-pulse rounded-md bg-[#f3f3f3]" aria-label="Carregando acesso" />
}
