import { ClerkLoaded, ClerkLoading } from '@clerk/nextjs'

import { AuthLayout } from '@/products/auth/frontend/components/AuthLayout'
import { SignUpFlow } from '@/products/auth/frontend/components/SignUpFlow'
import styles from '@/products/auth/frontend/components/AuthLogin.module.css'

export default function SignUpPage() {
  return (
    <AuthLayout mode="sign-up">
      <ClerkLoading><AuthFlowLoading /></ClerkLoading>
      <ClerkLoaded><SignUpFlow /></ClerkLoaded>
    </AuthLayout>
  )
}

function AuthFlowLoading() {
  return <div className={styles.loading} role="status" aria-label="Carregando cadastro"><span /><span /><span /><span /><span /></div>
}
