import { SignUp } from '@clerk/nextjs'

import { ClerkAuthShell, clerkAuthAppearance } from '@/products/auth/frontend/components/ClerkAuthShell'

export default function SignUpPage() {
  return (
    <ClerkAuthShell mode="sign-up">
      <SignUp
        appearance={clerkAuthAppearance}
        forceRedirectUrl="/onboarding"
        fallbackRedirectUrl="/onboarding"
        signInForceRedirectUrl="/onboarding"
        signInFallbackRedirectUrl="/onboarding"
      />
    </ClerkAuthShell>
  )
}
