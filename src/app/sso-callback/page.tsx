import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

import { AuthLayout } from '@/products/auth/frontend/components/AuthLayout'
import { AuthTransition } from '@/products/auth/frontend/components/AuthFormParts'

// Return from Google. Any extra step (new account, missing data, second factor) goes to Otto's own pages,
// never to Clerk's hosted ones.
export default function SsoCallbackPage() {
  return (
    <AuthLayout mode="callback">
      <AuthTransition />
      <AuthenticateWithRedirectCallback
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        continueSignUpUrl="/sign-up"
        secondFactorUrl="/sign-in"
        firstFactorUrl="/sign-in"
        resetPasswordUrl="/sign-in"
        verifyEmailAddressUrl="/sign-up"
        signInFallbackRedirectUrl="/onboarding"
        signUpFallbackRedirectUrl="/onboarding"
      />
    </AuthLayout>
  )
}
