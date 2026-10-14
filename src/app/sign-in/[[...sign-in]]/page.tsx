import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs'

import { AuthLayout } from '@/products/auth/frontend/components/AuthLayout'
import { SignInFlow } from '@/products/auth/frontend/components/SignInFlow'
import styles from '@/products/auth/frontend/components/AuthLogin.module.css'

export default function SignInPage() {
  return (
    <AuthLayout mode="sign-in">
      <ClerkLoading><AuthFlowLoading /></ClerkLoading>
      <ClerkLoaded><SignInFlow /></ClerkLoaded>
    </AuthLayout>
  )
}

function AuthFlowLoading() {
  return <div className={styles.loading} role="status" aria-label="Carregando acesso"><span /><span /><span /><span /><span /></div>
}
