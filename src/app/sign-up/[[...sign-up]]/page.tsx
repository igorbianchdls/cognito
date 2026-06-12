import { SignUp } from '@clerk/nextjs'

import { ClerkAuthShell, clerkAuthAppearance } from '@/products/auth/frontend/components/ClerkAuthShell'

export default function SignUpPage() {
  return (
    <ClerkAuthShell mode="sign-up">
      <SignUp
        appearance={clerkAuthAppearance}
        fallbackRedirectUrl="/onboarding"
        signInFallbackRedirectUrl="/onboarding"
      />
    </ClerkAuthShell>
  )
}
