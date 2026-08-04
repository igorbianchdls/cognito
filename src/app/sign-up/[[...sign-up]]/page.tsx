import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs'

import { AuthLayout } from '@/products/auth/frontend/components/AuthLayout'
import { SignUpFlow } from '@/products/auth/frontend/components/SignUpFlow'

export default function SignUpPage() {
  return (
    <AuthLayout mode="sign-up">
      <ClerkLoading><AuthFlowLoading /></ClerkLoading>
      <ClerkLoaded><SignUpFlow /></ClerkLoaded>
    </AuthLayout>
  )
}

function AuthFlowLoading() {
  return <div className="h-[540px] w-full animate-pulse rounded-md bg-[#f3f3f3]" aria-label="Carregando cadastro" />
}
