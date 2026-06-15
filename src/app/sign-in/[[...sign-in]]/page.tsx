import { SignIn } from '@clerk/nextjs'

import { ClerkAuthShell, clerkAuthAppearance } from '@/products/auth/frontend/components/ClerkAuthShell'

export default function SignInPage() {
  return (
    <ClerkAuthShell mode="sign-in">
      <SignIn
        appearance={clerkAuthAppearance}
        forceRedirectUrl="/onboarding"
        fallbackRedirectUrl="/onboarding"
        signUpForceRedirectUrl="/onboarding"
        signUpFallbackRedirectUrl="/onboarding"
      />
    </ClerkAuthShell>
  )
}
